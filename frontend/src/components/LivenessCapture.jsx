"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHALLENGES,
  LivenessTracker,
  analyzeFace,
  createFaceLandmarker,
  pickChallengeSequence,
  snapshotFromVideo,
  startCamera,
  stopStream,
} from "@/lib/liveness";

const STATUS_COPY = {
  idle: "La cámara se usa solo en tu navegador. El video nunca viaja al servidor.",
  requesting: "Pidiendo permiso de cámara…",
  loading: "Cargando Face Mesh en tu dispositivo…",
  running: "Sigue las indicaciones. Nada de esto se envía todavía.",
  no_face: "Acerca tu cara al óvalo. Necesitamos verte para comprobar que eres real.",
  capturing: "Extrayendo una sola foto validada…",
};

export default function LivenessCapture({ onCapture, onReset, autoStart = false }) {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const trackerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(-1);
  const capturingRef = useRef(false);
  const uiKeyRef = useRef("");
  const autoStartedRef = useRef(false);
  const runRef = useRef(0);

  const [phase, setPhase] = useState("idle");
  const [error, setError] = useState("");
  const [challengeIds, setChallengeIds] = useState([]);
  const [trackerState, setTrackerState] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      stopStream(streamRef.current);
      landmarkerRef.current?.close?.();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Strict Mode runs effects twice in dev; a second begin() would open a second camera stream.
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    begin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function begin() {
    setError("");
    setPhoto(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setChallengeIds([]);
    setTrackerState(null);
    setPhase("requesting");
    onReset?.();
    capturingRef.current = false;
    const run = ++runRef.current;

    const sequence = pickChallengeSequence();
    trackerRef.current = new LivenessTracker(sequence);

    try {
      setPhase("loading");
      const video = videoRef.current;
      const modelPromise = landmarkerRef.current
        ? Promise.resolve(landmarkerRef.current)
        : createFaceLandmarker();
      const [landmarker, stream] = await Promise.all([
        modelPromise,
        startCamera(video),
      ]);
      if (run !== runRef.current) {
        stopStream(stream);
        if (video) video.srcObject = null;
        return;
      }
      landmarkerRef.current = landmarker;
      streamRef.current = stream;

      lastTsRef.current = -1;
      uiKeyRef.current = "";
      setChallengeIds(sequence);
      setTrackerState(trackerRef.current.snapshot());
      setPhase("running");
      loop();
    } catch (err) {
      if (run !== runRef.current) return;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setChallengeIds([]);
      setPhase("idle");
      setError(
        err?.name === "NotAllowedError"
          ? "El navegador bloqueó la cámara. Permite el acceso en el candado de la barra de dirección y vuelve a intentarlo."
          : err?.message ?? "No se pudo iniciar la cámara."
      );
    }
  }

  function loop() {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    const tracker = trackerRef.current;
    if (!video || !landmarker || !tracker) return;

    const tick = () => {
      if (capturingRef.current || tracker.complete) return;
      if (video.readyState >= 2) {
        let now = performance.now();
        if (now <= lastTsRef.current) now = lastTsRef.current + 1;
        lastTsRef.current = now;
        const result = landmarker.detectForVideo(video, now);
        const signals = analyzeFace(result);
        const next = tracker.feed(signals, now);
        const uiKey = `${next.status}:${next.step}:${next.blinks}`;
        if (uiKeyRef.current !== uiKey) {
          uiKeyRef.current = uiKey;
          setTrackerState(next);
        }
        if (next.complete) {
          capture();
          return;
        }
        const nextPhase = signals.present ? "running" : "no_face";
        setPhase((current) => (current === nextPhase ? current : nextPhase));
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  async function capture() {
    if (capturingRef.current) return;
    capturingRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setPhase("capturing");

    try {
      const file = await snapshotFromVideo(videoRef.current);
      if (!file.type.startsWith("image/") || file.type.includes("video")) {
        throw new Error("La captura no es una foto. Inténtalo de nuevo.");
      }
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPhoto(file);
      setPhase("done");
      onCapture?.(file);
    } catch (err) {
      capturingRef.current = false;
      setPhase("idle");
      setError(err?.message ?? "No se pudo extraer la foto.");
      stopStream(streamRef.current);
    }
  }

  const prompt =
    phase === "no_face"
      ? {
          label: "No vemos tu cara",
          hint: "Centra el rostro dentro del óvalo, con buena luz.",
        }
      : trackerState?.status === "frontal"
        ? {
            label: "Mira al frente",
            hint: "Cara centrada, ojos abiertos. Capturamos una sola foto y apagamos la cámara.",
          }
        : trackerState?.current ?? null;

  return (
    <div className="liveness">
      <div className="liveness__stage">
        <video
          ref={videoRef}
          className={`liveness__video${phase === "done" ? " is-hidden" : ""}`}
          playsInline
          muted
          autoPlay
        />
        {phase === "done" && previewUrl ? (
          <img
            src={previewUrl}
            alt="Selfie validada por liveness"
            className="liveness__photo"
          />
        ) : phase === "idle" || phase === "requesting" ? (
          <p className="liveness__placeholder">Encuadra tu rostro en el óvalo</p>
        ) : (
          <div className="liveness__oval" aria-hidden="true" />
        )}
      </div>

      {phase !== "idle" && phase !== "done" && prompt ? (
        <div className="liveness__prompt">
          <strong>{prompt.label}</strong>
          <span>{prompt.hint}</span>
        </div>
      ) : null}

      {challengeIds.length > 0 ? (
        <ol className="liveness__steps">
          {challengeIds.map((id, index) => {
            const done = (trackerState?.step ?? 0) > index || phase === "done";
            const active =
              trackerState?.status === "challenge" &&
              trackerState?.current?.id === id &&
              phase !== "done";
            return (
              <li
                key={`${id}-${index}`}
                className={`liveness__step${done ? " is-done" : ""}${
                  active ? " is-active" : ""
                }`}
              >
                {CHALLENGES[id].label}
              </li>
            );
          })}
          <li
            className={`liveness__step${
              trackerState?.status === "frontal" ? " is-active" : ""
            }${phase === "done" ? " is-done" : ""}`}
          >
            Foto validada
          </li>
        </ol>
      ) : null}

      <p className="liveness__status" role="status">
        {phase === "done"
          ? "Prueba de vida superada. El video se detuvo; solo queda esta foto."
          : STATUS_COPY[phase] ?? STATUS_COPY.running}
      </p>

      {error ? (
        <p className="liveness__error" role="alert">
          {error}
        </p>
      ) : null}

      {photo ? (
        <p className="liveness__meta">
          {photo.name} · {(photo.size / 1024).toFixed(0)} KB · {photo.type}
        </p>
      ) : null}

      <div className="liveness__actions">
        {phase === "idle" || phase === "done" ? (
          <button type="button" className="btn btn--primary" onClick={begin}>
            {phase === "done" ? "Repetir prueba" : "Iniciar prueba de vida"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              runRef.current += 1;
              cancelAnimationFrame(rafRef.current);
              stopStream(streamRef.current);
              streamRef.current = null;
              if (videoRef.current) videoRef.current.srcObject = null;
              capturingRef.current = false;
              setChallengeIds([]);
              setTrackerState(null);
              setPhase("idle");
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
