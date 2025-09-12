import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  FiHome, FiUsers, FiSettings, FiGrid, FiChevronDown, FiLogOut, FiSearch, FiX,
} from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import avatar from "~/assets/imgs/favorite-5.jpg";
import logo from "~/assets/imgs/logoAdmin.png";
import config, { BASE_URL } from "~/config";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";

import Module from "../Module";
import UserModuleAccess from "../UserModuleAccess";
import http, { setAccessToken } from '~/api/http';

/* ---------- Helpers ---------- */
const Field = ({ label, hint, children }) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    {children}
    {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
  </div>
);

// icon có thể là "FiSomething" hoặc URL
const IconOrImg = ({ icon, className = "h-6 w-6" }) => {
  if (!icon) return <FiIcons.FiGrid className={className + " text-slate-800"} />;
  if (/^Fi[A-Za-z0-9]+$/.test(icon) && typeof FiIcons[icon] === "function") {
    const Cmp = FiIcons[icon];
    return <Cmp className={className + " text-slate-800"} />;
  }
  return <img src={icon} alt="" className={className + " object-contain"} />;
};

const slugify = (s = "") =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

/* ---------- Module Card (hiện đại) ---------- */
const ModuleCard = ({ module, onGoUser, onGoAdmin }) => {
  const { name, description, icon, allowedRoles = [] } = module || {};
  const canUser = allowedRoles.includes("user");
  const canAdmin = allowedRoles.includes("admin");

  return (
    <div
  className="
    group relative rounded-2xl bg-[#f5faf8] p-4 sm:p-5
    shadow-[4px_4px_12px_rgba(185,210,200,0.35),-4px_-4px_12px_rgba(255,255,255,0.9)]
    transition-all duration-300 hover:shadow-[2px_2px_6px_rgba(185,210,200,0.35),-2px_-2px_6px_rgba(255,255,255,0.9)]
    hover:-translate-y-1
  "
>

      <div className="flex items-start gap-3">
        <div
          className="
            flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
            bg-[#fafbfc]
            shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
          "
        >
          <IconOrImg icon={icon} className="h-6 w-6 text-gray-600" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Tiêu đề với tooltip */}
          <div className="relative group/title">
            <h3
              className="truncate text-lg font-semibold text-gray-700 cursor-pointer"
            >
              {name}
            </h3>
            {/* Tooltip khi hover */}
            <div
              className="absolute left-0 top-full z-10 mt-1 hidden w-max max-w-xs rounded-md bg-gray-800 px-3 py-1 text-sm text-white shadow-lg group-hover/title:block"
            >
              {name}
            </div>
          </div>

          
          {/* Mô tả với tooltip */}
          <div className="relative group/desc mt-1">
            <p className="text-sm text-gray-500 whitespace-normal break-words">
  {description || "—"}
</p>
          </div>

          {/* Nút quyền */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {canUser && (
              <button
                type="button"
                onClick={onGoUser}
                className="
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600
                  bg-[#fafbfc]
                  shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
                  transition hover:shadow-[2px_2px_4px_rgba(180,190,200,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)]
                "
              >
                <FiIcons.FiUser className="h-4 w-4" />
                <span>User</span>
              </button>
            )}

            {canAdmin && (
              <button
                type="button"
                onClick={onGoAdmin}
                className="
                  inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600
                  bg-[#fafbfc]
                  shadow-[3px_3px_6px_rgba(180,190,200,0.4),-3px_-3px_6px_rgba(255,255,255,0.8)]
                  transition hover:shadow-[2px_2px_4px_rgba(180,190,200,0.4),-2px_-2px_4px_rgba(255,255,255,0.8)]
                "
              >
                <FiIcons.FiShield className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



/* ---------- Trang chính ---------- */
function HomeMain() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Lấy user
  const tmp = useSelector(userSelector);
  const user = tmp?.login?.currentUser || { fullName: "Người dùng" };

  // View hiện tại
  const [view, setView] = useState("home");

  // Modules state
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const visibleModules = modules.filter(
    (m) => !query || norm(m.name).includes(norm(query)) || norm(m.description).includes(norm(query))
  );

  // Fetch modules theo user
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoadingModules(true);
        const uid = user?.userID;
        const role = user?.role; // 'admin' | 'user'

        // Ưu tiên: API phân quyền theo user
        try {
          if (uid) {
            const r = await http.get(`${BASE_URL}/api/users/${uid}/modules-roles`, {
              params: { page: 1, pageSize: 200, q: query }
            });
            const list = Array.isArray(r.data?.data)
              ? r.data.data
              : Array.isArray(r.data)
              ? r.data
              : [];
            if (list.length || query) {
              setModules(list);

              return;
            }
          }
        } catch {
          /* fallback dưới */
        }

        // Fallback: lấy all, gán allowedRoles theo role hiện tại
        const res = await http.get(`${BASE_URL}/api/modules`, {
          params: { page: 1, pageSize: 200, q: query },
        });
        const all = res.data?.data || res.data || [];
        const allowed = role === "admin" ? ["user", "admin"] : ["user"];
        setModules(all.map((m) => ({ ...m, allowedRoles: allowed })));
      } catch {
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };
    fetchModules();
  }, [user?.userID, user?.role, query]);

  // Ctrl/⌘+K focus search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close dropdown outside / ESC
  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const handleLogout = async () => {
    try {
        await http.post('/auth/logout'); // thu hồi refresh ở server + clear cookie
    } catch {}
    setAccessToken(null); 

    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
    
  };

  // Sidebar item helper
  const NavIcon = ({ active, title, children, onClick }) => (
    <button
      onClick={onClick}
      className={[
        "flex items-center justify-center w-10 h-10 rounded-xl ring-1 ring-inset",
        active
          ? "text-indigo-700 bg-indigo-50 ring-indigo-200"
          : "text-slate-600 bg-white ring-slate-200 hover:bg-slate-50",
      ].join(" ")}
      title={title}
    >
      {children}
    </button>
  );

  const goToModule = (m, role) => {
    console.log(m.name);
    
    let rou = '/';
    if (m.name === 'Quản lý cân rác' && role === 'user') {
      rou = config.routes.home
    } else if (m.name === 'Quản lý cân rác' && role === 'admin') {
      rou = config.routes.adminAnalytics
    } else if (m.name === 'Quản lý cân mực' && role === 'admin') {
        rou = config.routes.adminInkWeighHistory
    } else if (m.name === 'Hòm thư góp ý' && role === 'user') {
        rou = config.routes.feedback1
    } else if (m.name === 'Hòm thư góp ý' && role === 'admin') {
        rou = config.routes.adminSuggestionList
    }

    navigate(rou);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50">
      <div className="mx-auto max-w-[1200px] p-4 sm:p-6">
        <div className="rounded-3xl bg-white/70 backdrop-blur shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* Topbar */}
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white/70 px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="logo" className="h-8 w-auto" />
              <span className="hidden sm:block text-sm sm:text-base font-semibold text-slate-800 capitalize">
                {view === "home"
                  ? "Home"
                  : view === "create"
                  ? "Tạo tài khoản"
                  : view === "settings"
                  ? "Cài đặt"
                  : view === "modules"
                  ? "Quản lý Modules"
                  : view === "access"
                  ? "Phân quyền"
                  : ""}
              </span>
            </div>

            {/* Search chỉ hiện ở Home */}
            <div
              className={`flex items-center flex-1 mx-2 md:mx-4 ${
                view === "home" ? "max-w-full md:max-w-xl" : "max-w-0 md:max-w-0"
              } transition-all`}
            >
              {view === "home" && (
                <div className="relative w-full">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setQuery("")}
                    placeholder="Tìm nhanh module…"
                    className="w-full rounded-xl bg-white/70 pl-9 pr-9 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                      aria-label="Xoá tìm kiếm"
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Avatar + dropdown */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 ring-1 ring-slate-200 hover:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <img src={avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
                <span className="hidden sm:block text-sm font-medium text-slate-700">
                  {user?.fullName || user?.username || "Người dùng"}
                </span>
                <FiChevronDown
                  className={`hidden sm:block text-slate-400 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  tabIndex={-1}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur shadow-lg ring-1 ring-slate-200 p-1 z-50"
                >
                  <button
                    onClick={() => {
                      setView("create");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FiUsers /> Tạo tài khoản
                  </button>
                  <button
                    onClick={() => {
                      setView("settings");
                      setMenuOpen(false);
                    }}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <FiSettings /> Cài đặt tài khoản
                  </button>
                  <hr className="my-1 border-slate-200" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-[72px_1fr]">
            {/* Sidebar */}
            <aside className="border-r border-slate-200 bg-white/60">
              <nav className="p-2 flex flex-col items-center gap-2">
                <NavIcon active={view === "home"} title="Home" onClick={() => setView("home")}>
                  <FiHome />
                </NavIcon>

                <NavIcon
                  active={view === "modules"}
                  title="Quản lý Modules"
                  onClick={() => setView("modules")}
                >
                  <FiGrid />
                </NavIcon>
                
                <NavIcon
                  active={view === "access"}
                  title="Phân quyền"
                  onClick={() => setView("access")}
                >
                  <FiIcons.FiShield />
                </NavIcon>
              </nav>
            </aside>

            {/* Content theo view */}
            <main className="p-4 sm:p-6">
              {view === "home" && (
                loadingModules ? (
                  <div className="grid place-items-center h-48 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-slate-500">
                    Đang tải danh sách module…
                  </div>
                ) : visibleModules.length === 0 ? (
                  <div className="grid place-items-center h-48 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-slate-500">
                    Không tìm thấy module nào. Thử từ khoá khác hoặc liên hệ quản trị để được cấp quyền.
                  </div>
                ) : (
                  <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {visibleModules.map((m) => {
                      const toUser = () => goToModule(m, "user");
                      const toAdmin = () => goToModule(m, "admin");
                      return (
                        <ModuleCard
                          key={m.moduleId || m.name}
                          module={m}
                          onGoUser={toUser}
                          onGoAdmin={toAdmin}
                        />
                      );
                    })}
                  </div>
                )
              )}

              {view === "modules" && <Module />}

              {view === "access" && <UserModuleAccess />}

              {/* view "create" & "settings" bạn đã có sẵn trong project — giữ nguyên */}
              {view === "create" && (
                <div className="rounded-3xl bg-white/70 backdrop-blur ring-1 ring-slate-200 p-6 text-slate-700">
                  {/* Bạn có thể nhúng form tạo tài khoản cũ vào đây nếu cần */}
                  Tính năng Tạo tài khoản — (nhúng component form hiện có của bạn).
                </div>
              )}

              {view === "settings" && (
                <div className="rounded-3xl bg-white/70 backdrop-blur ring-1 ring-slate-200 p-6 text-slate-700">
                  {/* Bạn có thể nhúng SettingsPanel cũ vào đây nếu cần */}
                  Tính năng Cài đặt — (nhúng component settings hiện có của bạn).
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;
