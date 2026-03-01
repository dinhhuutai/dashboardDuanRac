import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaUtensils,
  FaThLarge,
  FaClipboardList,
  FaUsers,
} from "react-icons/fa";

import logoAdmin from "~/assets/imgs/logoAdmin.png"; // logo cân rác
import avatar_datcom from "~/assets/imgs/avatar-main.jpg"; // avatar dùng chung
import config from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";

/** ====== STYLE giống header BMI ====== */
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

/** Tab style giống BMI */
const navBtn = ({ isActive }) =>
  [
    "px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2",
    isActive
      ? `text-emerald-700 ${inset}`
      : "text-slate-700 hover:text-slate-900 hover:bg-white/60",
  ].join(" ");

/** (Optional) title cho mobile nếu bạn cần sau */
function getMobileTitle(pathname) {
  if (pathname.startsWith("/scan")) return "Quét QR";
  if (pathname.startsWith("/history")) return "Lịch sử";
  if (pathname.startsWith("/user")) return "Tài khoản";
  return "Cân rác";
}

function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tmp = useSelector(userSelector);
  const user = tmp?.login?.currentUser;

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
          <Link to={config.routes.lunchOrder} className="flex items-center gap-2 min-w-0">
            <img src={logoAdmin} alt="Logo" className="h-[40px] w-[40px] object-contain" />

            {/* Desktop brand */}
            <div className="hidden sm:block min-w-0">
              {/* ✅ đổi xanh nước biển -> xanh lá */}
              <div
                className="font-extrabold text-[14px] leading-tight truncate"
                style={{
                  background: "linear-gradient(90deg, #22C55E, #10B981)", // emerald/green
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                Thuận Hưng Long An
              </div>

              {/* ✅ đổi dòng phụ */}
              <div className="text-[12px] text-slate-500 -mt-[1px]">
                Đặt cơm
              </div>
            </div>
          </Link>
        </div>

        {/* MOBILE TITLE CENTER (nếu sau này bạn bật md:hidden) */}
        <div className="sm:hidden absolute left-1/2 -translate-x-1/2 max-w-[68%] text-center pointer-events-none">
          <div className="text-[15px] font-extrabold text-slate-800 truncate">
            {mobileTitle}
          </div>
        </div>

        
        {/* CENTER: Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to={config.routes.lunchOrder} end className={navBtn}>
            <FaUtensils className="text-[14px]" />
            Đặt cơm
          </NavLink>

          <NavLink to={config.routes.lunchOrderHistory} end className={navBtn}>
            <FaClipboardList className="text-[14px]" />
            Lịch sử
          </NavLink>

          <NavLink to={config.routes.lunchOrderProxy} className={navBtn}>
            <FaUsers className="text-[14px]" />
            Đặt giùm
          </NavLink>
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-2">
          {/* Mobile icon (hiện ở md:hidden nên ở đây để sẵn) */}
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
              title={user?.fullName || user?.username || ""}
              aria-label="Mở menu hồ sơ"
            >
              {/* ✅ Avatar giống bên BMI (background-image để canh vị trí chắc) */}
              <span
                className={`h-8 w-8 overflow-hidden rounded-full rounded-2xl`}
                style={{
                  backgroundImage: `url(${avatar_datcom})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                  backgroundPosition: "50% 65%", // chỉnh % nếu cần
                }}
              />

              <span className="text-sm font-semibold max-w-[160px] truncate">
                {user?.fullName || user?.username || "Người dùng"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
