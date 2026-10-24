"use client";

import { useState } from "react";
import Link from "next/link";

function CopyRow({ label, value, secret = false }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="credential">
      <span className="credential__label">{label}</span>
      <code className="credential__value">{value}</code>
      <button type="button" className="btn btn--secondary btn--sm" onClick={copy}>
        {copied ? "Copiado" : "Copiar"}
      </button>
      {secret && (
        <span className="credential__warning">
          Guárdalo ahora: no volveremos a mostrarlo.
        </span>
      )}
    </div>
  );
}

export default function Credentials({ company, credentials }) {
  const snippet = `zeroid.init({ clientId: "${credentials.clientId}" });`;

  return (
    <div className="form-card credentials">
      <span className="status-pill">
        <span className="status-icon">✓</span>
        <span>Solicitud recibida · {credentials.issuedAt}</span>
      </span>
      <h1 className="form-card__title">Tu API de ZeroID está lista</h1>
      <p className="text-muted">
        Recibimos la documentación de {company.tradeName}. Ya puedes integrar el
        botón “Continuar con ZeroID” en los dominios que autorizaste. Tu Trust
        Score aparecerá como <strong>en evaluación</strong> hasta que revisemos los
        documentos.
      </p>

      <CopyRow label="Client ID" value={credentials.clientId} />
      <CopyRow label="Client secret" value={credentials.clientSecret} secret />

      <h3 className="form-subtitle">Primer paso de la integración</h3>
      <pre className="code-block">
        <code>{snippet}</code>
      </pre>

      <div className="form-actions">
        <Link href="/autobuses" className="btn btn--secondary">
          Ver demo de integración
        </Link>
        <Link href="/" className="btn btn--primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
