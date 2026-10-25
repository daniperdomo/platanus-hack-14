"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { getAuthRequest, getClient, startSignIn } from "@/lib/api";
import { DATA_FIELDS } from "@/lib/mockData";

const SCOPE_LABELS = {
  persona_real_unica: "Que eres una persona real, con una sola cuenta",
  mayor_de_edad: "Que eres mayor de edad",
  nacionalidad: "Tu nacionalidad",
};
const POLL_MS = 2000;

function readFields(raw) {
  try {
    const fields = JSON.parse(raw || "[]");
    return Array.isArray(fields) ? fields.filter((item) => item && typeof item.field === "string") : [];
  } catch {
    return [];
  }
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    clientId: params.get("client_id") || "",
    origin: params.get("origin") || "",
    scopes: (params.get("scopes") || "persona_real_unica").split(",").filter(Boolean),
    fields: readFields(params.get("fields")),
  };
}

export default function ConnectPage() {
  const [params, setParams] = useState(null);
  const [app, setApp] = useState(null);
  const [step, setStep] = useState("loading");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [qr, setQr] = useState("");
  const [notified, setNotified] = useState(false);
  const poll = useRef(null);

  useEffect(() => {
    const current = readParams();
    setParams(current);
    if (!current.clientId || !current.origin) {
      setStep("invalid");
      setMessage("Falta la configuración del sitio que te envió aquí.");
      return undefined;
    }
    getClient(current.clientId)
      .then((client) => {
        if (!client.origins.includes(current.origin)) {
          setStep("invalid");
          setMessage("Este sitio no está autorizado para usar esta aplicación de ZeroID.");
          return;
        }
        setApp(client);
        setStep("form");
      })
      .catch((error) => {
        setStep("invalid");
        setMessage(error.message);
      });
    return () => clearInterval(poll.current);
  }, []);

  function tell(type, extra = {}) {
    window.opener?.postMessage({ source: "zeroid", type, ...extra }, params.origin);
  }

  function watch(requestId, expiresIn) {
    const started = Date.now();
    clearInterval(poll.current);
    poll.current = setInterval(async () => {
      try {
        const request = await getAuthRequest(requestId);
        if (request.status === "approved") {
          clearInterval(poll.current);
          setStep("done");
          tell("approved", { requestId });
          setTimeout(() => window.close(), 900);
          return;
        }
        if (request.status === "consumed") {
          clearInterval(poll.current);
          setStep("form");
          setQr("");
          setMessage("Rechazaste el inicio de sesión desde el teléfono.");
          tell("rejected");
          return;
        }
        if (request.status === "expired" || Date.now() - started > expiresIn * 1000) {
          clearInterval(poll.current);
          setStep("form");
          setQr("");
          setMessage("La solicitud expiró. Vuelve a intentarlo.");
          tell("expired");
        }
      } catch (error) {
        clearInterval(poll.current);
        setStep("form");
        setMessage(error.message);
      }
    }, POLL_MS);
  }

  async function begin(withUsername) {
    setMessage("");
    try {
      const started = await startSignIn({
        clientId: params.clientId,
        origin: params.origin,
        username: withUsername ? username.trim() : null,
        scopes: params.scopes,
        fields: params.fields,
      });
      setNotified(started.notified);
      setQr(
        started.notified
          ? ""
          : await QRCode.toDataURL(started.approve_uri, { margin: 1, width: 220 })
      );
      setStep("waiting");
      watch(started.request_id, started.expires_in);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function cancel() {
    clearInterval(poll.current);
    setQr("");
    setStep("form");
  }

  return (
    <main className="auth connect">
      <div className="auth__top">
        <span className="nav__brand auth__brand">
          <span className="logo-mark" />
          ZeroID
        </span>
      </div>

      {step === "loading" && (
        <div className="auth-card">
          <p className="text-muted">Cargando…</p>
        </div>
      )}

      {step === "invalid" && (
        <div className="auth-card">
          <h1 className="auth-card__title">No podemos continuar</h1>
          <p className="cta-status is-error">{message}</p>
        </div>
      )}

      {step === "form" && app && (
        <div className="auth-card">
          <span className="section-tag">Iniciar sesión</span>
          <h1 className="auth-card__title">{app.name}</h1>
          <p className="text-muted auth-card__lead">
            {params.fields.length > 0
              ? `${params.origin.replace(/^https?:\/\//, "")} te pedirá algunos datos. Tú decides en el teléfono cuáles compartir.`
              : `${params.origin.replace(/^https?:\/\//, "")} solo sabrá que eres tú. No recibe tu nombre, correo ni documento.`}
          </p>

          <div className="connect__scopes">
            <span className="connect__label">Comprobará</span>
            <ul>
              {params.scopes.map((scope) => (
                <li key={scope}>{SCOPE_LABELS[scope] ?? scope}</li>
              ))}
            </ul>
          </div>

          {params.fields.length > 0 && (
            <div className="connect__scopes">
              <span className="connect__label">Te pedirá</span>
              <ul>
                {params.fields.map((item) => (
                  <li key={item.field}>
                    {DATA_FIELDS[item.field] ?? item.field}
                    {item.required === false ? " (opcional)" : ""}
                    {item.purpose ? <small className="connect__purpose">{item.purpose}</small> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            className="auth-form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (username.trim()) begin(true);
            }}
          >
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Tu usuario de ZeroID"
              aria-label="Usuario de ZeroID"
              autoCapitalize="none"
              autoComplete="username"
              autoFocus
            />
            <button type="submit" className="btn btn--primary" disabled={!username.trim()}>
              Enviar aviso a mi teléfono
            </button>
          </form>
          <p className="cta-status is-error" role="status" aria-live="polite">
            {message}
          </p>
          <div className="auth-divider">o</div>
          <button type="button" className="btn btn--secondary" onClick={() => begin(false)}>
            Escanear un código QR
          </button>
        </div>
      )}

      {step === "waiting" && (
        <div className="auth-card">
          <span className="pulse-dot" />
          <h1 className="auth-card__title">
            {notified ? "Revisa tu teléfono" : "Escanea con la app ZeroID"}
          </h1>
          <p className="text-muted auth-card__lead">
            {notified
              ? `Te enviamos una notificación. Confirma con tu huella o rostro que quieres entrar a ${app.name}.`
              : "Abre la app ZeroID y escanea este código para confirmar que eres tú."}
          </p>
          {qr ? <img className="bus-qr" src={qr} alt="Código para aprobar en ZeroID" /> : null}
          <button type="button" className="btn btn--secondary btn--sm" onClick={cancel}>
            Cancelar
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="auth-card">
          <span className="status-icon">✓</span>
          <h1 className="auth-card__title">Listo</h1>
          <p className="text-muted">Volviendo a {app?.name}…</p>
        </div>
      )}
    </main>
  );
}
