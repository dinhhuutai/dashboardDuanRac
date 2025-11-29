// src/pageTaskManagement/MyTasks/CalendarView.jsx
import React, { useMemo } from "react";
import { StatusBadge } from "./TaskUI";

// Chỉ lấy HH:mm
function formatTimeLabel(t) {
  if (!t) return "";
  if (typeof t === "string") {
    // ISO: 1970-01-01T08:00:00.000Z
    const isoMatch = t.match(/T(\d{2}:\d{2})/);
    if (isoMatch) return isoMatch[1];

    // HH:mm[:ss]
    const parts = t.split(":");
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return t;
  }
  try {
    return new Date(t).toTimeString().slice(0, 5); // HH:mm
  } catch {
    return "";
  }
}

export default function CalendarView({ loading, rows, onTaskClick }) {
  const groups = useMemo(() => {
    const m = new Map();
    for (const r of rows || []) {
      // nhóm theo ngày làm việc (workDate từ API), fallback startDate
      const k =
        r.workDate ||
        (r.startDate ? String(r.startDate).slice(0, 10) : "");
      if (!k) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return Array.from(m.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, items]) => ({ date, items }));
  }, [rows]);

  return (
    <div className="card p-4 md:p-5">
      {loading && (
        <div className="py-10 text-center text-slate-500 text-sm">
          Đang tải dữ liệu lịch công việc…
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="py-10 text-center text-slate-400 text-sm">
          Không có công việc nào trong khoảng thời gian đã chọn.
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {groups.map((g) => {
            const d = new Date(g.date);
            const dayLabel = d.toLocaleDateString("vi-VN", {
              weekday: "short",
              day: "2-digit",
              month: "2-digit",
            });

            return (
              <div
                key={g.date}
                className="rounded-2xl border border-slate-200 bg-white p-3 flex flex-col gap-2"
              >
                {/* Header ngày */}
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-semibold text-slate-800">
                    {dayLabel}
                  </div>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                    {g.items.length} việc
                  </span>
                </div>

                {/* Danh sách công việc */}
                <div className="space-y-2">
                  {g.items.map((it) => {
                    const startTimeLabel = formatTimeLabel(it.startTime);
                    const dueTimeLabel = formatTimeLabel(it.dueTime);

                    // highlight theo ưu tiên
                    let priorityHighlight = "";
                    if (it.priority === "urgent") {
                      priorityHighlight = "border-l-4 border-l-rose-500";
                    } else if (it.priority === "high") {
                      priorityHighlight = "border-l-4 border-l-amber-400";
                    } else if (it.priority === "normal") {
                      priorityHighlight = "border-l-4 border-l-sky-300";
                    } else {
                      priorityHighlight = "border-l-4 border-l-slate-200";
                    }

                    // % tiến độ
                    const rawProgress = Number.isFinite(+it.progressPercent)
                      ? +it.progressPercent
                      : 0;
                    const progress = Math.min(
                      100,
                      Math.max(0, rawProgress || 0)
                    );

                    // ngày
                    const startLabel = it.startDate
                      ? new Date(it.startDate).toLocaleDateString("vi-VN")
                      : "";
                    const dueLabel = it.dueDate
                      ? new Date(it.dueDate).toLocaleDateString("vi-VN")
                      : "";
                    const completedLabel = it.completedDate
                      ? new Date(it.completedDate).toLocaleDateString("vi-VN")
                      : "";

                    // ───── Trễ hạn / Hoàn thành ─────
                    const isDone = it.statusCode === "done";

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    let isOverdue = false;
                    if (!isDone && !it.repeatDaily && it.dueDate) {
                      const due = new Date(it.dueDate);
                      due.setHours(0, 0, 0, 0);
                      isOverdue = due < today;
                    }

                    let stateClasses = "bg-slate-50/40 border-slate-200";
                    if (isOverdue) {
                      stateClasses =
                        "bg-rose-50/70 border-rose-200 ring-1 ring-rose-100";
                    } else if (isDone) {
                      stateClasses = "bg-emerald-50/70 border-emerald-200";
                    }

                    // 🔹 attachments
                    const attachmentCount = it.attachmentCount || 0;
                    const hasAttachment = attachmentCount > 0;

                    return (
                      <div
                        key={it.taskId}
                        onClick={() => onTaskClick?.(it.taskId)}
                        className={`
                          relative
                          p-2.5 rounded-xl border flex items-start justify-between gap-2
                          cursor-pointer transition-all
                          hover:bg-slate-50/60
                          ${priorityHighlight} ${stateClasses}
                        `}
                      >
                        <div className="min-w-0 flex-1">
                          {/* Tiêu đề + badge trạng thái mạnh */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 text-[10px] font-semibold text-rose-700 border border-rose-200">
                                ● Trễ hạn
                              </span>
                            )}
                            {isDone && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                ✓ Đã hoàn thành
                              </span>
                            )}
                            <div className="text-xs font-semibold text-slate-800 line-clamp-2">
                              {it.title}
                            </div>
                          </div>

                          {/* Info: tạo, giao, bắt đầu / hoàn thành */}
                          <div className="mt-0.5 flex flex-col gap-0.5 text-[11px] text-slate-500">
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              {it.createdByName && (
                                <span className="truncate max-w-[100%]">
                                  <span className="font-medium text-slate-600">
                                    Tạo:
                                  </span>{" "}
                                  {it.createdByName}
                                </span>
                              )}
                              {it.assigneeNames && (
                                <span className="truncate max-w-[100%]">
                                  <span className="font-medium text-slate-600">
                                    Giao cho:
                                  </span>{" "}
                                  {it.assigneeNames}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                              {startLabel && (
                                <span>
                                  <span className="font-medium text-slate-600">
                                    Bắt đầu:
                                  </span>{" "}
                                  {startLabel}
                                  {startTimeLabel && (
                                    <span className="text-slate-400">
                                      {" "}
                                      ({startTimeLabel})
                                    </span>
                                  )}
                                </span>
                              )}
                              {completedLabel && (
                                <span>
                                  <span className="font-medium text-slate-600">
                                    Hoàn thành:
                                  </span>{" "}
                                  {completedLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Thanh tiến độ */}
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="w-9 text-right">
                              {Math.round(progress)}%
                            </span>
                          </div>

                          {/* Hạn + giờ kết thúc hoặc lặp ngày */}
                          {!it.repeatDaily && it.dueDate && (
                            <div className="mt-0.5 text-[11px]">
                              <span
                                className={
                                  isOverdue
                                    ? "text-rose-600 font-semibold"
                                    : "text-slate-500"
                                }
                              >
                                Hạn: {dueLabel}
                                {dueTimeLabel && (
                                  <span className="text-slate-400">
                                    {" "}
                                    ({dueTimeLabel})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}

                          {it.repeatDaily && (
                            <div className="mt-1 text-[10px] inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Lặp hằng ngày
                            </div>
                          )}
                        </div>

                        <div className="ml-1 shrink-0">
                          <StatusBadge statusCode={it.statusCode} small />
                        </div>

                        {/* 🔹 Icon tệp góc dưới bên phải */}
                        {hasAttachment && (
                          <div className="absolute bottom-2 right-2">
                            <span
                              className="
                                inline-flex items-center gap-1
                                rounded-full bg-slate-100 border border-slate-200
                                px-2 py-0.5
                                text-[10px] font-medium text-slate-700
                              "
                            >
                              <span>📎</span>
                              <span>{attachmentCount} tệp</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
