import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiOutlineShieldCheck, HiSparkles, HiOutlineCurrencyDollar } from "react-icons/hi2";
import { FiArrowLeft } from "react-icons/fi";

const heroFeatures = [
  {
    title: "Launch in minutes",
    description: "Generate Flow-ready payment links and go live without wiring diagrams or spreadsheets.",
    icon: HiSparkles,
  },
  {
    title: "Settlement transparency",
    description: "Track on-chain earnings and treasury fees with real-time wallet reconciliation.",
    icon: HiOutlineCurrencyDollar,
  },
  {
    title: "Security baked-in",
    description: "Resource-oriented Cadence contracts guard funds, access, and merchant entitlements.",
    icon: HiOutlineShieldCheck,
  },
];

type View =
  | "signup"
  | "verify-signup"
  | "login"
  | "login-otp"
  | "forgot-password"
  | "reset-password";

const viewTitles: Record<View, string> = {
  signup: "Create your merchant console",
  "verify-signup": "Verify your email",
  login: "Welcome back",
  "login-otp": "Check your inbox",
  "forgot-password": "Reset your password",
  "reset-password": "Choose a new password",
};

const viewDescriptions: Partial<Record<View, string>> = {
  signup: "Tell us a bit about your business to generate your WalPay workspace.",
  login: "Sign in to manage links, treasury flows, and analytics.",
  "verify-signup": "Enter the OTP sent to your email to activate your account.",
  "login-otp": "Use the one-time code we just delivered to you.",
  "forgot-password": "We'll email a verification code so you can create a new password.",
  "reset-password": "Keep your account safe with a strong password.",
};

const backMap: Partial<Record<View, View>> = {
  "verify-signup": "signup",
  "login-otp": "login",
  "forgot-password": "login",
  "reset-password": "forgot-password",
};

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

  const handleChange = (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    setFeedback(null);
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
    setFeedback(null);
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
    setFeedback(null);
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
    setFeedback(null);
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
      setFeedback("Password successfully updated. You can now sign in.");
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
          <form onSubmit={handleSignup} className="space-y-5">
            <Input
              label="Business Name"
              value={form.businessName}
              onChange={handleChange("businessName")}
              placeholder="Flow City Fashion"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="you@brand.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="••••••••"
              required
            />
            <Select label="Country" value={form.country} onChange={handleChange("country")} options={COUNTRIES} />
            <PrimaryButton disabled={!isSignupValid || submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </PrimaryButton>
            <Terms />
            <SwitchText onClick={() => setView("login")} text="Already have an account?" action="Sign in" />
          </form>
        );
      case "verify-signup":
        return (
          <form onSubmit={handleVerifySignup} className="space-y-5">
            <Input
              label="Verification Code"
              value={form.otp}
              onChange={handleChange("otp")}
              placeholder="Enter the 6-digit code"
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Verifying…" : "Verify account"}</PrimaryButton>
            <button
              type="button"
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
              onClick={handleResendOtp}
              disabled={submitting}
            >
              Resend code
            </button>
          </form>
        );
      case "login":
        return (
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={form.loginEmail}
              onChange={handleChange("loginEmail")}
              placeholder="you@brand.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.loginPassword}
              onChange={handleChange("loginPassword")}
              placeholder="••••••••"
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</PrimaryButton>
            <div className="flex flex-wrap items-center justify-between text-sm text-slate-300">
              <button
                type="button"
                className="font-medium text-emerald-300 hover:text-emerald-200"
                onClick={() => setView("forgot-password")}
                disabled={submitting}
              >
                Forgot password?
              </button>
              <button
                type="button"
                className="font-medium hover:text-emerald-200"
                onClick={handleLoginOtpRequest}
                disabled={submitting || !form.loginEmail}
              >
                Use OTP instead
              </button>
            </div>
            <SwitchText onClick={() => setView("signup")} text="New to WalPay?" action="Create an account" />
          </form>
        );
      case "login-otp":
        return (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-5">
            <Input
              label="OTP Code"
              value={form.loginOtp}
              onChange={handleChange("loginOtp")}
              placeholder="Enter the code"
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Verifying…" : "Verify & Sign in"}</PrimaryButton>
          </form>
        );
      case "forgot-password":
        return (
          <form onSubmit={handleRequestPasswordReset} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              value={form.resetEmail}
              onChange={handleChange("resetEmail")}
              placeholder="you@brand.com"
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Sending…" : "Send reset code"}</PrimaryButton>
          </form>
        );
      case "reset-password":
        return (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <Input
              label="Verification Code"
              value={form.resetCode}
              onChange={handleChange("resetCode")}
              placeholder="Enter the code"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={form.resetPassword}
              onChange={handleChange("resetPassword")}
              placeholder="••••••••"
              required
            />
            <PrimaryButton disabled={submitting}>{submitting ? "Updating…" : "Reset password"}</PrimaryButton>
          </form>
        );
      default:
        return null;
    }
  };

  const secondaryHeading = () => {
    if (view === "verify-signup" && pendingEmail) {
      return `We sent a code to ${pendingEmail}.`;
    }
    if (view === "login-otp" && form.loginEmail) {
      return `OTP delivered to ${form.loginEmail}.`;
    }
    if (view === "forgot-password") {
      return "Enter the email tied to your WalPay account.";
    }
    return viewDescriptions[view] ?? "";
  };

  const showAuthSwitch = view === "signup" || view === "login";
  const backTarget = backMap[view];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute top-[-18%] left-[12%] h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[10%] h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <section className="flex w-full flex-col justify-between gap-12 px-6 pb-20 pt-16 sm:px-10 lg:w-1/2 lg:px-14 lg:pb-24">
          <header className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-emerald-300">
              WalPay for Flow
            </div>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Build a modern payments stack on Flow, without touching boilerplate code.
            </h1>
            <p className="max-w-xl text-base text-slate-300">
              WalPay handles on-chain payment links, treasury routing, and merchant analytics so your team can focus on
              customer experience—not plumbing.
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-2">
            {heroFeatures.map(({ title, description, icon: Icon }) => (
              <li
                key={title}
                className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur transition hover:border-emerald-500/60 hover:bg-emerald-500/10"
              >
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-200">{description}</p>
                </div>
              </li>
            ))}
          </ul>

          <footer className="space-y-3 text-sm text-slate-400">
            <p className="font-semibold text-white">Ship faster with Web3-native commerce.</p>
            <p>Join early teams reinventing cross-border payouts, NFT commerce, and digital goods on Flow.</p>
          </footer>
        </section>

        <section className="flex w-full items-center justify-center px-6 pb-16 pt-24 sm:px-10 lg:w-1/2">
          <div className="w-full max-w-md space-y-8 rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.65)] backdrop-blur-xl sm:p-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-emerald-300/70">
                  Merchant Console
                </p>
                <h2 className="text-3xl font-semibold text-white">{viewTitles[view]}</h2>
                <p className="text-sm text-slate-400">{secondaryHeading()}</p>
                {view === "verify-signup" && otpExpiresAt ? (
                  <p className="text-xs text-slate-500">Code expires {new Date(otpExpiresAt).toLocaleString()}</p>
                ) : null}
              </div>
              {backTarget ? (
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-400/50 hover:text-white"
                  onClick={() => setView(backTarget)}
                >
                  <FiArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {showAuthSwitch ? (
              <div className="grid grid-cols-2 rounded-full border border-white/10 bg-white/5 p-1 text-xs font-medium">
                <button
                  type="button"
                  className={`rounded-full px-3 py-2 transition ${
                    view === "signup" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setView("signup")}
                >
                  Create account
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-2 transition ${
                    view === "login" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setView("login")}
                >
                  Sign in
                </button>
              </div>
            ) : null}

            {feedback ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {feedback}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {renderContent()}
          </div>
        </section>
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
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
      <label className="text-sm font-medium text-slate-200">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-slate-900 text-white">
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">▾</span>
      </div>
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
      className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition ${
        disabled
          ? "cursor-not-allowed bg-emerald-700/50 text-emerald-200/60"
          : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-slate-950 hover:from-emerald-300 hover:via-emerald-400 hover:to-emerald-500"
      }`}
    >
      {children}
    </button>
  );
}

function Terms() {
  return (
    <p className="text-xs text-slate-500">
      By clicking "Create account" you agree to WalPay's{" "}
      <Link to="/terms" className="text-emerald-300 hover:text-emerald-200">
        terms of service
      </Link>{" "}
      and{" "}
      <Link to="/privacy" className="text-emerald-300 hover:text-emerald-200">
        privacy policy
      </Link>
      .
    </p>
  );
}

type SwitchTextProps = {
  text: string;
  action: string;
  onClick: () => void;
};

function SwitchText({ text, action, onClick }: SwitchTextProps) {
  return (
    <p className="text-center text-sm text-slate-400">
      {text}{" "}
      <button type="button" className="font-semibold text-emerald-300 hover:text-emerald-200" onClick={onClick}>
        {action}
      </button>
    </p>
  );
}

const COUNTRIES = [
  "Nigeria",
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "Kenya",
  "South Africa",
];
