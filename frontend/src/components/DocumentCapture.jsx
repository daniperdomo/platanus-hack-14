"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CameraCapture from "./CameraCapture";
import { checkDocument } from "@/lib/api";
import { validateDocumentImage } from "@/lib/documentImage";
import { fileToJpeg } from "@/lib/image";
import { saveDocumentDraft } from "@/lib/vault";

export default function DocumentCapture() {
  const router = useRouter();
  const [preview, setPreview] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);

  async function onCapture(file) {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setError("");
    setDebug(null);
    setStatus("checking");

    try {
      await validateDocumentImage(file);
      const jpeg = await fileToJpeg(file, "pasaporte.jpg");
      const result = await checkDocument(jpeg);
      await saveDocumentDraft({ file: jpeg });
      if (result.debug) {
        setDebug(result.debug);
        setStatus("debug");
        return;
      }
      setStatus("ok");
      router.push("/boveda");
    } catch (err) {
      setError(err?.message ?? "No pudimos verificar tu pasaporte.");
      setStatus("error");
    }
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setError("");
    setDebug(null);
    setStatus("idle");
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

            {status === "checking" ? (
              <p className="cta-status" role="status">
                Verificando tu pasaporte…
              </p>
            ) : null}

            {status === "ok" ? (
              <p className="cta-status" role="status">
                ✓ Pasaporte verificado. Iniciando la prueba de vida…
              </p>
            ) : null}

            {status === "debug" && debug ? (
              <>
                <p className="cta-status" role="status">
                  ✓ Pasaporte verificado. Modo debug: esto es lo que se leyó de la MRZ.
                </p>
                <div className="token-box">
                  {Object.entries(debug).map(([name, value]) => (
                    <div className="token-row" key={name}>
                      <code>
                        {name}: {JSON.stringify(value)}
                      </code>
                    </div>
                  ))}
                </div>
                <div className="camera__actions">
                  <button type="button" className="btn btn--secondary" onClick={retake}>
                    Volver a tomar
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => router.push("/boveda")}
                  >
                    Continuar a la prueba de vida
                  </button>
                </div>
              </>
            ) : null}

            {status === "error" ? (
              <>
                <p className="cta-status is-error" role="alert">
                  {error}
                </p>
                <div className="camera__actions">
                  <button type="button" className="btn btn--primary" onClick={retake}>
                    Volver a tomar
                  </button>
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <CameraCapture onCapture={onCapture} />
        )}
      </div>
    </div>
  );
}
