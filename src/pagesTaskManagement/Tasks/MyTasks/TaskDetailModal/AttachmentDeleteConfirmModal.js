// src/pageTaskManagement/MyTasks/AttachmentDeleteConfirmModal.jsx
import React from "react";

export default function AttachmentDeleteConfirmModal({
  attachment,
  deleting,
  onCancel,
  onConfirm,
}) {
  if (!attachment) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 z-[9999]">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 px-4 py-3 md:px-6 md:py-4 max-w-sm w-full">
        <h3 className="text-sm font-semibold text-slate-900">
          Xoá tệp đính kèm?
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Tệp{" "}
          <span className="font-medium">{attachment.fileName}</span> sẽ được
          xoá khỏi công việc này. Bạn có chắc chắn muốn tiếp tục?
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center rounded-full border border-rose-500 bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-60 hover:bg-rose-500"
          >
            {deleting ? "Đang xoá…" : "Xoá tệp"}
          </button>
        </div>
      </div>
    </div>
  );
}
