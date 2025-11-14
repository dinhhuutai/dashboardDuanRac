import React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v | 0));

export default function HhMmPicker({
  hours,
  minutes,
  onChange,
  maxHours = 23,
  className = "",
}) {
  const set = (h, m) => {
    const H = clamp(h, 0, maxHours);
    const M = clamp(m, 0, 59);
    onChange?.({ hours: H, minutes: M });
  };

  const addMinutes = (delta) => {
    let total = hours * 60 + minutes + delta;
    if (total < 0) total = 0;
    const H = Math.floor(total / 60);
    const M = total % 60;
    set(H, M);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hours */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2 py-1 shadow-sm">
        <button
          type="button"
          className="p-1 rounded-lg hover:bg-slate-100"
          onClick={() => set(hours - 1, minutes)}
        >
          <FiMinus />
        </button>
        <input
          type="number"
          min={0}
          max={maxHours}
          value={hours}
          onChange={(e) => set(+e.target.value, minutes)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              set(hours + 1, minutes);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              set(hours - 1, minutes);
            }
          }}
          className="w-14 text-center outline-none"
        />
        <button
          type="button"
          className="p-1 rounded-lg hover:bg-slate-100"
          onClick={() => set(hours + 1, minutes)}
        >
          <FiPlus />
        </button>
      </div>

      <span className="text-slate-500 font-semibold">:</span>

      {/* Minutes */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2 py-1 shadow-sm">
        <button
          type="button"
          className="p-1 rounded-lg hover:bg-slate-100"
          onClick={() => set(hours, minutes - 1)}
        >
          <FiMinus />
        </button>
        <input
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => set(hours, +e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              set(hours, minutes + 1);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              set(hours, minutes - 1);
            }
          }}
          className="w-14 text-center outline-none"
        />
        <button
          type="button"
          className="p-1 rounded-lg hover:bg-slate-100"
          onClick={() => set(hours, minutes + 1)}
        >
          <FiPlus />
        </button>
      </div>

      {/* Quick chips */}
      <div className="ml-2 flex flex-wrap gap-1">
        {[1, 5, 10].map((m) => (
          <button
            key={`+${m}`}
            type="button"
            onClick={() => addMinutes(m)}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            +{m}m
          </button>
        ))}
        {[-1, -5, -10].map((m) => (
          <button
            key={`${m}`}
            type="button"
            onClick={() => addMinutes(m)}
            className="px-2 py-1 text-xs rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
