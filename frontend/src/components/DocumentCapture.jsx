"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CameraCapture from "./CameraCapture";
import CountrySelect from "./CountrySelect";
import { documentLabel } from "@/lib/countries";
import { validateDocumentImage } from "@/lib/documentImage";
import { fileToJpeg } from "@/lib/image";
import { saveDocumentDraft } from "@/lib/vault";

export default function DocumentCapture() {
  const router = useRouter();
  const [nationality, setNationality] = useState("");
  const [documentType, setDocumentType] = useState("cedula");
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
    if (!nationality) {
      setError("Elige tu nacionalidad.");
      return;
    }
    if (!file) {
      setError("Fotografía o sube tu documento.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await validateDocumentImage(file);
      const jpeg = await fileToJpeg(file, `documento-${documentType}.jpg`);
      await saveDocumentDraft({ nationality, documentType, file: jpeg });
      router.push("/boveda");
    } catch (err) {
      setError(err?.message ?? "No pudimos guardar el documento.");
      setBusy(false);
    }
  }

  return (
    <div className="register">
      <div className="register__intro">
        <span className="section-tag">Registro</span>
        <h1 className="section__title">Solo pedimos dos cosas.</h1>
        <p className="section__desc">
          Tu nacionalidad y una foto de tu cédula o pasaporte. La imagen queda
          en este dispositivo hasta que el oráculo la lea en memoria y la
          destruya.
        </p>
      </div>

      <div className="register__panel">
        <label className="field">
          <span>Nacionalidad</span>
          <CountrySelect
            value={nationality}
            onChange={(code) => {
              setNationality(code);
              setError("");
            }}
          />
        </label>

        <div className="field">
          <span>Documento</span>
          <div className="choice-row">
            {[
              { id: "cedula", label: documentLabel(nationality, "cedula") },
              { id: "pasaporte", label: documentLabel(nationality, "pasaporte") },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                className={`choice${documentType === type.id ? " is-active" : ""}`}
                onClick={() => setDocumentType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {preview ? (
          <div className="preview">
            <img src={preview} alt="Foto del documento capturada" />
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
          <CameraCapture
            documentType={documentType}
            documentName={documentLabel(nationality, "cedula")}
            onCapture={onCapture}
          />
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
