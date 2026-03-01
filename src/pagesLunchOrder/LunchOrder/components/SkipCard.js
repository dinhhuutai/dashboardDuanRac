// src/pages/Lunch/UserOrderSlide/components/SkipCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

export default function SkipCard({
  day,
  active,
  disabled,
  onClick,
}) {
  return (
    <motion.button
      key={`none-${day}`}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onDoubleClick={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      aria-pressed={active}
      title={active ? "Đã chọn: Không ăn ngày này" : "Chọn: Không ăn ngày này"}
      className={`toy-card relative w-[220px] h-[270px] rounded-[24px] grid place-items-center cursor-pointer
        ${active ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
        bg-white/90 backdrop-blur border border-white/60 shadow-sm`}
    >
      {active && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-200 shadow">
          <FaCheck className="text-[9px]" /> Đã chọn
        </span>
      )}
      <div className="text-center">
        <span className={`text-3xl mx-auto mb-2 ${active ? "text-rose-500" : "text-slate-400"}`}>🍽️</span>
        <span className={`font-medium ${active ? "text-rose-700" : "text-slate-600"}`}>Không chọn</span>
        {active && <div className="mt-1 text-[10px] text-rose-500/90">Sẽ không đặt cơm ngày này</div>}
      </div>
      {active && <span className="absolute right-2 bottom-2 text-rose-500 opacity-80">✓</span>}
      <span className="shine" />
    </motion.button>
  );
}
