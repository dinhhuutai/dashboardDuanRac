// src/pages/Home/MobileHomeTrash.jsx
import React from "react";
import { FaThLarge } from "react-icons/fa";
import config from "~/config";
import avatarTrash from "~/assets/imgs/avatar-main.jpg";
import Lottie from "lottie-react";
import trashLottie from "~/assets/lottie/trash.json";

export default function MobileHomeTrash({
  navigate,
  tmp,
  openWeigh,
  isLoadingWeigh,
  FEATURE_SCAN_QR,
  handleScanQR,
  FEATURE_BLUE,
  handleConnectBluetooth,
  FEATURE_CHECK_CLASS,
  handleCheckClassification,
}) {
  const fullName = tmp?.login?.currentUser?.fullName || "bạn";

  /* ================= FLAT TOKENS (NO SHADOW) ================= */

  const bgMain = "bg-[#E3F4EC]"; // xanh đậm hơn chút
  const cardBg = "bg-[#ECF8F1] border border-emerald-200/60";
  const chipBg = "bg-[#E3F4EC] border border-emerald-200/70";

  const btnPrimary =
    "bg-gradient-to-br from-emerald-500 to-emerald-600 text-[#fcfcfc]";

  const btnSoft =
    "bg-[#E3F4EC] text-emerald-900 border border-emerald-200/70";

  const iconPill =
    "w-9 h-9 rounded-xl grid place-items-center text-[18px] " +
    "bg-[#E3F4EC] border border-emerald-200/70";

  /* ============================================================ */

  return (
    <div
      className={`md:hidden ${bgMain}`}
      style={{ minHeight: "calc(100dvh)" }}
    >
      {/* HEADER */}
      <div
        className="
          relative
          bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600
          rounded-b-[50px]
          px-4 pt-4 pb-[170px]
        "
      >
        {/* Top row */}
        <div className="relative flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img
                src={tmp?.login?.currentUser?.avatar || avatarTrash}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-2xl font-semibold text-white truncate">
                {fullName}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(config.routes.homeMain)}
            className="
              h-10 w-10 rounded-full grid place-items-center text-white
              bg-white/25 border border-white/40
            "
            aria-label="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>
        </div>

        {/* CARD */}
        <div className="absolute left-4 right-4 top-[110px]">
          <div className={`rounded-3xl px-4 py-4 ${cardBg}`}>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[22px] font-extrabold text-emerald-900">
                  ♻️ Cân rác{" "}
                  <span className="text-emerald-700">QRcode</span>
                </div>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${chipBg} text-emerald-800`}
                  >
                    Thao tác nhanh
                  </span>
                </div>
              </div>

              <div className="h-[92px] w-[92px] rounded-2xl bg-[#E3F4EC] border border-emerald-200/70">
                <Lottie animationData={trashLottie} loop />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="mt-4 space-y-3">
              <button
                onClick={openWeigh}
                disabled={isLoadingWeigh}
                className={`w-full h-[58px] rounded-2xl flex items-center gap-3 px-5 font-semibold ${btnPrimary}`}
              >
                <span className={iconPill}>⚖️</span>
                <span>Cân rác (chọn)</span>
              </button>

              {FEATURE_SCAN_QR && (
                <button
                  onClick={handleScanQR}
                  className={`w-full h-[58px] rounded-2xl flex items-center gap-3 px-5 font-semibold ${btnPrimary}`}
                >
                  <span className={iconPill}>📷</span>
                  <span>Cân rác (Quét QR)</span>
                </button>
              )}

              {FEATURE_BLUE && (
                <button
                  onClick={handleConnectBluetooth}
                  className={`w-full h-[58px] rounded-2xl flex items-center gap-3 px-5 font-semibold ${btnPrimary}`}
                >
                  <span className={iconPill}>🔵</span>
                  <span>Kết nối Bluetooth</span>
                </button>
              )}

              {FEATURE_CHECK_CLASS && (
                <button
                  onClick={handleCheckClassification}
                  className={`w-full h-[60px] rounded-2xl flex items-center gap-3 px-5 font-bold ${btnPrimary}`}
                >
                  <span className={iconPill}>🧪</span>
                  <span>Kiểm tra phân loại</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
