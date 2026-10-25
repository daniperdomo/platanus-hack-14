"use client";

import { useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { registerAccount, createPairing } from "@/lib/api";
import { getOrCreateDeviceKey, signChallenge } from "@/lib/crypto";
import { startSession } from "@/lib/session";
import {
  bytesToBase64Url,
  encryptJson,
  encryptPairing,
  generateVaultKey,
  randomSecret,
  wrapVaultKey,
} from "@/lib/vaultCrypto";

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,31}$/;

function filled(entries) {
  return Object.fromEntries(entries.filter(([, value]) => value));
}

export default function AccountSetup({ token, profile }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [bundle, setBundle] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const name = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(name)) {
      setError("El usuario debe tener entre 3 y 32 caracteres: letras, números, punto o guion.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const vault = filled([
        ["nombre", profile.nombre],
        ["documento", profile.documento],
        ["fecha_nacimiento", profile.fecha_nacimiento],
        ["nacionalidad", profile.nacionalidad],
        ["email", email.trim()],
        ["telefono", phone.trim()],
        ["direccion", address.trim()],
      ]);
      const vaultKey = await generateVaultKey();
      const vaultCiphertext = await encryptJson(vaultKey, vault);
      const wrapped = await wrapVaultKey(password, vaultKey);
      const signature = await signChallenge(`zeroid-register:${name}`);
      const account = await registerAccount({
        token,
        signature,
        username: name,
        password,
        email: email.trim() || null,
        vault_ciphertext: vaultCiphertext,
        wrapped_key: wrapped.wrappedKey,
        wrap_salt: wrapped.wrapSalt,
        wrap_iterations: wrapped.wrapIterations,
      });
      startSession({ username: account.username, token: account.session_token, vault });
      const { privateJwk } = await getOrCreateDeviceKey();
      const next = {
        token,
        privateJwk,
        vaultKey: bytesToBase64Url(vaultKey),
        vaultCiphertext,
      };
      setBundle(next);
      setPassword("");
      setConfirm("");
      await showPairing(next);
    } catch (err) {
      setError(err?.message ?? "No pudimos crear tu cuenta.");
    } finally {
      setBusy(false);
    }
  }

  async function showPairing(next) {
    const secret = randomSecret();
    const payload = await encryptPairing(secret, next);
    const pairing = await createPairing(payload);
    setQr(
      await QRCode.toDataURL(`zeroid://pair?id=${pairing.pairing_id}&key=${secret}`, {
        margin: 1,
        width: 240,
      })
    );
  }

  if (qr) {
    return (
      <div className="liveness">
        <div className="status-pill">
          <span className="status-icon">✓</span>
          <span>Cuenta creada · datos cifrados</span>
        </div>
        <h2>Vincula tu teléfono</h2>
        <p className="liveness__status">
          Abre la app ZeroID y escanea este código. Viaja cifrada la credencial,
          la llave para firmar y tu bóveda. El código sirve una sola vez y caduca
          en 5 minutos.
        </p>
        <img className="pair-qr" src={qr} alt="Código para vincular la app ZeroID" />
        <div className="liveness__actions flex flex-col md:flex-row">
          <button
            type="button"
            className="btn btn--secondary"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              showPairing(bundle).catch((err) => setError(err?.message ?? "No pudimos generar otro código.")).finally(() => setBusy(false));
            }}
          >
            Generar otro código
          </button>
          <Link href="/dashboard" className="btn btn--primary">
            Ir al dashboard
          </Link>
        </div>
        {error ? (
          <p className="liveness__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      <div className="status-pill">
        <span className="status-icon">✓</span>
        <span>Identidad verificada</span>
      </div>
      <p className="liveness__status">
        Elige un usuario y una contraseña. Tus datos se cifran en este navegador
        antes de salir: el servidor guarda el cifrado, no el contenido.
      </p>
      <label className="auth-field">
        Nombre
        <input value={profile.nombre || ""} readOnly />
      </label>
      <label className="auth-field">
        Documento
        <input value={profile.documento || ""} readOnly />
      </label>
      <label className="auth-field">
        Usuario
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoCapitalize="none"
          autoComplete="username"
          required
        />
      </label>
      <label className="auth-field">
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="auth-field">
        Repite la contraseña
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="auth-field">
        Correo (opcional, para encontrarte)
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />
      </label>
      <label className="auth-field">
        Teléfono (opcional)
        <input value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label className="auth-field">
        Dirección (opcional)
        <input value={address} onChange={(event) => setAddress(event.target.value)} />
      </label>
      {error ? (
        <p className="liveness__error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn--primary" disabled={busy}>
        {busy ? "Cifrando…" : "Crear cuenta y vincular teléfono"}
      </button>
    </form>
  );
}
