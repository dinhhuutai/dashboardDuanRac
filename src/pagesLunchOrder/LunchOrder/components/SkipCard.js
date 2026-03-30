// src/pages/Lunch/UserOrderSlide/components/SkipCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";

export default function SkipCard({
  day,
  active,
  disabled,
  onClick,
  compact = false,
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
      className={`toy-card relative grid place-items-center cursor-pointer
        ${compact ? "w-full max-w-[172px] h-[168px] rounded-[16px]" : "w-[220px] h-[270px] rounded-[24px]"}
        ${active ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
        bg-white/90 backdrop-blur border border-white/60 shadow-sm`}
    >
      {active && (
        <span
          className={`absolute inline-flex items-center rounded-full font-medium bg-rose-100 text-rose-700 border border-rose-200 shadow ${
            compact
              ? "top-2 right-2 gap-0.5 px-1.5 py-0.5 text-[9px]"
              : "top-3 right-3 gap-1 px-2 py-0.5 text-[10px]"
          }`}
        >
          <FaCheck className={compact ? "text-[8px]" : "text-[9px]"} /> Đã chọn
        </span>
      )}
      <div className="text-center px-1">
        <span
          className={`mx-auto block ${compact ? "text-2xl mb-1" : "text-3xl mb-2"} ${
            active ? "text-rose-500" : "text-slate-400"
          }`}
        >
          🍽️
        </span>
        <span
          className={`font-medium ${compact ? "text-xs" : ""} ${active ? "text-rose-700" : "text-slate-600"}`}
        >
          Không chọn
        </span>
        {active && (
          <div className={`text-rose-500/90 ${compact ? "mt-0.5 text-[9px]" : "mt-1 text-[10px]"}`}>
            Sẽ không đặt cơm ngày này
          </div>
        )}
      </div>
      {active && (
        <span className={`absolute text-rose-500 opacity-80 ${compact ? "right-1.5 bottom-1.5 text-sm" : "right-2 bottom-2"}`}>
          ✓
        </span>
      )}
      <span className="shine" />
    </motion.button>
  );
}
