// SegmentedControl.jsx (chỉ phần liên quan)
export default function SegmentedControl({ value, onChange, options, className="" }) {
  const count = options.length;
  const activeIdx = Math.max(0, options.findIndex(o => o.v === value));

  // 0.5rem = 8px (p-1 hai bên)
  const highlightStyle = {
    width: `calc((100% - 0.5rem) / ${count})`,
    transform: `translateX(${activeIdx * 100}%)`,
  };

  return (
    <div
      className={[
        "relative inline-flex w-full max-w-[480px] overflow-hidden",   // ✅ chặn tràn
        "rounded-2xl p-1 bg-white/80 ring-1 ring-slate-200 shadow-sm backdrop-blur-sm",
        className,
      ].join(" ")}
      role="tablist"
      aria-label="Chọn loại suất"
    >
      {/* ✅ highlight: bám padding & tính đúng chiều rộng thực tế */}
      <div
        className="absolute inset-1 rounded-xl bg-emerald-600/10 shadow-inner
                   transition-transform duration-300 ease-out"
        style={highlightStyle}
        aria-hidden
      />

      <div className="relative z-10 flex w-full gap-1">
        {options.map(op => {
          const active = op.v === value;
          return (
            <button
              key={op.v}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange?.(op.v)}
              className={[
                "flex-1 px-3 py-2 rounded-xl text-sm font-medium",
                "transition-colors duration-200",
                active ? "text-emerald-700" : "text-slate-700 hover:text-slate-900",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70",
                "flex items-center justify-center gap-2 whitespace-nowrap",
              ].join(" ")}
              title={op.label}
            >
              {op.icon && <span className="text-[14px] shrink-0">{op.icon}</span>}
              <span className="truncate">{op.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
