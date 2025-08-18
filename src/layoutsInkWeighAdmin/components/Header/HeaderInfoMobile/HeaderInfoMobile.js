// HeaderInfoMobile.jsx
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BsBoxArrowRight } from "react-icons/bs";
import avatar from "~/assets/imgs/favorite-5.jpg";
import authSlice from "~/redux/slices/authSlice";
import config from "~/config";
import http, { setAccessToken } from '~/api/http';

function HeaderInfoMobile() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  
  const handleLogout = async () => {
  try {
    await http.post('/auth/logout'); // thu hồi refresh ở server + clear cookie
  } catch {}
  setAccessToken(null); 
    dispatch(authSlice.actions.logoutSuccess());
    navigate(config.routes.login);
  };

  // đóng dropdown khi click ra ngoài / ESC
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-white/70 bg-white/80 shadow-sm focus-visible:ring-4 focus-visible:ring-slate-200"
        title="Tài khoản"
      >
        <img src={avatar} alt="avatar" className="h-9 w-9 rounded-full object-cover" />
      </button>

      <div
        role="menu"
        className={`absolute right-0 mt-2 w-44 origin-top-right rounded-2xl border border-white/70 bg-white/95 backdrop-blur-md shadow-xl transition-all ${
          open ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
        }`}
      >
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14px] text-slate-700 hover:bg-slate-50 active:bg-slate-100 rounded-2xl"
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

export default HeaderInfoMobile;
