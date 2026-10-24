"use client";

import { useState } from "react";
import CameraCapture from "@/components/CameraCapture";
import { debugDocument } from "@/lib/api";
import { fileToJpeg } from "@/lib/image";

function Fields({ fields }) {
  return (
    <div className="token-box">
      {Object.entries(fields).map(([name, value]) => (
        <div className="token-row" key={name}>
          <code>
            {name}: {JSON.stringify(value)}
          </code>
        </div>
      ))}
    </div>
  );
}

function Report({ title, result }) {
  if (result.status === "rejected") {
    return (
      <section className="debug-report">
        <h2>{title}</h2>
        <p className="cta-status is-error">{result.reason?.message}</p>
      </section>
    );
  }

  const report = result.value;
  return (
    <section className="debug-report">
      <h2>{title}</h2>
      <p>Imagen enviada: {report.image_size}</p>

      <h3>1. MRZ transcrita por Gemini</h3>
      <pre className="debug-pre">
        {`${report.gemini.mrz_line1}\n${report.gemini.mrz_line2}`}
      </pre>

      <h3>2. Respuesta completa de Gemini</h3>
      <Fields fields={report.gemini} />

      <h3>3. Verificación local (dígitos de control recalculados en el backend)</h3>
      {report.parsed ? (
        <Fields fields={report.parsed} />
      ) : (
        <p className="cta-status is-error">{report.parse_error}</p>
      )}
    </section>
  );
}

export default function DebugPassportPage() {
  const [preview, setPreview] = useState("");
  const [reports, setReports] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onCapture(file) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setReports(null);
    setBusy(true);

    const processed = await fileToJpeg(file, "pasaporte.jpg").catch(() => file);
    const [original, flow] = await Promise.allSettled([
      debugDocument(file),
      debugDocument(processed),
    ]);
    setReports({ original, flow });
    setBusy(false);
  }

  return (
    <main className="section">
      <div className="container debug-page">
        <h1>Diagnóstico de lectura de pasaporte</h1>
        <p>
          No valida ni registra nada. Muestra qué lee Gemini y si la MRZ pasa
          nuestra verificación de dígitos de control, para la imagen original
          y para la versión reducida a 1280 px que usa el flujo real. Requiere{" "}
          <code>DEBUG_PASSPORT=true</code> en el backend.
        </p>

        <CameraCapture onCapture={onCapture} />

        {preview ? <img className="debug-preview" src={preview} alt="Imagen analizada" /> : null}
        {busy ? <p className="cta-status">Analizando…</p> : null}

        {reports ? (
          <div className="debug-grid">
            <Report title="Imagen original" result={reports.original} />
            <Report title="Como en el flujo real (1280 px)" result={reports.flow} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
