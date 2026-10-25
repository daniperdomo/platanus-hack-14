"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";
import { DEMO_URL } from "@/lib/demo";
import { buildSdkGuide, guideToHtml, guideToMarkdown } from "@/lib/sdkGuide";

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
          Guárdalo ahora: no volveremos a mostrarlo y no aparece en la documentación.
        </span>
      )}
    </div>
  );
}

function slug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Credentials({ company, credentials }) {
  const guide = useMemo(
    () =>
      buildSdkGuide({
        companyName: company.tradeName,
        clientId: credentials.clientId,
        origins: credentials.origins,
        zeroidUrl: window.location.origin,
        apiUrl: API_URL,
        issuedAt: credentials.issuedAt,
      }),
    [company.tradeName, credentials]
  );
  const filename = `zeroid-sdk-${slug(company.tradeName) || "empresa"}`;
  const snippet = `<script src="${window.location.origin}/sdk/zeroid.js"></script>
<script>
  ZeroID.init({ clientId: "${credentials.clientId}" });
  ZeroID.renderButton("#zeroid-login", { onSuccess: ({ requestId }) => { /* envíalo a tu backend */ } });
</script>`;

  function openPrintable() {
    const url = URL.createObjectURL(new Blob([guideToHtml(guide)], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="form-card credentials">
      <span className="status-pill">
        <span className="status-icon">✓</span>
        <span>Solicitud recibida · {credentials.issuedAt}</span>
      </span>
      <h1 className="form-card__title">Tu API de ZeroID está lista</h1>
      <p className="text-muted">
        Recibimos la documentación de {company.tradeName}. Ya puedes integrar el
        botón “Continuar con ZeroID” en {credentials.origins.join(", ")}. Tu Trust
        Score aparecerá como <strong>en evaluación</strong> hasta que revisemos los
        documentos.
      </p>

      <CopyRow label="Client ID" value={credentials.clientId} />
      <CopyRow label="Client secret" value={credentials.clientSecret} secret />

      <h3 className="form-subtitle">Documentación del SDK</h3>
      <p className="text-muted">
        Guía de integración con tu client ID y tus dominios ya configurados: instalación,
        botón, canje en tu backend, verificación del token y referencia de errores.
      </p>
      <div className="credentials__docs">
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => download(`${filename}.md`, guideToMarkdown(guide), "text/markdown")}
        >
          Descargar guía (.md)
        </button>
        <button type="button" className="btn btn--secondary" onClick={openPrintable}>
          Abrir para guardar en PDF
        </button>
      </div>

      <h3 className="form-subtitle">Primer paso de la integración</h3>
      <pre className="code-block">
        <code>{snippet}</code>
      </pre>

      <div className="form-actions">
        <a href={DEMO_URL} className="btn btn--secondary">
          Ver demo de integración
        </a>
        <Link href="/" className="btn btn--primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
