// Sidebar.jsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  CheckSquare,   // icon nhóm: Công việc/Tổng quan
  Users,         // icon nhóm: Theo phạm vi tổ chức
  LayoutGrid,    // icon nhóm: Chế độ xem
  BarChart3,     // icon nhóm: Báo cáo & thông báo
} from "lucide-react";
import config from "~/config";

export default function Sidebar({ phase, onNavigate }) {
  if (phase !== "work") return null;

  return (
    <div className="sticky top-[76px] flex h-[calc(100dvh-76px)] flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {/* Nhóm 1: Tổng quan */}
      <NavSection title="Tổng quan" icon={CheckSquare} defaultOpen>
        <NavItem label="Bảng điều khiển" to={config.routes.taskManagementDashboard} onNavigate={onNavigate} />
      </NavSection>

      {/* Nhóm 2: Theo phạm vi tổ chức */}
      <NavSection title="Công việc theo phạm vi" icon={Users} defaultOpen>
        <NavItem label="Công việc của tôi" to={config.routes.taskManagementMyTasks} onNavigate={onNavigate} />
        <NavItem label="Theo nhóm" to={config} onNavigate={onNavigate} />
        <NavItem label="Theo phòng ban" to={config} onNavigate={onNavigate} />
        <NavItem label="Toàn công ty" to={config} onNavigate={onNavigate} />
      </NavSection>

      {/* Nhóm 3: Chế độ xem */}
      <NavSection title="Chế độ xem" icon={LayoutGrid} defaultOpen>
        <NavItem label="Kanban toàn cục" to={config} onNavigate={onNavigate} />
        <NavItem label="Danh sách nâng cao" to={config} onNavigate={onNavigate} />
      </NavSection>

      {/* Nhóm 4: Báo cáo & thông báo */}
      <NavSection title="Báo cáo & thông báo" icon={BarChart3} defaultOpen>
        <NavItem label="Báo cáo" to={config} onNavigate={onNavigate} />
        <NavItem label="Hộp thư & Thông báo" to={config} onNavigate={onNavigate} />
      </NavSection>

    </div>
  );
}

function NavSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
        aria-expanded={open}
        aria-controls={`section-${title}`}
      >
        <Icon className="h-4 w-4" />
        <span>{title}</span>
        <ChevronDown className={`ml-auto h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`section-${title}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-2"
          >
            <div className="flex flex-col gap-1 py-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ label, to = "#", onNavigate }) {
  const { pathname } = useLocation();
  const active = useMemo(() => {
    if (!to || to === "#") return false;
    return pathname === to || pathname.startsWith(to + "/");
  }, [pathname, to]);
  
  const handleClick = () => {
    // Nếu là mobile (nhỏ hơn md), đóng menu
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches) {
      onNavigate?.();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 ${
        active ? "bg-slate-200 text-slate-900" : "text-slate-700"
      }`}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}
