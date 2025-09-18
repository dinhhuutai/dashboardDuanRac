// UserHeader.jsx
import { Link } from "react-router-dom";
import { BsBell, BsChevronDown, BsPersonCircle } from "react-icons/bs";
import config from "~/config";

export default function Header() {
  return (
    <header className="h-[64px] md:h-[76px] px-3 sm:px-4 md:px-6 flex items-center justify-between">
      {/* Left: Logo + tên app */}
      <Link
        to={config.routes.lunchOrder}
        className="flex items-center gap-2 group"
        aria-label="Trang đặt cơm"
      >
        <div className="w-9 h-9 grid place-items-center rounded-xl bg-emerald-600 text-white font-bold">
          🍱
        </div>
        <div className="leading-tight">
          <div className="text-sm md:text-base font-semibold text-slate-900">
            Đặt Cơm Nội Bộ
          </div>
          <div className="text-[10px] md:text-[11px] text-slate-500 tracking-wide">
            Eat smart • Save time
          </div>
        </div>
      </Link>

      {/* Right: actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Thông báo */}
        <Link
          to={config.routes.lunchOrder}
          className="relative p-2 rounded-lg hover:bg-slate-100"
          aria-label="Thông báo"
          title="Thông báo"
        >
          <BsBell className="text-[18px]" />
          {/* badge demo */}
          {/* <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] px-1 rounded">
            2
          </span> */}
        </Link>

        {/* Avatar + menu nhỏ (demo) */}
        <button
          type="button"
          className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100"
          title="Tài khoản"
        >
          <BsPersonCircle className="text-[20px]" />
          <span className="text-sm text-slate-700">Bạn</span>
          <BsChevronDown className="text-[12px] text-slate-500" />
        </button>
      </div>
    </header>
  );
}
