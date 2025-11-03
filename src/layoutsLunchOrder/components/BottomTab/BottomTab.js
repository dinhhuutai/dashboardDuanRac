// UserBottomTab.jsx
import { NavLink } from "react-router-dom";
import {
  BsHouse,
  BsClockHistory,
  BsCardChecklist,
  BsMenuApp,
} from "react-icons/bs";
import config from "~/config";

const items = [
  { to: config.routes.lunchOrder, label: "Đặt cơm", icon: BsMenuApp },
  { to: config.routes.lunchOrderHistory, label: "Lịch sử tuần", icon: BsClockHistory },
  { to: config.routes.lunchSearch, label: "Tra suất", icon: BsCardChecklist },
  { to: config.routes.homeMain, label: "Quay lại", icon: BsHouse },
];

export default function BottomTab() {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-40
        border-t border-slate-200/70 bg-white/95 backdrop-blur
      "
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className={`grid grid-cols-4`}>
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center py-2.5 gap-1 text-[11px]",
                  isActive
                    ? "text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-800",
                ].join(" ")
              }
              aria-label={label}
            >
              <span className="text-[18px] leading-none">
                <Icon />
              </span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
