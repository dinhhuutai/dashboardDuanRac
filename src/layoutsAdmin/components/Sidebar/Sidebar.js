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
  BsChatDots,
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
  const [downFeedback, setDownFeedback] = useState(false);

  const hiddenItem = (key) => {
    key !== 'dashboard' && setDownDashboard(false);
    key !== 'classCheck' && setDownClassCheck(false);
    key !== 'page' && setDownPage(false);
    key !== 'application' && setDownApplication(false);
    key !== 'qrcode' && setDownQrcode(false);
    key !== 'user' && setDownUser(false);
    key !== 'waste' && setDownWaste(false);
    key !== 'teamMember' && setDownTeamMember(false);
    key !== 'feedback' && setDownFeedback(false);
  };

  return (
    <div className="hover:scrollbar-admin-sidebar w-full h-full shadow-lg shadow-indigo-500/50 overflow-y-auto scrollbar-admin-sidebar-none group/parent">
      <ul className="px-[24px] pt-[12px] pb-[22px] mr-[4px] group-hover/parent:mr-[0px]">
        <li>
          <span className="uppercase text-[#3F69D6] text-[12px] font-[700]">menu</span>
          <ul className="mt-[12px]">
            <div>
              <li
                onClick={() => {
                  hiddenItem('dashboard');
                  setDownDashboard((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsRocket />
                </div>
                <span
                  className={`${
                    downDashboard ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  Tổng Hợp
                </span>
                <div
                  className={`${
                    downDashboard ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downDashboard ? 'animate-downSlide2' : 'animate-upSlide2'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminAnalytics}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Tổng quan
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminReport}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Báo cáo
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminHistoryWeigh}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Lịch sử cân
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminUnscannedQR}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Theo dõi cân
                  </NavLink>
                </li>
              </ul>
            </div>

            <div>
              <li
                onClick={() => {
                  hiddenItem('classCheck');
                  setDownClassCheck((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsClipboardCheck />
                </div>
                <span
                  className={`${
                    downClassCheck ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  Kiểm Tra Phân Loại
                </span>
                <div
                  className={`${
                    downClassCheck ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downClassCheck ? 'animate-downSlide' : 'animate-upSlide'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminClassCheckHistory}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Lịch Sử
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminClassCheckListBin}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    DS Thùng Rác
                  </NavLink>
                </li>
              </ul>
            </div>

            <div className="mt-[6px]">
              <li
                onClick={() => {
                  hiddenItem('page');
                  setDownPage((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsWindowFullscreen />
                </div>
                <span
                  className={`${
                    downPage ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  pages
                </span>
                <div
                  className={`${
                    downPage ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downPage ? 'animate-downSlide1' : 'animate-upSlide1'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminPageHome}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Page Home
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminPageScan}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Page Scan
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminPageUser}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Page User
                  </NavLink>
                </li>
              </ul>
            </div>
            <div className="mt-[6px]">
              <li
                onClick={() => {
                  hiddenItem('application');
                  setDownApplication((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsBoxes />
                </div>
                <span
                  className={`${
                    downApplication ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  applications
                </span>
                <div
                  className={`${
                    downApplication ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downApplication ? 'animate-downSlide1' : 'animate-upSlide1'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminMailBox}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Mailbox
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminChat}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Chat
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminSection}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    FAQ Section
                  </NavLink>
                </li>
              </ul>
            </div>
          </ul>
        </li>

        <li className="mt-[12px]">
          <span className="uppercase text-[#3F69D6] text-[12px] font-[700]">Manage</span>
          <ul className="mt-[12px]">
            <div>
              <li
                onClick={() => {
                  hiddenItem('qrcode');
                  setDownQrcode((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsQrCodeScan />
                </div>
                <span
                  className={`${
                    downQrcode ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  QR Code
                </span>
                <div
                  className={`${
                    downQrcode ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downQrcode ? 'animate-downSlide' : 'animate-upSlide'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminQrcode}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    List
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminQrcodeCreate}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Create
                  </NavLink>
                </li>
              </ul>
            </div>
            <div className="mt-[6px]">
              <li
                onClick={() => {
                  hiddenItem('user');
                  setDownUser((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsPerson />
                </div>
                <span
                  className={`${
                    downUser ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  User
                </span>
                <div
                  className={`${
                    downUser ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downUser ? 'animate-downSlide' : 'animate-upSlide'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminUser}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    List
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminUserCreate}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Create
                  </NavLink>
                </li>
              </ul>
            </div>
            <div className="mt-[6px]">
              <li
                onClick={() => {
                  hiddenItem('waste');
                  setDownWaste((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsTrash2 />
                </div>
                <span
                  className={`${
                    downWaste ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  Trash Type
                </span>
                <div
                  className={`${
                    downWaste ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downWaste ? 'animate-downSlide' : 'animate-upSlide'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminTrashType}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    List
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminTrashTypeCreate}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Create
                  </NavLink>
                </li>
              </ul>
            </div>
            <div className="mt-[6px]">
              <li
                onClick={() => {
                  hiddenItem('teamMember');
                  setDownTeamMember((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <HiOutlineUserGroup />
                </div>
                <span
                  className={`${
                    downTeamMember ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  Team Member
                </span>
                <div
                  className={`${
                    downTeamMember ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downTeamMember ? 'animate-downSlide' : 'animate-upSlide'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminTeamMember}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    List
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminTeamMemberCreate}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Create
                  </NavLink>
                </li>
              </ul>
            </div>

            
            <div className="mt-[6px]">
              <li
                onClick={() => {
                  hiddenItem('feedback');
                  setDownFeedback((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsChatDots />
                </div>
                <span
                  className={`${
                    downFeedback ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  Ý kiến CNV
                </span>
                <div
                  className={`${
                    downFeedback ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downFeedback ? 'animate-downSlide1' : 'animate-upSlide1'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminFeedbackList}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Lịch sử
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminFeedbackAnalytics}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Thống kê
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminFeedbackRole}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Phân quyền
                  </NavLink>
                </li>
              </ul>
            </div>
          </ul>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
