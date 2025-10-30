import { useEffect, useState } from "react";
import type { SellerProfile } from "../../api/auth";

const brandGradient = "bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500";

const shortAddress = (address?: string | null) =>
  !address ? "—" : `${address.slice(0, 6)}…${address.slice(-4)}`;

interface ProfileSectionProps {
  seller: SellerProfile | null;
  walletAddress: string | null;
  onUpdateProfile: (payload: { businessName?: string; country?: string }) => Promise<any>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<any>;
}

export default function ProfileSection({
  seller,
  walletAddress,
  onUpdateProfile,
  onChangePassword,
}: ProfileSectionProps) {
  const [form, setForm] = useState({ businessName: seller?.businessName ?? "", country: seller?.country ?? "" });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setForm({
      businessName: seller?.businessName ?? "",
      country: seller?.country ?? "",
    });
  }, [seller]);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    setProfileError(null);
    try {
      await onUpdateProfile({ businessName: form.businessName, country: form.country });
      setProfileMessage("Profile updated");
    } catch (err: any) {
      setProfileError(err?.response?.data?.error ?? "Unable to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    setPasswordError(null);
    try {
      await onChangePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage("Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: any) {
      setPasswordError(err?.response?.data?.error ?? "Unable to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_-50px_rgba(59,130,246,0.5)] backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Merchant profile</h2>
        <p className="text-sm text-slate-400">Update your business identity shown to customers.</p>
        {profileMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {profileMessage}
          </div>
        ) : null}
        {profileError ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {profileError}
          </div>
        ) : null}
        <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Business name
            <input
              type="text"
              value={form.businessName}
              onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Flow City Fashion"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Country
            <input
              type="text"
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              placeholder="Nigeria"
              required
            />
          </label>
          <button
            type="submit"
            className={`${brandGradient} w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={profileLoading}
          >
            {profileLoading ? "Saving…" : "Save profile"}
          </button>
        </form>
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_-50px_rgba(59,130,246,0.5)] backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Security</h2>
        <p className="text-sm text-slate-400">Manage password and wallet details associated with your workspace.</p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Wallet address</span>
            <span className="font-mono text-sm text-white">{shortAddress(walletAddress)}</span>
          </div>
        </div>
        {passwordMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {passwordMessage}
          </div>
        ) : null}
        {passwordError ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {passwordError}
          </div>
        ) : null}
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            Current password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            New password
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Confirm new password
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              required
            />
          </label>
          <button
            type="submit"
            className={`${brandGradient} w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60`}
            disabled={passwordLoading}
          >
            {passwordLoading ? "Updating…" : "Update password"}
          </button>
        </form>
      </article>
    </section>
  );
}
