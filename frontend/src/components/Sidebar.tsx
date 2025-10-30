import { Fragment } from "react";
import {
  PiSquaresFourDuotone,
  PiReceiptDuotone,
  PiUserCircleDuotone,
  PiSlidersDuotone,
  PiSignOutDuotone,
} from "react-icons/pi";

export type SidebarSection = "payment" | "transactions" | "settings" | "profile" | "logout";

interface SidebarProps {
  active: SidebarSection;
  onSelect: (section: SidebarSection) => void;
}

const navItems: { key: SidebarSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "payment", label: "Payment Links", icon: PiSquaresFourDuotone },
  { key: "transactions", label: "Transactions", icon: PiReceiptDuotone },
  { key: "profile", label: "Profile", icon: PiUserCircleDuotone },
  { key: "settings", label: "Settings", icon: PiSlidersDuotone },
  { key: "logout", label: "Sign out", icon: PiSignOutDuotone },
];

export default function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="relative hidden h-full w-72 flex-col justify-between border-r border-white/10 bg-white/5 px-6 pb-10 pt-14 backdrop-blur lg:flex">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-500/15 to-transparent" />
      <div className="relative space-y-10">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-200">
            WalPay
          </div>
          <h2 className="text-2xl font-semibold text-white">Merchant console</h2>
          <p className="text-sm text-slate-400">Manage your Flow payment infrastructure from one glossy dashboard.</p>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ key, label, icon: Icon }) => {
            const isActive = key === active;
            return (
              <Fragment key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-500 text-slate-950 shadow-[0_12px_40px_-18px_rgba(20,184,166,0.6)]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                      isActive
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/5 bg-white/0 text-emerald-300 group-hover:border-emerald-300/40 group-hover:bg-emerald-500/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </button>
                {key === "payment" ? <hr className="border-white/5" /> : null}
              </Fragment>
            );
          })}
        </nav>
      </div>

      <footer className="relative rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
        <p className="font-semibold text-white">Need help?</p>
        <p className="mt-1">Read our Flow integration playbook or reach out to the WalPay team.</p>
      </footer>
    </aside>
  );
}
