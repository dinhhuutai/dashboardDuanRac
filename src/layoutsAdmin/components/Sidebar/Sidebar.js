import { NavLink, useNavigate } from 'react-router-dom';
import {
  BsRocket,
  BsChevronDown,
  BsFileEarmarkBarGraph,
  BsTrash2,
  BsQrCodeScan,
  BsPerson,
  BsClipboardCheck,
  BsCart2,
  BsGear,
} from 'react-icons/bs';
import { useEffect, useState, useMemo } from 'react';
import config from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { useFeatureAllowed } from '~/hooks/useFeatureGuard';

import MODULEID from '~/contants/modules';

function Sidebar() {
  const navigate = useNavigate();

  const VIEW_PAGE_ANALYTIC = useFeatureAllowed(MODULEID.CANRAC, 'cr_xemtrangtongquan');
  const VIEW_PAGE_HiSTORY = useFeatureAllowed(MODULEID.CANRAC, 'cr_xemtranglichsucan');
  const VIEW_PAGE_REPORT = useFeatureAllowed(MODULEID.CANRAC, 'cr_xembaocao');
  const VIEW_PAGE_ISSUE = useFeatureAllowed(MODULEID.CANRAC, 'cr_kexuatvattu');
  const VIEW_PAGE_CHECKCLASS = useFeatureAllowed(MODULEID.CANRAC, 'cr_xemlichsukiemtraphanloai');
  
  const ACTION_MANAGE = useFeatureAllowed(MODULEID.CANRAC, 'cr_cacchucnangomanage');
  const ACTION_SECTION_TRASHTRUCK = useFeatureAllowed(MODULEID.CANRAC, 'cr_quanlymucxedungrac');
  const ACTION_SECTION_QRCODE = useFeatureAllowed(MODULEID.CANRAC, 'cr_quanlymucQrCode');
  const ACTION_SECTION_USER = useFeatureAllowed(MODULEID.CANRAC, 'cr_quanlymucuser');
  const ACTION_SECTION_UTIL = useFeatureAllowed(MODULEID.CANRAC, 'cr_quanlymuctienich');
  
  const ACTION_PAGE_QRCODE_EXPORT_EXCEL = useFeatureAllowed(MODULEID.CANRAC, 'cr_quanlyxuatexcelQRcode');
  const ACTION_PAGE_NOTIFY_TRASH = useFeatureAllowed(MODULEID.CANRAC, 'cr_quanlytrangthongbaoracthai');
  
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  // mở/đóng từng nhóm
  const [downDashboard, setDownDashboard] = useState(true);
  const [downReport, setDownReport] = useState(false);
  const [downClassCheck, setDownClassCheck] = useState(false);
  const [downQrcode, setDownQrcode] = useState(false);
  const [downUser, setDownUser] = useState(false);
  const [downWaste, setDownWaste] = useState(false);
  const [downTrashTruck, setDownTrashTruck] = useState(false);
  const [downUtils, setDownUtils] = useState(false);

  const hiddenItem = (key) => {
    key !== 'dashboard' && setDownDashboard(false);
    key !== 'report' && setDownReport(false);
    key !== 'classCheck' && setDownClassCheck(false);
    key !== 'qrcode' && setDownQrcode(false);
    key !== 'user' && setDownUser(false);
    key !== 'waste' && setDownWaste(false);
    key !== 'trashTrush' && setDownTrashTruck(false);
    key !== 'utils' && setDownUtils(false);
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
        <span className={`flex-1 text-[13px] ${open ? 'font-semibold' : ''}`}>{title}</span>
        <span
          className={`text-[12px] text-slate-500 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
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
        {/* ===== Menu ===== */}
        <div className="px-1 pt-2 pb-3">
          <div className="uppercase text-emerald-700/80 text-[11px] font-bold tracking-wider px-2 mb-2">
            Menu
          </div>

          {/* Tổng hợp */}
          <Section
            title="Tổng hợp"
            icon={BsRocket}
            open={downDashboard}
            onToggle={() => {
              hiddenItem('dashboard');
              setDownDashboard((v) => !v);
            }}
          >
            {
              VIEW_PAGE_ANALYTIC &&
              <li>
                <NavLink to={config.routes.adminAnalytics} className={linkClass}>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r bg-emerald-500 opacity-0 group-[.active]:opacity-100"></span>
                  Tổng quan
                </NavLink>
              </li>
            }
            {
              VIEW_PAGE_HiSTORY &&
              <li>
                <NavLink to={config.routes.adminHistoryWeigh} className={linkClass}>
                  Lịch sử cân
                </NavLink>
              </li>
            }
          </Section>

          {/* Báo cáo */}
          {
            (VIEW_PAGE_REPORT || VIEW_PAGE_ISSUE) &&
            <Section
              title="Báo cáo"
              icon={BsFileEarmarkBarGraph}
              open={downReport}
              onToggle={() => {
                hiddenItem('report');
                setDownReport((v) => !v);
              }}
            >
              {
                VIEW_PAGE_REPORT &&
                <>
                  {/* <li>
                    <NavLink to={config.routes.adminReport} className={linkClass}>
                      Chi tiết
                    </NavLink>
                  </li> */}
                  <li>
                    <NavLink to={config.routes.adminReportByShift} className={linkClass}>
                      Theo ca làm
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to={config.routes.adminReportByTrash} className={linkClass}>
                      Theo loại rác
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to={config.routes.adminReportTrashAndMaterial} className={linkClass}>
                      Rác thải và vật tư
                    </NavLink>
                  </li>
                  {/* <li>
                    <NavLink to={config.routes.adminReportByTrashBF17} className={linkClass}>
                      Theo loại rác trước 17/09
                    </NavLink>
                  </li> */}
                </>
              }
              {/* {
                VIEW_PAGE_ISSUE &&
                <li>
                  <NavLink to={config.routes.adminReportMaterials} className={linkClass}>
                    Vật tư
                  </NavLink>
                </li>
              } */}
            </Section>
          }

          {/* Kiểm tra phân loại */}
          <Section
            title="Kiểm tra phân loại"
            icon={BsClipboardCheck}
            open={downClassCheck}
            onToggle={() => {
              hiddenItem('classCheck');
              setDownClassCheck((v) => !v);
            }}
          >
            {
              VIEW_PAGE_CHECKCLASS &&
              <li>
                <NavLink to={config.routes.adminClassCheckHistory} className={linkClass}>
                  Lịch sử
                </NavLink>
              </li>
            }
            <li>
              <NavLink to={config.routes.adminClassCheckListBin} className={linkClass}>
                DS thùng rác
              </NavLink>
            </li>
          </Section>
        </div>

        {/* ===== Manage ===== */}
        {
          ACTION_MANAGE &&
          <div className="px-1 pt-3">
            <div className="uppercase text-emerald-700/80 text-[11px] font-bold tracking-wider px-2 mb-2">
              Manage
            </div>

            {/* Xe đựng rác */}
            {
              ACTION_SECTION_TRASHTRUCK &&
              <Section
                title="Xe đựng rác"
                icon={BsCart2}
                open={downTrashTruck}
                onToggle={() => {
                  hiddenItem('trashTrush');
                  setDownTrashTruck((v) => !v);
                }}
              >
                <li>
                  <NavLink to={config.routes.adminTrashTruck} className={linkClass}>
                    Danh sách xe
                  </NavLink>
                </li>
                <li>
                  <NavLink to={config.routes.adminTrashTruckCreate} className={linkClass}>
                    Thêm xe
                  </NavLink>
                </li>
              </Section>
            }

            {/* QR Code (phân quyền) */}
            {
              ACTION_SECTION_QRCODE &&
              <Section
                title="QR Code"
                icon={BsQrCodeScan}
                open={downQrcode}
                onToggle={() => {
                  hiddenItem('qrcode');
                  setDownQrcode((v) => !v);
                }}
              >
                <li>
                  <NavLink to={config.routes.adminQrcode} className={linkClass}>
                    List
                  </NavLink>
                </li>
                <li>
                  <NavLink to={config.routes.adminQrcodeCreate} className={linkClass}>
                    Create
                  </NavLink>
                </li>
              </Section>
            }

            {/* User (phân quyền) */}
            {/* {
              ACTION_SECTION_USER &&
              <Section
                title="User"
                icon={BsPerson}
                open={downUser}
                onToggle={() => {
                  hiddenItem('user');
                  setDownUser((v) => !v);
                }}
              >
                <li>
                  <NavLink to={config.routes.adminUser} className={linkClass}>
                    List
                  </NavLink>
                </li>
                <li>
                  <NavLink to={config.routes.adminUserCreate} className={linkClass}>
                    Create
                  </NavLink>
                </li>
              </Section>
            } */}

            {/* Trash Type (phân quyền)
            {user?.managerTrash && (
              <Section
                title="Trash Type"
                icon={BsTrash2}
                open={downWaste}
                onToggle={() => {
                  hiddenItem('waste');
                  setDownWaste((v) => !v);
                }}
              >
                <li>
                  <NavLink to={config.routes.adminTrashType} className={linkClass}>
                    List
                  </NavLink>
                </li>
                <li>
                  <NavLink to={config.routes.adminTrashTypeCreate} className={linkClass}>
                    Create
                  </NavLink>
                </li>
              </Section>
            )} */}

            
            {/* Utils */}
            {
              ACTION_SECTION_UTIL &&
              <Section
                title="Tiện ích"
                icon={BsGear}
                open={downUtils}
                onToggle={() => {
                  hiddenItem('utils');
                  setDownUtils((v) => !v);
                }}
              >
                <li>
                  <NavLink to={config.routes.adminSortUnitByDepartment} className={linkClass}>
                    Sắp xếp chuyền theo tổ
                  </NavLink>
                </li>
                <li>
                  <NavLink to={config.routes.adminSettingTable} className={linkClass}>
                    Phân chia tổ
                  </NavLink>
                </li>
              </Section>
            }
          </div>
        }

        {/* ===== CTA vui vui (giữ nguyên điều kiện) ===== */}
        {/* {
          ACTION_PAGE_NOTIFY_TRASH &&
          <div className="pt-3 pb-2 px-1 flex justify-center">
            <button
              onClick={() => navigate(config.routes.adminNgienCheChou)}
              className="text-sm px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                         text-white shadow-lg hover:shadow-xl transition-transform hover:scale-[1.02]"
            >
              Ngiên Chẻ Chou (màu galaxy)
            </button>
          </div>
        }

        {
          ACTION_PAGE_QRCODE_EXPORT_EXCEL &&
          <div className="pt-3 pb-2 px-1 flex justify-center">
            <button
              onClick={() => navigate(config.routes.adminExportQR)}
              className="text-sm px-5 py-2 rounded-xl shadow-lg hover:shadow-xl transition-transform hover:scale-[1.02]"
            >
              QrCode xuất excel
            </button>
          </div>
        } */}
      </div>
    </aside>
  );
}

export default Sidebar;
