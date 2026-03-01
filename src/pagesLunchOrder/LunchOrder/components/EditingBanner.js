// src/pages/Lunch/UserOrderSlide/components/EditingBanner.jsx
import React from "react";
import { FaSpinner } from "react-icons/fa";

export default function EditingBanner({
  visible,
  dayText,
  isSaving,
  savingDay,
  onCancel,
  onSave,
}) {
  if (!visible) return null;
  return (
    <div className="fixed top-3 md:top-[100px] left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-lg backdrop-blur-sm flex items-center gap-2">
      <span className="text-xs font-medium">Đang đổi: {dayText}</span>
      <button
        onClick={onCancel}
        disabled={isSaving}
        className="inline-flex items-center justify-center px-3 h-8 rounded-full text-xs bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-60"
      >
        Huỷ đổi
      </button>
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center justify-center gap-2 px-3 h-8 rounded-full text-xs text-white bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-60"
      >
        {savingDay && <FaSpinner className="animate-spin" />} Lưu thay đổi
      </button>
    </div>
  );
}
