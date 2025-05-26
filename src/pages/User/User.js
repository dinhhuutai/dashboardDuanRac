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

  const handleLogout = async () => {
    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
  };

  return (
    <div className="flex flex-col items-center w-full font-sans pb-40 bg-gray-50 min-h-screen">
      {/* Ảnh bìa */}
      <div className="w-full relative h-[200px] md:h-[350px]">
        <img src={coverPhoto} alt="cover" className="w-full h-full object-cover" />

        {/* Avatar và thông tin */}
        <div className="absolute inset-x-0 bottom-[-120px] md:left-10 md:bottom-[-100px] flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
          <img
            src={avatar}
            alt="avatar"
            className="w-[100px] h-[100px] md:w-[160px] md:h-[160px] rounded-full border-4 border-white shadow-lg object-cover"
          />
          <div className="text-center md:text-left md:mt-[75px]">
            <h2 className="text-xl md:text-3xl font-bold">{user?.fullName}</h2>
            <p className="text-gray-500 text-sm md:text-base">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="w-full max-w-5xl px-4 mt-[150px] md:mt-[40px] flex flex-col md:flex-row items-center md:justify-end gap-3 md:gap-5">
        <button className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-[16px] w-full md:w-auto">
          ✏️ Chỉnh sửa trang cá nhân
        </button>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-[16px] w-full md:w-auto"
        >
          🔒 Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default User;
