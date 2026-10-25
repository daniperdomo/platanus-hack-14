const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function request(path: string, options?: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });
  } catch {
    throw new Error(`No pudimos conectar con ZeroID en ${API_URL}. Revisa que el servidor esté accesible en la red.`);
  } finally {
    clearTimeout(timer);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.detail;
    const message = typeof detail === 'string' ? detail : detail?.[0]?.msg;
    throw new ApiError(message ?? `Error ${response.status}`, response.status);
  }
  return body;
}

export type AuthField = {
  field: string;
  purpose: string;
  retention: string;
  required: boolean;
};

export type AuthRequest = {
  request_id: string;
  client_name: string;
  client_domain: string;
  kind: string;
  challenge: string;
  fields: AuthField[];
  status: string;
  expires_in: number;
};

function authHeaders(token: string, json = false): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export function claimPairing(pairingId: string) {
  return request(`/pairings/${pairingId}/claim`, { method: 'POST' }) as Promise<{ payload: string }>;
}

export function fetchInbox(token: string) {
  return request('/auth/inbox', { headers: authHeaders(token) }) as Promise<{ requests: AuthRequest[] }>;
}

export function fetchRequest(requestId: string) {
  return request(`/auth/requests/${requestId}`) as Promise<AuthRequest>;
}

export function rejectRequest(requestId: string, body: { token: string; signature: string }) {
  return request(`/auth/requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function approveRequest(requestId: string, body: { token: string; signature: string; disclosures: Record<string, string | boolean> }) {
  return request(`/auth/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function registerPushToken(token: string, pushToken: string) {
  return request('/auth/push-token', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ token: pushToken }),
  });
}

export function markPaired(token: string) {
  return request('/auth/accounts/paired', { method: 'POST', headers: authHeaders(token) });
}

export function listConnections(token: string) {
  return request('/auth/connections', { headers: authHeaders(token) }) as Promise<{
    connections: { id: string; client_name: string; client_domain: string; rules: string[]; created_at: string }[];
  }>;
}
