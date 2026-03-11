import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import avatarImg from '~/assets/imgs/avatar-main.jpg';
import coverPhoto from '~/assets/imgs/coverPhoto.png';
import config from '~/config';
import { userSelector } from '~/redux/selectors';
import authSlice from '~/redux/slices/authSlice';
import http from '~/api/http';
import { FaThLarge } from 'react-icons/fa';

function User() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  const [avatarHidden, setAvatarHidden] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  const initials = useMemo(() => {
    const full = user?.fullName || user?.username || '';
    const parts = full.trim().split(' ').filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  
  const handleLogout = async () => {
  try {
    await http.post('/auth/logout'); // thu hồi refresh ở server + clear cookie
  } catch {}
    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      {/* Cover */}
      <section className="relative h-[220px] md:h-[320px]">
        <img
          src={coverPhoto}
          alt="cover"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,.25),rgba(3,7,18,.55))]" />
        <div className="absolute inset-0 shadow-[inset_0_-120px_160px_-100px_rgba(2,6,23,.6)]" />

        {/* Nút quay lại trang ứng dụng */}
<button
  onClick={() => navigate(config.routes.homeMain)}
  className="
    md:hidden
    absolute top-4 right-4 z-20
    h-11 w-11 rounded-full
    grid place-items-center
    text-white
    bg-white/25 border border-white/40
    backdrop-blur
    hover:bg-white/35
    active:scale-95
    transition
  "
  aria-label="Chọn ứng dụng"
  title="Quay lại trang ứng dụng"
>
  <FaThLarge className="text-lg" />
</button>

      </section>

      {/* Card */}
      <div className="relative -mt-20 md:-mt-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white shadow-[0_20px_60px_-20px_rgba(2,6,23,.2)] p-5 md:p-8">
            {/* Header row */}
            <div className="flex flex-col md:flex-row md:items-end gap-5">
              {/* Avatar */}
              <div className="relative">
                <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-full ring-4 ring-white overflow-hidden shadow-xl bg-slate-100 grid place-items-center text-slate-500 font-semibold">
                  {/* Fallback initials (hiển thị phía sau) */}
                  <span className="select-none">{initials}</span>
                  {/* Ảnh nằm trên, nếu lỗi sẽ ẩn đi để lộ initials */}
                  {!avatarHidden && (
                    <img
                      src={user?.avatar || avatarImg}
                      alt="avatar"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={() => setAvatarHidden(true)}
                    />
                  )}
                </div>
              </div>

              {/* Name + badges */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {user?.fullName || 'Người dùng'}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-600">
                  <span className="text-sm">@{user?.username || 'username'}</span>
                  {user?.role && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs font-medium">
                      Vai trò: {user.role}
                    </span>
                  )}
                  {user?.operationType && (
                    <span className="inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 text-xs font-medium">
                      Quyền: {user.operationType}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex w-full md:w-auto gap-3">
                <button
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-[.98] transition"
                >
                  ✏️ Chỉnh sửa trang cá nhân
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg hover:from-rose-700 hover:to-red-700 active:scale-[.98] transition"
                >
                  🔒 Đăng xuất
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/70 border border-white p-4 shadow">
                <div className="text-xs uppercase tracking-wide text-slate-500">Họ & tên</div>
                <div className="mt-1 text-slate-900 font-medium">{user?.fullName || '—'}</div>
              </div>

              <div className="rounded-2xl bg-white/70 border border-white p-4 shadow">
                <div className="text-xs uppercase tracking-wide text-slate-500">Tài khoản</div>
                <div className="mt-1 text-slate-900 font-medium">@{user?.username || '—'}</div>
              </div>

              <div className="rounded-2xl bg-white/70 border border-white p-4 shadow">
                <div className="text-xs uppercase tracking-wide text-slate-500">Vai trò</div>
                <div className="mt-1 text-slate-900 font-medium">{user?.role || '—'}</div>
              </div>

              <div className="rounded-2xl bg-white/70 border border-white p-4 shadow">
                <div className="text-xs uppercase tracking-wide text-slate-500">Quyền vận hành</div>
                <div className="mt-1 text-slate-900 font-medium">{user?.operationType || '—'}</div>
              </div>

              <div className="rounded-2xl bg-white/70 border border-white p-4 shadow">
                <div className="text-xs uppercase tracking-wide text-slate-500">Mã người dùng</div>
                <div className="mt-1 text-slate-900 font-medium">{user?.userID || '—'}</div>
              </div>

              <div className="rounded-2xl bg-white/70 border border-white p-4 shadow">
                <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
                <div className="mt-1 text-slate-900 font-medium">{user?.email || '—'}</div>
              </div>
            </div>

            {/* Hint row (optional) */}
            <div className="mt-6 rounded-2xl border border-white bg-white/60 p-4 text-sm text-slate-600">
              Mẹo: Bạn có thể cập nhật ảnh bìa và ảnh đại diện để trang cá nhân nổi bật hơn.
            </div>
          </div>
        </div>
      </div>

      <div className="pb-24" />
    </div>
  );
}

export default User;
