"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collectSession, loginAccount } from "@/lib/api";
import { startGuestSession, startSession } from "@/lib/session";
import { decryptJson, unwrapVaultKey } from "@/lib/vaultCrypto";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("form");
  const [message, setMessage] = useState("");
  const poll = useRef(null);

  useEffect(() => () => clearInterval(poll.current), []);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const created = await loginAccount({ username: username.trim(), password });
      setStep("waiting");
      const started = Date.now();
      poll.current = setInterval(async () => {
        try {
          const result = await collectSession(created.request_id);
          if (result.status === "rejected") {
            clearInterval(poll.current);
            setStep("form");
            setMessage("Rechazaste el inicio de sesión desde el teléfono.");
            return;
          }
          if (result.status !== "delivered") {
            if (Date.now() - started > created.expires_in * 1000) {
              clearInterval(poll.current);
              setStep("form");
              setMessage("La solicitud expiró. Vuelve a intentarlo.");
            }
            return;
          }
          clearInterval(poll.current);
          const vaultKey = await unwrapVaultKey(
            password,
            result.wrapped_key,
            result.wrap_salt,
            result.wrap_iterations
          );
          const vault = await decryptJson(vaultKey, result.vault_ciphertext);
          setPassword("");
          startSession({ username: result.username, token: result.session_token, vault });
          router.push("/dashboard");
        } catch (err) {
          clearInterval(poll.current);
          setStep("form");
          setMessage(err?.message ?? "No pudimos abrir la sesión.");
        }
      }, 2000);
    } catch (err) {
      setMessage(err?.message ?? "No pudimos iniciar sesión.");
    }
  }

  function enterAsGuest() {
    startGuestSession();
    router.push("/dashboard");
  }

  return (
    <main className="auth">
      <Link href="/" className="nav__brand auth__brand">
        <span className="logo-mark" />
        ZeroID
      </Link>

      {step === "form" ? (
        <div className="auth-card">
          <h1 className="auth-card__title">Inicia sesión</h1>
          <p className="text-muted auth-card__lead">
            Después de tu contraseña, la app ZeroID de tu teléfono te pide
            confirmar que eres tú.
          </p>
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Usuario"
              aria-label="Usuario"
              autoCapitalize="none"
              autoComplete="username"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              aria-label="Contraseña"
              autoComplete="current-password"
            />
            <button type="submit" className="btn btn--primary">
              Continuar
            </button>
          </form>
          <p className="cta-status is-error" role="status" aria-live="polite">
            {message}
          </p>
          <p className="text-muted">
            ¿Primera vez? <Link href="/registrar">Crea tu ZeroID</Link>
          </p>
          <div className="auth-divider">o</div>
          <button
            type="button"
            className="btn btn--secondary auth-guest"
            onClick={enterAsGuest}
          >
            Entrar como invitado
          </button>
        </div>
      ) : (
        <div className="auth-card">
          <span className="pulse-dot" />
          <h1 className="auth-card__title">Revisa tu teléfono</h1>
          <p className="text-muted auth-card__lead">
            Abre la app ZeroID. Te va a preguntar si eres tú quien intenta entrar
            al dashboard de <strong>{username}</strong>.
          </p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => {
              clearInterval(poll.current);
              setStep("form");
            }}
          >
            Cancelar
          </button>
        </div>
      )}
    </main>
  );
}
