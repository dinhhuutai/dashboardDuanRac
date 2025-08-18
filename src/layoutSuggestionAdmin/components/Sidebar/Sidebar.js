import { NavLink } from 'react-router-dom';
import { BsMailbox, BsChevronDown } from 'react-icons/bs';
import { useEffect, useMemo, useState } from 'react';
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

  // class cho NavLink con (hiển thị modern + trạng thái active)
  const linkClass = useMemo(
    () =>
      ({ isActive }) =>
        [
          'relative block w-full rounded-lg px-3 py-2 text-sm transition-colors',
          'hover:bg-indigo-50 hover:text-indigo-700',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500/40',
          isActive
            ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-inset ring-indigo-200'
            : 'text-slate-700',
        ].join(' '),
    []
  );

  // height submenu (mượt, không bị cắt)
  const submenuMaxH = downSuggest ? 800 : 0;

  return (
    <aside
      className="
        relative z-30
        w-full md:w-[260px] shrink-0
        h-full md:h-screen
        overflow-y-auto
        bg-gradient-to-b from-white to-slate-50
        border-r border-slate-200 shadow-sm
      "
    >
      <div className="p-4">
        {/* HEADER */}
        <div className="mb-2">
          <span className="block text-[11px] tracking-wider uppercase text-slate-500 font-semibold">
            Menu
          </span>
        </div>

        {/* CARD CONTAINER (không overflow-hidden để tránh che submenu) */}
        <div className="rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm">
          {/* GROUP: Hòm thư */}
          <button
            type="button"
            aria-expanded={downSuggest}
            onClick={() => {
              hiddenItem('suggest');
              setDownSuggest((prev) => !prev);
            }}
            className="
              group flex w-full items-center gap-3
              px-3 py-2 text-left
              hover:bg-slate-50 transition-colors
              focus:outline-none focus:ring-2 focus:ring-indigo-500/30
            "
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
              <BsMailbox />
            </div>
            <span
              className={[
                'flex-1 text-[13px] capitalize transition-colors',
                downSuggest ? 'font-semibold text-slate-900' : 'text-slate-700',
              ].join(' ')}
            >
              Hòm thư
            </span>
            <div
              className={[
                'text-slate-400 transition-transform duration-200',
                downSuggest ? 'rotate-180' : 'rotate-0',
              ].join(' ')}
            >
              <BsChevronDown />
            </div>
          </button>

          {/* SUBMENU (dùng max-height + overflow-hidden để animate, không bị cắt) */}
          <div
            className="
              border-t border-slate-200/70
              transition-[max-height] duration-300 ease-in-out
              overflow-hidden
            "
            style={{ maxHeight: submenuMaxH }}
          >
            <ul className="relative pl-4 py-3 before:absolute before:left-2 before:top-0 before:bottom-0 before:w-[2px] before:bg-slate-200/70">
              {/* Item 1 */}
              <li className="mb-1 pl-4">
                <NavLink to={config.routes.adminSuggestionList} className={linkClass}>
                  {({ isActive }) => (
                    <span className="flex items-center">
                      <span
                        className={[
                          'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r',
                          isActive ? 'bg-indigo-500' : 'bg-transparent',
                        ].join(' ')}
                      />
                      <span>Góp ý của CNV</span>
                    </span>
                  )}
                </NavLink>
              </li>

              {/* Item 2 */}
              <li className="mb-1 pl-4">
                <NavLink to={config.routes.adminSuggestionCategoriList} className={linkClass}>
                  {({ isActive }) => (
                    <span className="flex items-center">
                      <span
                        className={[
                          'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r',
                          isActive ? 'bg-indigo-500' : 'bg-transparent',
                        ].join(' ')}
                      />
                      <span>Danh mục góp ý</span>
                    </span>
                  )}
                </NavLink>
              </li>

              {/* Item 3 */}
              <li className="pl-4">
                <NavLink to={config.routes.adminSuggestionCategoriCreate} className={linkClass}>
                  {({ isActive }) => (
                    <span className="flex items-center">
                      <span
                        className={[
                          'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r',
                          isActive ? 'bg-indigo-500' : 'bg-transparent',
                        ].join(' ')}
                      />
                      <span>Thêm danh mục</span>
                    </span>
                  )}
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
