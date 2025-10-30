import { useEffect, useMemo, useState } from "react";
import Sidebar, { type SidebarSection } from "../components/Sidebar";
import {
  PaymentLinksSection,
  TransactionsSection,
  ProfileSection,
  SettingsSection,
} from "../components/dashboard";
import { useFlowCurrentUser } from "@onflow/react-sdk";
import { useAuth } from "../context/AuthContext";
import {
  listPayments,
  createPayment,
  deletePayment,
  listTransactions,
  type PaymentRecord,
  type TransactionRecord,
} from "../api/payments";
import { createPaymentOnChain, deactivatePaymentOnChain, getSellerEarningsOnChain } from "../flow/walpay";
import { changePassword } from "../api/profile";
import { useNavigate } from "react-router-dom";
import { PiCoinsDuotone, PiArrowBendUpRightDuotone, PiUsersThreeDuotone, PiListDuotone } from "react-icons/pi";
import { Seo } from "../components/Seo";

const brandGradient = "bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500";
const FLOW_RATE_URL = "https://api.coinbase.com/v2/exchange-rates?currency=FLOW";
const FLOW_RATE_TTL_MS = 5 * 60 * 1000;

let cachedFlowUsdRate: { value: number; expires: number } | null = null;

async function fetchFlowUsdRate(): Promise<number> {
  const response = await fetch(FLOW_RATE_URL);
  if (!response.ok) throw new Error(`Rate request failed: ${response.status}`);
  const json = await response.json();
  const usdString = json?.data?.rates?.USD;
  const parsed = Number(usdString);
  if (!usdString || Number.isNaN(parsed)) throw new Error("Invalid USD rate");
  return parsed;
}

type StatCard = {
  title: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
};

function buildStatCards(
  summary: { count: number; totalFlow: number; totalUsd: number | null },
  loadingFlow: boolean,
  loadingRate: boolean,
  rateError: string | null
): StatCard[] {
  return [
    {
      title: "Active payment links",
      value: String(summary.count),
      helper: "Links available to customers",
      icon: PiCoinsDuotone,
    },
    {
      title: "Total Flow earned",
      value: loadingFlow ? "—" : `${summary.totalFlow.toFixed(2)} FLOW`,
      helper: loadingFlow ? "Fetching on-chain earnings" : "Reported directly from WalP",
      icon: PiArrowBendUpRightDuotone,
    },
    {
      title: "USD equivalent",
      value: loadingRate ? "…" : summary.totalUsd != null ? `$${summary.totalUsd.toFixed(2)}` : "—",
      helper: rateError
        ? rateError
        : loadingRate
          ? "Fetching Flow → USD rate"
          : "Estimated using Coinbase rate",
      icon: PiUsersThreeDuotone,
    },
  ];
}

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SidebarSection>("payment");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightWallet, setHighlightWallet] = useState(false);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionsFetched, setTransactionsFetched] = useState(false);

  const [chainEarnings, setChainEarnings] = useState<number | null>(null);
  const [loadingEarnings, setLoadingEarnings] = useState(false);
  const [usdRate, setUsdRate] = useState<number | null>(() => {
    const now = Date.now();
    if (cachedFlowUsdRate && cachedFlowUsdRate.expires > now) {
      return cachedFlowUsdRate.value;
    }
    return null;
  });
  const [loadingRates, setLoadingRates] = useState(() => {
    const now = Date.now();
    return !(cachedFlowUsdRate && cachedFlowUsdRate.expires > now);
  });
  const [rateError, setRateError] = useState<string | null>(null);

  const { seller, updateProfile, tokens } = useAuth();
  const navigate = useNavigate();

  const { user, authenticate, unauthenticate } = useFlowCurrentUser();

  useEffect(() => {
    if (!seller) {
      navigate("/");
      return;
    }
    // wait until we have an access token configured by the auth layer to avoid
    // firing an unauthenticated request due to effect ordering
    if (!tokens?.accessToken) {
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

  useEffect(() => {
    if (!user?.addr) {
      setChainEarnings(null);
      return;
    }
    let cancelled = false;
    const fetchEarnings = async () => {
      setLoadingEarnings(true);
      try {
        const value = await getSellerEarningsOnChain(user.addr!);
	
        if (!cancelled) {
          setChainEarnings(value);
        }
      } catch {
        if (!cancelled) {
          setChainEarnings(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingEarnings(false);
        }
      }
    };
    fetchEarnings();
    return () => {
      cancelled = true;
    };
  }, [user?.addr]);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    if (cachedFlowUsdRate && cachedFlowUsdRate.expires > now) {
      setUsdRate(cachedFlowUsdRate.value);
      setLoadingRates(false);
      return;
    }
    const fetchRate = async () => {
      setLoadingRates(true);
      setRateError(null);
      try {
        const parsed = await fetchFlowUsdRate();
        cachedFlowUsdRate = { value: parsed, expires: Date.now() + FLOW_RATE_TTL_MS };
        if (!cancelled) {
          setUsdRate(parsed);
        }
      } catch (err) {
        if (!cancelled) {
          setRateError("Unable to fetch Flow → USD rate");
          setUsdRate(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRates(false);
        }
      }
    };
    void fetchRate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeSection !== "transactions" || transactionsFetched || !seller) return;
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      setTransactionsError(null);
      try {
        const data = await listTransactions();
        setTransactions(data.items);
        setTransactionsFetched(true);
      } catch (err: any) {
        setTransactionsError(err?.response?.data?.error ?? "Unable to load transactions.");
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [activeSection, transactionsFetched, seller]);

  const statSummary = useMemo(() => {
    const activePayments = payments.filter((p) => p.status === "active");
    const totalLinks = activePayments.length;
    const onChain = chainEarnings ?? activePayments.reduce((sum, payment) => sum + (Number(payment.totalFlow) || 0), 0);
    const usdEquivalent = usdRate != null ? onChain * usdRate : null;
    return {
      count: totalLinks,
      totalFlow: onChain,
      totalUsd: usdEquivalent,
    };
  }, [payments, chainEarnings, usdRate]);

  const statCards = useMemo(
    () => buildStatCards(statSummary, loadingEarnings, loadingRates, rateError),
    [statSummary, loadingEarnings, loadingRates, rateError]
  );

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

  const renderSection = () => {
    switch (activeSection) {
      case "payment":
        return (
          <PaymentLinksSection
            payments={payments}
            loading={loadingPayments}
            walletConnected={Boolean(user?.loggedIn)}
            walletAddress={user?.addr ?? null}
            flowToUsdRate={usdRate}
            rateLoading={loadingRates}
            onRequireWallet={() => {
              setHighlightWallet(true);
              setTimeout(() => setHighlightWallet(false), 1500);
            }}
            onCreatePayment={handleCreatePayment}
            onDeletePayment={handleDeletePayment}
          />
        );
      case "transactions":
        return (
          <TransactionsSection
            transactions={transactions}
            loading={loadingTransactions}
            error={transactionsError}
            onRetry={() => setTransactionsFetched(false)}
          />
        );
      case "profile":
        return (
          <ProfileSection
            seller={seller ?? null}
            walletAddress={user?.addr ?? null}
            onUpdateProfile={updateProfile}
            onChangePassword={changePassword}
          />
        );
      default:
        return <SettingsSection />;
    }
  };

  return (
    <>
      <Seo
        title="Merchant dashboard"
        description="Monitor Flow payment performance, sync wallet payouts, and configure WalP automation from a single dashboard."
        noIndex
        keywords={[
          "Flow merchant dashboard",
          "payment analytics",
          "crypto payouts",
          "WalP console",
          "Flow earnings tracker",
        ]}
      />
      <div className="relative flex min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18%] h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />

      <button
        type="button"
        className="absolute left-4 top-5 z-30 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-400/40 hover:text-white lg:hidden"
        onClick={() => setMobileNavOpen(true)}
      >
        <PiListDuotone className="h-6 w-6" />
      </button>

      <Sidebar active={activeSection} onSelect={setActiveSection} />
      {mobileNavOpen ? (
        <>
          <div
            className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
          <Sidebar
            active={activeSection}
            onSelect={setActiveSection}
            mobile
            onClose={() => setMobileNavOpen(false)}
          />
        </>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <header className="px-4 pt-14 sm:px-8 lg:pt-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300/80">WalP Studio</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {seller?.businessName ?? "WalP merchant"}
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
                  onClick={() => {
                    setHighlightWallet(false);
                    authenticate();
                  }}
                >
                  Connect wallet
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-4 pb-16 pt-6 sm:px-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map(({ title, value, helper, icon: Icon }) => (
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

          {renderSection()}
        </main>
      </div>
      </div>
    </>
  );
};

export default Dashboard;
