"use client";

import { useEffect, useRef, useState } from "react";

async function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [photo, setPhoto] = useState(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }

  useEffect(() => {
    return () => {
      stopCamera();
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!live || !video || !stream) return;

    video.srcObject = stream;
    video.muted = true;
    const play = video.play();
    if (play) {
      play.catch(() => {
        setError("La cámara abrió, pero el navegador bloqueó la vista previa.");
      });
    }
  }, [live]);

  function applyFile(file) {
    if (!file) return;
    stopCamera();
    setPhoto(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    onCapture(file);
  }

  async function startCamera() {
    setError("");
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Este navegador no tiene cámara. Sube una foto.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setLive(true);
    } catch {
      setError("No pudimos usar la cámara. Revisa el permiso o sube una foto.");
    }
  }

  async function takePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    applyFile(await blobToFile(blob, "pasaporte.jpg"));
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    e.target.value = "";
    applyFile(file);
  }

  return (
    <div className="camera flex flex-col w-full">
      <div className="camera__stage camera__stage--pasaporte">
        {preview ? (
          <img src={preview} alt="Foto seleccionada" className="camera__preview" />
        ) : (
          <>
            <video
              ref={videoRef}
              className="camera__video"
              playsInline
              muted
              autoPlay
              hidden={!live}
            />
            {live ? null : (
              <p className="camera__placeholder">Encuadra la página de datos del pasaporte</p>
            )}
            <div className="camera__frame" aria-hidden="true" />
          </>
        )}
      </div>

      <p className="camera__hint">
        Asegúrate de que las dos líneas con &lt;&lt;&lt;&lt; inferiores sean legibles.
      </p>

      {error ? (
        <p className="cta-status is-error" role="status">
          {error}
        </p>
      ) : null}

      {photo ? (
        <p className="camera__meta">
          {photo.name} · {(photo.size / 1024).toFixed(0)} KB
        </p>
      ) : null}

      <div className="camera__actions flex flex-col md:flex-row">
        {live ? (
          <button type="button" className="btn btn--primary" onClick={takePhoto}>
            Tomar foto
          </button>
        ) : (
          <button type="button" className="btn btn--primary" onClick={startCamera}>
            Abrir cámara
          </button>
        )}
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => fileInputRef.current.click()}
        >
          Subir Foto
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
