import React from "react";
import { motion } from "framer-motion";
import { FaSun, FaMoon, FaBolt } from "react-icons/fa";

export default function OrderTypeToggle({ visible, orderType, onChangeType }) {
  if (!visible) return null;

  const items = [
    { k: "re", label: "Ca ngày", icon: <FaSun /> },
    { k: "ws", label: "Đi ca", icon: <FaMoon /> },
    { k: "ot", label: "Tăng ca", icon: <FaBolt /> },
  ];

  return (
    <div className="mx-[2px] mb-[4px]">
      <div
        className={[
          "relative inline-flex w-full",
          "rounded-2xl p-[6px]",
          // nền glass + viền nhẹ
          "bg-white/55 backdrop-blur-xl",
          "border border-white/70",
          // shadow kiểu Moni (mềm + nổi)
          "shadow-[0_10px_30px_rgba(15,23,42,0.10)]",
        ].join(" ")}
      >
        {/* Pill nền chạy */}
        <motion.div
          layout
          className={[
            "absolute top-[6px] bottom-[6px]",
            "rounded-xl",
            // pill trắng nổi, có viền + glow nhẹ
            "bg-white/85",
            "border border-white/80",
            "shadow-[0_10px_18px_rgba(15,23,42,0.12)]",
          ].join(" ")}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          style={{
            width: "calc((100% - 12px) / 3)",
            left:
              orderType === "re"
                ? 6
                : orderType === "ws"
                ? "calc(6px + (100% - 12px) / 3)"
                : "calc(6px + 2 * ((100% - 12px) / 3))",
          }}
        />

        {items.map((it) => {
          const active = orderType === it.k;

          return (
            <button
              key={it.k}
              type="button"
              onClick={() => onChangeType(it.k)}
              className={[
                "relative z-10 flex-1",
                "h-[44px] px-2",
                "rounded-xl",
                "transition active:scale-[0.98]",
                "select-none",
                active
                  ? "text-emerald-900"
                  : "text-slate-600 hover:text-slate-800",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={[
                    "text-[14px]",
                    active ? "opacity-100" : "opacity-80",
                  ].join(" ")}
                >
                  {it.icon}
                </span>

                <span
                  className={[
                    "text-[13px] md:text-sm",
                    active ? "font-extrabold" : "font-semibold",
                    "tracking-tight",
                  ].join(" ")}
                >
                  {it.label}
                </span>
              </div>

              {/* underline/glow rất nhẹ khi active */}
              {active && (
                <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[6px] h-[3px] w-10 rounded-full bg-emerald-300/70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
