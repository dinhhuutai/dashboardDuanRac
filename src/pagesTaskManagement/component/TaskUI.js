// src/pageTaskManagement/MyTasks/TaskUI.jsx
import React from "react";

export function LabelSmall({ children }) {
  return (
    <div className="text-[11px] font-medium text-slate-500 mb-1 uppercase tracking-wide">
      {children}
    </div>
  );
}

export function ViewChip({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function StatusBadge({ statusCode, small }) {
  let label = "Không rõ";
  let cls = "bg-slate-100 text-slate-700 border-slate-200";

  switch (statusCode) {
    case "todo":
      label = "Cần làm";
      cls = "bg-slate-100 text-slate-700 border-slate-200";
      break;
    case "doing":
      label = "Đang làm";
      cls = "bg-sky-100 text-sky-800 border-sky-200";
      break;
    case "review":
      label = "Chờ duyệt";
      cls = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case "done":
      label = "Hoàn thành";
      cls = "bg-emerald-100 text-emerald-800 border-emerald-200";
      break;
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 font-medium",
        small ? "text-[10px]" : "text-[11px]",
        cls,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, small }) {
  let label = "—";
  let cls = "bg-slate-100 text-slate-700 border-slate-200";

  switch (priority) {
    case "low":
      label = "Thấp";
      cls = "bg-slate-100 text-slate-700 border-slate-200";
      break;
    case "normal":
      label = "Bình thường";
      cls = "bg-sky-100 text-sky-800 border-sky-200";
      break;
    case "high":
      label = "Cao";
      cls = "bg-amber-100 text-amber-800 border-amber-200";
      break;
    case "urgent":
      label = "Khẩn cấp";
      cls =
        "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-300";
      break;
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 font-medium",
        small ? "text-[10px] shadow-none" : "text-[11px]",
        cls,
      ].join(" ")}
    >
      {label}
    </span>
  );
}

