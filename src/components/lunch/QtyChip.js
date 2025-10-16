import React, { useRef, useState, useEffect } from "react";

/* Hook nhấn-giữ (long press) */
function useLongPress(callback, { delay = 450 } = {}) {
  const timerRef = useRef(null);
  const start = () => {
    clear();
    timerRef.current = setTimeout(callback, delay);
  };
  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };
}

export default function QtyChip({
  day,
  entryId,
  foodName,
  currentQty,
  isSec,
  isEditing,
  editing,            // { day, entryId, value, max }
  openEditQty,        // (day, entryId, currentQty) => void
  changeEditValue,    // (newNumber) => void
  saveEdit,           // () => (void|Promise)
  cancelEdit,         // () => void
  canEdit,
  busy = false,
}) {
  const [saving, setSaving] = useState(false);

  // chỉ kích hoạt long-press khi được phép chỉnh & không bận
  const lp = useLongPress(() => {
    if (isSec && canEdit && !busy && !saving) openEditQty(day, entryId, currentQty);
  });

  // Text input để tránh 0 ở đầu
  const [text, setText] = useState("");
  useEffect(() => {
    if (isEditing) {
      const v = Number.isFinite(editing?.value) ? editing.value : 0;
      setText(String(v));
    } else {
      setText("");
      setSaving(false);
    }
  }, [isEditing, editing?.value]);

  const onInputChange = (ev) => {
    if (saving) return;
    const raw = ev.target.value.replace(/[^\d]/g, "");
    const cleaned = raw.replace(/^0+(?=\d)/, "");
    if (cleaned === "") {
      setText("");
      changeEditValue?.(0);
      return;
    }
    const max = editing?.max ?? Number.MAX_SAFE_INTEGER;
    let n = parseInt(cleaned, 10);
    if (!Number.isFinite(n)) n = 0;
    if (n > max) n = max;
    setText(String(n));
    changeEditValue?.(n);
  };

  const onInputBlur = () => {
    if (text === "") {
      setText("0");
      changeEditValue?.(0);
    }
  };

  // Bọc save để hiện loading + chống double
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const maybePromise = saveEdit?.();
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } finally {
      setSaving(false);
    }
  };

  const blockedTitle = !canEdit
    ? "Đã quá hạn chỉnh sửa (sau 09:00 ngày này)"
    : (isSec ? "Double-click hoặc nhấn giữ để chỉnh số lượng" : "");

  const tipId = `tip-${day}-${entryId}`;

  // Khi bị chặn: không gán handler long-press (tránh mở edit)
  const pressHandlers = (!saving && !busy && canEdit) ? lp : {};

  return (
    <div className="relative inline-block group">
      <span
        className={`relative inline-flex items-center gap-2 px-2 py-1 rounded-lg border ${
          isEditing
            ? "bg-white border-emerald-300 shadow-sm"
            : (canEdit
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-50 text-slate-400 border-slate-200")
        } ${busy ? "opacity-70 pointer-events-none" : ""}`}
        onDoubleClick={() => (isSec && canEdit && !busy && !saving) && openEditQty(day, entryId, currentQty)}
        {...pressHandlers}
        aria-describedby={blockedTitle ? tipId : undefined}
      >
        {/* overlay mờ khi saving */}
        {saving && (
          <span className="pointer-events-none absolute inset-0 rounded-lg bg-white/40" aria-hidden />
        )}

        <span className={`truncate max-w-[220px] ${isEditing ? "text-slate-700" : ""}`}>
          {foodName || `#${entryId}`}
        </span>

        {!isEditing ? (
          <span
            className={`text-xs px-1.5 py-0.5 rounded border ${
              canEdit
                ? "bg-white border-emerald-200 text-emerald-700"
                : "bg-white border-slate-200 text-slate-400"
            }`}
          >
            SL: {currentQty}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={text}
              onChange={onInputChange}
              onBlur={onInputBlur}
              disabled={saving}
              className="h-8 w-16 rounded-md border border-emerald-300 bg-white px-2 text-sm text-right
                         outline-none focus:ring-2 focus:ring-emerald-300 disabled:opacity-60"
              placeholder="0"
            />
            <span className="text-[11px] text-slate-500">/ {editing?.max}</span>

            <button
              onClick={handleSave}
              disabled={saving}
              className="ml-1 px-2 py-1 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-700
                         disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1"
            >
              {saving && (
                <span className="inline-block h-3 w-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              )}
              {saving ? "Đang lưu…" : "Lưu"}
            </button>
            <button
              onClick={!saving ? cancelEdit : undefined}
              disabled={saving}
              className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200 hover:bg-slate-200
                         disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Huỷ
            </button>
          </span>
        )}
      </span>

      {/* Tooltip đẹp (không dùng title mặc định) */}
      {blockedTitle && (
        <div
          id={tipId}
          role="tooltip"
          className={`pointer-events-none absolute -top-2 -translate-y-full left-1/2 -translate-x-1/2
                      opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                      transition-opacity duration-150 whitespace-nowrap
                      rounded-lg px-2.5 py-1.5 text-[11px] shadow-lg z-10
                      ${canEdit ? "bg-slate-800 text-white" : "bg-rose-600 text-white"}`}
        >
          {blockedTitle}
          <span
            className={`absolute top-full left-1/2 -translate-x-1/2 h-2 w-2 rotate-45
                        ${canEdit ? "bg-slate-800" : "bg-rose-600"}`}
          />
        </div>
      )}
    </div>
  );
}
