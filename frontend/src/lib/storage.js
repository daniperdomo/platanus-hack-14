const KEYS = {
  deviceKey: "zeroid.deviceKey",
  credential: "zeroid.credential",
};

function read(key) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadDeviceKey() {
  return read(KEYS.deviceKey);
}

export function saveDeviceKey(keyPair) {
  write(KEYS.deviceKey, keyPair);
}

export function loadCredential() {
  return read(KEYS.credential);
}

export function saveCredential(token) {
  write(KEYS.credential, token);
}

export function clearVault() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}
