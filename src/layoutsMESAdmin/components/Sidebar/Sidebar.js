import { NavLink } from 'react-router-dom';
import {
  BsChevronDown,
  BsSpeedometer2,
  BsDiagram3,
} from 'react-icons/bs';
import { useEffect, useState } from 'react';
import config from '~/config';
import { userSelector } from '~/redux/selectors';
import { useSelector } from 'react-redux';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';
import MODULEID from '~/contants/modules';

function Sidebar() {

  const VIEW_PAGE_PRODUCTION_ORDER = useFeatureAllowed(MODULEID.CANMUC, 'cm_xemtranglenhsanxuat');
  const VIEW_PAGE_INK_CART = useFeatureAllowed(MODULEID.CANMUC, 'cm_xemtrangxecapmuc');
  const VIEW_PAGE_HISTORY_WEIGHT = useFeatureAllowed(MODULEID.CANMUC, 'cm_xemtranglichsucanmuc');
  const VIEW_PAGE_LOG_FILE = useFeatureAllowed(MODULEID.CANMUC, 'cm_xemtranglogfile');
  const VIEW_PAGE_COMPARE_WEIGHT = useFeatureAllowed(MODULEID.CANMUC, 'cm_xemtrangsosanhdinhmuc');
  const VIEW_PAGE_REPORT_CART_INK = useFeatureAllowed(MODULEID.CANMUC, 'cm_xemtrangbaocaoxecanmuc');
  

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  const [openOperate, setOpenOperate] = useState(true);     // Vận hành
  const [openMonitor, setOpenMonitor] = useState(false);    // Theo dõi
  const [openReport, setOpenReport] = useState(false);      // Báo cáo/Đối chiếu

  const onlyOpen = (key) => {
    setOpenOperate(key === 'operate');
    setOpenMonitor(key === 'monitor');
    setOpenReport(key === 'report');
  };

  const baseItem =
    'flex items-center gap-3 w-full rounded-md px-3 py-2 text-[13px] transition-colors';
  const activeItem =
    'text-[#3F6AD8] bg-[#EAF3FF] font-medium ring-1 ring-[#3F6AD8]/20 border-l-4 border-[#3F6AD8]';
  const inactiveItem =
    'text-slate-600 hover:text-[#3F6AD8] hover:bg-[#EAF3FF]';

  const linkClass = (nav) =>
    `${baseItem} ${nav.isActive ? activeItem : inactiveItem}`;

  const SectionHeader = ({ title, isOpen, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className="w-full flex items-center justify-between text-[12px] font-semibold uppercase tracking-wide
                 text-slate-700 bg-gradient-to-r from-slate-50 to-white
                 px-3 py-2 rounded-md ring-1 ring-slate-200/60 hover:ring-[#3F6AD8]/30"
    >
      <span>{title}</span>
      <BsChevronDown
        className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );

  const SectionCard = ({ children }) => (
    <div className="mt-2 space-y-1">
      {children}
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-admin-sidebar scrollbar-admin-sidebar-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
      <div className="px-4 pt-3 pb-5">
        {/* Module label */}
        <div className="mb-3">
          <span className="uppercase text-[#3F69D6] text-[11px] font-bold">MES</span>
        </div>

        {/* ===== Nhóm: Vận hành ===== */}
        {
          <div className="rounded-lg p-3 bg-white ring-1 ring-slate-200/60 shadow-sm">
            <SectionHeader
              title="MES"
              isOpen={openOperate}
              onClick={() => (openOperate ? onlyOpen('') : onlyOpen('operate'))}
            />
            {openOperate && (
              <SectionCard>
                {
                  <NavLink to={config.routes.adminMesDashboard} className={linkClass}>
                    <BsSpeedometer2 className="text-[16px]" />
                    <span>Bảng điều khiển</span>
                  </NavLink>
                }
                {
                  <NavLink to={config.routes.adminMesFlow} className={linkClass}>
                    <BsDiagram3 className="text-[16px]" />
                    <span>Dòng chảy</span>
                  </NavLink>
                }

                {/* {
                  VIEW_PAGE_INK_CART &&
                  <NavLink to={config.routes.adminInkWeighInkTransferCart} className={linkClass}>
                    <BsQrCodeScan className="text-[16px]" />
                    <span>Xe cấp mực</span>
                  </NavLink>
                } */}
              </SectionCard>
            )}
          </div>
        }

        {/* {
          (VIEW_PAGE_PRODUCTION_ORDER || VIEW_PAGE_INK_CART) &&
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        }

        {
          (VIEW_PAGE_HISTORY_WEIGHT || VIEW_PAGE_LOG_FILE) &&
          <div className="rounded-lg p-3 bg-white ring-1 ring-slate-200/60 shadow-sm">
            <SectionHeader
              title="Theo dõi"
              isOpen={openMonitor}
              onClick={() => (openMonitor ? onlyOpen('') : onlyOpen('monitor'))}
            />
            {openMonitor && (
              <SectionCard>
                {
                  VIEW_PAGE_HISTORY_WEIGHT &&
                  <NavLink to={config.routes.adminInkWeighHistory} className={linkClass}>
                    <BsJournalAlbum className="text-[16px]" />
                    <span>Lịch sử lấy mực</span>
                  </NavLink>
                }

                {
                  VIEW_PAGE_LOG_FILE &&
                  <NavLink to={config.routes.adminInkWeighLogfile} className={linkClass}>
                    <BsJournalAlbum className="text-[16px]" />
                    <span>Log file</span>
                  </NavLink>
                }
              </SectionCard>
            )}
          </div>
        }

        {
          (VIEW_PAGE_HISTORY_WEIGHT || VIEW_PAGE_LOG_FILE) &&
          <div className="my-3 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        }

        {
          (VIEW_PAGE_COMPARE_WEIGHT || VIEW_PAGE_REPORT_CART_INK) && 
          <div className="rounded-lg p-3 bg-white ring-1 ring-slate-200/60 shadow-sm">
          <SectionHeader
            title="Đối chiếu & Báo cáo"
            isOpen={openReport}
            onClick={() => (openReport ? onlyOpen('') : onlyOpen('report'))}
          />
          {openReport && (
            <SectionCard>
              {
                VIEW_PAGE_COMPARE_WEIGHT &&
                <NavLink to={config.routes.adminInkWeigCompare} className={linkClass}>
                  <BsClipboardCheck className="text-[16px]" />
                  <span>So sánh định mức</span>
                </NavLink>
              }

              {
                VIEW_PAGE_REPORT_CART_INK &&
                <NavLink to={config.routes.adminReportCartInk} className={linkClass}>
                  <BsBarChartLine className="text-[16px]" />
                  <span>Báo cáo xe cân mực</span>
                </NavLink>
              }
            </SectionCard>
          )}
        </div>
        } */}
      </div>
    </div>
  );
}

export default Sidebar;
