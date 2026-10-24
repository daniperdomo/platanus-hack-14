const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function errorMessage(body, status) {
  const { detail } = body;
  const message = typeof detail === "string" ? detail : detail?.[0]?.msg;
  return message ?? `Error ${status}`;
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error("No pudimos conectar con el oráculo. Revisa tu conexión e inténtalo de nuevo.");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorMessage(body, response.status));
  }
  return body;
}

export function checkDocument(document) {
  const form = new FormData();
  form.append("document", document, document.name ?? "pasaporte.jpg");
  return request("/document/check", { method: "POST", body: form });
}

export function debugDocument(document) {
  const form = new FormData();
  form.append("document", document, document.name ?? "pasaporte.jpg");
  return request("/debug/document", { method: "POST", body: form });
}

export function ingest({ selfie, document, devicePublicJwk }) {
  if (!selfie?.type?.startsWith("image/") || selfie.type.startsWith("video/")) {
    return Promise.reject(
      new Error("Solo se envía una foto validada. El video no sale del navegador.")
    );
  }
  const form = new FormData();
  form.append("selfie", selfie, selfie.name ?? "liveness-selfie.jpg");
  form.append("document", document, document.name ?? "pasaporte.jpg");
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

export function createAuthRequest({ clientName, rules }) {
  return request("/auth/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_name: clientName, rules }),
  });
}

export function approveAuthRequest({ requestId, token, signature }) {
  return request(`/auth/requests/${requestId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, signature }),
  });
}

export function collectAuthToken(requestId) {
  return request(`/auth/requests/${requestId}/token`, { method: "POST" });
}

export function listConnections(token) {
  return request("/auth/connections", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
