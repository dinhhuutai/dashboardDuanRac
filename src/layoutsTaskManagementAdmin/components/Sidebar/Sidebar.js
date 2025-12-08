// src/pageTaskManagement/Admin/Sidebar.jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BsRocket,
  BsChevronDown,
  BsFileEarmarkBarGraph,
  BsPerson,
  BsPeople,
  BsKanban,
  BsShieldCheck,
  BsGear,
} from 'react-icons/bs';
import { useEffect, useState } from 'react';
import config from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
// import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
// import MODULEID from '~/contants/modules';

function Sidebar() {
  const navigate = useNavigate();

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  // mở/đóng từng nhóm
  const [downDashboard, setDownDashboard] = useState(true);
  const [downOrg, setDownOrg] = useState(false);
  const [downRoles, setDownRoles] = useState(false);
  const [downStatuses, setDownStatuses] = useState(false);
  const [downReport, setDownReport] = useState(false);

  const hiddenItem = (key) => {
    key !== 'dashboard' && setDownDashboard(false);
    key !== 'org' && setDownOrg(false);
    key !== 'roles' && setDownRoles(false);
    key !== 'statuses' && setDownStatuses(false);
    key !== 'report' && setDownReport(false);
  };

  const linkClass = ({ isActive }) =>
    [
      'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
      isActive
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50',
    ].join(' ');

  const Section = ({ title, icon: Icon, open, onToggle, children }) => (
    <div className="mb-1">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 transition"
        aria-expanded={open}
      >
        <span className="grid place-items-center w-[34px] h-[34px] rounded-lg bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
        <span className={`flex-1 text-[13px] ${open ? 'font-semibold' : ''}`}>
          {title}
        </span>
        <span
          className={`text-[12px] text-slate-500 transition-transform ${
            open ? 'rotate-180' : 'rotate-0'
          }`}
        >
          <BsChevronDown />
        </span>
      </button>

      <div
        className={`overflow-hidden pl-[14px] pr-[10px] border-l border-slate-200/60 ml-[18px] transition-[max-height] duration-300 ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <ul className="py-1.5 space-y-1">{children}</ul>
      </div>
    </div>
  );

  return (
    <aside
      className="
        h-full w-full overflow-y-auto
        bg-gradient-to-b from-white/90 to-white/70 backdrop-blur
        border-r border-slate-200
        shadow-[0_10px_30px_-15px_rgba(2,6,23,0.08)]
      "
    >
      <div className="px-3 py-3">
        {/* ===== Menu chính ===== */}
        <div className="px-1 pt-2 pb-3">
          <div className="uppercase text-emerald-700/80 text-[11px] font-bold tracking-wider px-2 mb-2">
            Menu
          </div>

          {/* Tổng quan */}
          <Section
            title="Tổng quan"
            icon={BsRocket}
            open={downDashboard}
            onToggle={() => {
              hiddenItem('dashboard');
              setDownDashboard((v) => !v);
            }}
          >
            <li>
              <NavLink
                to={config.routes.adminTaskManagementDashboard}
                className={linkClass}
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-emerald-500 opacity-0 group-[.active]:opacity-100" />
                Tổng quan công việc
              </NavLink>
            </li>
          </Section>

          {/* Báo cáo */}
          <Section
            title="Báo cáo"
            icon={BsFileEarmarkBarGraph}
            open={downReport}
            onToggle={() => {
              hiddenItem('report');
              setDownReport((v) => !v);
            }}
          >
            <li>
              <NavLink to={config.routes.adminTaskManagementReportByEmployee} className={linkClass}>
                Theo nhân viên
              </NavLink>
            </li>
            <li>
              <NavLink to={config.routes.adminTaskManagementReportByProject} className={linkClass}>
                Theo dự án
              </NavLink>
            </li>
            <li>
              <NavLink to={config.routes.adminTaskManagementReportByStatus} className={linkClass}>
                Theo trạng thái
              </NavLink>
            </li>
          </Section>
        </div>

        {/* ===== Cấu hình hệ thống ===== */}
        <div className="px-1 pt-3">
          <div className="uppercase text-emerald-700/80 text-[11px] font-bold tracking-wider px-2 mb-2">
            Cấu hình quản lý công việc
          </div>

          {/* Phòng ban / Đội nhóm */}
          <Section
            title="Phòng ban & Tổ nhóm"
            icon={BsPeople}
            open={downOrg}
            onToggle={() => {
              hiddenItem('org');
              setDownOrg((v) => !v);
            }}
          >
            <li>
              <NavLink to={config.routes.adminTaskManagementDepartments} className={linkClass}>
                Phòng ban
              </NavLink>
            </li>
            <li>
              <NavLink to={config.routes.adminTaskManagementTeams} className={linkClass}>
                Tổ / Nhóm
              </NavLink>
            </li>
          </Section>

          {/* Vai trò & phân quyền */}
          <Section
            title="Vai trò & phân quyền"
            icon={BsShieldCheck}
            open={downRoles}
            onToggle={() => {
              hiddenItem('roles');
              setDownRoles((v) => !v);
            }}
          >
            <li>
              <NavLink to={config.routes.adminTaskManagementRoles} className={linkClass}>
                Danh sách vai trò
              </NavLink>
            </li>
            <li>
              <NavLink to={config.routes.adminTaskManagementUserRoles} className={linkClass}>
                Gán vai trò cho người dùng
              </NavLink>
            </li>
          </Section>

          {/* Trạng thái & workflow */}
          <Section
            title="Trạng thái & Workflow"
            icon={BsKanban}
            open={downStatuses}
            onToggle={() => {
              hiddenItem('statuses');
              setDownStatuses((v) => !v);
            }}
          >
            <li>
              <NavLink to={config.routes.adminTaskManagementStatuses} className={linkClass}>
                Trạng thái công việc
              </NavLink>
            </li>
          </Section>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
