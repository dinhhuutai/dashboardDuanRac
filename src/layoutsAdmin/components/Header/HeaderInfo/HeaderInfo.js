import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsChevronDown, BsBoxArrowRight } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import avatar from "~/assets/imgs/favorite-5.jpg";
import { userSelector } from "~/redux/selectors";
import authSlice from "~/redux/slices/authSlice";
import config from "~/config";

import http, { setAccessToken } from '~/api/http';

function HeaderInfo() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  // Đóng menu khi click ra ngoài / nhấn ESC
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleLogout = async () => {
  try {
    await http.post('/auth/logout'); // thu hồi refresh ở server + clear cookie
  } catch {}
  setAccessToken(null); 

    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Thông tin tài khoản"
        className="flex items-center gap-2 rounded-full bg-white/70 border border-white/70 px-2.5 py-1.5 shadow-sm hover:bg-white transition focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
      >
        <span className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/70">
          <img alt="avatar" src={avatar} className="h-full w-full object-cover" />
        </span>
        <span className="hidden lg:flex flex-col items-start leading-tight">
          <span className="text-[13px] font-semibold text-slate-800 max-w-[160px] truncate">
            {user?.fullName || "Người dùng"}
          </span>
          <span className="text-[11px] text-slate-500">@{user?.username || "user"}</span>
        </span>
        <BsChevronDown className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <div
        role="menu"
        className={`absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-white/70 bg-white/90 backdrop-blur-md shadow-xl shadow-slate-900/5 transition-all ${
          open ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
        }`}
      >
        <div className="px-4 py-3">
          <p className="text-sm text-slate-500">Đăng nhập với</p>
          <p className="mt-0.5 text-sm font-medium text-slate-800 truncate">
            {user?.fullName || "Người dùng"}
          </p>
          <p className="text-xs text-slate-500 truncate">@{user?.username || "user"}</p>
        </div>
        <div className="h-px bg-slate-100" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-b-2xl"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <BsBoxArrowRight />
          </span>
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default HeaderInfo;
