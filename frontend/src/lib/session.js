const SESSION_KEY = "zeroid.session";

export function loadSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function startSession(email) {
  const session = { email, startedAt: new Date().toISOString() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function endSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function startGuestSession() {
  const session = { guest: true, email: null, startedAt: new Date().toISOString() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
