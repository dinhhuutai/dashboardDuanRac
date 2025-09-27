import { NavLink, useNavigate } from 'react-router-dom';
import {
  BsSpeedometer2,       // Dashboard
  BsCalendarWeek,       // Tạo thực đơn
  BsListCheck,          // Quản lý món
  BsPeople,             // Quản lý bộ phận
  BsPersonCheck,        // Gán user
  BsBell,               // Chưa đặt
  BsClockHistory,       // Lịch sử
  BsTable,              // Bảng bộ phận (editable)
  BsChevronDown,
} from 'react-icons/bs';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import MODULEID from '~/contants/modules';
import config from '~/config';

function SidebarMealAdmin() {
  const navigate = useNavigate();
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  // ========= Mở/đóng nhóm (chỉ 1 nhóm mở) =========
  const [openKey, setOpenKey] = useState('overview');
  const toggle = (key) => setOpenKey(prev => prev === key ? '' : key);
  const isOpen = (key) => openKey === key;

  // ========= Helpers =========
  const linkClass = ({ isActive }) =>
    [
      'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
      isActive
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50',
    ].join(' ');

  const Section = ({ title, icon: Icon, k, children }) => (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => toggle(k)}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-700 hover:bg-slate-50 transition"
        aria-expanded={isOpen(k)}
      >
        <span className="grid place-items-center w-[34px] h-[34px] rounded-lg bg-slate-100 text-slate-700">
          <Icon size={18} />
        </span>
        <span className={`flex-1 text-[13px] ${isOpen(k) ? 'font-semibold' : ''}`}>{title}</span>
        <span className={`text-[12px] text-slate-500 transition-transform ${isOpen(k) ? 'rotate-180' : 'rotate-0'}`}>
          <BsChevronDown />
        </span>
      </button>

      <div
        className={`overflow-hidden pl-[14px] pr-[10px] border-l border-slate-200/60 ml-[18px] transition-[max-height] duration-300 ${
          isOpen(k) ? 'max-h-96' : 'max-h-0'
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
  <div className="uppercase text-emerald-700/80 text-[11px] font-bold tracking-wider px-2 mb-2">
    Sản xuất
  </div>

  {/* 1) Tổng quan */}
  <Section title="Tổng quan" icon={BsSpeedometer2} k="overview">
    <li>
      <NavLink to={config.routes.adminShiftDashboard} className={linkClass}>
        Dashboard
      </NavLink>
    </li>
  </Section>

  {/* 2) Đánh giá theo Ca (gộp 4 trang KPI) */}
  <Section title="Đánh giá theo Ca" icon={BsListCheck} k="shift-kpis">
    <li>
      <NavLink to={config.routes.adminShiftOutput} className={linkClass}>
        Sản lượng &amp; Năng suất
      </NavLink>
    </li>
    <li>
      <NavLink to={config.routes.adminShiftCost} className={linkClass}>
        Chi phí
      </NavLink>
    </li>
    <li>
      <NavLink to={config.routes.adminShiftQuality} className={linkClass}>
        Chất lượng
      </NavLink>
    </li>
    <li>
      <NavLink to={config.routes.adminShiftHR} className={linkClass}>
        Nhân sự
      </NavLink>
    </li>
  </Section>

  {/* 3) Báo cáo tổng hợp (tùy chọn) */}
  <Section title="Báo cáo tổng hợp" icon={BsClockHistory} k="reports">
    <li>
      <NavLink to={config.routes.adminShiftCompare} className={linkClass}>
        So sánh Ca 1–2–3
      </NavLink>
    </li>
    <li>
      <NavLink to={config.routes.adminShiftTrends} className={linkClass}>
        Xu hướng ngày/tuần/tháng
      </NavLink>
    </li>
    <li>
      <NavLink to={config.routes.adminShiftExport} className={linkClass}>
        Xuất Excel
      </NavLink>
    </li>
  </Section>

  {/* 4) Dữ liệu nền (tùy chọn/role admin) */}
  <Section title="Dữ liệu nền" icon={BsTable} k="master-data">
    <li><NavLink to={config.routes.masterPlan} className={linkClass}>Kế hoạch sản xuất</NavLink></li>
    <li><NavLink to={config.routes.masterAttendance} className={linkClass}>Chấm công</NavLink></li>
    <li><NavLink to={config.routes.masterProduction} className={linkClass}>Báo cáo sản xuất</NavLink></li>
    <li><NavLink to={config.routes.masterMachinePower} className={linkClass}>Máy &amp; Điện năng</NavLink></li>
    <li><NavLink to={config.routes.masterQC} className={linkClass}>QC &amp; Khiếu nại</NavLink></li>
  </Section>
</div>

    </aside>
  );
}

export default SidebarMealAdmin;
