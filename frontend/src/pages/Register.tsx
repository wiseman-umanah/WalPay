import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type View =
  | "signup"
  | "verify-signup"
  | "login"
  | "login-otp"
  | "forgot-password"
  | "reset-password";

export default function RegistrationForm() {
  const {
    seller,
    signup,
    verifySignup,
    resendSignupOtp,
    loginWithPassword,
    requestLoginOtp,
    verifyLoginOtp,
    requestPasswordReset,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState<View>("signup");
  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
    country: "Nigeria",
    otp: "",
    loginEmail: "",
    loginPassword: "",
    loginOtp: "",
    resetEmail: "",
    resetCode: "",
    resetPassword: "",
  });
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (seller) {
      navigate("/dashboard");
    }
  }, [seller, navigate]);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const isSignupValid = useMemo(() => {
    return form.email && form.password && form.businessName && form.country;
  }, [form.email, form.password, form.businessName, form.country]);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSignupValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await signup({
        email: form.email,
        password: form.password,
        businessName: form.businessName,
        country: form.country,
      });
      setPendingEmail(form.email);
      setOtpExpiresAt(response.otpExpiresAt);
      setFeedback("Enter the verification code sent to your email.");
      setView("verify-signup");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to start signup. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await verifySignup({ email: pendingEmail, code: form.otp.trim() });
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Verification failed. Double-check the code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingEmail) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await resendSignupOtp(pendingEmail);
      setFeedback(`A new verification code was sent. It will expire at ${response?.otpExpiresAt ?? "soon."}`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not resend OTP. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await loginWithPassword(form.loginEmail, form.loginPassword);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Login failed. Check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginOtpRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestLoginOtp(form.loginEmail);
      setFeedback("OTP sent to your email.");
      setView("login-otp");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to send OTP. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyLoginOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await verifyLoginOtp(form.loginEmail, form.loginOtp);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "OTP verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestPasswordReset(form.resetEmail);
      setFeedback("Password reset code sent.");
      setView("reset-password");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to send reset code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(form.resetEmail, form.resetCode, form.resetPassword);
      setFeedback("Password successfully updated. You can login with the new password.");
      setView("login");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case "signup":
        return (
          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <Input
              label="Business Name"
              value={form.businessName}
              onChange={handleChange("businessName")}
              placeholder="Enter your business name"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="Choose a password"
              required
            />
            <Select
              label="Country"
              value={form.country}
              onChange={handleChange("country")}
              options={COUNTRIES}
            />

            <PrimaryButton disabled={!isSignupValid || submitting}>
              {submitting ? "Creating account..." : "Create My Account"}
            </PrimaryButton>
            <Terms />
            <SwitchText onClick={() => setView("login")} text="Already have an account?" action="Sign in" />
          </form>
        );
      case "verify-signup":
        return (
          <form onSubmit={handleVerifySignup} className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              We sent a code to <span className="font-semibold">{pendingEmail}</span>. Enter it below to verify your account.
              {otpExpiresAt && (
                <>
                  {" "}
                  <span className="block mt-2 text-xs">Code expires at {new Date(otpExpiresAt).toLocaleString()}</span>
                </>
              )}
            </p>
            <Input
              label="Verification Code"
              value={form.otp}
              onChange={handleChange("otp")}
              placeholder="Enter the 6-digit code"
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Verifying..." : "Verify Account"}</PrimaryButton>
            <button
              type="button"
              className="text-sm text-green-600 underline"
              onClick={handleResendOtp}
              disabled={submitting}
            >
              Resend code
            </button>
            <SwitchText onClick={() => setView("signup")} text="Need to edit your details?" action="Go back" />
          </form>
        );
      case "login":
        return (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={form.loginEmail}
              onChange={handleChange("loginEmail")}
              placeholder="Enter your email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.loginPassword}
              onChange={handleChange("loginPassword")}
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</PrimaryButton>
            <button
              type="button"
              className="text-sm text-green-600 underline"
              onClick={handleLoginOtpRequest}
              disabled={submitting || !form.loginEmail}
            >
              Use OTP instead
            </button>
            <button
              type="button"
              className="text-sm text-green-600 underline block"
              onClick={() => setView("forgot-password")}
              disabled={submitting}
            >
              Forgot password?
            </button>
            <SwitchText onClick={() => setView("signup")} text="New to WalPay?" action="Create an account" />
          </form>
        );
      case "login-otp":
        return (
          <form onSubmit={handleVerifyLoginOtp} className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">Enter the OTP sent to {form.loginEmail}.</p>
            <Input
              label="OTP Code"
              value={form.loginOtp}
              onChange={handleChange("loginOtp")}
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Verifying..." : "Verify & Sign in"}</PrimaryButton>
            <SwitchText onClick={() => setView("login")} text="Prefer password login?" action="Go back" />
          </form>
        );
      case "forgot-password":
        return (
          <form onSubmit={handleRequestPasswordReset} className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">Enter your email and we'll send a reset code.</p>
            <Input
              label="Email Address"
              type="email"
              value={form.resetEmail}
              onChange={handleChange("resetEmail")}
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Sending..." : "Send Reset Code"}</PrimaryButton>
            <SwitchText onClick={() => setView("login")} text="Remembered your password?" action="Back to login" />
          </form>
        );
      case "reset-password":
        return (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <Input
              label="Verification Code"
              value={form.resetCode}
              onChange={handleChange("resetCode")}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={form.resetPassword}
              onChange={handleChange("resetPassword")}
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Updating..." : "Reset Password"}</PrimaryButton>
            <SwitchText onClick={() => setView("login")} text="All set?" action="Sign in" />
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white w-full max-w-md p-8 rounded-lg shadow-lg border border-slate-200">
        <h2 className="text-2xl font-semibold text-center text-gray-900">
          {view === "signup" && "Register Your Business"}
          {view === "verify-signup" && "Verify your email"}
          {view === "login" && "Welcome back"}
          {view === "login-otp" && "Sign in with OTP"}
          {view === "forgot-password" && "Reset your password"}
          {view === "reset-password" && "Choose a new password"}
        </h2>
        {feedback && <p className="mt-4 text-sm text-green-600">{feedback}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {renderContent()}
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

function Input({ label, value, onChange, placeholder, type = "text", required }: InputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      />
    </div>
  );
}

type SelectProps = {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
};

function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-600">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

type PrimaryButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
};

function PrimaryButton({ children, disabled }: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full py-3 rounded-md mt-4 transition-colors ${
        disabled ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-green-500 text-white hover:bg-green-600"
      }`}
    >
      {children}
    </button>
  );
}

function Terms() {
  return (
    <div className="mt-4 text-sm text-center text-gray-600">
      By clicking the “Create My Account” button, you agree to WalPay&apos;s{" "}
      <a href="#" className="text-green-500">
        terms of service
      </a>{" "}
      and{" "}
      <a href="#" className="text-green-500">
        privacy policy
      </a>
      .
    </div>
  );
}

type SwitchTextProps = {
  text: string;
  action: string;
  onClick: () => void;
};

function SwitchText({ text, action, onClick }: SwitchTextProps) {
  return (
    <div className="mt-6 text-sm text-center">
      {text}{" "}
      <button type="button" className="text-green-500 underline" onClick={onClick}>
        {action}
      </button>
    </div>
  );
}

const COUNTRIES = ["Nigeria", "United States", "United Kingdom", "Canada", "Germany", "Kenya", "South Africa"];
