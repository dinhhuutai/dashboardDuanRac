// Báo cáo tự thiết kế (module 18) — hằng số + định dạng dùng chung cho trang xem và trang thiết kế.
// Luật tính nằm ở backend ApiDuAnRac/src/RequestManagement/report.js (frontend chỉ hiển thị).
import { fmtMoney } from "../shared/format";

export const PERIODS = [
  ["this_month", "Tháng này"], ["last_month", "Tháng trước"], ["this_week", "Tuần này"], ["today", "Hôm nay"],
  ["this_quarter", "Quý này"], ["this_year", "Năm nay"], ["last_year", "Năm trước"],
  ["last_7", "7 ngày qua"], ["last_30", "30 ngày qua"], ["last_90", "90 ngày qua"], ["all", "Toàn bộ thời gian"], ["custom", "Tuỳ chọn ngày…"],
];
export const PERIOD_LABEL = Object.fromEntries(PERIODS);

export const DIMENSION_LABEL = {
  none: "Không nhóm (tổng chung)", status: "Trạng thái", department: "Phòng ban người gửi", team: "Tổ người gửi", requester: "Người gửi",
  type: "Mẫu đề xuất", priority: "Mức độ (Gấp / Bình thường)", day: "Ngày", week: "Tuần", month: "Tháng", quarter: "Quý", year: "Năm",
};
export const TIME_DIMS = ["day", "week", "month", "quarter", "year"];
export const GROUP_FIELD_TYPES = ["select", "multiselect", "checkbox", "user", "text", "date", "daterange", "number"];
export const GROUP_COLUMN_TYPES = ["text", "date", "number"];
export const AGG_LABEL = { sum: "Tổng", avg: "Trung bình", min: "Nhỏ nhất", max: "Lớn nhất", count: "Số lượng" };
export const BASE_COLUMNS = [
  ["requestId", "Mã"], ["title", "Tiêu đề"], ["type", "Mẫu đề xuất"], ["requester", "Người gửi"], ["department", "Phòng ban"],
  ["team", "Tổ"], ["status", "Trạng thái"], ["priority", "Mức độ"], ["createdAt", "Ngày gửi"], ["finishedAt", "Ngày kết thúc"],
];
export const BASE_COLUMN_LABEL = Object.fromEntries(BASE_COLUMNS);

export const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4f46e5", "#0d9488", "#9333ea"];

export const EMPTY_DEFINITION = {
  period: "this_month", dateBasis: "created", statuses: [], departmentIds: [], priority: null,
  groupBy: { by: "status" },
  metrics: [{ key: "m1", label: "Số đề xuất", source: "request", agg: "count" }],
  chart: { type: "bar", metric: "m1" }, sort: { by: "label", dir: "asc" }, limit: 0,
  list: { show: true, columns: ["requestId", "title", "requester", "department", "status", "createdAt"] },
};

const num = (v, d = 2) => Number(v).toLocaleString("vi-VN", { maximumFractionDigits: d });

/** Giá trị chỉ số → chữ theo định dạng backend trả (int | money | number | hours) */
export function fmtMetric(m, v) {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return "—";
  switch (m.format) {
    case "money": return fmtMoney(v);
    case "int": return num(v, 0);
    case "hours": return Number(v) < 24 ? `${num(v, 1)} giờ` : `${num(Number(v) / 24, 1)} ngày`;
    default: return `${num(v)}${m.unit ? ` ${m.unit}` : ""}`;
  }
}

/** Số gọn cho trục biểu đồ: 1,5 tr · 2,3 tỷ · 12 N */
export function compact(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  const a = Math.abs(n);
  if (a >= 1e9) return `${num(n / 1e9, 1)} tỷ`;
  if (a >= 1e6) return `${num(n / 1e6, 1)} tr`;
  if (a >= 1e4) return `${num(n / 1e3, 0)} N`;
  return num(n, 1);
}

export function rangeText(range) {
  const f = (s) => (s ? s.split("-").reverse().join("/") : "");
  if (!range?.from && !range?.to) return "Toàn bộ thời gian";
  if (range.from === range.to) return f(range.from);
  return `${f(range.from) || "…"} – ${f(range.to) || "…"}`;
}

/** Mô tả ngắn nhóm theo (dùng trong danh sách báo cáo) */
export function groupByText(g, fields) {
  if (!g) return "";
  if (g.by === "field") return `Trường "${(fields || []).find((f) => f.key === g.field)?.label || g.field}"`;
  if (g.by === "column") {
    const t = (fields || []).find((f) => f.key === g.field);
    return `Cột "${t?.columns?.find((c) => c.key === g.column)?.label || g.column}"`;
  }
  return DIMENSION_LABEL[g.by] || g.by;
}
