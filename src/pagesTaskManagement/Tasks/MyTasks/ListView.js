// src/pageTaskManagement/MyTasks/ListView.jsx
import React from "react";
import { StatusBadge, PriorityBadge } from "./TaskUI";

// 👉 helper chỉ lấy HH:mm
function formatTimeHM(v) {
  if (!v) return "";
  if (typeof v === "string") {
    // dạng ISO: 1970-01-01T08:00:00.000Z
    const isoMatch = v.match(/T(\d{2}:\d{2})/);
    if (isoMatch) return isoMatch[1];

    // dạng HH:mm:ss hoặc HH:mm
    const parts = v.split(":");
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return v;
  }

  // nếu driver trả Date
  try {
    return new Date(v).toTimeString().slice(0, 5); // HH:mm
  } catch {
    return "";
  }
}

// 👉 render badge file đính kèm theo mimeType
function AttachmentBadge({ row }) {
  const count = row.attachmentCount || 0;
  if (!count) return null;

  return (
    <div
      className="
        absolute right-3 bottom-2
        md:right-4 md:bottom-2
        flex items-center gap-1 text-[11px] text-slate-600
      "
    >
      <div
        className="
          inline-flex items-center gap-1
          rounded-full bg-slate-100 px-2 py-[2px]
          border border-slate-200
        "
      >
        <span className="text-xs">📎</span>
        <span className="text-[11px] whitespace-nowrap">
          {count} tệp
        </span>
      </div>
    </div>
  );
}

export default function ListView({
  loading,
  rows,
  page,
  pageSize,
  totalRows,
  setPage,
  onTaskClick,
}) {
  const totalPages = Math.max(1, Math.ceil((totalRows || 0) / pageSize));

  return (
    <div className="card overflow-hidden">
      {/* Header row (desktop) */}
      <div className="hidden md:grid grid-cols-12 px-4 py-3 text-[13px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-200">
        <div className="w-10 text-center">#</div>
        <div className="col-span-4">Tiêu đề</div>
        <div className="col-span-2">Dự án</div>
        <div className="col-span-2">Trạng thái</div>
        <div className="col-span-1">Ưu tiên</div>
        <div className="col-span-2 text-right">Hạn hoàn thành</div>
      </div>

      {/* Body */}
      {loading && (
        <div className="px-4 py-10 text-center text-slate-500 text-sm">
          Đang tải dữ liệu công việc…
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="px-4 py-10 text-center text-slate-400 text-sm">
          Chưa có công việc nào phù hợp bộ lọc.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="px-2 py-2 md:px-0 md:py-0">
          {rows.map((r, i) => {
            const rowIndex = (page - 1) * pageSize + i + 1;

            const dueLabel = r.dueDate
              ? new Date(r.dueDate).toLocaleDateString("vi-VN")
              : "-";
            const startLabel = r.startDate
              ? new Date(r.startDate).toLocaleDateString("vi-VN")
              : "";
            const completedLabel = r.completedDate
              ? new Date(r.completedDate).toLocaleDateString("vi-VN")
              : "";

            const startTimeLabel = formatTimeHM(r.startTime);
            const dueTimeLabel = formatTimeHM(r.dueTime);

            // trạng thái
            const isDone = r.statusCode === "done";
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let isOverdue = false;
            if (!isDone && !r.repeatDaily && r.dueDate) {
              const due = new Date(r.dueDate);
              due.setHours(0, 0, 0, 0);
              isOverdue = due < today;
            }

            // zebra
            const zebra =
              i % 2 === 0 ? "md:bg-white" : "md:bg-slate-50/80";

            // highlight ưu tiên
            let priorityHighlight = "";
            if (r.priority === "urgent") {
              priorityHighlight =
                "md:border-l-4 md:border-l-rose-500 border-l-4 border-l-rose-500 md:bg-rose-50/60";
            } else if (r.priority === "high") {
              priorityHighlight =
                "md:border-l-4 md:border-l-amber-400 border-l-4 border-l-amber-400 md:bg-rose-50/60";
            } else if (r.priority === "normal") {
              priorityHighlight =
                "md:border-l-4 md:border-l-sky-300 border-l-4 border-l-sky-300 md:bg-rose-50/60";
            } else {
              priorityHighlight =
                "md:border-l-4 md:border-l-slate-200 border-l-4 border-l-slate-200 md:bg-rose-50/60";
            }

            // class theo state
            let stateHighlight = "";
            if (isOverdue) {
              stateHighlight =
                "bg-rose-50/60 md:bg-rose-50/70 border-rose-200 ring-1 ring-rose-100";
            } else if (isDone) {
              stateHighlight =
                "bg-emerald-50/60 md:bg-emerald-50/70 border-emerald-200";
            } else {
              stateHighlight = "bg-white";
            }

            // tiến độ
            const rawProgress = Number.isFinite(+r.progressPercent)
              ? +r.progressPercent
              : 0;
            const progress = Math.min(100, Math.max(0, rawProgress));

            return (
              <div
                key={r.taskId}
                onClick={() => onTaskClick?.(r.taskId)}
                className={`
                  relative
                  ${zebra} ${priorityHighlight} ${stateHighlight}
                  px-3 md:px-4 py-3
                  text-[12px] md:text-[13px]
                  flex flex-col gap-1
                  md:grid md:grid-cols-12 md:items-center
                  cursor-pointer
                  transition-all duration-150
                  hover:bg-slate-50/80 hover:-translate-y-[0.5px]
                  border rounded-2xl md:rounded-none mb-2
                  md:mb-0 md:border-0 md:border-b md:border-slate-100
                `}
              >
                {/* # index */}
                <div className="flex items-center gap-2 md:block md:w-10 text-slate-400 mb-1 md:mb-0">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] md:bg-transparent md:h-5 md:w-5 md:text-[12px]">
                    {rowIndex}
                  </span>
                </div>

                {/* Tiêu đề + info */}
                <div className="flex-1 md:col-span-4 md:pr-2">
                  {/* Tiêu đề + badge trạng thái */}
                  <div className="flex flex-wrap items-center gap-2">
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
                    <div className="font-semibold text-slate-900 line-clamp-2">
                      {r.title}
                    </div>
                  </div>

                  {/* Info: tạo, giao, bắt đầu, hoàn thành */}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    {r.createdByName && (
                      <span>
                        <span className="font-medium text-slate-600">
                          Tạo:
                        </span>{" "}
                        {r.createdByName}
                      </span>
                    )}

                    {r.assigneeNames && (
                      <span>
                        <span className="font-medium text-slate-600">
                          Giao cho:
                        </span>{" "}
                        {r.assigneeNames}
                      </span>
                    )}

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

                  {/* Thanh tiến độ */}
                  <div className="mt-1 w-full md:w-[70%] flex items-center gap-2 text-[11px] text-slate-500">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="w-10 text-right">
                      {Math.round(progress)}%
                    </span>
                  </div>

                  {/* 👉 Badge tệp đính kèm */}
                  <AttachmentBadge row={r} />

                  {/* Dòng phụ (mobile) */}
                  <div className="mt-1 md:hidden text-[11px] text-slate-500 space-y-0.5">
                    {r.projectCode && (
                      <div className="truncate">
                        <span className="font-medium text-slate-600">
                          Dự án:
                        </span>{" "}
                        {r.projectCode}
                      </div>
                    )}
                    <div className="flex items-center flex-wrap gap-2">
                      <StatusBadge statusCode={r.statusCode} small />
                      <PriorityBadge priority={r.priority} small />
                    </div>
                    {!r.repeatDaily && (
                      <div>
                        Hạn: <b>{dueLabel}</b>
                        {dueTimeLabel && (
                          <span className="text-slate-400">
                            {" "}
                            ({dueTimeLabel})
                          </span>
                        )}
                      </div>
                    )}
                    {r.repeatDaily && (
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 border border-emerald-100">
                        Lặp hằng ngày
                      </div>
                    )}
                  </div>
                </div>

                {/* Dự án (desktop) */}
                <div className="hidden md:block md:col-span-2 text-[12px] text-slate-600 truncate">
                  {r.projectCode || "—"}
                </div>

                {/* Trạng thái (desktop) */}
                <div className="hidden md:block md:col-span-2">
                  <StatusBadge statusCode={r.statusCode} />
                </div>

                {/* Ưu tiên (desktop) */}
                <div className="hidden md:block md:col-span-1">
                  <PriorityBadge priority={r.priority} />
                </div>

                {/* Hạn hoàn thành (desktop) */}
                {r.repeatDaily ? (
                  <div className="hidden md:flex md:col-span-2 justify-end text-[12px] text-slate-700">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 border border-emerald-100">
                      Lặp hằng ngày
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:flex md:col-span-2 flex-col items-end text-[12px] text-slate-700">
                    
                    {isOverdue ? (
                      <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-[10px] font-semibold text-rose-700 border border-rose-200">
                        Trễ {dueLabel}
                      {dueTimeLabel && (
                        <span className="text-slate-400">
                          {" "}
                          ({dueTimeLabel})
                        </span>
                      )}
                      </span>
                    ) :
                      <span
                        className={
                          "font-medium " +
                          (isOverdue ? "text-rose-600" : "text-slate-700")
                        }
                      >
                        {dueLabel}
                        {dueTimeLabel && (
                          <span className="text-slate-400">
                            {" "}
                            ({dueTimeLabel})
                          </span>
                        )}
                      </span>
                    }
                    {isDone && completedLabel && (
                      <span className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 border border-emerald-100">
                        Hoàn thành: {completedLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer / Paging */}
      <div className="px-3 md:px-4 py-3 flex flex-col md:flex-row gap-2 md:gap-3 md:items-center md:justify-between bg-white/70">
        <div className="text-xs text-slate-500">
          Đang hiển thị{" "}
          <b>
            {rows.length > 0 ? (page - 1) * pageSize + 1 : 0}–
            {(page - 1) * pageSize + rows.length}
          </b>{" "}
          trên tổng <b>{totalRows}</b> công việc.
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-50 disabled:cursor-default hover:bg-slate-50"
          >
            ← Trước
          </button>
          <span className="text-slate-500">
            Trang <b>{page}</b> / {totalPages}
          </span>
          <button
            disabled={page * pageSize >= totalRows}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-50 disabled:cursor-default hover:bg-slate-50"
          >
            Sau →
          </button>
        </div>
      </div>
    </div>
  );
}
