"use client";

import { useEffect, useRef, useState } from "react";

const GUIDE_WIDTH = 0.86;
// ID-1 card proportions (85.6 × 54 mm); a passport data page also fits inside.
const GUIDE_RATIO = 85.6 / 54;

function cameraErrorMessage(error) {
  if (!window.isSecureContext) {
    return "La cámara solo funciona en una conexión segura (https).";
  }
  if (error?.name === "NotAllowedError") {
    return "No diste permiso para usar la cámara. Actívalo en tu navegador o sube una imagen.";
  }
  if (error?.name === "NotFoundError" || error?.name === "OverconstrainedError") {
    return "No encontramos una cámara en este dispositivo. Sube una imagen.";
  }
  return "No pudimos abrir la cámara. Sube una imagen.";
}

export default function DocumentCamera({ onCapture, onCancel }) {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let stream;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) return;
        videoRef.current.srcObject = stream;
      } catch (cameraError) {
        if (!cancelled) setError(cameraErrorMessage(cameraError));
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      start();
    } else {
      setError(cameraErrorMessage());
    }

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const frame = frameRef.current.getBoundingClientRect();

    // The video is rendered with object-fit: cover, so map the on-screen guide
    // back to the camera's native pixels before cropping.
    const scale = Math.max(frame.width / video.videoWidth, frame.height / video.videoHeight);
    const offsetX = (frame.width - video.videoWidth * scale) / 2;
    const offsetY = (frame.height - video.videoHeight * scale) / 2;

    const guideWidth = frame.width * GUIDE_WIDTH;
    const guideHeight = guideWidth / GUIDE_RATIO;
    const guideX = (frame.width - guideWidth) / 2;
    const guideY = (frame.height - guideHeight) / 2;

    const sx = (guideX - offsetX) / scale;
    const sy = (guideY - offsetY) / scale;
    const sw = guideWidth / scale;
    const sh = guideHeight / scale;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    canvas.getContext("2d").drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], "documento.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className="camera">
      <div className="camera__frame" ref={frameRef}>
        <video
          ref={videoRef}
          className="camera__video"
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setReady(true)}
        />
        <div
          className="camera__guide"
          style={{ width: `${GUIDE_WIDTH * 100}%`, aspectRatio: GUIDE_RATIO }}
          aria-hidden="true"
        />
        {!ready && !error && <p className="camera__status">Abriendo cámara…</p>}
        {error && <p className="camera__status">{error}</p>}
      </div>

      <p className="camera__hint">
        Encuadra tu cédula o la página de datos de tu pasaporte dentro del marco, con buena luz y sin
        reflejos.
      </p>

      <div className="camera__actions">
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn btn--primary" onClick={capture} disabled={!ready}>
          Tomar foto
        </button>
      </div>
    </div>
  );
}
