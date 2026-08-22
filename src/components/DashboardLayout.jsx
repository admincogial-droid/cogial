import { NavLink, useNavigate } from "react-router-dom";
import { LayoutGrid, History, Settings, LogOut, AlertCircle } from "lucide-react";
import Seal from "./Seal";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Tool room", icon: LayoutGrid, end: true },
  { to: "/dashboard/history", label: "History", icon: History },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-brand-cloud">
      <aside className="w-64 shrink-0 border-r border-brand-slate/20 flex flex-col p-5 fixed inset-y-0">
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <img src="/logo-dark.png" alt="Cogial Logo" className="h-7 w-auto object-contain" />
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive ? "bg-brand-violet/10 text-brand-violet border border-brand-violet/30" : "text-brand-slate/75 hover:bg-brand-white hover:text-brand-navy border border-transparent"
                  }`
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-brand-white shadow-sm border border-brand-slate/10">
            <div className="h-8 w-8 rounded-full bg-brand-lavender border border-brand-violet/20 flex items-center justify-center text-xs font-medium text-brand-violet">
              {(user?.displayName || user?.email || "P")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-brand-navy truncate">{user?.displayName || user?.email || "Guest editor"}</p>
              <p className="text-[11px] text-brand-slate">Free Plan</p>
            </div>
            <button onClick={handleSignOut} aria-label="Sign out" className="text-brand-slate hover:text-semantic-error transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
