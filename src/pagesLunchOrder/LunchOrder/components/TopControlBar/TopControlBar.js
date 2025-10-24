// BalancedTopBar.jsx
import React from "react";
import MODULEID from "~/contants/modules";
import { useFeatureAllowed } from "~/hooks/useFeatureGuard";

function StatusDot({ on, className = "" }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${on ? "bg-emerald-500 animate-pulse" : "bg-slate-400"} ${className}`}
      aria-hidden="true"
    />
  );
}

function TinyBadge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    good: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warn: "bg-amber-100 text-amber-700 border-amber-200",
    bad: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export default function BalancedTopBar({
  // Push
  pushReady, pushBusy, isIOS, isStandalone, notifPerm, pushStatus, pushError,
  handleEnablePush, unregisterPush,
  // OT & Secretary
  isOvertime, setOvertime,
  isSec, setSecEnabled,
}) {
  const CAN_SECRETARY = useFeatureAllowed(MODULEID.DATCOM, "thukydatcom");

  // Gợi ý/hạn chế hệ thống cho push
  const iosBlocked = !pushReady && isIOS && !isStandalone;
  const permDenied = !pushReady && notifPerm === "denied";

  const pushTitle = pushReady ? "Thông báo — ĐANG BẬT" : "Thông báo";
  const pushSubtitle = pushReady
    ? (pushStatus || "Đang bật")
    : (permDenied
        ? "Đang bị chặn trong trình duyệt"
        : (iosBlocked ? "Cài lên màn hình chính để bật trên iOS" : "Đang tắt"));

  const gridCols = CAN_SECRETARY ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className="mx-2 mb-3 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm">
      <div className={`px-3 py-3 grid grid-cols-1 xs:grid-cols-2 ${gridCols} gap-2`}>
        {/* 1) Thông báo đẩy */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50 transition">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-1">
              <StatusDot on={!!pushReady} />
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-800 truncate">{pushTitle}</div>
              <div className="text-[11px] text-slate-600 truncate">{pushSubtitle}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {pushReady && <TinyBadge tone="good">Đang nhận thông báo</TinyBadge>}
                {!pushReady && iosBlocked && <TinyBadge tone="warn">iOS cần “Thêm vào MH chính”</TinyBadge>}
                {!pushReady && permDenied && <TinyBadge tone="bad">Đang chặn quyền</TinyBadge>}
                {pushError && <TinyBadge tone="bad">Lỗi: {pushError}</TinyBadge>}
              </div>
            </div>
          </div>

          <button
            onClick={pushReady ? unregisterPush : handleEnablePush}
            disabled={pushBusy || iosBlocked}
            aria-busy={pushBusy}
            title={
              permDenied
                ? "Bạn đang chặn thông báo trong trình duyệt"
                : (iosBlocked
                    ? "Vui lòng cài ứng dụng lên màn hình chính (iOS) rồi bật lại"
                    : (pushReady ? "Tắt thông báo" : "Bật thông báo"))
            }
            className={`h-9 px-3 rounded-md text-[12px] border transition whitespace-nowrap
              ${pushReady
                ? "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"}
              ${pushBusy ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {pushBusy ? (pushReady ? "Đang tắt…" : "Đang bật…") : (pushReady ? "Tắt" : "Bật")}
          </button>
        </div>

        {/* 2) Đặt cơm tăng ca */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50 transition">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 text-slate-700">
              {/* icon đồng hồ */}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 1a11 11 0 1 0 11 11A11.013 11.013 0 0 0 12 1Zm1 11h5v2h-7V6h2Z" fill="currentColor"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-slate-800">Đặt cơm tăng ca</div>
              <div className="text-[11px] text-slate-600">
                {isOvertime ? "Chế độ TĂNG CA đang bật" : "Đặt cơm bình thường"}
              </div>
            </div>
          </div>

          {/* Switch đẹp + to hơn chút */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none" aria-label="Bật tắt chế độ tăng ca">
            <input
              type="checkbox"
              checked={isOvertime}
              onChange={(e) => setOvertime(e.target.checked)}
              className="sr-only"
            />
            <span className={`w-11 h-6 rounded-full relative transition-all duration-200
              ${isOvertime ? "bg-orange-500/90" : "bg-slate-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                ${isOvertime ? "translate-x-5" : ""}`} />
            </span>
          </label>
        </div>

        {/* 3) Chế độ thư ký (chỉ hiện nếu có quyền) */}
        {CAN_SECRETARY && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 hover:bg-slate-50 transition">
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 text-slate-700">
                {/* icon user */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M10 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5Z" fill="currentColor"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-slate-800">Chế độ thư ký</div>
                <div className="text-[11px] text-slate-600">
                  {isSec ? "Bạn có thể đặt giùm cho người khác" : "Tắt — Chỉ đặt cho chính bạn"}
                </div>
              </div>
            </div>

            <button
              role="switch"
              aria-checked={isSec}
              onClick={() => setSecEnabled((v) => !v)}
              className={`w-11 h-6 rounded-full relative transition-all duration-200
                ${isSec ? "bg-emerald-600" : "bg-slate-300"}`}
              title={isSec ? "Tắt chế độ thư ký" : "Bật chế độ thư ký"}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
                ${isSec ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Dòng thông tin/lỗi ngắn gọn (chỉ khi có vấn đề về push) */}
      {(!pushReady && (notifPerm === "denied" || pushError || iosBlocked)) && (
        <div className="px-3 pb-2">
          <div className="text-[12px] text-amber-700" aria-live="polite">
            {notifPerm === "denied"
              ? "Trình duyệt đang chặn quyền thông báo. Vui lòng mở quyền trong Cài đặt trình duyệt."
              : (iosBlocked
                  ? "Trên iOS, hãy thêm ứng dụng lên Màn hình chính để bật thông báo đẩy."
                  : pushError)}
          </div>
        </div>
      )}
    </div>
  );
}
