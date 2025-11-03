// src/pages/Lunch/components/OrderTypeToggle.jsx
import React from "react";
import { motion } from "framer-motion";

export default function OrderTypeToggle({ orderType, onChange, onAfterChange }) {
  const tabs = [
    { k: "re", label: "Bình thường" },
    { k: "ws", label: "Đi ca" },
    { k: "ot", label: "Tăng ca" },
  ];
  return (
    <div className="relative inline-flex bg-white/70 backdrop-blur rounded-xl p-1 border border-slate-200 shadow-sm">
      {tabs.map((t) => (
        <button
          key={t.k}
          onClick={() => { onChange?.(t.k); onAfterChange?.(t.k); }}
          className={`relative z-10 px-4 py-2 text-sm rounded-lg transition
            ${orderType === t.k ? "text-emerald-800 font-semibold" : "text-slate-600 hover:text-slate-800"}`}
          style={{ minWidth: 120 }}
        >
          {t.label}
          {orderType === t.k && (
            <motion.span
              layoutId="pill-orderType"
              className="absolute inset-0 -z-10 rounded-lg bg-white shadow"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
