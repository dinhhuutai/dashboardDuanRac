import { BsFillBellFill, BsCircleFill } from "react-icons/bs";
import nationGermany from "~/assets/imgs/nation-germany.svg";

function IconButton({ children, title }) {
  return (
    <button
      title={title}
      className="relative inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/70 border border-white/70 text-slate-700 hover:bg-white transition shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-200"
    >
      {children}
    </button>
  );
}

function HeaderNotice() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <IconButton title="Thông báo">
          <BsFillBellFill className="text-[18px] text-rose-600" />
        </IconButton>
        {/* badge ví dụ */}
        <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-rose-500 text-white text-[10px] leading-5 text-center shadow">
          3
        </span>
      </div>

      <IconButton title="Ngôn ngữ">
        <img
          className="h-[22px] w-[22px] rounded-full object-cover"
          alt="Deutsch"
          src={nationGermany}
        />
      </IconButton>

      <IconButton title="Trạng thái hệ thống">
        <div className="relative">
          <BsCircleFill className="text-[16px] text-emerald-500" />
          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/50" />
        </div>
      </IconButton>
    </div>
  );
}

export default HeaderNotice;
