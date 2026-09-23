// Layout quản trị — module Biểu mẫu nội bộ
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Building2, ClipboardList, Eye, House, Menu, Plus, X } from "lucide-react";
import config from "~/config";
import { ConfirmHost, Toaster, cn } from "~/pagesForm/shared/ui";

const NAV = [
  { to: config.routes.adminFormList, label: "Biểu mẫu", icon: ClipboardList, end: true },
  { to: config.routes.adminFormBuilder, label: "Tạo biểu mẫu", icon: Plus, end: true },
  { to: config.routes.adminFormOrg, label: "Phòng ban & chức danh", icon: Building2 },
];

function Sidebar({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-5 font-semibold text-white">
        <ClipboardList className="h-5 w-5 text-sky-400" /> Biểu mẫu nội bộ
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              )
            }
          >
            <n.icon className="h-4 w-4" /> {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 border-t border-slate-800 p-3">
        <Link to={config.routes.form} onClick={onNavigate} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white">
          <Eye className="h-4 w-4" /> Xem như nhân viên
        </Link>
        <Link to={config.routes.homeMain} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-white">
          <House className="h-4 w-4" /> Về trang chủ
        </Link>
      </div>
    </div>
  );
}

function DefaultLayoutAdmin({ children }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const current = NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 bg-slate-900 lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 shadow-xl">
            <button className="absolute right-2 top-3 rounded-md p-1.5 text-slate-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Đóng menu">
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button className="-ml-1 rounded-md p-1.5 text-slate-600 hover:bg-slate-100" onClick={() => setOpen(true)} aria-label="Mở menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-slate-800">{current?.label || "Biểu mẫu nội bộ"}</span>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8">{children}</main>
      </div>
      <Toaster />
      <ConfirmHost />
    </div>
  );
}

export default DefaultLayoutAdmin;
