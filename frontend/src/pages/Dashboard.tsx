import React, { useEffect, useMemo, useState } from "react";
import Sidebar, { type SidebarSection } from "../components/Sidebar";
import { Payment } from "../components/Payment";
import { useFlowCurrentUser } from "@onflow/react-sdk";
import { useAuth } from "../context/AuthContext";
import { listPayments, createPayment, deletePayment, type PaymentRecord } from "../api/payments";
import { createPaymentOnChain, deactivatePaymentOnChain } from "../flow/walpay";
import { useNavigate } from "react-router-dom";
import { PiCoinsDuotone, PiArrowBendUpRightDuotone, PiUsersThreeDuotone } from "react-icons/pi";

const statCards = (
  stats: { count: number; totalFlow: number; totalUsd: number }
): { title: string; value: string; helper: string; icon: React.ComponentType<{ className?: string }> }[] => [
  {
    title: "Active payment links",
    value: String(stats.count),
    helper: "Links available to customers",
    icon: PiCoinsDuotone,
  },
  {
    title: "Total Flow earned",
    value: `${stats.totalFlow.toFixed(2)} FLOW`,
    helper: "Cumulative settlements",
    icon: PiArrowBendUpRightDuotone,
  },
  {
    title: "USD equivalent",
    value: stats.totalUsd ? `$${stats.totalUsd.toFixed(2)}` : "—",
    helper: "Based on configured FX",
    icon: PiUsersThreeDuotone,
  },
];

const brandGradient = "bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500";

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SidebarSection>("payment");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightWallet, setHighlightWallet] = useState(false);

  const { seller, logout } = useAuth();
  const navigate = useNavigate();

  const { user, authenticate, unauthenticate } = useFlowCurrentUser();

  useEffect(() => {
    if (!seller) {
      navigate("/");
      return;
    }
    const fetchPayments = async () => {
      setLoadingPayments(true);
      setError(null);
      try {
        const data = await listPayments();
        setPayments(data.items);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Unable to load payment links.");
      } finally {
        setLoadingPayments(false);
      }
    };
    void fetchPayments();
  }, [seller, navigate]);

  const stats = useMemo(() => {
    const totalFlow = payments.reduce((sum, payment) => sum + (Number(payment.totalFlow) || 0), 0);
    const totalUsd = payments.reduce((sum, payment) => sum + (Number(payment.priceUSD ?? 0) || 0), 0);
    return {
      count: payments.length,
      totalFlow,
      totalUsd,
    };
  }, [payments]);

  const handleCreatePayment = async (payload: {
    name: string;
    description: string;
    amountFlow: number;
    successMessage: string;
    redirectUrl?: string;
    slug: string;
    imageBase64?: string | null;
  }) => {
    if (!user?.addr) {
      setError("Connect your Flow wallet before creating a payment link.");
      return;
    }
    setLoadingAction(true);
    setError(null);
    try {
      const onChain = await createPaymentOnChain({ id: payload.slug, amountFlow: payload.amountFlow });
      const payment = await createPayment({
        name: payload.name,
        description: payload.description,
        priceFlow: payload.amountFlow,
        customSuccessMessage: payload.successMessage,
        redirectUrl: payload.redirectUrl,
        slug: payload.slug,
        imageBase64: payload.imageBase64 ?? undefined,
        blockchainTxId: onChain.transactionId,
        sellerAddress: user.addr,
      });
      setPayments((prev) => [payment, ...prev]);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to create payment.");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeletePayment = async (payment: PaymentRecord) => {
    if (!window.confirm(`Delete payment link "${payment.name}"?`)) {
      return;
    }
    if (!user?.addr) {
      setError("Connect your Flow wallet before deleting a payment link.");
      return;
    }
    if (payment.sellerAddress && payment.sellerAddress !== user.addr) {
      setError("Connected wallet cannot deactivate this link.");
      return;
    }
    setLoadingAction(true);
    setError(null);
    try {
      const onChain = await deactivatePaymentOnChain({ id: payment.paymentLink });
      await deletePayment(payment.id, onChain.transactionId, user.addr);
      setPayments((prev) => prev.filter((item) => item.id !== payment.id));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to delete payment.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18%] h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      <Sidebar active={activeSection} onSelect={setActiveSection} />

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="px-6 pt-12 sm:px-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300/80">WalPay Studio</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {seller?.businessName ?? "WalPay merchant"}
              </h1>
              <p className="text-sm text-slate-400">
                Manage Flow payment links, payouts, and insights from a single dashboard.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {user?.loggedIn ? (
                <button
                  className="flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200"
                  onClick={unauthenticate}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  {user.addr}
                </button>
              ) : (
                <button
                  className={`${brandGradient} flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:brightness-110 ${
                    highlightWallet ? "animate-pulse" : ""
                  }`}
                  onClick={authenticate}
                >
                  Connect wallet
                </button>
              )}
              <button
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-400/50 hover:text-red-200"
                onClick={async () => {
                  await logout();
                  navigate("/");
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-6 pb-16 pt-8 sm:px-10">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards(stats).map(({ title, value, helper, icon: Icon }) => (
              <article
                key={title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_90px_-45px_rgba(16,185,129,0.7)] backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">{title}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-xs text-slate-500">{helper}</p>
              </article>
            ))}
          </section>

          {error ? (
            <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-5 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {loadingAction ? (
            <div className="flex items-center gap-3 rounded-3xl border border-emerald-400/30 bg-emerald-500/5 px-5 py-3 text-sm text-emerald-200">
              <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-300" />
              Processing request…
            </div>
          ) : null}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_-50px_rgba(59,130,246,0.5)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Payment links</h2>
                <p className="text-sm text-slate-400">
                  Create and manage Flow payment links with built-in fee routing.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Payment
                payments={payments}
                loading={loadingPayments}
                walletConnected={Boolean(user?.loggedIn)}
                walletAddress={user?.addr ?? null}
                onRequireWallet={() => {
                  setHighlightWallet(true);
                  setTimeout(() => setHighlightWallet(false), 1500);
                }}
                onCreatePayment={handleCreatePayment}
                onDeletePayment={handleDeletePayment}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
