import { gcm } from '@noble/ciphers/aes.js';
import { p256 } from '@noble/curves/nist.js';

export function fromBase64Url(value: string) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const binary = globalThis.atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decryptJson<T>(keyBytes: Uint8Array, payload: string): T {
  const packed = fromBase64Url(payload);
  const plain = gcm(keyBytes, packed.slice(0, 12)).decrypt(packed.slice(12));
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}

export function signChallenge(privateD: string, challenge: string) {
  const signature = p256.sign(new TextEncoder().encode(challenge), fromBase64Url(privateD), {
    lowS: true,
    prehash: true,
  });
  if (!(signature instanceof Uint8Array)) {
    throw new Error('No pudimos firmar la solicitud.');
  }
  return toBase64Url(signature);
}
