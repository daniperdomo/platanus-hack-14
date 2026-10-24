import { loadDeviceKey, saveDeviceKey } from "./storage";

const ALGORITHM = { name: "ECDSA", namedCurve: "P-256" };
const SIGNATURE = { name: "ECDSA", hash: "SHA-256" };

function toBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getOrCreateDeviceKey() {
  const stored = loadDeviceKey();
  if (stored) return stored;

  const keyPair = await crypto.subtle.generateKey(ALGORITHM, true, [
    "sign",
    "verify",
  ]);
  const jwks = {
    publicJwk: await crypto.subtle.exportKey("jwk", keyPair.publicKey),
    privateJwk: await crypto.subtle.exportKey("jwk", keyPair.privateKey),
  };
  saveDeviceKey(jwks);
  return jwks;
}

export async function signChallenge(challenge) {
  const { privateJwk } = await getOrCreateDeviceKey();
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateJwk,
    ALGORITHM,
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    SIGNATURE,
    privateKey,
    new TextEncoder().encode(challenge)
  );
  return toBase64Url(signature);
}
