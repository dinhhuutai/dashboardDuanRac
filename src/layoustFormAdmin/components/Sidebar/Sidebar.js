import { NavLink } from 'react-router-dom';
import { BsSpeedometer2, BsListCheck, BsChevronDown } from 'react-icons/bs';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
// import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
// import MODULEID from '~/contants/modules';
import config from '~/config';

function SidebarMealAdmin() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  // ====== (tuỳ chọn) Quyền ======
  // const CAN_CREATE = useFeatureAllowed(MODULEID.DATCOM, 'dc_taothucdon');
  // const CAN_LIST   = useFeatureAllowed(MODULEID.DATCOM, 'dc_quanlymonan');
  // const CAN_ANALYT = useFeatureAllowed(MODULEID.DATCOM, 'dc_xembaocao');

  // ====== Chỉ 1 nhóm mở ======
  const [openKey, setOpenKey] = useState('overview');
  const toggle = (key) => setOpenKey(prev => (prev === key ? '' : key));
  const isOpen = (key) => openKey === key;

  // ====== Helpers ======
  const linkClass = ({ isActive }) =>
    [
      'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
      isActive
        ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200'
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
        <div className="uppercase text-violet-700/80 text-[11px] font-bold tracking-wider px-2 mb-2">
          Biểu mẫu
        </div>

        {/* 1) Tổng quan */}
        <Section title="Tổng quan" icon={BsSpeedometer2} k="overview">
          <li>
            <NavLink to={config.routes.adminFormDashboard} className={linkClass}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to={config.routes.adminFormAnalytics} className={linkClass}>
              Analytics
            </NavLink>
          </li>
        </Section>

        {/* 2) Quản lý */}
        <Section title="Quản lý" icon={BsListCheck} k="manage">
          <li>
            <NavLink to={config.routes.adminFormCreate} className={linkClass}>
              Tạo biểu mẫu
            </NavLink>
          </li>
          <li>
            <NavLink to={config.routes.adminFormList} className={linkClass}>
              Danh sách biểu mẫu
            </NavLink>
          </li>
        </Section>
      </div>
    </aside>
  );
}

export default SidebarMealAdmin;
