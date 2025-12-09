// src/pageTaskManagement/MyTasks/BoardView.jsx
import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusBadge, PriorityBadge } from "./TaskUI";

const priorityRank = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

// 👉 helper: chỉ lấy HH:mm từ ISO / time string
function formatTimeHM(v) {
  if (!v) return "";
  if (typeof v === "string") {
    // dạng ISO: 1970-01-01T08:00:00.000Z
    const isoMatch = v.match(/T(\d{2}:\d{2})/);
    if (isoMatch) return isoMatch[1];

    // dạng HH:mm[:ss]
    const parts = v.split(":");
    if (parts.length >= 2) {
      const hh = parts[0].padStart(2, "0");
      const mm = parts[1].padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return v;
  }

  try {
    return new Date(v).toTimeString().slice(0, 5); // HH:mm
  } catch {
    return "";
  }
}

export default function BoardView({
  columns,
  setColumns,
  onMoveTask,
  onReload,
  loading,
  onTaskClick,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [activeTask, setActiveTask] = useState(null);

  function handleDragStart(event) {
    const data = event.active?.data?.current;
    if (data?.type === "task") {
      setActiveTask(data.task);
    }
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    if (!active || !over) return;

    const data = active.data?.current;
    if (data?.type !== "task") return;

    const taskId = data.task.taskId;
    const overId = String(over.id);

    let toStatusId = null;

    setColumns((prev) => {
      const cloned = prev.map((c) => ({
        ...c,
        items: [...(c.items || [])],
      }));

      const findColByTaskId = (tid) =>
        cloned.find((c) => (c.items || []).some((it) => it.taskId === tid));

      // 1) Xác định statusId đích
      if (overId.startsWith("col-")) {
        toStatusId = +overId.replace("col-", "");
      } else if (overId.startsWith("task-")) {
        const tid = +overId.replace("task-", "");
        const col = findColByTaskId(tid);
        toStatusId = col?.statusId ?? null;
      }

      if (!toStatusId) return prev;

      const fromCol = findColByTaskId(taskId);
      if (!fromCol || fromCol.statusId === toStatusId) return prev;

      const src = cloned.find((c) => c.statusId === fromCol.statusId);
      const dst = cloned.find((c) => c.statusId === toStatusId);
      if (!src || !dst) return prev;

      const idx = src.items.findIndex((it) => it.taskId === taskId);
      if (idx === -1) return prev;

      const [task] = src.items.splice(idx, 1);

      // 🔹 Cập nhật statusId
      task.statusId = toStatusId;

      // 🔹 Logic cập nhật progress theo cột
      const movingToDone = dst.statusCode === "done";
      const fromDone = src.statusCode === "done";

      const todayIso = new Date().toISOString();

      if (movingToDone) {
        task.progressPercent = 100;
        task.completedDate = task.completedDate || todayIso;
      } else if (fromDone && !movingToDone) {
        task.progressPercent = 0;
        task.completedDate = null;
      }

      dst.items.unshift(task);

      const sortItems = (arr) =>
        arr.sort((a, b) => {
          const ra = priorityRank[a.priority] || 99;
          const rb = priorityRank[b.priority] || 99;
          if (ra !== rb) return ra - rb;

          const da = a.dueDate || "";
          const db = b.dueDate || "";
          return String(da).localeCompare(String(db));
        });

      src.items = sortItems(src.items);
      dst.items = sortItems(dst.items);

      return cloned;
    });

    try {
      if (toStatusId) {
        await onMoveTask?.(taskId, toStatusId);
      }
    } catch (e) {
      console.error("onMoveTask error, reload board", e);
      onReload?.();
    }
  }

  return (
    <div className="card p-3 md:p-4">
      {loading && (
        <div className="py-8 text-center text-slate-500 text-sm">
          Đang tải board công việc…
        </div>
      )}

      {!loading && (!columns || columns.length === 0) && (
        <div className="py-8 text-center text-slate-400 text-sm">
          Chưa có công việc nào để hiển thị.
        </div>
      )}

      {!loading && columns && columns.length > 0 && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="md:overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full md:min-w-0">
              {columns.map((col) => (
                <SortableContext
                  key={col.statusId}
                  items={(col.items || []).map((it) => `task-${it.taskId}`)}
                  strategy={rectSortingStrategy}
                >
                  <KanbanColumn col={col}>
                    {(col.items || []).map((it) => (
                      <TaskCard
                        key={it.taskId}
                        item={it}
                        onTaskClick={onTaskClick}
                      />
                    ))}
                  </KanbanColumn>
                </SortableContext>
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-lg max-w-xs text-sm">
                <div className="font-semibold text-slate-800 truncate">
                  {activeTask.title}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Kéo đến cột trạng thái mới…
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <PriorityBadge priority={activeTask.priority} small />
                  {typeof activeTask.progressPercent === "number" && (
                    <span className="text-[11px] text-slate-500">
                      {Math.round(
                        Math.min(
                          100,
                          Math.max(0, activeTask.progressPercent || 0)
                        )
                      )}
                      %
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

/* ========== COLUMN (droppable cả khi rỗng) ========== */

function KanbanColumn({ col, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${col.statusId}`,
  });

  const count = col.items?.length || 0;

  let colorClass = "border-slate-200 bg-slate-50";
  if (col.statusCode === "todo") colorClass = "border-slate-200 bg-slate-50";
  else if (col.statusCode === "doing")
    colorClass = "border-sky-100/70 bg-sky-50/60";
  else if (col.statusCode === "review")
    colorClass = "border-amber-100/70 bg-amber-50/60";
  else if (col.statusCode === "done")
    colorClass = "border-emerald-100/70 bg-emerald-50/60";

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-2xl border ${colorClass} p-3 flex flex-col transition
        md:max-h-[70vh] md:overflow-y-auto
        ${isOver ? "ring-2 ring-indigo-300/60 ring-offset-0" : ""}
      `}
    >
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-opacity-80 bg-inherit backdrop-blur-[1px] z-10 pb-1">
        <div className="text-sm font-semibold text-slate-800">
          {col.statusName || col.statusCode?.toUpperCase()}
        </div>
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-700">
          {count} việc
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {count === 0 && (
          <div className="text-[11px] text-slate-400 italic py-2 text-center">
            Kéo công việc vào đây…
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ========== TASK CARD (sortable) ========== */
function TaskCard({ item, onTaskClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `task-${item.taskId}`,
    data: { type: "task", task: item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    cursor: "grab",
  };

  // Priority highlight
  let priorityHighlight = "";
  if (item.priority === "urgent") {
    priorityHighlight = "border-l-4 border-l-rose-500";
  } else if (item.priority === "high") {
    priorityHighlight = "border-l-4 border-l-amber-400";
  } else if (item.priority === "normal") {
    priorityHighlight = "border-l-4 border-l-sky-300";
  } else {
    priorityHighlight = "border-l-4 border-l-slate-200";
  }

  // Trạng thái
  const isDone = item.statusCode === "done";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let isOverdue = false;
  if (!isDone && !item.repeatDaily && item.dueDate) {
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    isOverdue = due < today;
  }

  let stateHighlight = "";
  if (isOverdue) {
    stateHighlight = "bg-rose-50/70 border-rose-200 ring-1 ring-rose-100";
  } else if (isDone) {
    stateHighlight = "bg-emerald-50/70 border-emerald-200";
  } else {
    stateHighlight = "bg-white";
  }

  // % tiến độ
  const rawProgress = Number.isFinite(+item.progressPercent)
    ? +item.progressPercent
    : 0;
  const progress = Math.min(100, Math.max(0, rawProgress));

  // Ngày
  const startLabel = item.startDate
    ? new Date(item.startDate).toLocaleDateString("vi-VN")
    : "";
  const dueLabel = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString("vi-VN")
    : "";
  const completedLabel = item.completedDate
    ? new Date(item.completedDate).toLocaleDateString("vi-VN")
    : "";

  // Giờ (HH:mm)
  const startTimeLabel = formatTimeHM(item.startTime);
  const dueTimeLabel = formatTimeHM(item.dueTime);

  const hasAttachment = (item.attachmentCount || 0) > 0;

  const attachmentCount = item.attachmentCount || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick?.(item.taskId)}
      className={`
        relative
        p-3 rounded-xl border flex flex-col gap-1.5 text-xs shadow-sm
        transition-all duration-150 ease-out
        ${priorityHighlight} ${stateHighlight}
        hover:bg-slate-50/60
        hover:shadow
        hover:-translate-y-[1px]
      `}
    >
      {/* 📎 icon file đính kèm góc phải trên */}
      {hasAttachment && (
        <div className="absolute top-2 right-2">
          <span
            className="
              inline-flex items-center gap-1
              rounded-full bg-slate-100 border border-slate-200
              px-2 py-0.5
              text-[11px] font-medium text-slate-700
            "
          >
            <span>📎</span>
            <span>{attachmentCount} tệp</span>
          </span>
        </div>
      )}

      {/* Tiêu đề + badge trạng thái */}
      <div className="flex flex-wrap items-center gap-1.5 pr-7">
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
          {item.title}
        </div>
      </div>

      {/* Info: thực hiện, tạo, bắt đầu / hoàn thành */}
<div className="mt-0.5 flex flex-col gap-1 text-[11px] text-slate-500">
  {/* Dòng 1: Thực hiện (nổi bật) + Tạo */}
  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
    {item.assigneeNames && (
      <span
        className="
          inline-flex items-center gap-1
          px-2 py-[2px]
          rounded-full
          bg-indigo-50
          text-[11px] text-indigo-700
          border border-indigo-100
          max-w-full
        "
      >
        <span className="font-semibold">Thực hiện:</span>
        <span className="font-medium truncate max-w-[180px] md:max-w-[220px]">
          {item.assigneeNames}
        </span>
      </span>
    )}

    {item.createdByName && (
      <span className="truncate max-w-[70%]">
        <span className="font-medium text-slate-600">Tạo:</span>{" "}
        {item.createdByName}
      </span>
    )}
  </div>

  {/* Dòng 2: Bắt đầu / Hoàn thành */}
  <div className="flex flex-wrap gap-x-2 gap-y-0.5">
    {startLabel && (
      <span>
        <span className="font-medium text-slate-600">Bắt đầu:</span>{" "}
        {startLabel}
        {startTimeLabel && (
          <span className="text-slate-400"> ({startTimeLabel})</span>
        )}
      </span>
    )}
    {completedLabel && (
      <span>
        <span className="font-medium text-slate-600">Hoàn thành:</span>{" "}
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
        <span className="w-10 text-right">{Math.round(progress)}%</span>
      </div>

      {/* Ưu tiên + hạn / lặp ngày */}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <PriorityBadge priority={item.priority} small />
        </div>

        {item.repeatDaily ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] text-emerald-700 border border-emerald-100">
            Lặp hằng ngày
          </span>
        ) : (
          <span
            className={
              "text-[11px] whitespace-nowrap " +
              (isOverdue ? "text-rose-600 font-semibold" : "text-slate-500")
            }
          >
            {dueLabel || "-"}
            {dueTimeLabel && (
              <span className="text-slate-400"> ({dueTimeLabel})</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

