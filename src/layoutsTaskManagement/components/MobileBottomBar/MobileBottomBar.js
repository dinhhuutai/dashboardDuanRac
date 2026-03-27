import React from "react";
import { Home, LayoutDashboard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import config from "~/config";

export default function MobileBottomBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isHome = pathname === config.routes.taskManagementHome;
  const isDashboard = pathname === config.routes.taskManagementDashboard;

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 md:hidden flex justify-center pointer-events-none">
      <div className="w-full max-w-screen-sm px-4 pointer-events-auto">
        <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-2 py-2 flex gap-2 shadow-sm">
          <TabItem
            active={isHome}
            onClick={() => navigate(config.routes.taskManagementHome)}
            icon={Home}
            label="Home"
          />
          <TabItem active={isDashboard} onClick={() => navigate(config.routes.taskManagementDashboard)} icon={LayoutDashboard} label="Dashboard" />
        </div>
      </div>
    </div>
  );
}

function TabItem({ active, onClick, icon: Icon, label }) {
  const base =
    "flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] sm:text-xs font-medium transition";

  const activeStyle = "bg-indigo-600 text-white";
  const inactiveStyle = "bg-transparent text-slate-500 hover:bg-slate-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeStyle : inactiveStyle}`}
    >
      <Icon
        className={`h-5 w-5 ${active ? "text-white" : "text-slate-400"}`}
      />
      <span>{label}</span>
    </button>
  );
}
