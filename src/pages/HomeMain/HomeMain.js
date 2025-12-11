// src/pages/Home/HomeMain.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  FiHome,
  FiUsers,
  FiSettings,
  FiGrid,
  FiChevronDown,
  FiLogOut,
  FiSearch,
  FiX,
} from "react-icons/fi";
import * as FiIcons from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import avatar from "~/assets/imgs/favorite-5.jpg";
import logo from "~/assets/imgs/logoAdmin.png";
import config, { BASE_URL } from "~/config";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";
import http from "~/api/http";
import MODULEID from "~/contants/modules";

import FirstLoginChangePasswordModal from "./FirstLoginChangePasswordModal";
import PasswordChangeSuccessModal from "./PasswordChangeSuccessModal";

import Module from "../Module";
import UserModuleAccess from "../UserModuleAccess";

import MidAutumnLanternBackground from "~/components/UiBackground/BgTrungThu";
import ChristmasSceneBackground from "~/components/UiBackground/BgNoel";
import TetSpringBackground from "~/components/UiBackground/BgTet";
import SummerBeachBackground from "~/components/UiBackground/BgHe";

import longdenImg from "../../assets/imgs/long_den.png";

import ModuleCard from "./ModuleCard";
import CreateAccountCard from "./CreateAccountCard";
import UsersAdminPanel from "./UsersAdminPanel";
import ProfileSettingsCard from "./ProfileSettingsCard";
// import ThemeToggle from "./components/ThemeToggle";

import LuckyGiftModal from "./LuckyGiftModal";
import FirstLoginGiftModal from "./FirstLoginGiftModal";

function HomeMain() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Lucky gift hệ thống (cũ)
  const [showLuckyGiftModal, setShowLuckyGiftModal] = useState(false);

  // Lucky gift cho lần đầu đăng nhập
  const [showFirstLoginGiftModal, setShowFirstLoginGiftModal] =
    useState(false);

  // modal đổi mật khẩu
  const [forceChangePassword, setForceChangePassword] = useState(false);
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] =
    useState(false);

  const [theme, setTheme] = useState("normal");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const tmp = useSelector(userSelector);
  const user = tmp?.login?.currentUser || { fullName: "Người dùng" };

  console.log(user);
  const [view, setView] = useState("home");

  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  const [loadingLogout, setLoadingLogout] = useState(false);

  const [query, setQuery] = useState("");
  const searchRef = useRef(null);

  const norm = (s) =>
    (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const visibleModules = modules.filter(
    (m) =>
      !query ||
      norm(m.name).includes(norm(query)) ||
      norm(m.description).includes(norm(query))
  );

  // Kiểm tra xem user đã đổi mật khẩu chưa (dùng user từ Redux)
  useEffect(() => {
    if (user?.userID) {
      setForceChangePassword(!user.hasChangedPassword);
    } else {
      setForceChangePassword(false);
    }
  }, [user?.userID, user?.hasChangedPassword]);

  // Kiểm tra lucky gift hệ thống (như cũ)
  useEffect(() => {
    const checkLuckyGift = async () => {
      try {
        const res = await http.get(`${BASE_URL}/api/lucky-gift/status`);

        if (res.data?.success && res.data.data) {
          const { canSpin, luckyGiftClaimed } = res.data.data;
          if (!luckyGiftClaimed && canSpin) {
            setShowLuckyGiftModal(true);
          }
        }
      } catch (err) {
        console.error("check lucky gift status error:", err);
      }
    };

    if (user?.userID) {
      checkLuckyGift();
    }
  }, [user?.userID]);

  // load modules
  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        const uid = user?.userID;
        const role = user?.role;

        if (uid) {
          try {
            const r = await http.get(
              `${BASE_URL}/api/users/${uid}/modules-roles`,
              {
                params: { page: 1, pageSize: 200, q: query },
              }
            );
            const list = Array.isArray(r.data?.data)
              ? r.data.data
              : Array.isArray(r.data)
              ? r.data
              : [];
            setModules(list);
            return;
          } catch (err) {
            console.warn("modules-roles failed, fallback to all:", err);
          }
        }

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
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  async function unregisterPushSafe(timeoutMs = 1000) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const withTimeout = (p, ms) =>
      Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms),
        ),
      ]);

    try {
      const reg = await withTimeout(navigator.serviceWorker.ready, timeoutMs);
      const sub = await withTimeout(
        reg.pushManager.getSubscription(),
        timeoutMs
      );
      if (!sub) return;

      try {
        await withTimeout(
          http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, {
            endpoint: sub.endpoint,
          }),
          timeoutMs
        );
      } catch {}

      try {
        await withTimeout(sub.unsubscribe(), timeoutMs);
      } catch {}
    } catch {
      // ignore
    }
  }

  async function handleLogout() {
    if (loadingLogout) return;
    setLoadingLogout(true);
    try {
      await unregisterPushSafe(1200);

      try {
        await http.post("/auth/logout", {}, { withCredentials: true });
      } catch {}

      dispatch(authSlice.actions.logoutSuccess());
      navigate(config.routes.login);
    } finally {
      setTimeout(() => setLoadingLogout(false), 1000);
    }
  }

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
    let rou = "/";
    if (m.moduleId === MODULEID.CANRAC && role === "user") {
      rou = config.routes.home;
    } else if (m.moduleId === MODULEID.CANRAC && role === "admin") {
      rou = config.routes.adminAnalytics;
    } else if (m.moduleId === MODULEID.CANMUC && role === "admin") {
      rou = config.routes.adminInkWeighHistory;
    } else if (m.moduleId === MODULEID.HOMTHU && role === "user") {
      rou = config.routes.feedback1;
    } else if (m.moduleId === MODULEID.HOMTHU && role === "admin") {
      rou = config.routes.adminSuggestionList;
    } else if (m.moduleId === MODULEID.DATCOM && role === "user") {
      rou = config.routes.lunchOrder;
    } else if (m.moduleId === MODULEID.DATCOM && role === "admin") {
      rou = config.routes.adminLunchOrderDashboard;
    } else if (m.moduleId === MODULEID.HINHDRAWER && role === "user") {
      rou = config.routes.imageCaddi;
    } else if (m.moduleId === MODULEID.SANXUAT && role === "admin") {
      rou = config.routes.adminProductionDashboard;
    } else if (m.moduleId === MODULEID.TINHLUONG && role === "admin") {
      rou = config.routes.adminCalculateSalaryUploadPayrollReport;
    } else if (m.moduleId === MODULEID.TINHLUONG && role === "user") {
      rou = config.routes.calculateSalaryViewPayslip;
    } else if (m.moduleId === MODULEID.BIEUMAUNOIBO && role === "admin") {
      rou = config.routes.adminFormCreate;
    } else if (m.moduleId === MODULEID.BIEUMAUNOIBO && role === "user") {
      rou = config.routes.form;
    } else if (m.moduleId === MODULEID.CONGVIEC && role === "user") {
      rou = config.routes.taskManagementDashboard;
    } else if (m.moduleId === MODULEID.CONGVIEC && role === "admin") {
      rou = config.routes.adminTaskManagementDashboard;
    } else if (m.moduleId === MODULEID.XEPHOIVAI && role === "user") {
      rou = config.routes.dryingCart;
    }
    navigate(rou);
  };

  return (
    <div className="relative min-h-screen">
      {/* Modal đổi mật khẩu lần đầu */}
      <FirstLoginChangePasswordModal
        isOpen={forceChangePassword}
        onSuccess={() => {
          setForceChangePassword(false);
          setShowPasswordSuccessModal(true);
        }}
      />

      {/* Modal thông báo đổi mật khẩu thành công */}
      <PasswordChangeSuccessModal
        isOpen={showPasswordSuccessModal}
        onClose={() => {
          setShowPasswordSuccessModal(false);
          // Nếu user chưa nhận quà lần đầu thì mở modal quà lần đầu
          if (!user.firstLoginGiftClaimed) {
            setShowFirstLoginGiftModal(true);
          }
        }}
      />

      {/* Lucky gift lần đầu đăng nhập (dùng lại LuckyGiftModal) */}
      <FirstLoginGiftModal
        isOpen={showFirstLoginGiftModal}
        onClose={async () => {
          setShowFirstLoginGiftModal(false);
          try {
            dispatch(authSlice.actions.firstLoginGift());
            await http.post(`${BASE_URL}/api/auth/first-login-gift-claim`);
          } catch (err) {
            console.error("first-login-gift-claim error:", err);
          }
        }}
      />

      {/* Lucky gift hệ thống (cũ) */}
      <LuckyGiftModal
        isOpen={showLuckyGiftModal}
        onClose={() => setShowLuckyGiftModal(false)}
      />

      {/* Background theo theme */}
      {theme === "normal" && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-indigo-50 via-white to-sky-50" />
      )}

      {theme === "midautumn" && (
        <div className="absolute inset-0 z-10">
          <MidAutumnLanternBackground
            count={80}
            className="h-full w-full"
            lanternSrc={longdenImg}
          />
        </div>
      )}

      {theme === "noel" && (
        <div className="absolute inset-0 z-10">
          <ChristmasSceneBackground
            className="h-full w-full"
            starCount={90}
            snowCount={160}
            flakeRatio={0.2}
            maxDriftVW={12}
            groundHeight="24vh"
          />
        </div>
      )}

      {theme === "tet" && (
        <div className="absolute inset-0 z-10">
          <TetSpringBackground
            className="h-full w-full"
            envelopeCount={5}
            flowerCount={10}
            rightTree="peach"
          />
        </div>
      )}

      {theme === "summer" && (
        <div className="absolute inset-0 z-10">
          <SummerBeachBackground />
        </div>
      )}

      <div className="relative z-20 mx-auto max-w-[1200px] p-4 sm:p-6">
        <div className="rounded-3xl bg-white/10 backdrop-blur shadow-sm ring-1 ring-slate-200 overflow-hidden">
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
                  : view === "users"
                  ? "Người dùng"
                  : ""}
              </span>
            </div>

            {/* <ThemeToggle value={theme} onChange={setTheme} /> */}

            <div
              className={`flex items-center flex-1 mx-2 md:mx-4 ${
                view === "home"
                  ? "max-w-full md:max-w-xl"
                  : "max-w-0 md:max-w-0"
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

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 ring-1 ring-slate-200 hover:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <img
                  src={avatar}
                  alt="avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
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
                  {(user.username === "dinhhuutai" ||
                    user.username === "thaonguyen") && (
                    <button
                      onClick={() => {
                        setView("create");
                        setMenuOpen(false);
                      }}
                      className="w-full text-left rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FiUsers /> Tạo tài khoản
                    </button>
                  )}
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
                    disabled={loadingLogout}
                    aria-busy={loadingLogout}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm transition
                      ${
                        loadingLogout
                          ? "bg-slate-50 text-slate-500 cursor-wait opacity-70"
                          : "text-red-600 hover:bg-red-50"
                      }`}
                  >
                    {loadingLogout ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v2A6 6 0 006 12H4z"
                          />
                        </svg>
                        Đang đăng xuất...
                      </>
                    ) : (
                      <>
                        <FiLogOut />
                        Đăng xuất
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-[72px_1fr]">
            <aside className="border-r border-slate-200 bg-white/60">
              <nav className="p-2 flex flex-col items-center gap-2">
                <NavIcon
                  active={view === "home"}
                  title="Home"
                  onClick={() => setView("home")}
                >
                  <FiHome />
                </NavIcon>

                {(user.username === "dinhhuutai" ||
                  user.username === "thaonguyen") && (
                  <NavIcon
                    active={view === "users"}
                    title="Người dùng"
                    onClick={() => setView("users")}
                  >
                    <FiUsers />
                  </NavIcon>
                )}

                {(user.username === "dinhhuutai" ||
                  user.username === "thaonguyen") && (
                  <NavIcon
                    active={view === "modules"}
                    title="Quản lý Modules"
                    onClick={() => setView("modules")}
                  >
                    <FiGrid />
                  </NavIcon>
                )}

                {(user.username === "dinhhuutai" ||
                  user.username === "thaonguyen") && (
                  <NavIcon
                    active={view === "access"}
                    title="Phân quyền"
                    onClick={() => setView("access")}
                  >
                    <FiIcons.FiShield />
                  </NavIcon>
                )}
              </nav>
            </aside>

            <main className="p-4 sm:p-6">
              {view === "home" &&
                (loadingModules ? (
                  <div className="grid place-items-center h-48 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-slate-500">
                    Đang tải danh sách module…
                  </div>
                ) : visibleModules.length === 0 ? (
                  <div className="grid place-items-center h-48 rounded-2xl border border-dashed border-slate-200 bg-white/60 text-slate-500">
                    Không tìm thấy module nào. Thử từ khoá khác hoặc liên hệ
                    quản trị để được cấp quyền.
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
                ))}

              {view === "modules" && <Module />}

              {view === "access" && <UserModuleAccess />}

              {view === "users" && <UsersAdminPanel />}

              {view === "create" && (
                <CreateAccountCard onCreated={() => setView("users")} />
              )}

              {view === "settings" && <ProfileSettingsCard />}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeMain;



// import React from "react";

// export default function SleepingPage() {
//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
//       <div className="max-w-md w-full text-center bg-slate-900/70 border border-slate-700 rounded-3xl p-8 shadow-xl shadow-slate-900/50 backdrop-blur">
//         <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
//           <span className="text-4xl">🌙</span>
//         </div>

//         <h1 className="text-2xl md:text-3xl font-semibold mb-3">
//           Website đang ngủ đông
//         </h1>

//         <p className="text-sm md:text-base text-slate-300 mb-2">
//           Hệ thống đang tạm dừng để bảo trì & nâng cấp. Bạn quay lại sau nhé.
//         </p>

//         <p className="text-xs md:text-sm text-slate-400 mb-4">
//           Trong thời gian chờ, bạn có thể truy cập website tạm thời tại đường dẫn bên dưới:
//         </p>

//         {/* Nút truy cập website tạm – style “card” đẹp hơn */}
//         <a
//           href="http://10.84.40.34:3000/"
//           target="_blank"
//           rel="noopener noreferrer"
//           className="group inline-flex w-full justify-center items-center gap-3 rounded-2xl bg-emerald-500/90 hover:bg-emerald-400 px-5 py-3 text-left shadow-lg shadow-emerald-500/40 transition-transform hover:-translate-y-0.5"
//         >
//           <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600/90 group-hover:bg-emerald-500">
//             <span className="text-xl">🚀</span>
//           </div>

//           <div className="flex-1 justify-center">
//             <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-950/70">
//               Truy cập website tạm
//             </div>
//             <div className="text-sm md:text-base font-semibold text-emerald-950 whitespace-nowrap md:whitespace-normal break-all underline">
//               http://10.84.40.34:3000/
//             </div>
//           </div>
//         </a>

//         {/* Nút liên hệ hỗ trợ */}
//         <a
//           href="mailto:support@yourcompany.com"
//           className="inline-flex items-center justify-center mt-4 px-5 py-2.5 rounded-full border border-slate-600 hover:border-slate-400 text-xs md:text-sm font-medium bg-slate-800 hover:bg-slate-700 transition"
//         >
//           Liên hệ hỗ trợ
//         </a>

//         <p className="mt-4 text-[11px] text-slate-500">
//           ⏰ Dự kiến hoạt động lại:{" "}
//           <span className="font-medium text-slate-300">…</span>
//         </p>

//         <div className="mt-6 text-[11px] text-slate-500">
//           Cảm ơn bạn đã kiên nhẫn 💙
//         </div>
//       </div>
//     </div>
//   );
// }
