import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  FolderKanban,
  CheckSquare,
} from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsChevronDown, BsBoxArrowRight, BsBoxArrowLeft } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import avatar from "~/assets/imgs/favorite-5.jpg";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";
import config from "~/config";
import http from "~/api/http";

import { Link } from "react-router-dom";
import logo from "~/assets/imgs/logoAdmin.png";


export default function HeaderBar({ phase, onPhaseChange, onToggleSidebar, onCreateQuick }) {
  return (
    <div className="flex h-16 items-center gap-3">
      {/* Mobile menu */}
      {
        phase === 'work' ?
        <button
          onClick={onToggleSidebar}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:shadow-sm"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button> :
        <button
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white hover:shadow-sm"
          aria-label="Mở menu"
        >
          <div className="h-5 w-5"></div>
        </button>
      }

      {/* Brand */}
      <div className="hidden md:flex w-[270px] items-center gap-2 font-semibold tracking-tight">
        <Link
          to={phase === 'work' ? config.routes.taskManagementDashboard : config.routes.taskManagementProjectList}
          className="hidden md:flex items-center gap-3 group pr-[10px]"
          aria-label="Trang phân tích"
        >
          <img alt="logo" src={logo} className="h-9 w-auto object-contain" />
        </Link>
        <span className="hidden sm:inline flex-1">{phase === 'work' ? 'QL Công Việc' : 'QL Dự Án'}</span>
      </div>

      {/* Phase switcher */}
      <div className="ml-2">
        <PhaseSwitcher phase={phase} onChange={onPhaseChange} />
      </div>

      {/* Search */}
      <div className="relative ml-3 hidden md:block w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          placeholder="Tìm task, dự án, file, người dùng…"
          className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:shadow-sm" aria-label="Thông báo">
          <Bell className="h-5 w-5" />
        </button>
        
        <HeaderInfo exitTo={config.routes.home} />
      </div>
    </div>
  );
}


/* =============================
 * Phase Switcher
 * ============================= */
function PhaseSwitcher({ phase, onChange }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
      <button
        onClick={() => onChange("work")}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
          phase === "work" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <CheckSquare className="h-4 w-4" /> Công việc
      </button>
      <button
        onClick={() => onChange("projects")}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
          phase === "projects" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <FolderKanban className="h-4 w-4" /> Dự án
      </button>
    </div>
  );
}


function HeaderInfo({ exitTo = config.routes.home }) {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  // Đóng menu khi click ra ngoài / ESC
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await http.post("/auth/logout"); // thu hồi refresh + clear cookie server
    } catch {}
    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
  };

  const handleExitModule = () => {
    navigate(config.routes.homeMain); // điều hướng ra trang tổng (home/dashboard hệ thống)
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Thông tin tài khoản"
        className="flex items-center gap-2 rounded-full bg-white/70 border border-white/70 px-2.5 py-1.5 shadow-sm hover:bg-white transition focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
      >
        <span className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/70">
          <img alt="avatar" src={avatar} className="h-full w-full object-cover" />
        </span>
        <span className="hidden lg:flex flex-col items-start leading-tight">
          <span className="text-[13px] font-semibold text-slate-800 max-w-[160px] truncate">
            {user?.fullName || "Người dùng"}
          </span>
          <span className="text-[11px] text-slate-500">@{user?.username || "user"}</span>
        </span>
        <BsChevronDown className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <div
        role="menu"
        className={`absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-white/70 bg-white/90 backdrop-blur-md shadow-xl shadow-slate-900/5 transition-all ${
          open ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
        }`}
      >
        <div className="block md:hidden px-4 py-3">
          <p className="mt-0.5 text-sm font-medium text-slate-800 truncate">
            {user?.fullName || "Người dùng"}
          </p>
          <p className="text-xs text-slate-500 truncate">@{user?.username || "user"}</p>
        </div>

        <div className="block md:hidden h-px bg-slate-100" />

        {/* Thoát QLCV */}
        <button
          onClick={handleExitModule}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-slate-700 hover:bg-slate-50"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <BsBoxArrowLeft />
          </span>
          Thoát QLCV
        </button>

        {/* Đăng xuất */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-b-2xl"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <BsBoxArrowRight />
          </span>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

