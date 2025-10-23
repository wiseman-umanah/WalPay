import React from "react";
import { FaChartLine, FaCog, FaWallet, FaUser, FaSignOutAlt } from "react-icons/fa";

export type SidebarSection = "payment" | "transactions" | "settings" | "profile" | "logout";

interface SidebarProps {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ active, onSelect }) => {
  return (
    <div className="bg-gray-800 text-white flex flex-col items-center p-6 w-max">
      <h1 className="text-xl font-bold text-center text-green-500 mb-12">WalletPay</h1>
      <ul className="flex flex-col justify-between h-full">
		<div className="space-y-10">
			<li
          className={`cursor-pointer hover:bg-white p-3 rounded-lg font-bold flex items-center gap-5 ${active === "payment" ? "text-green-500" : "hover:text-green-500"}`}
          onClick={() => onSelect("payment")}
        >
          <FaWallet size={24} />
		  <p>Payment</p>
			</li>
			<li
			className={`cursor-pointer hover:bg-white p-3 rounded-lg font-bold flex items-center gap-5 ${active === "transactions" ? "text-green-500" : "hover:text-green-500"}`}
			onClick={() => onSelect("transactions")}
			>
			<FaChartLine size={24} />
			<p>Transactions</p>
			</li>
		</div>

		<div className="space-y-10">
			<li
				className={`cursor-pointer hover:bg-white p-3 rounded-lg font-bold flex items-center gap-5 ${active === "profile" ? "text-green-500" : "hover:text-green-500"}`}
				onClick={() => onSelect("profile")}
				>
				<FaUser size={24} />
				<p>Profile</p>
			</li>
			<li
				className={`cursor-pointer hover:bg-white p-3 rounded-lg font-bold flex items-center gap-5 ${active === "settings" ? "text-green-500" : "hover:text-green-500"}`}
				onClick={() => onSelect("settings")}
				>
				<FaCog size={24} />
				<p>Settings</p>
			</li>
			<li
				className={`cursor-pointer hover:bg-white p-3 rounded-lg font-bold flex items-center gap-5 ${active === "logout" ? "text-green-500" : "hover:text-green-500"}`}
				onClick={() => onSelect("logout")}
				>
				<FaSignOutAlt size={24} />
				<p>Logout</p>
			</li>
		</div>
      </ul>
    </div>
  );
};

export default Sidebar;
