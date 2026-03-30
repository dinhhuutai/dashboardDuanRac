import React from "react";
import { motion } from "framer-motion";

export default function OrderTypeToggle({
  visible,
  orderType,
  onChangeType,
  className = "",
  compact = false,
}) {
  if (!visible) return null;

  const shell = compact
    ? "rounded-xl p-0.5"
    : "rounded-2xl p-1";
  const btn = compact
    ? "px-2.5 py-1 rounded-lg text-xs"
    : "px-4 py-2 rounded-xl text-sm";
  const minW = compact ? 78 : 112;

  return (
    <div className={`relative inline-flex items-center bg-white border border-slate-200 shadow-sm ${shell} ${className}`}>
      {[
        { k: "re", label: "Ca ngày" },
        { k: "ws", label: "Đi ca" },
        { k: "ot", label: "Tăng ca" },
      ].map((t) => (
        <button
          key={t.k}
          type="button"
          onClick={() => onChangeType(t.k)}
          className={`relative z-10 ${btn} font-medium transition whitespace-nowrap ${
            orderType === t.k
              ? "text-emerald-800 font-semibold"
              : "text-slate-600 hover:text-slate-800"
          }`}
          style={{ minWidth: minW }}
        >
          {t.label}
          {orderType === t.k && (
            <motion.span
              layoutId="pill-orderType"
              className={`absolute inset-0 -z-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm ${compact ? "rounded-lg" : "rounded-xl"}`}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}