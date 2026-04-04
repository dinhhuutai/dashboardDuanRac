import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  Line,
  ComposedChart,
} from "recharts";
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiBarChart2,
  FiLayers,
  FiCalendar,
  FiActivity,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";

const STATIONS = [
  { id: 1, name: "1. Thông tin đơn hàng" },
  { id: 2, name: "2. Hồ sơ kỹ thuật" },
  { id: 3, name: "3. Khuôn in" },
  { id: 4, name: "4. Mực in" },
  { id: 5, name: "5. Vải về" },
  { id: 6, name: "6. 4M- Khuôn" },
  { id: 7, name: "7. 4M- Mực" },
  { id: 8, name: "8. Lập kế hoạch" },
  { id: 9, name: "9. In" },
  { id: 10, name: "10. Chờ khô" },
  { id: 11, name: "11. KCS" },
  { id: 12, name: "12. Sửa" },
  { id: 13, name: "13. OQC" },
  { id: 14, name: "14. Giao hàng" },
];

const PIE_COLORS = {
  OPEN: "#ef4444",
  READY: "#f59e0b",
  RELEASE: "#22c55e",
};

const BATCH_ID_POOL = [
  "SA026LA-000009",
  "SA025LA-017644",
  "SA025LA-017676",
  "SA026LA-000112",
  "SA025LA-018001",
  "SA026LA-000390",
  "SA026LA-000521",
  "SA026LA-000612",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function ymdFromDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function parseYmd(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function normalizeDateOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(dateStr, days) {
  const d = parseYmd(dateStr);
  if (!d) return "";
  d.setDate(d.getDate() + days);
  return ymdFromDate(d);
}

function diffDays(fromDateStr, toDate) {
  const from = parseYmd(fromDateStr);
  if (!from || !toDate) return 0;
  const a = normalizeDateOnly(from);
  const b = normalizeDateOnly(toDate);
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function formatDateDisplay(dateStr) {
  const d = parseYmd(dateStr);
  if (!d) return "-";
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatDateTimeNow(date) {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(
    date.getHours()
  )}:${pad2(date.getMinutes())}`;
}

function stationById(id) {
  return STATIONS.find((s) => s.id === id) || STATIONS[0];
}

function isSameDayYmd(dateStr, now) {
  const d = parseYmd(dateStr);
  if (!d) return false;
  return normalizeDateOnly(d).getTime() === normalizeDateOnly(now).getTime();
}

function isWithinRangeYmd(dateStr, range) {
  const d = parseYmd(dateStr);
  if (!d) return false;
  const current = normalizeDateOnly(d);
  const from = range?.from ? normalizeDateOnly(range.from) : null;
  const to = range?.to ? normalizeDateOnly(range.to) : null;

  if (from && to) return current >= from && current <= to;
  if (from) return current >= from;
  if (to) return current <= to;
  return true;
}

function getOrderWarning(order, now) {
  const left = diffDays(ymdFromDate(now), parseYmd(order.deadline) || now) * -1;
  if (left < 0) return "Trễ";
  if (left <= 2) return "Gần trễ";
  return "Bình thường";
}

function getStatusBadgeClass(status) {
  if (status === "OPEN") return "bg-red-50 text-red-700 border border-red-200";
  if (status === "READY") return "bg-amber-50 text-amber-800 border border-amber-200";
  if (status === "RELEASE") return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  return "bg-slate-50 text-slate-700 border border-slate-200";
}

function getSeverityBadgeClass(level) {
  if (level === "Nghiêm trọng") return "bg-red-50 text-red-700 border border-red-200";
  if (level === "Cảnh báo") return "bg-orange-50 text-orange-700 border border-orange-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusBadgeClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function SeverityBadge({ level }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${getSeverityBadgeClass(
        level
      )}`}
    >
      {level}
    </span>
  );
}

function SectionCard({ title, icon: Icon, right, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {Icon ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <Icon className="text-[15px]" />
            </span>
          ) : null}
          <h2 className="text-sm sm:text-[15px] font-semibold text-slate-900">
            {title}
          </h2>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, tone = "slate", subLabel }) {
  const toneClass =
    tone === "red"
      ? "border-red-200 bg-red-50"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50"
      : tone === "green"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "blue"
      ? "border-sky-200 bg-sky-50"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-slate-500">{title}</div>
          <div className="mt-1 text-[24px] sm:text-[28px] leading-none font-bold text-slate-900 tabular-nums">
            {value}
          </div>
          {subLabel ? <div className="mt-1 text-[11px] text-slate-500">{subLabel}</div> : null}
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
          <Icon className="text-[16px]" />
        </span>
      </div>
    </div>
  );
}

function ProgressMini({ value, tone = "green" }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const barClass =
    tone === "red" ? "bg-red-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-[86px] rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${barClass}`} style={{ width: `${safe}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-slate-700 tabular-nums">{safe}%</span>
    </div>
  );
}

function StatusMiniBar({ open, ready, release, total }) {
  const o = total ? (open / total) * 100 : 0;
  const r = total ? (ready / total) * 100 : 0;
  const rl = total ? (release / total) * 100 : 0;

  return (
    <div className="w-[120px]">
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-red-500" style={{ width: `${o}%` }} />
        <div className="bg-amber-500" style={{ width: `${r}%` }} />
        <div className="bg-emerald-500" style={{ width: `${rl}%` }} />
      </div>
    </div>
  );
}

/* ---------------- DateRangeField inline ---------------- */

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

  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= totalDays; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
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

function DateRangeField({ range, onChange }) {
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

    if (picked.getTime() < from.getTime()) {
      onChange({ from: date, to: range.from });
    } else {
      onChange({ from: range.from, to: date });
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full sm:w-[280px] h-10 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <span className={range?.from ? "text-slate-900" : "text-slate-400"}>{rangeText}</span>
          <FiCalendar className="text-slate-500" />
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute z-50 mt-2 w-full min-w-[320px] rounded-2xl border border-slate-200 bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[12px] font-semibold text-slate-700">Chọn khoảng ngày</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ from: undefined, to: undefined })}
                  className="text-[12px] text-slate-500"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
              >
                <FiChevronLeft />
              </button>
              <div className="text-sm font-semibold text-slate-800">{monthTitle(viewDate)}</div>
              <button
                type="button"
                onClick={() =>
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
              >
                <FiChevronRight />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                <div
                  key={d}
                  className="h-8 flex items-center justify-center text-[11px] font-semibold text-slate-500"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((date, di) => {
                    if (!date) return <div key={di} className="h-9" />;

                    const isStart = sameDate(date, range?.from);
                    const isEnd = sameDate(date, range?.to);
                    const inRange = isDateBetween(date, range?.from, range?.to);
                    const isToday = sameDate(date, new Date());

                    let cls = "h-9 rounded-lg text-sm border border-transparent transition ";
                    if (isStart || isEnd) cls += "bg-slate-900 text-white ";
                    else if (inRange) cls += "bg-slate-100 text-slate-900 ";
                    else cls += "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 ";
                    if (isToday && !isStart && !isEnd) cls += " ring-1 ring-sky-300 ";

                    return (
                      <button key={di} type="button" onClick={() => handlePick(date)} className={cls}>
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Mock data realistic ---------------- */

function buildMockOrders() {
  const seeds = [
    { orderId: "DH025LA-011938", customerName: "DK", orderName: "ACT CORE 55+10 SL (2026)", createdAt: "2026-03-20", deadline: "2026-03-30", currentStationId: 5, pattern: "stuck-fabric", itemCount: 2 },
    { orderId: "DH025LA-010623", customerName: "VN", orderName: "PEAK 45", createdAt: "2026-03-20", deadline: "2026-03-31", currentStationId: 8, pattern: "stuck-plan", itemCount: 3 },
    { orderId: "DH025LA-007478", customerName: "SL-GLOVIS", orderName: "DAY SACK MINI RIP", createdAt: "2026-03-21", deadline: "2026-04-01", currentStationId: 11, pattern: "stuck-kcs", itemCount: 2 },
    { orderId: "DH026LA-000001", customerName: "SG", orderName: "TOTE BAG MINI OS NE LOGO REFRECT", createdAt: "2026-03-21", deadline: "2026-04-02", currentStationId: 12, pattern: "stuck-repair", itemCount: 2 },
    { orderId: "DH026LA-001506", customerName: "KN", orderName: "SQUARE WASTE BAG OS NE LOGO REFRECT", createdAt: "2026-03-22", deadline: "2026-04-03", currentStationId: 9, pattern: "mid-progress", itemCount: 3 },
    { orderId: "DH026LA-002127", customerName: "DV", orderName: "HNF SHOULDER BAG FIGHTERS", createdAt: "2026-03-22", deadline: "2026-04-05", currentStationId: 3, pattern: "early-stage", itemCount: 1 },
    { orderId: "DH026LA-003201", customerName: "LEVI'S", orderName: "UTILITY WAIST PACK", createdAt: "2026-03-23", deadline: "2026-04-04", currentStationId: 10, pattern: "drying", itemCount: 2 },
    { orderId: "DH025LA-009001", customerName: "DK", orderName: "TRAVEL POUCH SERIES", createdAt: "2026-03-23", deadline: "2026-04-06", currentStationId: 13, pattern: "almost-done", itemCount: 2 },
    { orderId: "DH025LA-008442", customerName: "VN", orderName: "WORK BAG NX 24", createdAt: "2026-03-24", deadline: "2026-04-07", currentStationId: 4, pattern: "ink-stage", itemCount: 3 },
    { orderId: "DH026LA-004889", customerName: "ORTOVOX", orderName: "ACTIVE SACK RF 18", createdAt: "2026-03-24", deadline: "2026-04-08", currentStationId: 14, pattern: "released", itemCount: 2 },
    { orderId: "DH025LA-012100", customerName: "SG", orderName: "PACK LINER 35", createdAt: "2026-03-25", deadline: "2026-04-09", currentStationId: 6, pattern: "4m-mold", itemCount: 2 },
    { orderId: "DH026LA-005500", customerName: "KN", orderName: "WAIST BAG LITE", createdAt: "2026-03-25", deadline: "2026-04-10", currentStationId: 7, pattern: "4m-ink", itemCount: 1 },
    { orderId: "DH025LA-006678", customerName: "DV", orderName: "PEAK 45", createdAt: "2026-03-26", deadline: "2026-04-11", currentStationId: 1, pattern: "new-order", itemCount: 2 },
    { orderId: "DH026LA-007700", customerName: "PUMA", orderName: "DAY SACK MINI RIP", createdAt: "2026-03-26", deadline: "2026-04-12", currentStationId: 2, pattern: "tech-file", itemCount: 3 },
    { orderId: "DH025LA-013300", customerName: "SL-GLOVIS", orderName: "UTILITY WAIST PACK", createdAt: "2026-03-27", deadline: "2026-04-13", currentStationId: 5, pattern: "fabric-normal", itemCount: 1 },
    { orderId: "DH026LA-008811", customerName: "VN", orderName: "WORK BAG NX 24", createdAt: "2026-03-27", deadline: "2026-04-08", currentStationId: 8, pattern: "rush-plan", itemCount: 2 },
    { orderId: "DH025LA-014420", customerName: "SG", orderName: "ACT CORE 55+10 SL (2026)", createdAt: "2026-03-28", deadline: "2026-04-14", currentStationId: 11, pattern: "kcs-review", itemCount: 1 },
    { orderId: "DH026LA-009998", customerName: "LEVI'S", orderName: "TRAVEL POUCH SERIES", createdAt: "2026-03-28", deadline: "2026-04-15", currentStationId: 3, pattern: "fresh-early", itemCount: 2 },

    { orderId: "DH026LA-010101", customerName: "DK", orderName: "WAIST BAG LITE", createdAt: "2026-03-28", deadline: "2026-04-16", currentStationId: 9, pattern: "mid-progress", itemCount: 2 },
    { orderId: "DH026LA-010102", customerName: "PUMA", orderName: "PACK LINER 35", createdAt: "2026-03-29", deadline: "2026-04-16", currentStationId: 14, pattern: "released", itemCount: 2 },
    { orderId: "DH026LA-010103", customerName: "VN", orderName: "UTILITY WAIST PACK", createdAt: "2026-03-29", deadline: "2026-04-17", currentStationId: 5, pattern: "stuck-fabric", itemCount: 1 },
    { orderId: "DH026LA-010104", customerName: "SG", orderName: "PEAK 45", createdAt: "2026-03-29", deadline: "2026-04-18", currentStationId: 8, pattern: "rush-plan", itemCount: 2 },
    { orderId: "DH026LA-010105", customerName: "KN", orderName: "DAY SACK MINI RIP", createdAt: "2026-03-30", deadline: "2026-04-18", currentStationId: 2, pattern: "tech-file", itemCount: 2 },
    { orderId: "DH026LA-010106", customerName: "DV", orderName: "WORK BAG NX 24", createdAt: "2026-03-30", deadline: "2026-04-19", currentStationId: 11, pattern: "kcs-review", itemCount: 2 },
    { orderId: "DH026LA-010107", customerName: "ORTOVOX", orderName: "ACTIVE SACK RF 18", createdAt: "2026-03-30", deadline: "2026-04-19", currentStationId: 10, pattern: "drying", itemCount: 2 },
    { orderId: "DH026LA-010108", customerName: "LEVI'S", orderName: "TRAVEL POUCH SERIES", createdAt: "2026-03-31", deadline: "2026-04-20", currentStationId: 13, pattern: "almost-done", itemCount: 1 },
    { orderId: "DH026LA-010109", customerName: "DK", orderName: "ACT CORE 55+10 SL (2026)", createdAt: "2026-03-31", deadline: "2026-04-20", currentStationId: 6, pattern: "4m-mold", itemCount: 2 },
    { orderId: "DH026LA-010110", customerName: "SL-GLOVIS", orderName: "PACK LINER 35", createdAt: "2026-03-31", deadline: "2026-04-21", currentStationId: 7, pattern: "4m-ink", itemCount: 2 },
    { orderId: "DH026LA-010111", customerName: "VN", orderName: "HNF SHOULDER BAG FIGHTERS", createdAt: "2026-04-01", deadline: "2026-04-22", currentStationId: 3, pattern: "fresh-early", itemCount: 2 },
    { orderId: "DH026LA-010112", customerName: "SG", orderName: "UTILITY WAIST PACK", createdAt: "2026-04-01", deadline: "2026-04-22", currentStationId: 8, pattern: "stuck-plan", itemCount: 2 },
    { orderId: "DH026LA-010113", customerName: "KN", orderName: "WORK BAG NX 24", createdAt: "2026-04-02", deadline: "2026-04-23", currentStationId: 14, pattern: "released", itemCount: 1 },
    { orderId: "DH026LA-010114", customerName: "DV", orderName: "PEAK 45", createdAt: "2026-04-02", deadline: "2026-04-23", currentStationId: 5, pattern: "fabric-normal", itemCount: 2 },
    { orderId: "DH026LA-010115", customerName: "PUMA", orderName: "DAY SACK MINI RIP", createdAt: "2026-04-03", deadline: "2026-04-24", currentStationId: 1, pattern: "new-order", itemCount: 2 },
    { orderId: "DH026LA-010116", customerName: "LEVI'S", orderName: "TRAVEL POUCH SERIES", createdAt: "2026-04-03", deadline: "2026-04-24", currentStationId: 11, pattern: "stuck-kcs", itemCount: 2 },
    { orderId: "DH026LA-010117", customerName: "DK", orderName: "ACT CORE 55+10 SL (2026)", createdAt: "2026-04-04", deadline: "2026-04-25", currentStationId: 9, pattern: "mid-progress", itemCount: 3 },
    { orderId: "DH026LA-010118", customerName: "VN", orderName: "PACK LINER 35", createdAt: "2026-04-04", deadline: "2026-04-25", currentStationId: 12, pattern: "stuck-repair", itemCount: 1 },
  ];

  function detailStatusByPattern(pattern, sid, index, count) {
    if (pattern === "released") return "RELEASE";
    if (["stuck-fabric", "stuck-plan", "stuck-kcs", "stuck-repair"].includes(pattern)) {
      return index < Math.max(2, count - 1) ? "OPEN" : "READY";
    }
    if (
      ["rush-plan", "fabric-normal", "early-stage", "new-order", "tech-file", "fresh-early", "ink-stage"].includes(
        pattern
      )
    ) {
      if (sid <= 4) return index % 2 === 0 ? "OPEN" : "READY";
      return "OPEN";
    }
    if (["mid-progress", "4m-mold", "4m-ink", "drying", "kcs-review"].includes(pattern)) {
      if (sid >= 11 && index === count - 1) return "RELEASE";
      return index % 3 === 0 ? "READY" : "OPEN";
    }
    if (pattern === "almost-done") return index < count - 1 ? "RELEASE" : "READY";
    return sid >= 13 ? "RELEASE" : sid >= 9 ? "READY" : "OPEN";
  }

  return seeds.map((seed, oi) => {
    const items = Array.from({ length: seed.itemCount }).map((_, ii) => {
      const detailCount =
        seed.pattern === "stuck-plan"
          ? 8
          : seed.pattern === "stuck-kcs"
          ? 7
          : seed.pattern === "released"
          ? 4
          : 3 + ((oi + ii) % 5);

      const details = Array.from({ length: detailCount }).map((__, di) => {
        let sid = seed.currentStationId;

        if (seed.pattern === "released") sid = 14;
        else if (seed.pattern === "almost-done") sid = di < detailCount - 1 ? 13 + (di % 2) : 12;
        else if (seed.pattern === "mid-progress") sid = 8 + (di % 3);
        else if (seed.pattern === "drying") sid = 9 + (di % 2);
        else if (seed.pattern === "4m-mold") sid = 6;
        else if (seed.pattern === "4m-ink") sid = 7;
        else if (seed.pattern === "tech-file") sid = 2 + (di % 2);
        else if (seed.pattern === "new-order") sid = 1 + (di % 2);
        else if (seed.pattern === "fresh-early") sid = 3 + (di % 2);
        else if (seed.pattern === "fabric-normal") sid = di === 0 ? 5 : 6;
        else if (seed.pattern === "rush-plan") sid = di < detailCount - 1 ? 8 : 9;
        else if (seed.pattern === "kcs-review") sid = di < detailCount - 1 ? 11 : 12;

        const status = detailStatusByPattern(seed.pattern, sid, di, detailCount);

        const enteredOffset =
          seed.pattern === "stuck-fabric"
            ? 6 + di
            : seed.pattern === "stuck-plan"
            ? 7 + di
            : seed.pattern === "stuck-kcs"
            ? 5 + di
            : seed.pattern === "stuck-repair"
            ? 4 + di
            : seed.pattern === "released"
            ? 10 + di
            : seed.pattern === "rush-plan"
            ? 1 + di
            : 2 + di;

        const batchCount =
          sid >= 5
            ? seed.pattern === "released"
              ? 2 + (di % 2)
              : di % 3
            : 0;

        const batches = Array.from({ length: batchCount }).map((_, bi) => ({
          batchId: BATCH_ID_POOL[(oi + ii + di + bi) % BATCH_ID_POOL.length],
          receivedDate: addDays(seed.createdAt, enteredOffset + bi),
          quantityReceived: 180 + oi * 12 + ii * 35 + di * 25 + bi * 18,
          qualityCheckMStatus: bi % 2 === 0 ? "READY" : "OPEN",
        }));

        return {
          detailId: `${seed.orderId}_${String(di + 1).padStart(4, "0")}`,
          detailCode: di % 4 === 0 ? "-" : `P-${di + 1}`,
          quantity: 120 + oi * 8 + ii * 35 + di * 18,
          status,
          currentStationId: sid,
          currentStationName: stationById(sid).name,
          stationEnteredAt: addDays(seed.createdAt, enteredOffset),
          batchCount,
          batches,
        };
      });

      const itemStatus = details.some((d) => d.status === "OPEN")
        ? "OPEN"
        : details.some((d) => d.status === "READY")
        ? "READY"
        : "RELEASE";

      const activeDetail =
        details.find((d) => d.status === "OPEN") ||
        details.find((d) => d.status === "READY") ||
        details[0];

      return {
        itemId: String(800088000 + oi * 10 + ii),
        itemCode: `MH-${oi + 1}-${ii + 1}`,
        itemName: `Mã ${ii + 1} - ${seed.orderName}`,
        quantity: details.reduce((sum, d) => sum + d.quantity, 0),
        status: itemStatus,
        currentStationId: activeDetail.currentStationId,
        currentStationName: activeDetail.currentStationName,
        detailsCount: details.length,
        details,
      };
    });

    const allDetails = items.flatMap((it) => it.details);
    const activeDetail =
      allDetails.find((d) => d.status === "OPEN") ||
      allDetails.find((d) => d.status === "READY") ||
      allDetails[0];

    const orderStatus = allDetails.some((d) => d.status === "OPEN")
      ? "OPEN"
      : allDetails.some((d) => d.status === "READY")
      ? "READY"
      : "RELEASE";

    return {
      orderId: seed.orderId,
      customerName: seed.customerName,
      orderName: seed.orderName,
      status: orderStatus,
      mstatus: `${String(activeDetail.currentStationId).padStart(2, "0")}_${orderStatus}`,
      createdAt: seed.createdAt,
      deadline: seed.deadline,
      currentStationId: activeDetail.currentStationId,
      currentStationName: activeDetail.currentStationName,
      items,
    };
  });
}

const MOCK_ORDERS = buildMockOrders();

function enrichOrders(orders, now) {
  return orders.map((order) => {
    const processingDays = Math.max(0, diffDays(order.createdAt, now));
    const details = order.items.flatMap((it) => it.details);
    const activeDetail =
      details.find((d) => d.status === "OPEN") ||
      details.find((d) => d.status === "READY") ||
      details[0];

    const daysAtCurrentStation = activeDetail?.stationEnteredAt
      ? Math.max(0, diffDays(activeDetail.stationEnteredAt, now))
      : 0;

    const warning = getOrderWarning(order, now);

    return {
      ...order,
      processingDays,
      daysAtCurrentStation,
      warning,
    };
  });
}

function flattenDetails(orders) {
  const rows = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      item.details.forEach((detail) => {
        rows.push({ order, item, detail });
      });
    });
  });
  return rows;
}

function countOpenDetails(order) {
  return order.items.reduce(
    (sum, item) => sum + item.details.filter((d) => d.status === "OPEN").length,
    0
  );
}

function getKpisFromOrders(orders, now) {
  const totalToday = orders.filter((o) => isSameDayYmd(o.createdAt, now)).length;
  const open = orders.filter((o) => o.status === "OPEN").length;
  const ready = orders.filter((o) => o.status === "READY").length;
  const release = orders.filter((o) => o.status === "RELEASE").length;
  const late = orders.filter((o) => o.warning === "Trễ").length;
  return { totalToday, open, ready, release, late };
}

function getPieDataFromOrders(orders) {
  const open = orders.filter((o) => o.status === "OPEN").length;
  const ready = orders.filter((o) => o.status === "READY").length;
  const release = orders.filter((o) => o.status === "RELEASE").length;
  return [
    { name: "OPEN", value: open, key: "OPEN" },
    { name: "READY", value: ready, key: "READY" },
    { name: "RELEASE", value: release, key: "RELEASE" },
  ].filter((x) => x.value > 0);
}

function getGroupedChartData(orders) {
  const map = new Map();

  orders.forEach((order) => {
    const d = parseYmd(order.createdAt);
    if (!d) return;

    const key = order.createdAt;
    const label = `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        label,
        total: 0,
        open: 0,
        ready: 0,
        release: 0,
      });
    }

    const row = map.get(key);
    row.total += 1;

    if (order.status === "OPEN") row.open += 1;
    else if (order.status === "READY") row.ready += 1;
    else row.release += 1;
  });

  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function getStationStatsFromDetails(orders) {
  const base = {};
  STATIONS.forEach((s) => {
    base[s.id] = {
      stationId: s.id,
      stationName: s.name,
      open: 0,
      ready: 0,
      release: 0,
      total: 0,
    };
  });

  flattenDetails(orders).forEach(({ detail }) => {
    const row = base[detail.currentStationId];
    if (!row) return;
    row.total += 1;
    if (detail.status === "OPEN") row.open += 1;
    else if (detail.status === "READY") row.ready += 1;
    else row.release += 1;
  });

  return STATIONS.map((s) => {
    const row = base[s.id];
    const completionPct = row.total ? Math.round((row.release / row.total) * 100) : 0;

    let healthLabel = "Ổn";
    let healthTone = "green";
    if (row.open >= 6 && row.open >= row.release) {
      healthLabel = "Nghẽn";
      healthTone = "red";
    } else if (completionPct < 30 || row.open >= 3) {
      healthLabel = "Theo dõi";
      healthTone = "amber";
    }

    return { ...row, completionPct, healthLabel, healthTone };
  });
}

function getTopOrders(orders, count = 3) {
  return [...orders]
    .map((o) => ({
      orderId: o.orderId,
      customerName: o.customerName,
      currentStationName: o.currentStationName,
      openDetails: countOpenDetails(o),
      daysAtCurrentStation: o.daysAtCurrentStation,
      warning: o.warning,
    }))
    .sort((a, b) => {
      if (b.openDetails !== a.openDetails) return b.openDetails - a.openDetails;
      return b.daysAtCurrentStation - a.daysAtCurrentStation;
    })
    .slice(0, count);
}

function filterByDateRange(orders, dateRange) {
  return orders.filter((o) => isWithinRangeYmd(o.createdAt, dateRange));
}

const chartTooltipStyle = {
  backgroundColor: "#fff",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  fontSize: 12,
};

const emptyRange = { from: undefined, to: undefined };

export default function Dashboard() {
  const [now, setNow] = useState(() => new Date());
  const [dateRange, setDateRange] = useState(emptyRange);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const allOrders = useMemo(() => enrichOrders(MOCK_ORDERS, now), [now]);
  const filteredOrders = useMemo(() => filterByDateRange(allOrders, dateRange), [allOrders, dateRange]);

  const kpis = useMemo(() => getKpisFromOrders(filteredOrders, now), [filteredOrders, now]);
  const pieData = useMemo(() => getPieDataFromOrders(filteredOrders), [filteredOrders]);
  const chartData = useMemo(() => getGroupedChartData(filteredOrders), [filteredOrders]);
  const stationRows = useMemo(() => getStationStatsFromDetails(filteredOrders), [filteredOrders]);
  const topOrders = useMemo(() => getTopOrders(filteredOrders, 3), [filteredOrders]);

  const bottleneckStation = useMemo(
    () => [...stationRows].sort((a, b) => b.open - a.open)[0],
    [stationRows]
  );

  const safePieData = pieData.length ? pieData : [{ name: "READY", value: 1, key: "READY" }];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
        <header className="mb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Dashboard điều hành
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Tập trung vào đơn hôm nay, ORR, điểm nghẽn và đơn đang kẹt
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DateRangeField range={dateRange} onChange={setDateRange} />
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                <FiCalendar className="text-[14px]" />
                <span>{formatDateTimeNow(now)}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-5">
          <KpiCard
            title="Tổng đơn hàng hôm nay"
            value={kpis.totalToday}
            icon={FiPackage}
            tone="blue"
          />
          <KpiCard title="OPEN" value={kpis.open} icon={FiClock} tone="red" />
          <KpiCard title="READY" value={kpis.ready} icon={FiActivity} tone="amber" />
          <KpiCard
            title="RELEASE"
            value={kpis.release}
            icon={FiCheckCircle}
            tone="green"
          />
          <KpiCard
            title="Đơn trễ deadline"
            value={kpis.late}
            icon={FiAlertTriangle}
            tone="red"
          />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <SectionCard title="Tỷ lệ ORR" icon={FiBarChart2}>
            <div className="h-[220px] sm:h-[240px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={safePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="48%"
                    outerRadius="74%"
                    paddingAngle={2}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                  >
                    {safePieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.key] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Đơn hàng theo ngày" icon={FiCalendar} className="xl:col-span-2">
  <div className="h-[240px] sm:h-[260px] lg:h-[320px]">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={34} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11 }} />

        <Bar
          dataKey="total"
          name="Tổng đơn"
          fill="#94a3b8"
          radius={[4, 4, 0, 0]}
          barSize={24}
        />

        <Line
          type="monotone"
          dataKey="open"
          name="OPEN"
          stroke="#ef4444"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />

        <Line
          type="monotone"
          dataKey="ready"
          name="READY"
          stroke="#f59e0b"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />

        <Line
          type="monotone"
          dataKey="release"
          name="RELEASE"
          stroke="#22c55e"
          strokeWidth={2.5}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
</SectionCard>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          <SectionCard title="Điểm cần chú ý" icon={FiAlertTriangle} className="xl:col-span-1">
            <div className="space-y-2">
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="text-[11px] text-red-600">Trạm nghẽn nhất</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
                  {bottleneckStation?.stationName || "-"}
                </div>
                <div className="mt-1 text-[11px] text-slate-600">
                  OPEN: {bottleneckStation?.open ?? 0}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Tổng đơn đang theo dõi</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {filteredOrders.length}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Tổng chi tiết OPEN</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {filteredOrders.reduce((sum, o) => sum + countOpenDetails(o), 0)}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Top đơn hàng đang kẹt" icon={FiClock} className="xl:col-span-2">
            <div className="space-y-2">
              {topOrders.map((row, idx) => (
                <div key={row.orderId} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500">#{idx + 1}</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{row.orderId}</div>
                      <div className="mt-1 text-[11px] text-slate-500 break-words">
                        {row.customerName} • {row.currentStationName}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
                          OPEN CT: {row.openDetails}
                        </span>
                        <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700">
                          Ở trạm: {row.daysAtCurrentStation} ngày
                        </span>
                      </div>
                    </div>
                    <SeverityBadge
                      level={
                        row.warning === "Trễ"
                          ? "Nghiêm trọng"
                          : row.warning === "Gần trễ"
                          ? "Cảnh báo"
                          : "Bình thường"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Tình hình 14 trạm" icon={FiLayers}>
  <div className="overflow-x-auto -mx-1 px-1">
    <table className="min-w-[920px] w-full text-left text-[12px]">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-3 pr-3 font-semibold">Trạm</th>
          <th className="py-3 pr-2 text-center font-semibold">OPEN</th>
          <th className="py-3 pr-2 text-center font-semibold">READY</th>
          <th className="py-3 pr-2 text-center font-semibold">RELEASE</th>
          <th className="py-3 pr-2 text-center font-semibold">Tổng</th>
          <th className="py-3 pr-3 font-semibold">Tỷ trọng</th>
          <th className="py-3 pr-3 font-semibold">% HT</th>
          <th className="py-3 font-semibold">Đánh giá</th>
        </tr>
      </thead>

      <tbody>
        {stationRows.map((row) => {
          const rowTone =
            row.healthTone === "red"
              ? "bg-red-50/80"
              : row.healthTone === "amber"
              ? "bg-amber-50/80"
              : "bg-white";

          const badgeLevel =
            row.healthTone === "red"
              ? "Nghiêm trọng"
              : row.healthTone === "amber"
              ? "Cảnh báo"
              : "Bình thường";

          return (
            <tr
              key={row.stationId}
              className={`border-b border-slate-100 ${rowTone} hover:bg-slate-50 transition`}
            >
              <td className="py-3 pr-3">
                <div className="font-semibold text-slate-900">
                  {row.stationName}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {row.total > 0
                    ? `${row.open} OPEN • ${row.ready} READY • ${row.release} RELEASE`
                    : "Chưa có dữ liệu"}
                </div>
              </td>

              <td className="py-3 pr-2 text-center">
                <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 font-semibold text-red-700">
                  {row.open}
                </span>
              </td>

              <td className="py-3 pr-2 text-center">
                <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">
                  {row.ready}
                </span>
              </td>

              <td className="py-3 pr-2 text-center">
                <span className="inline-flex min-w-[42px] items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">
                  {row.release}
                </span>
              </td>

              <td className="py-3 pr-2 text-center">
                <span className="font-semibold text-slate-900 tabular-nums">
                  {row.total}
                </span>
              </td>

              <td className="py-3 pr-3">
                <StatusMiniBar
                  open={row.open}
                  ready={row.ready}
                  release={row.release}
                  total={row.total}
                />
              </td>

              <td className="py-3 pr-3">
                <ProgressMini
                  value={row.completionPct}
                  tone={
                    row.completionPct < 30
                      ? "red"
                      : row.completionPct < 60
                      ? "amber"
                      : "green"
                  }
                />
              </td>

              <td className="py-3">
                <SeverityBadge level={badgeLevel} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>

  <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
    <div className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
      OPEN
    </div>
    <div className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
      READY
    </div>
    <div className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
      RELEASE
    </div>
  </div>
</SectionCard>
      </div>
    </div>
  );
}