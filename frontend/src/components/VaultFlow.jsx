"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LivenessCapture from "./LivenessCapture";
import { ingest } from "@/lib/api";
import { getOrCreateDeviceKey } from "@/lib/crypto";
import { saveCredential } from "@/lib/storage";
import AccountSetup from "./AccountSetup";
import { clearDocumentDraft, loadDocumentDraft } from "@/lib/vault";

export default function VaultFlow() {
  const [draft, setDraft] = useState(undefined);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState(null);

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
      setIssued({ token: response.token, profile: response.profile });
    } catch (err) {
      setError(err?.message ?? "No pudimos emitir tu credencial.");
    } finally {
      setSending(false);
    }
  }

  if (issued) {
    return <AccountSetup token={issued.token} profile={issued.profile} />;
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
