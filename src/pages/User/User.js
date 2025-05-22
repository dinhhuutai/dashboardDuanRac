import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import avatar from '~/assets/imgs/avatar.png';
import coverPhoto from '~/assets/imgs/coverPhoto.png';
import config from '~/config';
import { userSelector } from '~/redux/selectors';
import authSlice from '~/redux/slices/authSlice';

function User() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  const handleLogout = async (e) => {
    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
  };

  return (
    <div className="flex flex-col items-center w-full font-sans min-h-screen pb-[300px] bg-gray-50">
      {/* Ảnh bìa */}
      <div className="w-full relative h-[300px] md:h-[350px]">
        <div className='absolute bottom-[-30%]'>
          <img src={coverPhoto} alt="cover" className="w-full h-full object-cover" />

          {/* Avatar và thông tin */}
          <div className="absolute left-1/2 bottom-[-50%] transform -translate-x-1/2 md:left-[6%] md:bottom-[-150px] md:transform-none flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5">
            <img
              src={avatar}
              alt="avatar"
              className="w-[120px] h-[120px] md:w-[200px] md:h-[200px] rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div className="text-center md:text-left mt-[15%]">
              <h2 className="text-[24px] md:text-[30px] font-bold">{user?.fullName}</h2>
              <p className="text-gray-500">@{user?.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nút hành động - đặt ngoài ảnh bìa để tránh tràn / lệch */}
      <div className="mt-[4%] absolute bottom-[-10%] md:bottom-[-4%] w-full max-w-5xl px-4 md:px-0 flex flex-col md:flex-row justify-center md:justify-end gap-4">
        <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-[16px] w-full max-w-xs md:w-auto">
          ✏️ Chỉnh sửa trang cá nhân
        </button>
        <button
          onClick={() => handleLogout()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-[16px] w-full max-w-xs md:w-auto"
        >
          🔒 Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default User;
