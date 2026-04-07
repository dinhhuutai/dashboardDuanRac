import React from "react";

export default function PersistLoading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 gap-4 px-4"
      role="status"
      aria-live="polite"
      aria-label="Đang tải ứng dụng"
    >
      <div
        className="h-11 w-11 rounded-full border-2 border-pink-100 border-t-pink-600 animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium text-slate-700">Đang tải...</p>
    </div>
  );
}
