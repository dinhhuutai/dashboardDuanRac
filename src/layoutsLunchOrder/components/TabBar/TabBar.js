import { NavLink } from "react-router-dom";
import {
  FaUtensils,
  FaClipboardList,
  FaUsers,
} from "react-icons/fa";
import config from "~/config";

const barCard =
  "rounded-3xl bg-white/70 backdrop-blur-xl border border-white/70 " +
  "shadow-[0_18px_40px_rgba(15,23,42,0.12)]";

function TabItem({ to, label, icon }) {
  return (
    <NavLink to={to} end>
      {({ isActive }) => (
        <div
          className={[
            "relative flex flex-col items-center justify-center transition",
            isActive
              ? "text-emerald-700"
              : "text-slate-600 hover:text-slate-800",
          ].join(" ")}
        >
          <div className="text-xl">{icon}</div>

          <div className="mt-1 text-[11px] font-semibold">
            {label}
          </div>

          <span
            className={[
              "absolute -bottom-2 h-[5px] w-[5px] rounded-full transition",
              isActive ? "bg-emerald-500" : "bg-transparent",
            ].join(" ")}
          />
        </div>
      )}
    </NavLink>
  );
}

export default function TabBar() {
  return (
    <div className="fixed bottom-3 left-0 right-0 z-[999] md:hidden">
      <div className="px-3">
        <div className={`${barCard} relative h-[62px]`}>
          <div className="grid grid-cols-3 h-full items-center px-2">
            {/* Đặt cơm */}
            <div className="flex justify-center">
              <TabItem
                to={config.routes.lunchOrder}
                label="Đặt cơm"
                icon={<FaUtensils />}
              />
            </div>

            {/* Lịch sử */}
            <div className="flex justify-center">
              <TabItem
                to={config.routes.lunchOrderHistory}
                label="Lịch sử"
                icon={<FaClipboardList />}
              />
            </div>

            {/* Đặt giùm */}
            <div className="flex justify-center">
              <TabItem
                to={config.routes.lunchOrderProxy}
                label="Đặt giùm"
                icon={<FaUsers />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
