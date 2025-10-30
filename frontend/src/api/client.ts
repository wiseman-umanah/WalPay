import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

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

let tokens: Tokens = { accessToken: null, refreshToken: null };
let refreshHandler: RefreshHandler | null = null;
let refreshingPromise: Promise<Tokens | null> | null = null;

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
  if (tokens.accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig: any = error.config;

    if (status === 401 && refreshHandler && !originalConfig?._retry) {
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

    return Promise.reject(error);
  }
);
