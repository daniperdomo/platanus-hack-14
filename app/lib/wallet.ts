import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token: 'zeroid.token',
  privateJwk: 'zeroid.privateJwk',
  vaultKey: 'zeroid.vaultKey',
  vault: 'zeroid.vault',
} as const;

export type PrivateJwk = {
  kty: string;
  crv: string;
  x: string;
  y: string;
  d: string;
};

export type Wallet = {
  token: string;
  privateJwk: PrivateJwk;
  vaultKey: string;
  vault: Record<string, string>;
};

export async function loadWallet(): Promise<Wallet | null> {
  const [token, privateJwk, vaultKey, vault] = await Promise.all([
    SecureStore.getItemAsync(KEYS.token),
    SecureStore.getItemAsync(KEYS.privateJwk),
    SecureStore.getItemAsync(KEYS.vaultKey),
    SecureStore.getItemAsync(KEYS.vault),
  ]);
  if (!token || !privateJwk || !vaultKey || !vault) return null;
  return {
    token,
    privateJwk: JSON.parse(privateJwk),
    vaultKey,
    vault: JSON.parse(vault),
  };
}

export async function saveWallet(wallet: Wallet) {
  await SecureStore.setItemAsync(KEYS.token, wallet.token);
  await SecureStore.setItemAsync(KEYS.privateJwk, JSON.stringify(wallet.privateJwk));
  await SecureStore.setItemAsync(KEYS.vaultKey, wallet.vaultKey);
  await SecureStore.setItemAsync(KEYS.vault, JSON.stringify(wallet.vault));
}

export async function clearWallet() {
  await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)));
}
