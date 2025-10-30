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
      <div className="min-h-screen flex items-center justify-center text-gray-500 animate-pulse">
        Loading payment page…
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-600 text-center px-6">
        {error ?? "Payment not available."}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="min-w-[50%] max-w-3xl border border-slate-200 rounded-md shadow-md bg-white">
        <header className="w-full border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">WalPay • Checkout</h1>

          {user?.loggedIn ? (
            <button
              className="bg-white border cursor-pointer border-green-500 font-bold text-green-500 px-4 py-2 rounded"
              onClick={unauthenticate}
            >
              {user?.addr}
            </button>
          ) : (
            <button
              className="bg-green-500 cursor-pointer font-bold text-white px-4 py-2 rounded"
              onClick={authenticate}
            >
              Connect Wallet
            </button>
          )}
        </header>

        <main className="px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {item.imageUrl && imageVisible && (
              <div className="lg:w-1/2 w-full">
                <div className="aspect-[4/3] w-full overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={() => setImageVisible(false)}
                  />
                </div>
              </div>
            )}

            <div className={`${item.imageUrl && imageVisible ? "lg:w-1/2" : "lg:w-2/3"} w-full flex flex-col justify-center`}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{item.name}</h2>
                  {item.description && (
                    <p className="mt-2 text-gray-600 leading-relaxed">{item.description}</p>
                  )}
                </div>

                <div className="rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-200">
                  <Row label="Price" value={`${round4(item.amountFlow)} FLOW`} />
                  <Row label="Charges" value={`${feeFlow} FLOW`} />
                  <Row
                    label={<span className="font-semibold text-gray-900">Total</span>}
                    value={<span className="font-semibold text-gray-900">{totalFlow} FLOW</span>}
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePay}
                    disabled={loadingPay || status === "success"}
                    className="w-full inline-flex items-center justify-center shadow-lg px-5 py-3 rounded-md text-white font-semibold transition disabled:opacity-60"
                    style={{ backgroundColor: FLOW_GREEN }}
                  >
                    {status === "processing" ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing…
                      </span>
                    ) : status === "success" ? (
                      "Paid"
                    ) : (
                      "Pay"
                    )}
                  </button>
                  <p className="mt-3 text-xs text-gray-500">
                    Payments are processed on Flow. You’ll confirm in your wallet.
                  </p>
                  {status === "success" && successMessage ? (
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
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
                      <p className="text-sm font-medium text-green-700">{successMessage}</p>
                      {item.redirectUrl ? (
                        <p className="mt-2 text-xs text-green-600">
                          Redirecting you shortly…
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {status === "error" && error ? (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm">{value}</span>
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
