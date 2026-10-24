import type { AuthRequest } from './api';

let current: AuthRequest | null = null;

export function setPending(request: AuthRequest | null) {
  current = request;
}

export function getPending() {
  return current;
}
