import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { loadAuth } from "../utils/authStorage";

type Tokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

type RefreshHandler = () => Promise<Tokens | null>;

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize in-memory tokens from localStorage to avoid request races
const storedAuth = typeof window !== "undefined" ? loadAuth() : { seller: null, tokens: null };
let tokens: Tokens = {
  accessToken: storedAuth.tokens?.accessToken ?? null,
  refreshToken: storedAuth.tokens?.refreshToken ?? null,
};
try {
  // eslint-disable-next-line no-console
  console.debug("api.client: initialized tokens from localStorage", {
    hasAccess: !!tokens.accessToken,
    hasRefresh: !!tokens.refreshToken,
  });
} catch (e) {
  /* ignore */
}
let refreshHandler: RefreshHandler | null = null;
let refreshingPromise: Promise<Tokens | null> | null = null;

function isRefreshEndpoint(config?: InternalAxiosRequestConfig<any>) {
  if (!config?.url) return false;
  return config.url.includes("/auth/refresh");
}

export function configureAuth(initialTokens: Tokens, handler: RefreshHandler | null) {
  tokens = initialTokens;
  refreshHandler = handler;
}

export function updateTokens(next: Tokens) {
  tokens = next;
}

export function clearTokens() {
  tokens = { accessToken: null, refreshToken: null };
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (tokens.accessToken && !isRefreshEndpoint(config)) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  // Debugging: log outgoing request url and whether Authorization header is present
  try {
    // avoid logging tokens directly in production; this is temporary debug info
    // eslint-disable-next-line no-console
    console.debug("api.request:", { url: config.url, hasAuth: !!config.headers?.Authorization });
  } catch (e) {
    /* ignore */
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig: any = error.config;

    if (
      status === 401 &&
      refreshHandler &&
      !originalConfig?._retry &&
      !isRefreshEndpoint(originalConfig)
    ) {
      if (!refreshingPromise) {
        refreshingPromise = refreshHandler().finally(() => {
          refreshingPromise = null;
        });
      }

      const refreshed = await refreshingPromise;
      if (refreshed?.accessToken) {
        originalConfig._retry = true;
        originalConfig.headers = {
          ...(originalConfig.headers ?? {}),
          Authorization: `Bearer ${refreshed.accessToken}`,
        };
        return api.request(originalConfig);
      }
    }

    // Log 401 failures to help debug authorization issues
    try {
      // eslint-disable-next-line no-console
      console.debug("api.response.error:", {
        url: originalConfig?.url,
        status,
        tokensPresent: { access: !!tokens.accessToken, refresh: !!tokens.refreshToken },
        _retry: originalConfig?._retry ?? false,
      });
    } catch (e) {
      /* ignore */
    }

    return Promise.reject(error);
  }
);
