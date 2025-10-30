import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthSuccessResponse, AuthTokens, SellerProfile } from "../api/auth";
import {
  login as apiLogin,
  signup as apiSignup,
  verifySignup as apiVerifySignup,
  resendOtp,
  logout as apiLogout,
  refresh as apiRefresh,
  type SignupPayload,
  type SignupResponse,
  type VerifySignupPayload,
  requestLoginOtp as apiRequestLoginOtp,
  verifyLoginOtp as apiVerifyLoginOtp,
  requestPasswordReset as apiRequestPasswordReset,
  resetPassword as apiResetPassword,
} from "../api/auth";
import { getProfile as apiGetProfile, updateProfile as apiUpdateProfile } from "../api/profile";
import {
  clearAuth,
  loadAuth,
  saveAuth,
  toStoredAuth,
  type StoredAuth,
} from "../utils/authStorage";
import { configureAuth, updateTokens, clearTokens } from "../api/client";

type AuthContextValue = {
  seller: SellerProfile | null;
  tokens: AuthTokens | null;
  loading: boolean;
  signup: (payload: SignupPayload) => Promise<SignupResponse>;
  verifySignup: (payload: VerifySignupPayload) => Promise<AuthSuccessResponse>;
  resendSignupOtp: (email: string) => Promise<{ message: string; otpExpiresAt: string }>;
  loginWithPassword: (email: string, password: string) => Promise<AuthSuccessResponse>;
  requestLoginOtp: (email: string) => Promise<void>;
  verifyLoginOtp: (email: string, code: string) => Promise<AuthSuccessResponse>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<AuthTokens | null>;
  setAuth: (auth: AuthSuccessResponse) => void;
  updateProfile: (payload: { businessName?: string; country?: string }) => Promise<SellerProfile>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [{ seller, tokens }, setState] = useState<StoredAuth>(() => loadAuth());
  const [loading, setLoading] = useState(false);

  const persist = useCallback((next: StoredAuth) => {
    setState(next);
    saveAuth(next);
    if (next.tokens) {
      updateTokens({
        accessToken: next.tokens.accessToken,
        refreshToken: next.tokens.refreshToken,
      });
    } else {
      clearTokens();
    }
  }, []);

  const setAuth = useCallback(
    (response: AuthSuccessResponse) => {
      const stored = toStoredAuth(response);
      persist(stored);
    },
    [persist]
  );

  const refreshTokens = useCallback(async () => {
    if (!tokens?.refreshToken) return null;
    try {
      const result = await apiRefresh(tokens.refreshToken);
      const next: StoredAuth = {
        seller,
        tokens: {
          ...tokens,
          accessToken: result.tokens.accessToken,
          accessExpiresAt: result.tokens.accessExpiresAt,
          refreshToken: result.tokens.refreshToken,
          refreshExpiresAt: result.tokens.refreshExpiresAt,
        },
      };
      persist(next);
      return next.tokens;
    } catch {
      persist({ seller: null, tokens: null });
      clearAuth();
      return null;
    }
  }, [persist, seller, tokens]);

  useEffect(() => {
    configureAuth(
      {
        accessToken: tokens?.accessToken ?? null,
        refreshToken: tokens?.refreshToken ?? null,
      },
      refreshTokens
    );
  }, [tokens?.accessToken, tokens?.refreshToken, refreshTokens]);

  useEffect(() => {
    async function hydrate() {
      if (!tokens?.accessToken || seller) return;
      setLoading(true);
      try {
        const profile = await apiGetProfile();
        persist({ seller: profile, tokens });
      } catch {
        persist({ seller: null, tokens: null });
        clearAuth();
      } finally {
        setLoading(false);
      }
    }
    void hydrate();
  }, [persist, seller, tokens]);

  const signup = useCallback(async (payload: SignupPayload) => {
    const response = await apiSignup(payload);
    return response;
  }, []);

  const verifySignup = useCallback(
    async (payload: VerifySignupPayload) => {
      const response = await apiVerifySignup(payload);
      setAuth(response);
      return response;
    },
    [setAuth]
  );

  const resendSignupOtp = useCallback(async (email: string) => {
    return resendOtp(email, "signup");
  }, []);

  const loginWithPassword = useCallback(
    async (email: string, password: string) => {
      const response = await apiLogin(email, password);
      setAuth(response);
      return response;
    },
    [setAuth]
  );

  const requestLoginOtp = useCallback(async (email: string) => {
    await apiRequestLoginOtp(email);
  }, []);

  const verifyLoginOtpHandler = useCallback(
    async (email: string, code: string) => {
      const response = await apiVerifyLoginOtp(email, code);
      setAuth(response);
      return response;
    },
    [setAuth]
  );

  const requestPasswordResetHandler = useCallback(async (email: string) => {
    await apiRequestPasswordReset(email);
  }, []);

  const resetPasswordHandler = useCallback(async (email: string, code: string, newPassword: string) => {
    await apiResetPassword(email, code, newPassword);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }
    persist({ seller: null, tokens: null });
    clearAuth();
  }, [persist]);

  const updateProfile = useCallback(
    async (payload: { businessName?: string; country?: string }) => {
      const profile = await apiUpdateProfile(payload);
      persist({ seller: profile, tokens });
      return profile;
    },
    [persist, tokens]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      seller,
      tokens,
      loading,
      signup,
      verifySignup,
      resendSignupOtp,
      loginWithPassword,
      requestLoginOtp,
      verifyLoginOtp: verifyLoginOtpHandler,
      requestPasswordReset: requestPasswordResetHandler,
      resetPassword: resetPasswordHandler,
      logout,
      refreshTokens,
      setAuth,
      updateProfile,
    }),
    [
      seller,
      tokens,
      loading,
      signup,
      verifySignup,
      resendSignupOtp,
      loginWithPassword,
      requestLoginOtp,
      verifyLoginOtpHandler,
      requestPasswordResetHandler,
      resetPasswordHandler,
      logout,
      refreshTokens,
      setAuth,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
