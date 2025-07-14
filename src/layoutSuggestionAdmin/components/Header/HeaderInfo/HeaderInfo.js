import { useEffect, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { useSelector } from 'react-redux';

import avatar from '~/assets/imgs/favorite-5.jpg';
import { userSelector } from '~/redux/selectors';

function HeaderInfo() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  return (
    <div className="flex items-center">
      <div className="cursor-pointer flex items-center">
        <div className="h-[40px] w-[40px] overflow-hidden rounded-[50%]">
          <img alt="avatar" src={avatar} />
        </div>
        <div className="text-[14px] text-[#979A9E] ml-[4px]">
          <BsChevronDown />
        </div>
      </div>
      <div className="ml-[10px] flex flex-col">
        <span className="text-[14px] font-[600] text-[#6C7278]">{user?.fullName}</span>
        <span className="text-[12px] text-[#b8bec4]">VP People Manager</span>
      </div>
    </div>
  );
}

export default HeaderInfo;
