import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

export default function ConfirmCancelModal({ open, foodName, dayText, onCancel, onConfirm, busy }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/45 z-[210] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-md w-full border border-white/60"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="px-5 py-4 border-b border-slate-200/60">
              <h3 className="font-semibold text-lg text-slate-800">Xác nhận huỷ cơm</h3>
            </div>

            <div className="px-5 py-4 text-slate-700">
              <p>Bạn có chắc chắn muốn huỷ món <b>{foodName}</b> ({dayText}) không?</p>
              <p className="text-sm text-slate-500 mt-1">Thao tác này sẽ bỏ lựa chọn cho ngày này.</p>
            </div>

            <div className="px-5 py-3 border-t border-slate-200/60 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 disabled:opacity-60"
              >
                Bỏ qua
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow disabled:opacity-60 inline-flex items-center gap-2"
              >
                {busy && <FaSpinner className="animate-spin" />}
                Xác nhận huỷ
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
