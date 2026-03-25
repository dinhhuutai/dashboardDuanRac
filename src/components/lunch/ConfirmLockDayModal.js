import React from "react";
import { FaLock, FaSpinner } from "react-icons/fa";

export default function ConfirmLockDayModal({
  open,
  dayText = "",
  busy = false,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center">
              <FaLock />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">Xác nhận chốt ngày</div>
              <div className="text-sm text-slate-500">Sau khi chốt sẽ không sửa hoặc huỷ món ngày này.</div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="text-slate-700">
            Bạn có chắc muốn <span className="font-semibold text-slate-900">chốt {dayText}</span> không?
          </div>
        </div>

        <div className="px-5 pb-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-60"
          >
            {busy ? <FaSpinner className="animate-spin" /> : <FaLock />}
            {busy ? "Đang chốt..." : "Xác nhận chốt"}
          </button>
        </div>
      </div>
    </div>
  );
}