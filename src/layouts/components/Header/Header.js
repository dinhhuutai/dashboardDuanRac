import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import logo from '~/assets/imgs/logo.png';
import config from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  // Initials avatar
  const userInitials = useMemo(() => {
    const full = user?.fullName || user?.username || '';
    const parts = full.trim().split(' ').filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  const goDashboard = () => {
    if (user?.operationType === 'canmuc') navigate(config.routes.adminInkWeighHistory);
    else navigate(config.routes.adminAnalytics);
  };

  // Tabs style
  const tabLink = ({ isActive }) =>
    [
      'relative px-3 py-2 text-sm transition-colors',
      isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900',
    ].join(' ');

  const TabUnderline = ({ isActive }) => (
    <span
      className={`absolute left-2 right-2 -bottom-[6px] h-[2px] rounded bg-emerald-600 transition-transform duration-300 ${
        isActive ? 'scale-x-100' : 'scale-x-0'
      } origin-left`}
    />
  );

  return (
    <header className="sticky top-0 z-50">
      {/* App bar glass */}
      <div className="backdrop-blur-md bg-white/80 border-b border-white/70">
        <div className="mx-auto max-w-7xl px-3 sm:px-6">
          <div className="h-14 sm:h-16 grid grid-cols-[auto_1fr_auto] items-center gap-2">
            {/* Left: Logo only */}
            <Link to={config.routes.home} className="flex items-center">
              <img
                src={logo}
                alt="Logo"
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>

            {/* Center: Tabs (desktop) */}
            <nav className="hidden md:flex justify-center">
              <ul className="flex items-center gap-6">
                  <li>
                    
              <button
  onClick={() => {
    navigate(config.routes.homeMain); // Điều hướng đến trang chọn ứng dụng
    setMenuOpen(false);
  }}
  className="
    w-full rounded-lg px-3 py-2 text-sm font-medium
    bg-slate-100 text-slate-700
    hover:bg-slate-200 transition-colors
  "
>
  Chọn ứng dụng
</button>
                  </li>

                <li className="relative">
                  <NavLink to={config.routes.home} className={tabLink}>
                    {({ isActive }) => (
                      <>
                        Trang chủ
                        <TabUnderline isActive={isActive} />
                      </>
                    )}
                  </NavLink>
                </li>

                {/* <li className="relative">
                  <NavLink to={config.routes.history} className={tabLink}>
                    {({ isActive }) => (
                      <>
                        Lịch sử cân
                        <TabUnderline isActive={isActive} />
                      </>
                    )}
                  </NavLink>
                </li> */}

                <li className="relative">
                  <NavLink to={config.routes.user} className={tabLink}>
                    {({ isActive }) => (
                      <>
                        Thông tin
                        <TabUnderline isActive={isActive} />
                      </>
                    )}
                  </NavLink>
                </li>
              </ul>
            </nav>

            {/* Right: User + Hamburger */}
            <div className="flex items-center justify-end gap-2">
              {/* User chip (desktop) */}
              <div className="hidden md:flex items-center gap-3">
                <div className="h-8 w-8 grid place-items-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-white shadow-sm">
                  {userInitials || ''}
                </div>
                <div className="hidden lg:block leading-tight">
                  <div className="text-[11px] text-slate-500">Xin chào</div>
                  <div className="text-sm font-medium text-slate-800 truncate max-w-[180px]">
                    {user?.fullName || user?.username || 'Người dùng'}
                  </div>
                </div>
              </div>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => setMenuOpen((p) => !p)}
                aria-label="Mở menu"
                className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/70 bg-white/70 text-slate-700 hover:bg-white active:scale-[.98] transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sheet */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
            menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 border-t border-white/70 bg-white/85 backdrop-blur-md">
            <div className="flex flex-col gap-2">
              {/* {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    if (user?.operationType === 'canmuc') navigate(config.routes.adminInkWeighHistory);
                    else navigate(config.routes.adminAnalytics);
                    setMenuOpen(false);
                  }}
                  className="px-3 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-black/90 transition shadow-sm"
                >
                  Dashboard
                </button>
              )} */}

              <button
  onClick={() => {
    navigate(config.routes.homeMain); // Điều hướng đến trang chọn ứng dụng
    setMenuOpen(false);
  }}
  className="
    w-full rounded-lg px-3 py-2 text-sm font-medium
    bg-slate-100 text-slate-700
    hover:bg-slate-200 transition-colors
  "
>
  Chọn ứng dụng
</button>


              <NavLink
                to={config.routes.home}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-2 rounded-lg text-sm ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                Trang chủ
              </NavLink>

              {/* <NavLink
                to={config.routes.history}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-2 rounded-lg text-sm ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                Lịch sử cân
              </NavLink> */}

              <NavLink
                to={config.routes.user}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-2 py-2 rounded-lg text-sm ${isActive ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`
                }
              >
                Thông tin
              </NavLink>

              {/* User row */}
              <div className="mt-2 flex items-center gap-3 p-2 rounded-lg bg-slate-50/70 border border-white/70">
                <div className="h-9 w-9 grid place-items-center rounded-full bg-slate-100 text-slate-700 text-sm font-semibold border border-white shadow-sm">
                  {userInitials || ''}
                </div>
                <div className="leading-tight">
                  <div className="text-[11px] text-slate-500">Đang đăng nhập</div>
                  <div className="text-sm font-medium text-slate-800">
                    {user?.fullName || user?.username || 'Người dùng'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </header>
  );
}

export default Header;
