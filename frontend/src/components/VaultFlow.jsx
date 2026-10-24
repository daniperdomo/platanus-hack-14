"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LivenessCapture from "./LivenessCapture";
import { ingest } from "@/lib/api";
import { getOrCreateDeviceKey } from "@/lib/crypto";
import { saveCredential } from "@/lib/storage";
import { clearDocumentDraft, loadDocumentDraft } from "@/lib/vault";

export default function VaultFlow() {
  const [draft, setDraft] = useState(undefined);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [claims, setClaims] = useState(null);

  useEffect(() => {
    loadDocumentDraft()
      .then(setDraft)
      .catch(() => setDraft(null));
  }, []);

  async function onCapture(selfie) {
    setSending(true);
    setError("");
    try {
      const { publicJwk } = await getOrCreateDeviceKey();
      const response = await ingest({
        selfie,
        document: draft.file,
        devicePublicJwk: publicJwk,
      });
      saveCredential(response.token);
      clearDocumentDraft();
      setDraft(null);
      setClaims(response.claims);
    } catch (err) {
      setError(err?.message ?? "No pudimos emitir tu credencial.");
    } finally {
      setSending(false);
    }
  }

  if (claims) {
    return (
      <div className="liveness">
        <div className="status-pill">
          <span className="status-icon">✓</span>
          <span>Credencial emitida · documento destruido</span>
        </div>
        <div className="token-box">
          {Object.entries(claims).map(([name, value]) => (
            <div className="token-row" key={name}>
              <code>
                {name}: {JSON.stringify(value)}
              </code>
            </div>
          ))}
        </div>
        <p className="liveness__status">
          Tu credencial vive solo en este navegador. El oráculo ya descartó tu
          selfie y la foto de tu documento.
        </p>
      </div>
    );
  }

  if (draft === undefined) {
    return <p className="liveness__status">Cargando tu documento…</p>;
  }

  if (!draft) {
    return (
      <div className="liveness">
        <p className="liveness__status">
          Primero necesitamos la foto de tu documento.
        </p>
        <div className="liveness__actions">
          <Link href="/registrar" className="btn btn--primary">
            Fotografiar documento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <LivenessCapture onCapture={onCapture} onReset={() => setError("")} />
      {sending ? (
        <p className="liveness__status" role="status">
          Verificando con el oráculo…
        </p>
      ) : null}
      {error ? (
        <p className="liveness__error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
