"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CameraCapture from "./CameraCapture";
import { validateDocumentImage } from "@/lib/documentImage";
import { fileToJpeg } from "@/lib/image";
import { saveDocumentDraft } from "@/lib/vault";

export default function DocumentCapture() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onCapture(nextFile) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setError("");
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
  }

  async function confirm() {
    if (!file) {
      setError("Fotografía o sube la página de datos de tu pasaporte.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await validateDocumentImage(file);
      const jpeg = await fileToJpeg(file, "pasaporte.jpg");
      await saveDocumentDraft({ file: jpeg });
      router.push("/boveda");
    } catch (err) {
      setError(err?.message ?? "No pudimos guardar el pasaporte.");
      setBusy(false);
    }
  }

  return (
    <div className="register">
      <div className="register__intro">
        <span className="section-tag">Registro</span>
        <h1 className="section__title">Solo pedimos tu pasaporte.</h1>
        <p className="section__desc">
          Una foto de la página de datos de tu pasaporte. La imagen queda en
          este dispositivo hasta que el oráculo lea la zona MRZ en memoria y la
          destruya.
        </p>
      </div>

      <div className="register__panel">
        {preview ? (
          <div className="preview">
            <img src={preview} alt="Foto del pasaporte capturada" />
            <div className="camera__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={retake}
                disabled={busy}
              >
                Volver a tomar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={confirm}
                disabled={busy}
              >
                {busy ? "Guardando…" : "Continuar a la prueba de vida"}
              </button>
            </div>
          </div>
        ) : (
          <CameraCapture onCapture={onCapture} />
        )}

        {error ? (
          <p className="cta-status is-error" role="status">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
