import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import PaymentLinkModal from "./PaymentLinkModal";

interface PaymentLink {
  id: string;
  name: string;
  amountFlow: number;
  amountCurrency: string;
  created: string;
  link: string;
}

export function Payment() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [paymentLinks] = useState<PaymentLink[]>([
    {
      id: "1",
      name: "Website Order",
      amountFlow: 50,
      amountCurrency: "NGN 25,000",
      created: "Oct 16, 2021",
      link: "/payment/1",
    },
    {
      id: "2",
      name: "School Fees",
      amountFlow: 20,
      amountCurrency: "NGN 10,000",
      created: "Nov 2, 2021",
      link: "/payment/2",
    },
    {
      id: "3",
      name: "Product Purchase",
      amountFlow: 30,
      amountCurrency: "NGN 15,000",
      created: "Dec 4, 2021",
      link: "/payment/3",
    },
    {
      id: "4",
      name: "Donation Fund",
      amountFlow: 10,
      amountCurrency: "NGN 5,000",
      created: "Jan 12, 2022",
      link: "/payment/4",
    },
    {
      id: "5",
      name: "Service Payment",
      amountFlow: 40,
      amountCurrency: "NGN 20,000",
      created: "Feb 10, 2022",
      link: "/payment/5",
    },
	{
      id: "6",
      name: "Website Order",
      amountFlow: 50,
      amountCurrency: "NGN 25,000",
      created: "Oct 16, 2021",
      link: "/payment/6",
    },
    {
      id: "7",
      name: "School Fees",
      amountFlow: 20,
      amountCurrency: "NGN 10,000",
      created: "Nov 2, 2021",
      link: "/payment/7",
    },
    {
      id: "8",
      name: "Product Purchase",
      amountFlow: 30,
      amountCurrency: "NGN 15,000",
      created: "Dec 4, 2021",
      link: "/payment/8",
    },
    {
      id: "9",
      name: "Donation Fund",
      amountFlow: 10,
      amountCurrency: "NGN 5,000",
      created: "Jan 12, 2022",
      link: "/payment/9",
    },
    {
      id: "10",
      name: "Service Payment",
      amountFlow: 40,
      amountCurrency: "NGN 20,000",
      created: "Feb 10, 2022",
      link: "/payment/10",
    },
  ]);

  // Filter the payment links based on the search query
  const filteredLinks = paymentLinks.filter((link) =>
    link.name.toLowerCase().includes(search.toLowerCase())
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
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-md"
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
              <th className="px-4 py-10 text-left">Created</th>
              <th className="px-4 py-10 text-left">Link</th>
              <th className="px-4 py-10 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map((link, index) => (
              <tr key={link.id} className="border-b border-b-slate-200">
                <td className="px-4 py-10">{index + 1}</td>
                <td className="px-4 py-10">{link.name}</td>
                <td className="px-4 py-10">{link.amountFlow} Flow</td>
                <td className="px-4 py-10">{link.amountCurrency}</td>
                <td className="px-4 py-10">{link.created}</td>
                <td className="px-4 py-10">
                  <a href={link.link} className="text-blue-500 hover:underline">
                    Preview
                  </a>
                </td>
                <td className="px-4 py-10">
                  <button className="text-red-500">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaymentLinkModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
