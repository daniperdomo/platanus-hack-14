export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export function createAuthRequest({ clientName, clientDomain = "", rules = [], fields = [] }) {
  return request("/auth/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: clientName,
      client_domain: clientDomain,
      rules,
      fields,
    }),
  });
}

export function getAuthRequest(requestId) {
  return request(`/auth/requests/${requestId}`);
}

export function rejectAuthRequest({ requestId, token, signature }) {
  return request(`/auth/requests/${requestId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, signature }),
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

export function registerAccount(body) {
  return request("/auth/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function loginAccount({ username, password }) {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function collectSession(requestId) {
  return request(`/auth/requests/${requestId}/session`, { method: "POST" });
}

export function createPairing(payload) {
  return request("/pairings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payload }),
  });
}

export function registerClient({ name, origins, redirectUri = "" }) {
  return request("/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, origins, redirect_uri: redirectUri }),
  });
}

export function getClient(clientId) {
  return request(`/clients/${encodeURIComponent(clientId)}`);
}

export function startSignIn({ clientId, origin, username, scopes, fields = [] }) {
  return request("/auth/sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, origin, username: username || null, scopes, fields }),
  });
}

export function accountMe(token) {
  return request("/auth/accounts/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
