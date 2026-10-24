const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

const YAW_TURN = 0.28;
const YAW_FRONTAL = 0.14;
const PITCH_FRONTAL = 0.2;
const BLINK_CLOSED = 0.42;
const BLINK_OPEN = 0.18;
const SMILE = 0.38;
const HOLD_MS = 600;
const BLINKS_REQUIRED = 2;

export const CHALLENGES = {
  blink: {
    id: "blink",
    label: "Parpadea dos veces",
    hint: "Cierra y abre los ojos, despacio.",
  },
  turn_left: {
    id: "turn_left",
    label: "Gira a tu izquierda",
    hint: "Rota la cabeza hacia tu hombro izquierdo y sostén un momento.",
  },
  turn_right: {
    id: "turn_right",
    label: "Gira a tu derecha",
    hint: "Rota la cabeza hacia tu hombro derecho y sostén un momento.",
  },
  smile: {
    id: "smile",
    label: "Sonríe",
    hint: "Una sonrisa natural, con los ojos abiertos.",
  },
};

export function pickChallengeSequence() {
  const turns = ["turn_left", "turn_right"];
  const turn = turns[Math.floor(Math.random() * turns.length)];
  const extraPool = ["smile", turns.find((id) => id !== turn)];
  const extra = extraPool[Math.floor(Math.random() * extraPool.length)];
  const sequence = ["blink", turn, extra];
  for (let i = sequence.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
  }
  return sequence;
}

function blendshape(result, name) {
  const categories = result.faceBlendshapes?.[0]?.categories ?? [];
  return categories.find((item) => item.categoryName === name)?.score ?? 0;
}

function landmark(landmarks, index) {
  return landmarks[index] ?? { x: 0.5, y: 0.5, z: 0 };
}

export function analyzeFace(result) {
  const landmarks = result.faceLandmarks?.[0];
  if (!landmarks) {
    return { present: false };
  }

  const left = landmark(landmarks, 234);
  const right = landmark(landmarks, 454);
  const nose = landmark(landmarks, 1);
  const forehead = landmark(landmarks, 10);
  const chin = landmark(landmarks, 152);

  const midX = (left.x + right.x) / 2;
  const halfX = (right.x - left.x) / 2 || 1;
  const yaw = (nose.x - midX) / halfX;

  const midY = (forehead.y + chin.y) / 2;
  const halfY = (chin.y - forehead.y) / 2 || 1;
  const pitch = (nose.y - midY) / halfY;

  const blink =
    (blendshape(result, "eyeBlinkLeft") + blendshape(result, "eyeBlinkRight")) /
    2;
  const smile =
    (blendshape(result, "mouthSmileLeft") +
      blendshape(result, "mouthSmileRight")) /
    2;

  const eyesClosed = blink >= BLINK_CLOSED;
  const eyesOpen = blink <= BLINK_OPEN;
  const frontal =
    Math.abs(yaw) <= YAW_FRONTAL &&
    Math.abs(pitch) <= PITCH_FRONTAL &&
    eyesOpen;

  return {
    present: true,
    yaw,
    pitch,
    blink,
    smile,
    eyesClosed,
    eyesOpen,
    smiling: smile >= SMILE,
    turnedLeft: yaw > YAW_TURN,
    turnedRight: yaw < -YAW_TURN,
    frontal,
  };
}

export class LivenessTracker {
  constructor(challengeIds) {
    this.challengeIds = challengeIds;
    this.index = 0;
    this.holdStarted = null;
    this.blinks = 0;
    this.eyesWereOpen = true;
    this.phase = "challenges";
    this.frontalStarted = null;
  }

  get currentId() {
    return this.challengeIds[this.index] ?? null;
  }

  get current() {
    return this.currentId ? CHALLENGES[this.currentId] : null;
  }

  get challengesDone() {
    return this.index >= this.challengeIds.length;
  }

  get complete() {
    return this.phase === "ready";
  }

  get step() {
    return this.challengesDone
      ? this.challengeIds.length
      : this.index;
  }

  feed(signals, now = 0) {
    if (this.complete) {
      return this.snapshot();
    }

    if (!signals.present) {
      this.holdStarted = null;
      this.frontalStarted = null;
      return { ...this.snapshot(), status: "no_face" };
    }

    if (!this.challengesDone) {
      if (this.#challengeMet(signals, now)) {
        this.index += 1;
        this.holdStarted = null;
        this.blinks = 0;
        this.eyesWereOpen = true;
      }
    }

    if (this.challengesDone) {
      this.phase = "frontal";
      if (signals.frontal) {
        if (this.frontalStarted == null) this.frontalStarted = now;
        if (now - this.frontalStarted >= HOLD_MS) this.phase = "ready";
      } else {
        this.frontalStarted = null;
      }
    }

    return this.snapshot();
  }

  snapshot() {
    return {
      status: this.complete
        ? "ready"
        : this.challengesDone
          ? "frontal"
          : "challenge",
      phase: this.phase,
      current: this.current,
      step: this.step,
      total: this.challengeIds.length,
      blinks: this.blinks,
      complete: this.complete,
    };
  }

  #challengeMet(signals, now) {
    const id = this.currentId;
    if (id === "blink") {
      if (this.eyesWereOpen && signals.eyesClosed) {
        this.eyesWereOpen = false;
      } else if (!this.eyesWereOpen && signals.eyesOpen) {
        this.blinks += 1;
        this.eyesWereOpen = true;
      }
      return this.blinks >= BLINKS_REQUIRED;
    }

    const holding =
      (id === "turn_left" && signals.turnedLeft) ||
      (id === "turn_right" && signals.turnedRight) ||
      (id === "smile" && signals.smiling && signals.eyesOpen);

    if (!holding) {
      this.holdStarted = null;
      return false;
    }
    if (this.holdStarted == null) this.holdStarted = now;
    return now - this.holdStarted >= HOLD_MS;
  }
}

function quietMediaPipeLogs() {
  if (typeof window === "undefined" || window.__zeroIdMpLogs) return;
  window.__zeroIdMpLogs = true;
  const original = console.error.bind(console);
  console.error = (...args) => {
    const text = args.map((item) => String(item?.message ?? item)).join(" ");
    if (/INFO:|TensorFlow Lite|XNNPACK|Created TensorFlow/.test(text)) return;
    original(...args);
  };
}

export async function createFaceLandmarker() {
  quietMediaPipeLogs();
  const { FaceLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const options = {
    outputFaceBlendshapes: true,
    runningMode: "VIDEO",
    numFaces: 1,
  };

  try {
    return await FaceLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    });
  } catch {
    return await FaceLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
    });
  }
}

export async function startCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function snapshotFromVideo(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo capturar la foto."));
          return;
        }
        resolve(
          new File([blob], "liveness-selfie.jpg", { type: "image/jpeg" })
        );
      },
      "image/jpeg",
      0.92
    );
  });
}
