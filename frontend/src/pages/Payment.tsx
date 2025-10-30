import React, { useEffect, useMemo, useState } from "react";
import { useFlowCurrentUser } from "@onflow/react-sdk";
import { useParams } from "react-router-dom";
import { fetchPublicPayment, type PaymentRecord, recordPaymentTransaction } from "../api/payments";
import { payOnChain } from "../flow/walpay";

type PaymentItem = {
  recordId: string;
  id: string;
  name: string;
  description?: string;
  amountFlow: number;
  imageUrl?: string | null;
  feeFlow: number;
  totalFlow: number;
  successMessage?: string | null;
  redirectUrl?: string | null;
};

const FLOW_GREEN = "#00b140";

export default function PublicPaymentPage() {
  const [item, setItem] = useState<PaymentItem | null>(null);
  const [imageVisible, setImageVisible] = useState(true);
  const [loadingPay, setLoadingPay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const { slug } = useParams<{ slug: string }>();

  const { user, authenticate, unauthenticate } = useFlowCurrentUser();

  useEffect(() => {
    async function loadPayment() {
      if (!slug) {
        setError("Missing payment link.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const payment = await fetchPublicPayment(slug);
        setItem(mapPayment(payment));
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Payment link not found or inactive.");
      } finally {
        setLoading(false);
      }
    }

    loadPayment();
  }, [slug]);

  useEffect(() => {
    if (status === "success" && item?.redirectUrl) {
      const timeout = window.setTimeout(() => {
        window.location.href = item.redirectUrl as string;
      }, 4000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [status, item?.redirectUrl]);

  const { feeFlow, totalFlow } = useMemo(() => {
    if (!item) return { feeFlow: 0, totalFlow: 0 };
    return {
      feeFlow: round4(item.feeFlow),
      totalFlow: round4(item.totalFlow),
    };
  }, [item]);

  const connectWallet = async () => {
    await authenticate();
  };

  const handlePay = async () => {
    if (!user?.loggedIn) {
      await connectWallet();
    }
    if (!item) return;
    setLoadingPay(true);
    setStatus("processing");
    setError(null);
    try {
      const onChain = await payOnChain({ id: item.id, totalFlow: totalFlow, clientRef: null });
      await recordPaymentTransaction(
        item.recordId,
        onChain.transactionId,
        "payment",
        user?.addr ?? null
      );
      setSuccessMessage(item.successMessage ?? "Thank you for your purchase!");
      setStatus("success");
    } catch (e) {
      setStatus("error");
      setError("Payment failed. Please try again.");
    } finally {
      setLoadingPay(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
            Loading checkout…
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400">
        <div className="flex min-h-screen items-center justify-center">
          <div className="max-w-md rounded-3xl border border-red-400/40 bg-red-500/10 px-8 py-6 text-center text-sm text-red-100">
            {error ?? "Payment not available."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),transparent_50%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-18%] h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-[0_50px_120px_-50px_rgba(16,185,129,0.6)] backdrop-blur-xl sm:p-12">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">WalPay Checkout</p>
              <h1 className="text-2xl font-semibold text-white">Secure Flow payment</h1>
            </div>

            {user?.loggedIn ? (
              <button
                className="flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-xs font-semibold text-emerald-200"
                onClick={unauthenticate}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {user?.addr}
              </button>
            ) : (
              <button
                className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 rounded-full shadow-lg transition hover:brightness-110"
                onClick={authenticate}
              >
                Connect wallet
              </button>
            )}
          </header>

          <main className="mt-8">
            <div className="flex flex-col gap-10 lg:flex-row">
              {item.imageUrl && imageVisible && (
                <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-2 lg:w-1/2">
                  <div className="aspect-[4/3] w-full overflow-hidden rounded-[26px] border border-white/10 bg-black/40">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={() => setImageVisible(false)}
                    />
                  </div>
                </div>
              )}

              <div
                className={`${
                  item.imageUrl && imageVisible ? "lg:w-1/2" : "lg:w-2/3"
                } w-full space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6`}
              >
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-white">{item.name}</h2>
                  {item.description ? (
                    <p className="text-sm leading-relaxed text-slate-300">{item.description}</p>
                  ) : null}
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <Row label="Price" value={`${round4(item.amountFlow)} FLOW`} />
                  <Row label="Charges" value={`${feeFlow} FLOW`} />
                  <Row
                    label={<span className="font-semibold text-white">Total</span>}
                    value={<span className="font-semibold text-white">{totalFlow} FLOW</span>}
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handlePay}
                    disabled={loadingPay || status === "success"}
                    className={`w-full inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg transition disabled:opacity-60 ${
                      status === "success"
                        ? "bg-emerald-600 text-white"
                        : "bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500 text-slate-950 hover:brightness-110"
                    }`}
                  >
                    {status === "processing" ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                        Processing…
                      </span>
                    ) : status === "success" ? (
                      "Paid"
                    ) : (
                      "Pay"
                    )}
                  </button>
                  <p className="text-xs text-slate-500">
                    Payments run on Flow. Your wallet confirms the exact amount before submission.
                  </p>

                  {status === "success" && successMessage ? (
                    <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                        <svg
                          className="h-8 w-8 animate-pulse"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-emerald-50">{successMessage}</p>
                      {item.redirectUrl ? (
                        <p className="mt-2 text-xs text-emerald-200">Redirecting you shortly…</p>
                      ) : null}
                    </div>
                  ) : null}

                  {status === "error" && error ? (
                    <p className="text-sm text-red-300">{error}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}

function mapPayment(payment: PaymentRecord): PaymentItem {
  return {
    recordId: payment.id,
    id: payment.paymentLink,
    name: payment.name,
    description: payment.description ?? undefined,
    amountFlow: payment.priceFlow,
    feeFlow: payment.feeFlow ?? 0,
    totalFlow: payment.totalFlow ?? payment.priceFlow + (payment.feeFlow ?? 0),
    imageUrl: payment.image,
    successMessage: payment.customSuccessMessage,
    redirectUrl: payment.redirectUrl,
  };
}
