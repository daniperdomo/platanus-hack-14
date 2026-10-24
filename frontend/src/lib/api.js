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
  const form = new FormData();
  form.append("selfie", selfie);
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
