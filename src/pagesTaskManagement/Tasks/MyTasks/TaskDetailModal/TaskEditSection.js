// src/pageTaskManagement/MyTasks/TaskEditSection.jsx
import React from "react";
import { LabelSmall } from "../TaskUI";

export default function TaskEditSection({
  description,
  onDescriptionChange,
  statusCode,
  onStatusChange,
  repeatDaily,
  onToggleRepeatDaily,
  safeProgress,
  onProgressSliderChange,
  onProgressInputChange,
  statusOptions,
}) {
  return (
    <div className="border-t border-slate-200 pt-3 space-y-4">
      <div>
        <LabelSmall>Mô tả</LabelSmall>
        <textarea
          rows={3}
          className="inset w-full px-3 py-2 text-sm outline-none"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Mô tả chi tiết yêu cầu, ghi chú, kết quả mong đợi…"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <LabelSmall>Trạng thái</LabelSmall>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {statusOptions.map((s) => {
              const active = statusCode === s.value;
              let activeClasses = "";
              if (s.value === "todo") {
                activeClasses = "bg-slate-900 text-white border-slate-900";
              } else if (s.value === "doing") {
                activeClasses = "bg-sky-600 text-white border-sky-600";
              } else if (s.value === "review") {
                activeClasses = "bg-amber-500 text-white border-amber-500";
              } else if (s.value === "done") {
                activeClasses = "bg-emerald-600 text-white border-emerald-600";
              }

              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => onStatusChange(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${
                      active
                        ? activeClasses + " shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 md:mt-6">
          <button
            type="button"
            onClick={onToggleRepeatDaily}
            className={`inline-flex items-center justify-between w-full max-w-xs rounded-full px-3 py-1.5 text-xs font-medium border transition
              ${
                repeatDaily
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-600"
              }`}
          >
            <span>Lặp lại hằng ngày</span>
            <span
              className={`inline-flex h-4 w-7 items-center rounded-full transition
                ${repeatDaily ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span
                className={`h-3 w-3 rounded-full bg-white shadow transform transition
                  ${repeatDaily ? "translate-x-3" : "translate-x-1"}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div>
        <LabelSmall>Tiến độ hoàn thành (%)</LabelSmall>
        <div className="mt-1 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              Kéo để cập nhật tiến độ
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              {safeProgress}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={safeProgress}
              onChange={(e) => onProgressSliderChange(e.target.value)}
              className="flex-1 accent-emerald-500"
            />
            <input
              type="number"
              min={0}
              max={100}
              className="inset w-16 px-2 py-1 text-xs text-center outline-none"
              value={safeProgress}
              onChange={(e) => onProgressInputChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
