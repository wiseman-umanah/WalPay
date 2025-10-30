import { Payment } from "../Payment";
import type { PaymentRecord } from "../../api/payments";

interface PaymentLinksSectionProps {
  payments: PaymentRecord[];
  loading: boolean;
  walletConnected: boolean;
  walletAddress?: string | null;
  flowToUsdRate: number | null;
  rateLoading: boolean;
  onRequireWallet: () => void;
  onCreatePayment: (payload: {
    name: string;
    description: string;
    amountFlow: number;
    successMessage: string;
    redirectUrl?: string;
    slug: string;
    imageBase64?: string | null;
  }) => Promise<void>;
  onDeletePayment: (payment: PaymentRecord) => Promise<void>;
}

export default function PaymentLinksSection({
  payments,
  loading,
  walletConnected,
  walletAddress,
  flowToUsdRate,
  rateLoading,
  onRequireWallet,
  onCreatePayment,
  onDeletePayment,
}: PaymentLinksSectionProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_40px_100px_-50px_rgba(59,130,246,0.5)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Payment links</h2>
          <p className="text-sm text-slate-400">Create and manage Flow payment links with built-in fee routing.</p>
        </div>
      </div>
      <div className="mt-6">
        <Payment
          payments={payments}
          loading={loading}
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          flowToUsdRate={flowToUsdRate}
          rateLoading={rateLoading}
          onRequireWallet={onRequireWallet}
          onCreatePayment={onCreatePayment}
          onDeletePayment={onDeletePayment}
        />
      </div>
    </section>
  );
}
