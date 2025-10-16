import React, { useRef } from "react";

export default function QuantityStepper({ value = 1, min = 1, onChange, disabled }) {
  const holdRef = useRef(null);
  const clamp = (v) => Math.max(min, Number.isFinite(+v) ? parseInt(v, 10) : min);

  const apply = (next) => {
    if (disabled) return;
    // Cho phép truyền setState dạng hàm
    if (typeof next === "function") onChange?.((prev) => clamp(next(prev)));
    else onChange?.(clamp(next));
  };

  const startHold = (delta) => (e) => {
    e.stopPropagation();
    if (disabled) return;
    apply((value ?? min) + delta); // click 1 lần
    // giữ để lặp
    const id = setInterval(() => apply((prev) => (typeof prev === "number" ? prev + delta : (value ?? min) + delta)), 120);
    holdRef.current = id;
  };
  const stopHold = () => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  return (
    <div
      className="inline-flex items-center rounded-full bg-white/90 backdrop-blur border border-slate-200 shadow-sm h-10 select-none"
      role="group"
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.preventDefault()}
      onMouseUp={stopHold}
      onMouseLeave={stopHold}
      onTouchEnd={stopHold}
    >
      <button
        type="button"
        aria-label="Giảm"
        disabled={disabled || value <= min}
        onClick={(e) => { e.stopPropagation(); apply(value - 1); }}
        onMouseDown={startHold(-1)}
        onTouchStart={startHold(-1)}
        className={`w-10 h-10 rounded-l-full grid place-items-center border-r border-slate-200
          ${disabled ? "text-slate-300" : "hover:bg-slate-50 active:scale-95"}`}
      >
        −
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, "");
          apply(raw === "" ? min : parseInt(raw, 10));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") { e.preventDefault(); apply(value + 1); }
          if (e.key === "ArrowDown") { e.preventDefault(); apply(value - 1); }
          if (e.key === "Enter" || e.key === " ") e.preventDefault();
        }}
        className="w-14 text-center outline-none bg-transparent text-slate-800 font-medium"
      />

      <button
        type="button"
        aria-label="Tăng"
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); apply(value + 1); }}
        onMouseDown={startHold(1)}
        onTouchStart={startHold(1)}
        className={`w-10 h-10 rounded-r-full grid place-items-center border-l border-slate-200
          ${disabled ? "text-slate-300" : "hover:bg-slate-50 active:scale-95"}`}
      >
        +
      </button>
    </div>
  );
}
