import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function NoticeModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-[200] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl max-w-md w-full border border-white/40"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60">
              <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
            <div className="px-5 py-3 border-t border-slate-200/60 flex justify-end">
              <button onClick={onClose} className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow">
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
