const SESSION_KEY = "zeroid.session";
const VAULT_KEY = "zeroid.vault";

export function loadSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const session = JSON.parse(raw);
  if (!session?.token || !session?.username) return null;
  return session;
}

export function startSession({ username, token, vault }) {
  const session = { username, token, startedAt: new Date().toISOString() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (vault) window.sessionStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  return session;
}

export function loadVault() {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(VAULT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function endSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(VAULT_KEY);
}
