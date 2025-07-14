import { NavLink } from 'react-router-dom';
import {
  BsMailbox,
  BsChevronDown
} from 'react-icons/bs';
import { HiOutlineUserGroup } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import config from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';

function Sidebar() {
  const [downSuggest, setDownSuggest] = useState(true);

  
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  
  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  const hiddenItem = (key) => {
    key !== 'suggest' && setDownSuggest(false);
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
                  hiddenItem('suggest');
                  setDownSuggest((prev) => !prev);
                }}
                className="flex items-center py-[8px] rounded-[4px] cursor-pointer hover:bg-[#E0F3FF] group"
              >
                <div className="text-[#999797] group-hover:text-[#333] text-[20px] w-[34px] flex justify-center">
                  <BsMailbox />
                </div>
                <span
                  className={`${
                    downSuggest ? 'text-[13px] flex-1 ml-[6px] font-[600]' : 'text-[13px] flex-1 ml-[6px]'
                  } capitalize`}
                >
                  Hòm thư
                </span>
                <div
                  className={`${
                    downSuggest ? 'rotate-[180deg]' : 'rotate-[0deg]'
                  } ease-linear duration-[.2s] text-[#999797] group-hover:text-[#333] text-[12px] mr-[10px]`}
                >
                  <BsChevronDown />
                </div>
              </li>
              <ul
                className={`${
                  downSuggest ? 'animate-downSlide1' : 'animate-upSlide1'
                } overflow-hidden pl-[28px] pt-[4px] relative before:content-[""] before:left-[16px] before:absolute before:w-[2px] before:h-full before:bg-[#c0cfd8]`}
              >
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminSuggestionList}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Góp ý của CNV
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminSuggestionCategoriList}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Danh mục góp ý
                  </NavLink>
                </li>
                <li className="hover:text-[#3F6AD8] text-[13px] mt-[4px] capitalize rounded-[4px] hover:bg-[#E0F3FF] cursor-pointer">
                  <NavLink
                    to={config.routes.adminSuggestionCategoriCreate}
                    className={(nav) =>
                      nav.isActive
                        ? 'font-[600] text-[#3F6AD8] py-[6px] px-[22px] block w-full'
                        : 'font-[400] py-[6px] px-[22px] block w-full'
                    }
                  >
                    Thêm danh mục
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
