// src/pages/Home/MobileHomeOQC.jsx
import React from "react";
import { FaThLarge, FaQrcode } from "react-icons/fa";
import config from "~/config";
import avatar from "~/assets/imgs/avatar-main.jpg";

export default function MobileHomeOQC({ navigate, tmp }) {
  const fullName = tmp?.login?.currentUser?.fullName || "bạn";

  /* ================= STYLE TOKENS ================= */

  const bgMain = "bg-[#E8F8F1]";
  const cardBg = "bg-[#F3FBF6] border border-green-200/70";

  /* =============================================== */

  return (
    <div className={`md:hidden ${bgMain}`} style={{ minHeight: "100dvh" }}>
      {/* HEADER */}
      <div
        className="
          relative
          bg-gradient-to-br
          from-green-400 via-green-500 to-emerald-600
          rounded-b-[46px]
          px-4 pt-4 pb-[200px]
        "
      >
        {/* Top row */}
        <div className="relative flex items-center justify-between mt-[18px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img
                src={tmp?.login?.currentUser?.avatar || avatar}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="text-xs text-white/90">Xin chào,</div>
              <div className="text-xl font-semibold text-white truncate">
                {fullName}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(config.routes.homeMain)}
            className="
              h-9 w-9 rounded-full grid place-items-center text-white
              bg-white/25 border border-white/40
            "
            aria-label="Chọn ứng dụng"
          >
            <FaThLarge size={16} />
          </button>
        </div>

        {/* CARD */}
        <div className="absolute left-4 right-4 top-[100px]">
          <div className={`rounded-3xl px-4 py-5 ${cardBg}`}>
            {/* TITLE */}
            <div className="text-[18px] font-bold text-green-900">
              🧪 KCS{" "}
              <span className="text-green-700 font-semibold">
                Kiểm tra chất lượng sau in
              </span>
            </div>

            {/* SUB */}
            <div className="mt-1 text-[13px] text-slate-600">
              Thực hiện kiểm tra sản phẩm theo hệ thống
            </div>

            {/* DIVIDER */}
            <div className="my-4 h-px bg-green-100" />

            {/* GUIDE */}
            <div className="space-y-3 text-[14px] text-slate-700">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600">1.</span>

                <span className="text-green-800 flex items-center gap-1 flex-wrap">
                  Bấm vào biểu tượng
                  <FaQrcode className="text-green-600 text-base" />
                  <span className="font-semibold text-green-700">
                    Quét QR
                  </span>
                  ở thanh bên dưới
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600">2.</span>
                <span>Quét mã QR trên sản phẩm cần kiểm tra</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600">3.</span>
                <span>
                  Chọn kết quả{" "}
                  <span className="font-semibold text-green-600">
                    Đạt
                  </span>{" "}
                  hoặc{" "}
                  <span className="font-semibold text-red-600">
                    Không đạt
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-green-600">4.</span>
                <span>Bấm <b>Xác nhận</b> để hoàn tất kiểm tra</span>
              </div>
            </div>

            {/* NOTE */}
            <div className="mt-4 text-[12px] text-slate-500 italic">
              Lưu ý: Vui lòng kiểm tra đúng sản phẩm trước khi xác nhận.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}