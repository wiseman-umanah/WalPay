import type { AuthSuccessResponse, AuthTokens, SellerProfile } from "../api/auth";

const STORAGE_KEY = "walpay.auth";

export type StoredAuth = {
  seller: SellerProfile | null;
  tokens: AuthTokens | null;
};

export function loadAuth(): StoredAuth {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearAuth() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function toStoredAuth(response: AuthSuccessResponse): StoredAuth {
  return {
    seller: response.seller,
    tokens: response.tokens,
  };
}
