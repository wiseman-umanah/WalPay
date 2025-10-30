import React, { createContext, useEffect, useMemo, useState } from "react";
import type { AuthSuccessResponse, AuthTokens, SellerProfile } from "../api/auth";
import { login as apiLogin, refresh as apiRefresh } from "../api/auth";
import { updateProfile as apiUpdateProfile } from "../api/profile";
import { loadAuth, saveAuth, clearAuth, toStoredAuth } from "../utils/authStorage";
import { configureAuth, updateTokens, clearTokens } from "../api/client";

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
type AuthContextValue = {
  seller: SellerProfile | null;
  tokens: AuthTokens | null;
  loading: boolean;
  loginWithPassword: (email: string, password: string) => Promise<AuthSuccessResponse>;
  logout: () => void;
  refreshTokens: () => Promise<AuthTokens | null>;
  setAuth: (auth: AuthSuccessResponse) => void;
  updateProfile: (payload: { businessName?: string; country?: string }) => Promise<SellerProfile>;
  signup: (payload: import("../api/auth").SignupPayload) => Promise<import("../api/auth").SignupResponse>;
  verifySignup: (payload: import("../api/auth").VerifySignupPayload) => Promise<AuthSuccessResponse>;
  resendSignupOtp: (email: string) => Promise<{ message: string; otpExpiresAt: string }>;
  requestLoginOtp: (email: string) => Promise<{ message: string }>;
  verifyLoginOtp: (email: string, code: string) => Promise<AuthSuccessResponse>;
  requestPasswordReset: (email: string) => Promise<{ message: string; otpExpiresAt: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ message: string }>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(false);

  // Hydrate seller and tokens from localStorage on mount
  useEffect(() => {
    const { seller: storedSeller, tokens: storedTokens } = loadAuth();
    setSeller(storedSeller ?? null);
    setTokens(storedTokens ?? null);
    updateTokens({ accessToken: storedTokens?.accessToken ?? null, refreshToken: storedTokens?.refreshToken ?? null });
    configureAuth({ accessToken: storedTokens?.accessToken ?? null, refreshToken: storedTokens?.refreshToken ?? null }, null);
  }, []);

  // Keep localStorage and axios client in sync when tokens change
  useEffect(() => {
    updateTokens({ accessToken: tokens?.accessToken ?? null, refreshToken: tokens?.refreshToken ?? null });
    configureAuth({ accessToken: tokens?.accessToken ?? null, refreshToken: tokens?.refreshToken ?? null }, null);
    saveAuth({ seller, tokens });
  }, [tokens, seller]);

  const persistAuth = (nextSeller: SellerProfile | null, nextTokens: AuthTokens | null) => {
    setSeller(nextSeller);
    setTokens(nextTokens);
    try {
      saveAuth({ seller: nextSeller, tokens: nextTokens });
    } catch (e) {
      // ignore storage errors
    }
    updateTokens({ accessToken: nextTokens?.accessToken ?? null, refreshToken: nextTokens?.refreshToken ?? null });
    configureAuth({ accessToken: nextTokens?.accessToken ?? null, refreshToken: nextTokens?.refreshToken ?? null }, null);
  };

  const setAuth = (response: AuthSuccessResponse) => {
    const stored = toStoredAuth(response as any);
    persistAuth(stored.seller, stored.tokens);
  };

  const loginWithPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiLogin(email, password);
      setAuth(response as AuthSuccessResponse);
      return response as AuthSuccessResponse;
    } catch (e) {
      // Do not clear localStorage on failed login
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persistAuth(null, null);
    try {
      clearAuth();
    } catch (e) {
      /* ignore */
    }
    clearTokens();
  };

  const refreshTokens = async (): Promise<AuthTokens | null> => {
    if (!tokens?.refreshToken) return null;
    try {
      const res = await apiRefresh(tokens.refreshToken);
      const nextTokens = res.tokens as unknown as AuthTokens;
      persistAuth(seller, nextTokens);
      return nextTokens;
    } catch (e) {
      // Do not clear localStorage on failed refresh
      return null;
    }
  };

  const updateProfile = async (payload: { businessName?: string; country?: string }) => {
    const profile = await apiUpdateProfile(payload);
    persistAuth(profile, tokens);
    return profile;
  };

  // Registration and OTP methods
  const signup = async (payload: import("../api/auth").SignupPayload) => {
    setLoading(true);
    try {
      const { signup } = await import("../api/auth");
      return await signup(payload);
    } finally {
      setLoading(false);
    }
  };

  const verifySignup = async (payload: import("../api/auth").VerifySignupPayload) => {
    setLoading(true);
    try {
      const { verifySignup } = await import("../api/auth");
      const response = await verifySignup(payload);
      setAuth(response);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const resendSignupOtp = async (email: string) => {
    setLoading(true);
    try {
      const { resendOtp } = await import("../api/auth");
      return await resendOtp(email, "signup");
    } finally {
      setLoading(false);
    }
  };

  const requestLoginOtp = async (email: string) => {
    setLoading(true);
    try {
      const { requestLoginOtp } = await import("../api/auth");
      return await requestLoginOtp(email);
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginOtp = async (email: string, code: string) => {
    setLoading(true);
    try {
      const { verifyLoginOtp } = await import("../api/auth");
      const response = await verifyLoginOtp(email, code);
      setAuth(response);
      return response;
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const { requestPasswordReset } = await import("../api/auth");
      return await requestPasswordReset(email);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    setLoading(true);
    try {
      const { resetPassword } = await import("../api/auth");
      return await resetPassword(email, code, newPassword);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      seller,
      tokens,
      loading,
      loginWithPassword,
      logout,
      refreshTokens,
      setAuth,
      updateProfile,
      signup,
      verifySignup,
      resendSignupOtp,
      requestLoginOtp,
      verifyLoginOtp,
      requestPasswordReset,
      resetPassword,
    }),
    [seller, tokens, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


