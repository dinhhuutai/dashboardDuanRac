// src/pages/Lunch/UserOrderSlide/components/ResetBar.jsx
import React from "react";

export default function ResetBar({ visible, onExit }) {
  if (!visible) return null;
  return (
    <div className="fixed top-3 md:top-[100px] left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 shadow-lg backdrop-blur-sm flex items-center gap-3">
      <span className="text-xs font-medium">Đang ở chế độ đặt lại – các thay đổi chưa lưu</span>
      <button
        onClick={() => onExit(true)}
        className="inline-flex items-center justify-center px-3 h-8 rounded-full text-xs bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition shadow-sm"
      >
        Tắt đặt lại
      </button>
    </div>
  );
}
