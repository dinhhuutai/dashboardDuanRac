// src/pages/Home/components/ThemeToggle.jsx
import React, { useEffect, useRef, useState } from "react";
import { BsStars, BsSnow, BsUmbrella } from "react-icons/bs";
import { RiRedPacketLine } from "react-icons/ri";
import { GiLantern } from "react-icons/gi";

const THEMES = [
  { key: "normal", label: "Mặc định", icon: BsStars, accent: "#6366f1" },
  { key: "tet", label: "Tết", icon: RiRedPacketLine, accent: "#ef4444" },
  { key: "summer", label: "Hè", icon: BsUmbrella, accent: "#06b6d4" },
  { key: "midautumn", label: "Trung thu", icon: GiLantern, accent: "#f59e0b" },
  { key: "noel", label: "Noel", icon: BsSnow, accent: "#22c55e" },
];

function ThemeToggle({ value, onChange }) {
  const containerRef = useRef(null);
  const btnRefs = useRef({});
  const [slider, setSlider] = useState({ left: 0, width: 0, height: 0 });

  const updateSlider = () => {
    const el = btnRefs.current[value];
    const parent = containerRef.current;
    if (!el || !parent) return;
    const parentRect = parent.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setSlider({
      left: rect.left - parentRect.left,
      width: rect.width,
      height: rect.height,
    });
  };

  useEffect(() => {
    updateSlider();
  }, [value]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ro = new ResizeObserver(() => updateSlider());
    ro.observe(containerRef.current);

    const onResize = () => updateSlider();
    window.addEventListener("resize", onResize);

    const id = setTimeout(updateSlider, 0);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(id);
    };
  }, []);

  return (
    <div
      role="tablist"
      aria-label="Chọn giao diện"
      ref={containerRef}
      className="relative inline-flex items-center gap-1 rounded-2xl bg-white/80 backdrop-blur px-1 py-1 ring-1 ring-slate-200 shadow-sm overflow-hidden"
    >
      <div
        className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-xl bg-slate-900/90 shadow transition-all duration-300 ease-out"
        style={{
          left: slider.left,
          width: slider.width,
          height: slider.height - 8,
        }}
      />

      {THEMES.map(({ key, label, icon: Icon, accent }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            ref={(el) => (btnRefs.current[key] = el)}
            className={`group relative z-10 flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition
              ${
                active
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            title={label}
          >
            <Icon
              className={`h-4 w-4 transition-transform duration-300 ${
                active
                  ? "scale-110"
                  : "scale-100 opacity-80 group-hover:opacity-100"
              }`}
              style={active ? { color: accent } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
