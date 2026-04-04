import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toYMD(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// Lịch tháng mobile-first (thứ 2 -> CN)
export default function MonthCalendar({
  monthCursor,
  calendarDays = [],
  selectedDate,
  onOpenCreate,
  todayStr,
}) {
  const year = monthCursor.getFullYear();
  const monthIndex = monthCursor.getMonth(); // 0-based

  const dayMap = useMemo(() => {
    const m = new Map();
    (calendarDays || []).forEach((d) => m.set(d.date, d));
    return m;
  }, [calendarDays]);

  const firstDay = new Date(year, monthIndex, 1);
  // JS: 0 Sun..6 Sat -> chuyển sang Mon-first: 0 Mon..6 Sun
  const startOffset = (firstDay.getDay() + 6) % 7;

  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const gridCount = Math.ceil((startOffset + totalDays) / 7) * 7;
  const monthKey = `${year}-${monthIndex + 1}`;

  return (
    <div className="rounded-3xl bg-white/70 ring-1 ring-pink-100 p-3">
      <div className="grid grid-cols-7 gap-2 text-[11px] text-slate-500 font-semibold mb-3">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((h) => (
          <div key={h} className="text-center">
            {h}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={monthKey}
          className="grid grid-cols-7 gap-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {Array.from({ length: gridCount }).map((_, idx) => {
          const dayNum = idx - startOffset + 1;
          if (dayNum < 1 || dayNum > totalDays) {
            return <div key={`e-${idx}`} className="h-12" />;
          }

          const cellDate = `${year}-${pad2(monthIndex + 1)}-${pad2(dayNum)}`;
          const d = dayMap.get(cellDate);

          const isToday = cellDate === todayStr;
          const isSelected = cellDate === selectedDate;

          const todayObj = new Date(todayStr);
          const cellObj = new Date(cellDate);
          const isPast = cellObj < todayObj;
          const isFuture = cellObj > todayObj;

          let circleClass =
            "h-8 w-8 rounded-full border grid place-items-center transition";

          if (isFuture) {
            circleClass += " bg-pink-100 border-pink-200 text-pink-500";
          } else {
            circleClass += " bg-transparent border-pink-200 text-pink-500";
          }

          if (isToday) {
            circleClass += " bg-pink-600 border-pink-600 text-white shadow-sm";
          }

          let dayTextClass = "text-[11px] mt-0.5 transition";
          if (isToday) {
            dayTextClass += " text-pink-600 font-semibold";
          } else if (isPast) {
            dayTextClass += " text-slate-900";
          } else {
            dayTextClass += " text-slate-400";
          }

          return (
            <motion.button
              layout
              key={cellDate}
              type="button"
              onClick={() => onOpenCreate?.(cellDate)}
              className={[
                "h-14 flex flex-col items-center justify-start text-center",
                "transition",
                isSelected ? "scale-[1.02]" : "",
              ].join(" ")}
            >
              <div className={isToday ? "-mt-0.5" : ""}>
                <div className={circleClass}>
                  {isToday ? (
                    <Plus size={16} strokeWidth={3} className="text-pink-500" aria-hidden />
                  ) : !isFuture ? (
                    <Plus size={14} strokeWidth={3} className="text-pink-500" aria-hidden />
                  ) : null}
                </div>
              </div>
              <div className={dayTextClass}>{dayNum}</div>
              {isToday ? <div className="h-1 w-1 rounded-full bg-pink-500 mt-1" /> : <div className="h-1 w-1 mt-1" />}
            </motion.button>
          );
        })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

