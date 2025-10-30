import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import type { SidebarSection } from "../components/Sidebar";
import { Payment } from "../components/Payment";
import { useFlowCurrentUser } from "@onflow/react-sdk"
import { useAuth } from "../context/AuthContext";
import { listPayments, createPayment, deletePayment, type PaymentRecord } from "../api/payments";
import { createPaymentOnChain } from "../flow/walpay";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SidebarSection>("payment");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightWallet, setHighlightWallet] = useState(false);

  const { seller, logout } = useAuth();
  const navigate = useNavigate();

  const { user, authenticate, unauthenticate } = useFlowCurrentUser()

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
    setLoadingAction(true);
    setError(null);
    try {
      await deletePayment(payment.id);
      setPayments((prev) => prev.filter((item) => item.id !== payment.id));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to delete payment.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar active={activeSection} onSelect={setActiveSection} />
      
      <div className="flex-1 px-6 min-h-screen overflow-y-auto relative">
			<div className="w-[90%] mx-auto">
				{/* Header */}
				<div className="mb-6 sticky top-0 left-0 right-0 bg-white py-10">
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold text-gray-900">
							{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
						</h2>

						{user?.loggedIn ? (
							<button
                className="bg-white border cursor-pointer border-green-500 font-bold text-green-500 px-4 py-2 rounded"
                onClick={unauthenticate}
              >
                {user?.addr}
              </button>
						) : (
							<button
                className={`bg-green-500 cursor-pointer font-bold text-white px-4 py-2 rounded transition ${
                  highlightWallet ? "animate-pulse" : ""
                }`}
                onClick={authenticate}
              >
                Connect Wallet
              </button>
						)}
					</div>
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-500">
              Signed in as <span className="font-medium text-gray-800">{seller?.businessName}</span>
            </p>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/");
              }}
              className="text-sm text-red-500 underline"
            >
              Logout
            </button>
          </div>
				</div>

				{/* Info Cards Section */}
				<div className="grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Total Transactions Card */}
				<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
					<h3 className="text-lg font-medium text-gray-800">Total Transactions</h3>
					<p className="text-3xl font-semibold text-gray-600">{stats.count}</p>
				</div>

				{/* Total Earnings Card */}
				<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
					<h3 className="text-lg font-medium text-gray-800">Total Flow Earned</h3>
					<p className="text-3xl font-semibold text-gray-600">{stats.totalFlow.toFixed(4)} FLOW</p>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
					<h3 className="text-lg font-medium text-gray-800">Total in Currency Per</h3>
					<p className="text-3xl font-semibold text-gray-600">
            {stats.totalUsd ? `$${stats.totalUsd.toFixed(2)}` : "—"}
          </p>
				</div>
				</div>

        {error ? (
          <div className="my-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loadingAction ? (
          <p className="text-sm text-gray-500">Processing request…</p>
        ) : null}

				<div className="my-20">
					{activeSection === "payment" && (
            <Payment
              payments={payments}
              loading={loadingPayments}
              walletConnected={Boolean(user?.loggedIn)}
              onRequireWallet={() => {
                setHighlightWallet(true);
                setTimeout(() => setHighlightWallet(false), 1500);
              }}
              onCreatePayment={handleCreatePayment}
              onDeletePayment={handleDeletePayment}
            />
          )}
					{/* {activeSection === "transactions" && <TransactionsSection />}
					{activeSection === "settings" && <SettingsSection />}
					{activeSection === "profile" && <ProfileSection />}
					{activeSection === "logout" && <LogoutSection />} */}
				</div>
				
			</div>
      </div>
    </div>
  );
};

export default Dashboard;
