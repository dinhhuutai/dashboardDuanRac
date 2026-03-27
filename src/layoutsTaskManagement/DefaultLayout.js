import React, { useEffect, useState } from "react";
 


import HeaderBar from './components/HeaderBar';
import Sidebar from './components/Sidebar';
import { useLocation, useNavigate } from "react-router-dom";
import config from "~/config";
import { useDispatch, useSelector } from "react-redux";
import { fetchTaskManagerRole } from "~/redux/slices/authSlice";
import { userRoleTaskManager, userSelector } from "~/redux/selectors";
import { FaThLarge } from "react-icons/fa";
import avatarFallback from "~/assets/imgs/avatar-main.jpg";

export default function TaskManagementLayout({
  children,
  onCreateQuick,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const roleTaskManager = useSelector(userRoleTaskManager);
  const auth = useSelector(userSelector);
  const currentUser = auth?.login?.currentUser || null;
  const roleCode = roleTaskManager?.code || "";
  const fullName = currentUser?.fullName || "Người dùng";
  const avatar = currentUser?.avatar || avatarFallback;

  useEffect(() => {
    if (!roleTaskManager) dispatch(fetchTaskManagerRole());
  }, [dispatch, roleTaskManager]);

  const isDashboard = location.pathname === config.routes.taskManagementDashboard;
  const isHome = location.pathname === config.routes.taskManagementHome;
  const isProject = location.pathname.startsWith(config.routes.taskManagementProjectList) || location.pathname.startsWith(`${config.routes.taskManagementProjectOverview}/`);
  const isRequest = location.pathname === config.routes.taskManagementRequests;
  const isWork = !isDashboard && !isProject && !isRequest && !isHome;
  const showDesktopSidebar = !isProject;

  const canViewTeamTasks = ["bangiamdoc", "giamdocnhamay", "truongphong", "phophong", "totruong"].includes(roleCode) && roleTaskManager?.cv_team !== null;
  const canViewDepartmentTasks = ["bangiamdoc", "giamdocnhamay", "truongphong", "phophong"].includes(roleCode) && roleTaskManager?.cv_department !== null;
  const canViewCompanyTasks = ["bangiamdoc", "giamdocnhamay"].includes(roleCode);

  const phase = isProject ? "projects" : "work";

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      {/* Top Header */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6">
          <HeaderBar
            phase={phase}
            onPhaseChange={(nextPhase) => {
              navigate(nextPhase === "work" ? config.routes.taskManagementMyTasks : config.routes.taskManagementProjectList);
            }}
            onCreateQuick={onCreateQuick}
          />
        </div>
      </div>

      {/* Mobile hero/toggles */}
      <div className="md:hidden pt-0">
        <div className="relative bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 rounded-b-[38px] px-4 pt-3 pb-[112px]">
          <div className="relative flex items-center justify-between mt-[6px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
                <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white/90">Xin chào,</div>
                <div className="text-[18px] font-semibold text-white truncate">{fullName}</div>
              </div>
            </div>

            <button
              onClick={() => navigate(config.routes.homeMain)}
              className="h-10 w-10 rounded-full grid place-items-center text-white bg-white/25 border border-white/40 active:scale-95 transition"
              aria-label="Chọn ứng dụng"
              title="Chọn ứng dụng"
            >
              <FaThLarge />
            </button>
          </div>
        </div>

        <div className="absolute left-4 right-4 top-[72px]">
          <div className="rounded-3xl px-4 py-4 bg-slate-50/95 border border-sky-100">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-[20px] font-extrabold text-sky-900">📌 Quản lý công việc</div>
                </div>

                <div className="mt-1 text-[12px] font-semibold text-sky-700">
                  Vai trò: {roleTaskManager?.name || "Nhân viên"}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(config.routes.taskManagementMyTasks)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold active:scale-95 transition ${isWork ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-sky-200 text-sky-700"}`}
                  >
                    Công việc
                  </button>
                  <button
                    onClick={() => navigate(config.routes.taskManagementProjectList)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold active:scale-95 transition ${isProject ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-sky-200 text-sky-700"}`}
                  >
                    Dự án
                  </button>
                  <button
                    onClick={() => navigate(config.routes.taskManagementRequests)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-semibold active:scale-95 transition ${isRequest ? "bg-sky-600 border-sky-600 text-white" : "bg-white border-sky-200 text-sky-700"}`}
                  >
                    Đề nghị
                  </button>
                </div>

                {!isProject && !isHome && !isDashboard && !isRequest && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <ScopeBtn active={location.pathname === config.routes.taskManagementMyTasks} onClick={() => navigate(config.routes.taskManagementMyTasks)} label="Của tôi" />
                    {canViewTeamTasks && (
                      <ScopeBtn active={location.pathname === config.routes.taskManagementTeamTasks} onClick={() => navigate(config.routes.taskManagementTeamTasks)} label="Theo team" />
                    )}
                    {canViewDepartmentTasks && (
                      <ScopeBtn active={location.pathname === config.routes.taskManagementDepartmentTasks} onClick={() => navigate(config.routes.taskManagementDepartmentTasks)} label="Theo phòng" />
                    )}
                    {canViewCompanyTasks && (
                      <ScopeBtn active={location.pathname === config.routes.taskManagementCompanyTasks} onClick={() => navigate(config.routes.taskManagementCompanyTasks)} label="Công ty" />
                    )}
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Frame */}
      <div className="mx-auto max-w-screen-2xl pt-2 md:pt-[76px] md:flex md:gap-6">
        {/* Desktop Sidebar */}
        {
          showDesktopSidebar &&
          <aside className="hidden md:block md:w-[270px] shrink-0">
            <Sidebar phase={phase} />
          </aside>
        }

        {/* Content */}
        <main
          className="w-full px-4"
          style={{
            paddingBottom: "max(14px, env(safe-area-inset-bottom))",
          }}
        >
          {/* Page Content Slot */}
          <div className="py-2 md:py-4 mt-[70px] md:mt-0">{children}</div>
        </main>
      </div>

    </div>
  );
}

function ScopeBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] ${active ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600"}`}
    >
      {label}
    </button>
  );
}


