import type { AuthSuccessResponse, AuthTokens, SellerProfile } from "../api/auth";

export const AUTH_STORAGE_KEY = "walp.auth";

export type StoredAuth = {
  seller: SellerProfile | null;
  tokens: AuthTokens | null;
};

export function loadAuth(): StoredAuth {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { seller: null, tokens: null };
    }
    const parsed = JSON.parse(raw) as StoredAuth;
    return {
      seller: parsed.seller ?? null,
      tokens: parsed.tokens ?? null,
    };	
  } catch {
    return { seller: null, tokens: null };
  }
}

export function saveAuth(data: StoredAuth) {
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("authStorage.saveAuth: failed to save auth", e);
  }
}

export function clearAuth() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function toStoredAuth(response: AuthSuccessResponse): StoredAuth {
  return {
    seller: response.seller,
    tokens: response.tokens,
  };
}
