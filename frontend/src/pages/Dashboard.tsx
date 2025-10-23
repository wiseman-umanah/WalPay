import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import type { SidebarSection } from "../components/Sidebar";
import { Payment } from "../components/Payment";
import { useFlowCurrentUser } from "@onflow/react-sdk"

const Dashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SidebarSection>("payment");

  const { user, authenticate, unauthenticate } = useFlowCurrentUser()

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
							<button className="bg-white border cursor-pointer border-green-500 font-bold text-green-500 px-4 py-2 rounded" onClick={unauthenticate}>{user?.addr}</button>
						) : (
							<button className="bg-green-500 cursor-pointer font-bold text-white px-4 py-2 rounded" onClick={authenticate}>Connect Wallet</button>
						)}
					</div>
				</div>

				{/* Info Cards Section */}
				<div className="grid  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Total Transactions Card */}
				<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
					<h3 className="text-lg font-medium text-gray-800">Total Transactions</h3>
					<p className="text-3xl font-semibold text-gray-600">1,234</p>
				</div>

				{/* Total Earnings Card */}
				<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
					<h3 className="text-lg font-medium text-gray-800">Total Flow Earned</h3>
					<p className="text-3xl font-semibold text-gray-600">2,500 FLOW</p>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
					<h3 className="text-lg font-medium text-gray-800">Total in Currency Per</h3>
					<p className="text-3xl font-semibold text-gray-600">$2,500</p>
				</div>
				</div>

				<div className="my-20">
					{activeSection === "payment" && <Payment />}
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
