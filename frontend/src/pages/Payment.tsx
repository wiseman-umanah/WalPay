import React, { useEffect, useMemo, useState } from "react";
import { useFlowCurrentUser } from "@onflow/react-sdk";

type PaymentItem = {
  id: string;
  name: string;
  description?: string;
  amountFlow: number;
  imageUrl?: string | null;
  feePercent?: number;
};

const FLOW_GREEN = "#00b140";

export default function PublicPaymentPage() {
  const [item, setItem] = useState<PaymentItem | null>(null);
  const [imageVisible, setImageVisible] = useState(true);
  const [loadingPay, setLoadingPay] = useState(false);

  const { user, authenticate, unauthenticate } = useFlowCurrentUser()

  useEffect(() => {
    // simulate fetch
    setItem({
      id: "demo-123",
      name: "WalP T-Shirt",
      description:
        "Premium cotton tee with soft hand feel. Limited drop. Ships worldwide. okdowjod djwo wodjo wdowjdwo dowjo wdojdodowjdojdwoj wjdowjwodow odwdjowjdwodwodw wodjwojdowo djwojow djwdjwodwodjow dowjow ww wdowdjwodwdwo dwojwo dwdowjo wdwo dwodow dwodwo dowd wwjodjdow dwjowdwj odwoj owodwjodw dwjowjowdow dwdw ow wdjwodjwodwo dwdow dwjowodod",
      amountFlow: 12.5,
      imageUrl:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop",
      feePercent: 10,
    });
  }, []);

  const { feeFlow, totalFlow } = useMemo(() => {
    if (!item) return { feeFlow: 0, totalFlow: 0 };
    const fee = ((item.feePercent ?? 0) / 100) * item.amountFlow;
    return { feeFlow: round4(fee), totalFlow: round4(item.amountFlow + fee) };
  }, [item]);

  const connectWallet = async () => {
    // TODO: integrate FCL
    await authenticate();
  };

  const handlePay = async () => {
    if (!user?.loggedIn) {
      await connectWallet();
    }
    if (!item) return;
    setLoadingPay(true);
    try {
      // TODO: FCL tx call
      alert(`Payment flow triggered for ${item.name}`);
    } catch (e) {
      alert("Payment failed to start. Please try again.");
    } finally {
      setLoadingPay(false);
    }
  };

  if (!item)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 animate-pulse">
        Loading payment page…
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="min-w-[50%] max-w-3xl border border-slate-200 rounded-md shadow-md bg-white">
        {/* Header */}
        <header className="w-full border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            WalletPay • Checkout
          </h1>

			{user?.loggedIn ? (
				<button className="bg-white border cursor-pointer border-green-500 font-bold text-green-500 px-4 py-2 rounded" onClick={unauthenticate}>{user?.addr}</button>
			) : (
				<button className="bg-green-500 cursor-pointer font-bold text-white px-4 py-2 rounded" onClick={authenticate}>Connect Wallet</button>
			)}
        </header>

        {/* Content */}
        <main className="px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Image preview */}
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

            {/* Right: Details */}
            <div
              className={`${
                item.imageUrl && imageVisible ? "lg:w-1/2" : "lg:w-2/3"
              } w-full flex flex-col justify-center`}
            >
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {item.name}
                  </h2>
                  {item.description && (
                    <p className="mt-2 text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="rounded-lg shadow-lg border border-gray-200 divide-y divide-gray-200">
                  <Row label="Price" value={`${item.amountFlow} FLOW`} />
                  <Row label="Charges" value={`${feeFlow} FLOW`} />
                  <Row
                    label={
                      <span className="font-semibold text-gray-900">Total</span>
                    }
                    value={
                      <span className="font-semibold text-gray-900">
                        {totalFlow} FLOW
                      </span>
                    }
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handlePay}
                    disabled={loadingPay}
                    className={`w-full inline-flex items-center justify-center shadow-lg px-5 py-3 rounded-md text-white font-semibold transition disabled:opacity-60`}
                    style={{ backgroundColor: FLOW_GREEN }}
                  >
                    {loadingPay ? "Processing…" : "Pay"}
                  </button>
                  <p className="mt-3 text-xs text-gray-500">
                    Payments are processed on Flow. You’ll confirm in your
                    wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
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
