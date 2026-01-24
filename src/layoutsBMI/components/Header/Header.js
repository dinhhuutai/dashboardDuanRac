import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  FaHome,
  FaClipboardCheck,
  FaPlusCircle,
  FaChartBar,
  FaThLarge,
  FaChevronDown,
  FaUser,
} from "react-icons/fa";

import logo from "~/assets/imgs/logo_bmi.png";
import config from "~/config";
import avatarBMI from "~/assets/imgs/avatar_bmi.png";

const glassBar =
  "hidden md:block fixed top-0 left-0 right-0 z-[1000] " +
  "backdrop-blur-xl bg-white/65 border-b border-white/70 " +
  "shadow-[0_10px_26px_rgba(15,23,42,0.06)]";

const chip =
  "rounded-2xl bg-white/55 border border-white/70 " +
  "shadow-[6px_6px_14px_rgba(15,23,42,0.08),-6px_-6px_14px_rgba(255,255,255,0.95)]";

const inset =
  "rounded-2xl bg-white/55 border border-white/70 " +
  "shadow-[inset_6px_6px_14px_rgba(15,23,42,0.08),inset_-6px_-6px_14px_rgba(255,255,255,0.95)]";

const navBtn = ({ isActive }) =>
  [
    "px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2",
    isActive
      ? `text-emerald-700 ${inset}`
      : "text-slate-700 hover:text-slate-900 hover:bg-white/60",
  ].join(" ");

// Map route -> title mobile
function getMobileTitle(pathname) {
  if (pathname.startsWith("/bmi/check")) return "Đo BMI";
  if (pathname.startsWith("/bmi/plan")) return "Lộ trình";
  if (pathname.startsWith("/bmi/dashboard")) return "Thống kê";
  if (pathname.startsWith("/bmi/profile")) return "Hồ sơ";
  if (pathname.startsWith("/bmi")) return "BMI";
  return "BMI";
}

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // mock user (sau thay redux)
  const user = { fullName: "Đinh Tài", username: "tai" };

  const userInitials = useMemo(() => {
    const full = user?.fullName || user?.username || "";
    const parts = full.trim().split(" ").filter(Boolean);
    if (!parts.length) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  const mobileTitle = useMemo(() => getMobileTitle(pathname), [pathname]);

  // Avatar dropdown
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <header className={glassBar}>
      <div className="h-[64px] px-3 sm:px-5 hidden md:flex items-center justify-between gap-3 relative">
        {/* LEFT: Brand */}
        <div className="flex items-center gap-2 min-w-0">
          <Link to="/bmi" className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />

            {/* Desktop brand */}
            <div className="hidden sm:block min-w-0">
              <div
                className="font-extrabold text-[14px] leading-tight truncate"
                style={{
                  background: "linear-gradient(90deg, #FACC15, #F97316)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Thuận Hưng Long An
              </div>
              <div className="text-[12px] text-slate-500 -mt-[1px]">
                AI Sức khỏe • BMI
              </div>
            </div>
          </Link>
        </div>

        {/* MOBILE TITLE CENTER (absolute center) */}
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 max-w-[68%] text-center pointer-events-none">
          <div className="text-[15px] font-extrabold text-slate-800 truncate">
            {mobileTitle}
          </div>
        </div>

        {/* CENTER: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to={config.routes.bmi} end className={navBtn}>
            <FaHome className="text-[14px]" />
            Trang chủ
          </NavLink>

          <NavLink to={config.routes.bmiPlan} className={navBtn}>
            <FaClipboardCheck className="text-[14px]" />
            Lộ trình
          </NavLink>

          <NavLink to={config.routes.bmiCheck} className={navBtn}>
            <FaPlusCircle className="text-[14px]" />
            Đo BMI
          </NavLink>

          <NavLink to={config.routes.bmiDashboard} className={navBtn}>
            <FaChartBar className="text-[14px]" />
            Thống kê
          </NavLink>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {/* Mobile: module icon => Chọn ứng dụng */}
          <button
            onClick={() => navigate(config.routes.homeMain)}
            className={`md:hidden ${chip} h-10 w-10 grid place-items-center text-slate-700 hover:opacity-90 transition`}
            title="Chọn ứng dụng"
            aria-label="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>

          {/* Desktop: Chọn ứng dụng */}
          <button
  onClick={() => navigate(config.routes.homeMain)}
  className={`
  hidden md:inline-flex items-center gap-2
  ${chip}
  h-10 px-4
  text-sm font-semibold text-slate-700
  hover:text-slate-900 hover:bg-white/70
  hover:ring-4 hover:ring-white/40
  active:scale-[.98] transition
`}
>
  <FaThLarge className="text-[15px] -mt-[1px]" />
  <span className="leading-none">Chọn ứng dụng</span>
</button>

          {/* Desktop Avatar dropdown */}
          <div className="hidden md:block relative" ref={wrapRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className={`${chip} h-10 px-3 inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 transition`}
              title={user?.fullName}
              aria-label="Mở menu hồ sơ"
            >
              <span
  className={`rounded-2xl h-8 w-8 overflow-hidden rounded-full`}
  style={{
    backgroundImage: `url(${avatarBMI})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "50% 65%", // 👈 chỉnh % ở đây
  }}
/>
              <span className="text-sm font-semibold max-w-[160px] truncate">
                {user?.fullName}
              </span>
              <FaChevronDown className={`text-[12px] transition ${open ? "rotate-180" : ""}`} />
            </button>

            <div
              className={[
                "absolute right-0 mt-2 w-[220px] overflow-hidden",
                "rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl",
                "shadow-[0_18px_40px_rgba(15,23,42,0.12)]",
                "transition origin-top-right",
                open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none",
              ].join(" ")}
            >
              <button
                onClick={() => {
                  navigate(config.routes.bmiProfile);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-white/60 flex items-center gap-2"
              >
                <FaUser className="text-slate-600" />
                Hồ sơ
              </button>

              <div className="h-px bg-white/70" />

              <button
                onClick={() => {
                  navigate(config.routes.homeMain);
                  setOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-white/60"
              >
                Chọn ứng dụng
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
