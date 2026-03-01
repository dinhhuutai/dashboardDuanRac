// src/pages/Lunch/UserOrderSlide/components/PushBanner.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";
import { FiBell, FiAlertTriangle, FiInfo, FiCheckCircle } from "react-icons/fi";

export default function PushBanner({
  pushChecking,
  pushReady,
  pushBusy,
  pushError,
  pushStatus,
  notifPerm,
  isIOS,
  isStandalone,
  enablePush,
  disablePush,
  compact = false,
}) {
  if (pushChecking) return null;

  if (compact) {
    return (
      <div className="mx-2 mb-3 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm p-3 flex items-center justify-between">
        <div className="text-sm text-slate-700">
          {pushReady ? "Đang bật thông báo đặt cơm" : "Bạn có thể bật thông báo để được nhắc khi có menu/khoá menu"}
        </div>
        <div className="flex gap-2">
          <button
            onClick={enablePush}
            disabled={pushBusy || pushReady || (isIOS && !isStandalone)}
            className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-emerald-500/90 text-white text-[12px] shadow-sm hover:shadow transition-shadow hover:bg-emerald-500 disabled:opacity-50"
            title={isIOS && !isStandalone ? "Hãy thêm trang ra màn hình chính để bật thông báo trên iOS" : ""}
          >
            {pushBusy ? <FaSpinner className="animate-spin" /> : <FiBell />}
            Bật thông báo
          </button>
          {pushReady && (
            <button
              onClick={disablePush}
              disabled={pushBusy}
              className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-white text-slate-700 text-[12px] border border-slate-200 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            >
              Tắt
            </button>
          )}
        </div>
      </div>
    );
  }

  // empty-menu big banner
  if (pushReady) return null;

  return (
    <div className="mx-[10px] mb-4 group">
      <div className="relative rounded-2xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-400" />
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-300/40">
                <FiBell className="text-emerald-600 text-xl" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-base md:text-lg">Bật thông báo đặt cơm</div>
                <div className="text-sm text-slate-600">
                  Nhận nhắc lịch chọn món / khóa menu ngay cả khi bạn không mở trang.
                </div>

                {notifPerm === "denied" && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm text-red-700 ring-1 ring-red-200">
                    <FiAlertTriangle />
                    <span>Bạn đang chặn thông báo. Hãy bật lại trong cài đặt trình duyệt.</span>
                  </div>
                )}

                {pushError && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm text-red-700 ring-1 ring-red-200">
                    <FiAlertTriangle />
                    <span>{pushError}</span>
                  </div>
                )}

                {pushStatus && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
                    <FiCheckCircle />
                    <span>{pushStatus}</span>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <FiInfo className="opacity-80" />
                  <span>Có thể tắt bất kỳ lúc nào trong phần Cài đặt trình duyệt.</span>
                </div>
              </div>
            </div>

            <button
              onClick={enablePush}
              disabled={pushBusy || (isIOS && !isStandalone)}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-white",
                "bg-gradient-to-r from-emerald-500 to-teal-500",
                "shadow-sm hover:shadow md:active:scale-[0.98]",
                "transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300",
                "disabled:cursor-not-allowed disabled:opacity-60",
              ].join(" ")}
              title={isIOS && !isStandalone ? "Hãy thêm trang ra màn hình chính để bật thông báo trên iOS" : ""}
            >
              {pushBusy ? <FaSpinner className="animate-spin" /> : <FiBell />}
              <span>Bật thông báo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
