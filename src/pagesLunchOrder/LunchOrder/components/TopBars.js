// src/pages/Lunch/components/TopBars.jsx
import React from "react";

export function ResetBar({ onExit }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 shadow-lg backdrop-blur-sm flex items-center gap-3" role="status" aria-live="polite">
      <span className="text-xs font-medium">Đang ở chế độ đặt lại – các thay đổi chưa lưu</span>
      <button
        onClick={onExit}
        className="inline-flex items-center justify-center px-3 h-8 rounded-full text-xs bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition shadow-sm"
        title="Khôi phục lựa chọn đã sao lưu và thoát chế độ đặt lại"
      >
        Tắt đặt lại
      </button>
    </div>
  );
}

export function EditingBanner({ dayText, onCancel, onSave, saving }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-lg backdrop-blur-sm flex items-center gap-2">
      <span className="text-xs font-medium">Đang đổi: {dayText}</span>
      <button
        onClick={onCancel}
        disabled={saving}
        className="inline-flex items-center justify-center px-3 h-8 rounded-full text-xs bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-60"
        title="Huỷ đổi và khôi phục lại như cũ"
      >
        Huỷ đổi
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center justify-center gap-2 px-3 h-8 rounded-full text-xs text-white bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-60"
        title="Lưu thay đổi ngày này"
      >
        {saving && <span className="animate-spin mr-1">⏳</span>}
        Lưu thay đổi
      </button>
    </div>
  );
}

export function PushInfoBar({ show, pushReady, enablePush, disablePush, busy }) {
  if (!show) return null;
  return (
    <div className="mx-2 mb-3 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm p-3 flex items-center justify-between">
      <div className="text-sm text-slate-700">
        {pushReady ? "Đang bật thông báo đặt cơm" : "Bạn có thể bật thông báo để được nhắc khi có menu/khoá menu"}
      </div>
      <div className="flex gap-2">
        <button
          onClick={enablePush}
          disabled={busy || pushReady}
          className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-emerald-500/90 text-white text-[12px] shadow-sm hover:shadow transition-shadow hover:bg-emerald-500 disabled:opacity-50"
        >
          Bật thông báo
        </button>
        {pushReady && (
          <button
            onClick={disablePush}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-white text-slate-700 text-[12px] border border-slate-200 hover:bg-slate-50 shadow-sm transition"
          >
            Tắt
          </button>
        )}
      </div>
    </div>
  );
}
