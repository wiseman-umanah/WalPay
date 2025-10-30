import { useMemo, useState } from "react";
import { PiMagnifyingGlassDuotone, PiLinkDuotone, PiTrashDuotone, PiPlusCircleDuotone } from "react-icons/pi";
import PaymentLinkModal from "./PaymentLinkModal";
import type { PaymentRecord } from "../api/payments";

type PaymentProps = {
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
};

export function Payment({
  payments,
  loading,
  walletConnected,
  walletAddress,
  flowToUsdRate,
  rateLoading,
  onRequireWallet,
  onCreatePayment,
  onDeletePayment,
}: PaymentProps) {
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);

  const filteredLinks = useMemo(
    () =>
      payments.filter((link) =>
        link.name.toLowerCase().includes(search.toLowerCase())
      ),
    [payments, search]
  );

  const canDelete = (link: PaymentRecord) => {
    if (!walletConnected) return false;
    if (!walletAddress) return false;
    if (link.sellerAddress && walletAddress && link.sellerAddress !== walletAddress) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <PiMagnifyingGlassDuotone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search payment links"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>
        <button
          type="button"
          disabled={!walletConnected}
          onClick={() => {
            if (!walletConnected) {
              onRequireWallet();
              return;
            }
            setModalOpen(true);
          }}
          className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition ${
            walletConnected
              ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-sky-500 hover:brightness-110"
            : "cursor-not-allowed bg-white/10 text-slate-400"
          }`}
        >
          <PiPlusCircleDuotone className="h-4 w-4" />
          Create link
        </button>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full divide-y divide-white/5 text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left">Link</th>
                <th className="px-6 py-4 text-left">Flow amount</th>
                <th className="px-6 py-4 text-left">Fiat (USD)</th>
                <th className="px-6 py-4 text-left">Total Flow</th>
                <th className="px-6 py-4 text-left">Created</th>
                <th className="px-6 py-4 text-left">Actions</th>
                <th className="px-6 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    Loading payment links…
                  </td>
                </tr>
              ) : filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    No payment links yet. Create your first one to start accepting Flow payments.
                  </td>
                </tr>
              ) : (
                filteredLinks.map((link) => (
                  <tr key={link.id} className="divide-y divide-white/5 bg-white/0 transition hover:bg-emerald-500/10">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{link.name}</span>
                        <span className="text-xs text-slate-500">{link.paymentLink}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-white">{Number(link.priceFlow).toFixed(4)} FLOW</td>
                    <td className="px-6 py-5">
                      {rateLoading
                        ? "Loading…"
                        : flowToUsdRate != null
                          ? `$${(Number(link.priceFlow) * flowToUsdRate).toFixed(2)}`
                          : link.priceUSD != null
                            ? `$${Number(link.priceUSD).toFixed(2)}`
                            : "—"}
                    </td>
                    <td className="px-6 py-5 text-white">{Number(link.totalFlow).toFixed(4)} FLOW</td>
                    <td className="px-6 py-5 text-slate-400">
                      {new Date(link.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <a
                          href={`/payment/${link.paymentLink}`}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/10"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <PiLinkDuotone className="h-4 w-4" /> Preview
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:border-white/5 disabled:bg-white/5 disabled:text-slate-500"
                          disabled={!canDelete(link)}
                          onClick={() => {
                            if (!walletConnected) {
                              onRequireWallet();
                              return;
                            }
                            onDeletePayment(link);
                          }}
                        >
                          <PiTrashDuotone className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-white">{link.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentLinkModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async (payload) => {
          await onCreatePayment(payload);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
