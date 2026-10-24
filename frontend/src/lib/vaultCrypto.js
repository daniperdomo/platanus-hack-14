const WRAP_ITERATIONS = 210000;

function toBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function aesKey(raw, usages) {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, usages);
}

export function bytesToBase64Url(bytes) {
  return toBase64Url(bytes);
}

export async function generateVaultKey() {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function randomSecret() {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function encryptBytes(keyBytes, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await aesKey(keyBytes, ["encrypt"]);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return toBase64Url(packed);
}

export async function decryptBytes(keyBytes, payload) {
  const packed = fromBase64Url(payload);
  const key = await aesKey(keyBytes, ["decrypt"]);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: packed.slice(0, 12) },
    key,
    packed.slice(12)
  );
  return new Uint8Array(plain);
}

export async function encryptJson(keyBytes, value) {
  return encryptBytes(keyBytes, new TextEncoder().encode(JSON.stringify(value)));
}

export async function decryptJson(keyBytes, payload) {
  const plain = await decryptBytes(keyBytes, payload);
  return JSON.parse(new TextDecoder().decode(plain));
}

async function wrappingKey(password, salt, iterations, usages) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    usages
  );
}

export async function wrapVaultKey(password, vaultKey) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await wrappingKey(password, salt, WRAP_ITERATIONS, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, vaultKey)
  );
  const packed = new Uint8Array(iv.length + cipher.length);
  packed.set(iv, 0);
  packed.set(cipher, iv.length);
  return {
    wrappedKey: toBase64Url(packed),
    wrapSalt: toBase64Url(salt),
    wrapIterations: WRAP_ITERATIONS,
  };
}

export async function unwrapVaultKey(password, wrappedKey, wrapSalt, wrapIterations) {
  const salt = fromBase64Url(wrapSalt);
  const key = await wrappingKey(password, salt, wrapIterations, ["decrypt"]);
  const packed = fromBase64Url(wrappedKey);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: packed.slice(0, 12) },
    key,
    packed.slice(12)
  );
  return new Uint8Array(plain);
}

export async function encryptPairing(secret, payload) {
  return encryptJson(fromBase64Url(secret), payload);
}
