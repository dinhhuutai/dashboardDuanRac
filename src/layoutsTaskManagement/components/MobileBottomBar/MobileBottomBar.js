// MobileBottomBar.jsx
import React from "react";
import { FolderKanban, CheckSquare } from "lucide-react";

export default function MobileBottomBar({ phase, onPhaseChange }) {
  return (
    <div className="fixed inset-x-0 bottom-3 z-40 md:hidden flex justify-center pointer-events-none">
      <div className="w-full max-w-screen-sm px-4 pointer-events-auto">
        {/* Thanh bo tròn chính – pastel + neumorphism */}
        <div className="rounded-[999px] border border-white/70 bg-gradient-to-r from-indigo-50 via-sky-50 to-purple-50 shadow-[0_12px_30px_rgba(15,23,42,0.15)] px-2 py-2 flex gap-2">
          <NeumorphicTab
            active={phase === "work"}
            onClick={() => onPhaseChange("work")}
            icon={CheckSquare}
            label="Công việc"
          />
          <NeumorphicTab
            active={phase === "projects"}
            onClick={() => onPhaseChange("projects")}
            icon={FolderKanban}
            label="Dự án"
          />
        </div>
      </div>
    </div>
  );
}

function NeumorphicTab({ active, onClick, icon: Icon, label }) {
  const base =
    "flex-1 flex items-center justify-center gap-1.5 rounded-[999px] px-4 py-2 text-[11px] sm:text-xs font-medium transition-all duration-200";

  const activeStyle =
    "bg-white/90 text-slate-800 shadow-[4px_4px_10px_rgba(148,163,184,0.55),-4px_-4px_10px_rgba(255,255,255,0.95)]";
  const inactiveStyle =
    "bg-transparent text-slate-500 shadow-[2px_2px_6px_rgba(148,163,184,0.4),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:bg-white/60";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${active ? activeStyle : inactiveStyle}`}
    >
      <Icon
        className={`h-5 w-5 ${
          active ? "text-indigo-500" : "text-slate-400"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}
