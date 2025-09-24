import { BsList } from "react-icons/bs";
import { Link } from "react-router-dom";
import logo from "~/assets/imgs/logoAdmin.png";
import config from "~/config";

function HeaderLogo({ onToggle }) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-6 w-auto md:w-[var(--admin-width-sidebar)]">
      <Link
        to={config.routes.adminLunchOrderDashboard}
        className="hidden md:flex items-center gap-3 group"
        aria-label="Trang phân tích"
      >
        <img alt="logo" src={logo} className="h-9 w-auto object-contain" />
        <span className="text-slate-700 font-semibold tracking-tight group-hover:text-slate-900 transition">
          Admin
        </span>
      </Link>

      <button
        onClick={onToggle}
        aria-label="Mở/đóng sidebar"
        className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/70 border border-white/70 text-slate-700 hover:bg-white transition shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
      >
        <BsList className="text-[22px]" />
      </button>
    </div>
  );
}

export default HeaderLogo;
