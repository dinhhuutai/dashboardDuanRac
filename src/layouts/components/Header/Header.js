import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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

  return (
    <header className="bg-white px-4 py-2 flex items-center justify-between md:px-8 md:py-3 shadow-sm">
      <Link to={config.routes.home} className="flex-shrink-0">
        <img src={logo} alt="THUẬN HƯNG LONG AN" className="w-[180px] md:w-[240px]" />
      </Link>

      {/* Desktop Menu */}
      <nav className="hidden md:flex items-center gap-10">
        {user?.role === 'admin' && (
          <button
            onClick={() => navigate(config.routes.adminAnalytics)}
            className="text-[13px] px-3 py-1.5 bg-[#f4253a] text-white rounded hover:bg-[#f4253ad8] transition"
          >
            Dashboard
          </button>
        )}

        <ul className="flex gap-10 text-[13px]">
          <li>
            <NavLink
              to={config.routes.home}
              className={({ isActive }) =>
                isActive
                  ? 'text-[#008cff] underline underline-offset-4'
                  : 'text-[#333] hover:text-[#008cff] hover:underline hover:underline-offset-4'
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to={config.routes.user}
              className={({ isActive }) =>
                isActive
                  ? 'text-[#008cff] underline underline-offset-4'
                  : 'text-[#333] hover:text-[#008cff] hover:underline hover:underline-offset-4'
              }
            >
              User
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          className="text-[#333] focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md md:hidden z-50">
          <div className="flex flex-col p-4 gap-4">
            <button
              onClick={() => {
                navigate(config.routes.adminAnalytics);
                setMenuOpen(false);
              }}
              className="text-[13px] px-3 py-2 bg-[#f4253a] text-white rounded hover:bg-[#f4253ad8] transition"
            >
              Dashboard
            </button>
            <NavLink
              to={config.routes.home}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                (isActive ? 'text-[#008cff]' : 'text-[#333] hover:text-[#008cff]') + ' text-[13px]'
              }
            >
              Home
            </NavLink>
            <NavLink
              to={config.routes.user}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                (isActive ? 'text-[#008cff]' : 'text-[#333] hover:text-[#008cff]') + ' text-[13px]'
              }
            >
              User
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
