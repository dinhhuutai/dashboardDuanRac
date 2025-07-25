import { NavLink } from 'react-router-dom';
import {
  BsRocket,
  BsChevronDown,
  BsWindowFullscreen,
  BsBoxes,
  BsQrCodeScan,
  BsMusicNoteList,
  BsTrash2,
  BsJournalAlbum,
  BsPerson,
  BsColumnsGap,
  BsPersonPlus,
  BsBarChartLine,
  BsClipboardCheck,
} from 'react-icons/bs';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { useState } from 'react';
import config from '~/config';

function Sidebar() {
  const [downDashboard, setDownDashboard] = useState(true);
  const [downClassCheck, setDownClassCheck] = useState(false);
  const [downPage, setDownPage] = useState(false);
  const [downApplication, setDownApplication] = useState(false);

  const [downQrcode, setDownQrcode] = useState(false);
  const [downUser, setDownUser] = useState(false);
  const [downWaste, setDownWaste] = useState(false);
  const [downTeamMember, setDownTeamMember] = useState(false);

  const hiddenItem = (key) => {
    key !== 'dashboard' && setDownDashboard(false);
    key !== 'classCheck' && setDownClassCheck(false);
    key !== 'page' && setDownPage(false);
    key !== 'application' && setDownApplication(false);
    key !== 'qrcode' && setDownQrcode(false);
    key !== 'user' && setDownUser(false);
    key !== 'waste' && setDownWaste(false);
    key !== 'teamMember' && setDownTeamMember(false);
  };

  return (
    <div className="hover:scrollbar-admin-sidebar w-full h-full shadow-lg shadow-indigo-500/50 overflow-y-auto scrollbar-admin-sidebar-none group/parent">
      <ul className="px-[24px] pt-[12px] pb-[22px] mr-[4px] group-hover/parent:mr-[0px]">
        <li>
          <span className="uppercase text-[#3F69D6] text-[12px] font-[700]">Pha Màu</span>
          <ul className="mt-[12px]">
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminInkWeighProductionOrder}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Lệnh sản xuất
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminInkWeighInkTransferCart}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Xe cấp mực
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminInkWeighHistory}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Lịch sử lấy mực
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminInkWeighLogfile}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Log file
                  </NavLink>
                </li>
           </ul> 
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
