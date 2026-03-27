import { Search, FolderKanban, CheckSquare } from "lucide-react";

import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsChevronDown, BsBoxArrowRight } from "react-icons/bs";
import { FaThLarge } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import avatar from "~/assets/imgs/avatar-main.jpg";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";
import config from "~/config";
import http from "~/api/http";

import { Link } from "react-router-dom";
import logo from "~/assets/imgs/logoAdmin.png";


export default function HeaderBar({ phase, onPhaseChange, onCreateQuick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRequest = location.pathname === config.routes.taskManagementRequests;
  const isWorkActive =
    !isRequest &&
    (location.pathname === config.routes.taskManagementMyTasks ||
      location.pathname === config.routes.taskManagementTeamTasks ||
      location.pathname === config.routes.taskManagementDepartmentTasks ||
      location.pathname === config.routes.taskManagementCompanyTasks ||
      location.pathname === config.routes.taskManagementDashboard ||
      location.pathname === config.routes.taskManagementHome);
  const isProjectActive =
    location.pathname.startsWith(config.routes.taskManagementProjectList) ||
    location.pathname.startsWith(`${config.routes.taskManagementProjectOverview}/`);

  return (
    <div className="flex h-16 items-center gap-3">
      {/* Mobile menu */}
      <div className="md:hidden inline-flex items-center gap-2 font-semibold">
        <Link
          to={config.routes.taskManagementHome}
          className="flex items-center gap-3 group pr-[10px]"
          aria-label="Trang quản lý công việc"
        >
          <img alt="logo" src={logo} className="h-9 w-auto object-contain" />
        </Link>
        <span>Quản lý công việc</span>
      </div>

      {/* Brand */}
      <div className="hidden md:flex min-w-[220px] items-center gap-2 font-semibold tracking-tight">
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
      <div className="ml-2 md:block hidden">
        <PhaseSwitcher
          isWorkActive={isWorkActive}
          isProjectActive={isProjectActive}
          isRequest={isRequest}
          onChange={onPhaseChange}
          onGoRequests={() => navigate(config.routes.taskManagementRequests)}
        />
      </div>

      {/* Search */}
      <div className="relative ml-2 hidden md:block w-full max-w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          placeholder="Tìm task, dự án..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => navigate(config.routes.homeMain)}
          className="
            hidden md:inline-flex items-center gap-2
            h-10 px-3.5 rounded-xl border border-slate-200 bg-white
            text-sm font-semibold text-slate-700
            hover:bg-slate-50 active:scale-[.98] transition
          "
          title="Chọn ứng dụng"
          aria-label="Chọn ứng dụng"
        >
          <FaThLarge className="text-[14px]" />
          <span className="leading-none">Chọn ứng dụng</span>
        </button>
        <HeaderInfo />
      </div>
    </div>
  );
}


/* =============================
 * Phase Switcher
 * ============================= */
function PhaseSwitcher({ isWorkActive, isProjectActive, isRequest, onChange, onGoRequests }) {
  return (
    <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1">
      <button
        onClick={() => onChange("work")}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
          isWorkActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <CheckSquare className="h-4 w-4" /> Công việc
      </button>
      <button
        onClick={() => onChange("projects")}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
          isProjectActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <FolderKanban className="h-4 w-4" /> Dự án
      </button>
      <button
        onClick={onGoRequests}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm transition ${
          isRequest ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <span className="text-[13px]">📌</span> Đề nghị
      </button>
    </div>
  );
}


function HeaderInfo() {
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
          <img alt="avatar" src={user?.avatar || avatar} className="h-full w-full object-cover" />
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

        {/* Đăng xuất */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-2xl"
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

