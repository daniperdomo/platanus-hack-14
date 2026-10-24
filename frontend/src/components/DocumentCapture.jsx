"use client";

import { useState } from "react";
import CameraCapture from "./CameraCapture";
import CountrySelect from "./CountrySelect";
import { countryName, documentLabel } from "@/lib/countries";
import { saveDocumentDraft } from "@/lib/vault";

export default function DocumentCapture() {
  const [nationality, setNationality] = useState("");
  const [documentType, setDocumentType] = useState("cedula");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function onCapture(nextFile) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setSaved(false);
    setError("");
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    setSaved(false);
  }

  function confirm() {
    if (!nationality) {
      setError("Elige tu nacionalidad.");
      return;
    }
    if (!file) {
      setError("Fotografía o sube tu documento.");
      return;
    }

    saveDocumentDraft({ nationality, documentType, file });
    setSaved(true);
    setError("");
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
              setSaved(false);
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
                onClick={() => {
                  setDocumentType(type.id);
                  setSaved(false);
                }}
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
              <button type="button" className="btn btn--secondary" onClick={retake}>
                Volver a tomar
              </button>
              <button type="button" className="btn btn--primary" onClick={confirm}>
                Confirmar documento
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

        {saved ? (
          <p className="register__done" role="status">
            Documento listo: {countryName(nationality)} ·{" "}
            {documentLabel(nationality, documentType)}. No se envió
            a ningún servidor. La selfie de liveness es el siguiente paso.
          </p>
        ) : null}

      </div>
    </div>
  );
}
