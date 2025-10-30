import { useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import PaymentLinkModal from "./PaymentLinkModal";
import type { PaymentRecord } from "../api/payments";

type PaymentProps = {
  payments: PaymentRecord[];
  loading: boolean;
  walletConnected: boolean;
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

  return (
    <>
      <div className="flex justify-between mb-6">
        <div className="w-1/3">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!walletConnected) {
              onRequireWallet();
              return;
            }
            setModalOpen(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition ${
            walletConnected
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <FaPlus />
          <p>Create Payment Link</p>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-300">
              <th className="px-4 py-10 text-left">S/N</th>
              <th className="px-4 py-10 text-left">Name</th>
              <th className="px-4 py-10 text-left">Amount (Flow)</th>
              <th className="px-4 py-10 text-left">Amount (Currency)</th>
              <th className="px-4 py-10 text-left">Total (Flow)</th>
              <th className="px-4 py-10 text-left">Created</th>
              <th className="px-4 py-10 text-left">Link</th>
              <th className="px-4 py-10 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  Loading payment links…
                </td>
              </tr>
            ) : filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  No payment links yet.
                </td>
              </tr>
            ) : (
              filteredLinks.map((link, index) => (
              <tr key={link.id} className="border-b border-b-slate-200">
                <td className="px-4 py-10">{index + 1}</td>
                <td className="px-4 py-10">{link.name}</td>
                <td className="px-4 py-10">{Number(link.priceFlow).toFixed(4)} Flow</td>
                <td className="px-4 py-10">{link.priceUSD != null ? `$${Number(link.priceUSD).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-10">{Number(link.totalFlow).toFixed(4)} Flow</td>
                <td className="px-4 py-10">
                  {new Date(link.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-10">
                  <a href={`/payment/${link.paymentLink}`} className="text-blue-500 hover:underline" target="_blank" rel="noreferrer">
                    Preview
                  </a>
                </td>
                <td className="px-4 py-10">
                  <button
                    type="button"
                    className="text-red-500 hover:underline"
                    onClick={() => onDeletePayment(link)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      <PaymentLinkModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={async (payload) => {
          await onCreatePayment(payload);
        }}
      />
    </>
  );
}
