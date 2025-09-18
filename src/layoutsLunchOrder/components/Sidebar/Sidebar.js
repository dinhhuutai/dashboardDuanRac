// UserSidebar.jsx
import { NavLink } from "react-router-dom";
import {
  BsMenuApp,
  BsClockHistory,
  BsPersonPlus,
  BsHouse,
} from "react-icons/bs";
import config from "~/config";

const nav = [
  { to: config.routes.lunchOrder, label: "Đặt cơm", icon: BsMenuApp },
  { to: config.routes.lunchOrderHistory, label: "Lịch sử tuần", icon: BsClockHistory },
  { to: config.routes.lunchOrderProxy, label: "Đặt giùm", icon: BsPersonPlus },
  { to: config.routes.homeMain, label: "Quay lại", icon: BsHouse },
];

export default function Sidebar() {
  return (
    <aside
      className="
        h-[calc(100vh-76px)]
        sticky top-[76px]
        rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-3
        shadow-[0_10px_30px_-15px_rgba(2,6,23,0.08)]
      "
    >
      <div className="text-[11px] uppercase font-bold text-emerald-700/80 tracking-widest px-2 mb-2">
        Menu
      </div>
      <ul className="space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                ].join(" ")
              }
            >
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-slate-100">
                <Icon size={16} />
              </span>
              <span className="flex-1">{label}</span>
              <span className="h-5 w-[3px] rounded-r bg-emerald-500 opacity-0 group-[.active]:opacity-100" />
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Tip/CTA nhỏ */}
      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
        💡 Mẹo: Bạn có thể đặt cả tuần chỉ với một lần bấm “Xác nhận”.
      </div>
    </aside>
  );
}
