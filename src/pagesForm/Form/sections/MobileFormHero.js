import React from "react";
import { FaThLarge, FaWpforms } from "react-icons/fa";
import config from "~/config";
import avatarDefault from "~/assets/imgs/avatar-main.jpg";

export default function MobileFormHero({ navigate, currentUser, formTitle, formDescription }) {
  const fullName = currentUser?.fullName || "bạn";
  const avatar = currentUser?.avatar || avatarDefault;

  return (
    <div className="md:hidden">
      <div className="relative bg-gradient-to-br from-violet-500 via-fuchsia-600 to-purple-700 rounded-b-[50px] px-4 pt-4 pb-[170px]">
        <div className="relative flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-[18px] font-semibold text-white truncate">{fullName}</div>
            </div>
          </div>

          <button
            onClick={() => navigate(config.routes.homeMain)}
            className="h-10 w-10 rounded-full grid place-items-center text-white bg-white/25 border border-white/40 active:scale-95 transition"
            aria-label="Chọn ứng dụng"
            title="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>
        </div>

        <div className="absolute left-4 right-4 top-[110px]">
          <div className="rounded-3xl px-4 py-4 bg-[#faf5ff] border border-violet-200/80">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FaWpforms className="text-violet-700 text-[18px]" />
                  <div className="text-[20px] font-extrabold text-violet-900">Biểu mẫu nội bộ</div>
                </div>

                <div className="mt-1 text-[13px] font-semibold text-violet-700 line-clamp-1">
                  {formTitle || "Mẫu phản hồi nhanh"}
                </div>

                <div className="mt-2">
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full bg-violet-100 border border-violet-200 text-violet-800">
                    Điền biểu mẫu nhanh • Đồng bộ realtime
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              {formDescription || "Vui lòng điền đầy đủ thông tin để gửi phản hồi."}
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Các câu có dấu * là bắt buộc.
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
                Kiểm tra lại trước khi bấm Gửi biểu mẫu.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
