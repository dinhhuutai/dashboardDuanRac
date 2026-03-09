import React from "react";
import { motion } from "framer-motion";

export default function OrderTypeToggle({
  visible,
  orderType,
  onChangeType,
  className = "",
}) {
  if (!visible) return null;

  return (
    <div className={`relative inline-flex items-center rounded-2xl bg-white border border-slate-200 shadow-sm p-1 ${className}`}>
      {[
        { k: "re", label: "Ca ngày" },
        { k: "ws", label: "Đi ca" },
        { k: "ot", label: "Tăng ca" },
      ].map((t) => (
        <button
          key={t.k}
          type="button"
          onClick={() => onChangeType(t.k)}
          className={`relative z-10 px-4 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap ${
            orderType === t.k
              ? "text-emerald-800 font-semibold"
              : "text-slate-600 hover:text-slate-800"
          }`}
          style={{ minWidth: 112 }}
        >
          {t.label}
          {orderType === t.k && (
            <motion.span
              layoutId="pill-orderType"
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}