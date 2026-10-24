const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function errorMessage(body, status) {
  const { detail } = body;
  const message = typeof detail === "string" ? detail : detail?.[0]?.msg;
  return message ?? `Error ${status}`;
}

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorMessage(body, response.status));
  }
  return body;
}

export function ingest({
  selfie,
  document,
  devicePublicJwk,
  nationality,
  documentType = "cedula",
}) {
  if (!selfie?.type?.startsWith("image/") || selfie.type.startsWith("video/")) {
    return Promise.reject(
      new Error("Solo se envía una foto validada. El video no sale del navegador.")
    );
  }
  const form = new FormData();
  form.append("selfie", selfie, selfie.name ?? "liveness-selfie.jpg");
  form.append("document", document, document.name ?? "documento.jpg");
  form.append("device_public_jwk", JSON.stringify(devicePublicJwk));
  form.append("document_type", documentType);
  if (nationality) form.append("nationality", nationality);
  return request("/ingest", { method: "POST", body: form });
}

export function verify({ token, rules }) {
  return request("/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, rules }),
  });
}
