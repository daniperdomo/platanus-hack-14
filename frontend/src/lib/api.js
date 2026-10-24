const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.detail ?? `Error ${response.status}`);
  }
  return body;
}

export function ingest({ selfie, document, devicePublicJwk }) {
  if (!selfie?.type?.startsWith("image/") || selfie.type.startsWith("video/")) {
    return Promise.reject(
      new Error("Solo se envía una foto validada. El video no sale del navegador.")
    );
  }
  const form = new FormData();
  form.append("selfie", selfie, selfie.name ?? "liveness-selfie.jpg");
  form.append("document", document);
  form.append("device_public_jwk", JSON.stringify(devicePublicJwk));
  return request("/ingest", { method: "POST", body: form });
}

export function verify({ token, rules }) {
  return request("/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, rules }),
  });
}
