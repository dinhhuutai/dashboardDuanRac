import React, { useMemo, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

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

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-[260px] h-10 rounded-xl border px-3 text-left"
      >
        {rangeText}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border p-3 rounded-xl shadow">
          <div className="flex justify-between mb-2">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}>◀</button>
            <span>{monthTitle(viewDate)}</span>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}>▶</button>
          </div>

          {weeks.map((week, i) => (
            <div key={i} className="grid grid-cols-7 gap-1">
              {week.map((d, j) =>
                d ? (
                  <button key={j} onClick={() => handlePick(d)} className="p-2 hover:bg-gray-100">
                    {d.getDate()}
                  </button>
                ) : (
                  <div key={j}></div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}