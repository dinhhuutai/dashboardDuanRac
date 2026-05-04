import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// ===== helper =====
const pad2 = (n) => String(n).padStart(2, "0");

const normalizeDateOnly = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

function monthTitle(date) {
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}

function buildCalendarMatrix(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const firstWeekday = (first.getDay() + 6) % 7;
  const totalDays = last.getDate();
  const cells = [];

  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function sameDate(a, b) {
  if (!a || !b) return false;
  return normalizeDateOnly(a).getTime() === normalizeDateOnly(b).getTime();
}

function isDateBetween(date, from, to) {
  if (!date || !from || !to) return false;
  const d = normalizeDateOnly(date).getTime();
  const a = normalizeDateOnly(from).getTime();
  const b = normalizeDateOnly(to).getTime();
  return d > Math.min(a, b) && d < Math.max(a, b);
}

function formatDateObj(date) {
  if (!date) return "";
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// ===== COMPONENT =====
export default function DateRangeField({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => range?.from || new Date());
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const weeks = useMemo(() => buildCalendarMatrix(viewDate), [viewDate]);

  const rangeText = useMemo(() => {
    if (!range?.from && !range?.to) return "Chọn khoảng ngày";
    if (range?.from && !range?.to) return `Từ ${formatDateObj(range.from)}`;
    return `${formatDateObj(range.from)} → ${formatDateObj(range.to)}`;
  }, [range]);

  const handlePick = (date) => {
    if (!date) return;

    if (!range?.from || (range?.from && range?.to)) {
      onChange({ from: date, to: undefined });
      return;
    }

    const from = normalizeDateOnly(range.from);
    const picked = normalizeDateOnly(date);

    if (picked < from) {
      onChange({ from: date, to: range.from });
    } else {
      onChange({ from: range.from, to: date });
      setOpen(false);
    }
  };

  const updatePopoverPosition = () => {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const popoverMinW = 268;
    const pad = 8;
    let left = rect.left;
    const maxLeft = window.innerWidth - popoverMinW - pad;
    if (left > maxLeft) left = Math.max(pad, maxLeft);
    if (left < pad) left = pad;
    setPopoverPos({ top: rect.bottom + 8, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePopoverPosition();
  }, [open, viewDate]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      const t = e.target;
      if (
        popoverRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePopoverPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  const popover =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={popoverRef}
        className="fixed z-[9999] min-w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        style={{ top: popoverPos.top, left: popoverPos.left }}
        role="dialog"
        aria-label="Chọn khoảng ngày"
      >
        <div className="mb-2 flex justify-between">
          <button
            type="button"
            className="rounded px-2 py-1 hover:bg-gray-100"
            onClick={() =>
              setViewDate(
                new Date(viewDate.getFullYear(), viewDate.getMonth() - 1)
              )
            }
          >
            ◀
          </button>
          <span className="font-medium">{monthTitle(viewDate)}</span>
          <button
            type="button"
            className="rounded px-2 py-1 hover:bg-gray-100"
            onClick={() =>
              setViewDate(
                new Date(viewDate.getFullYear(), viewDate.getMonth() + 1)
              )
            }
          >
            ▶
          </button>
        </div>

        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {week.map((d, j) =>
              d ? (
                <button
                  key={j}
                  type="button"
                  onClick={() => handlePick(d)}
                  className="rounded p-2 hover:bg-gray-100"
                >
                  {d.getDate()}
                </button>
              ) : (
                <div key={j} />
              )
            )}
          </div>
        ))}
      </div>,
      document.body
    );

  return (
    <div className="relative w-full min-w-0 max-w-full">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-full min-w-0 max-w-full rounded-xl border border-slate-300 bg-white px-3 text-left text-sm md:w-[260px] md:max-w-[260px] md:shrink-0"
      >
        {rangeText}
      </button>
      {popover}
    </div>
  );
}