// Loại trường của mẫu đề xuất — bản mô tả phía frontend.
// Backend kiểm tra/chuẩn hoá ở ApiDuAnRac/src/RequestManagement/definition.js — sửa một bên phải sửa cả hai
// (kể cả phần TỰ TÍNH: cột "= A × B" của bảng, trường "tổng của cột", trường "số tiền bằng chữ").
import {
  AlignLeft, Banknote, Calendar, CalendarRange, CheckSquare, ChevronDownSquare, Hash, Heading, ListChecks, Paperclip, Table2, Type, UserRound,
} from "lucide-react";
import { daysBetween, fmtMoney, fmtYmd } from "./format";

export const FIELD_TYPES = [
  { type: "text", label: "Văn bản ngắn", icon: Type },
  { type: "textarea", label: "Đoạn văn", icon: AlignLeft },
  { type: "number", label: "Số", icon: Hash },
  { type: "currency", label: "Số tiền (VNĐ)", icon: Banknote },
  { type: "date", label: "Ngày", icon: Calendar },
  { type: "daterange", label: "Từ ngày – đến ngày", icon: CalendarRange },
  { type: "select", label: "Chọn 1", icon: ChevronDownSquare },
  { type: "multiselect", label: "Chọn nhiều", icon: ListChecks },
  { type: "checkbox", label: "Ô xác nhận", icon: CheckSquare },
  { type: "user", label: "Chọn nhân viên", icon: UserRound },
  { type: "files", label: "Tệp / ảnh đính kèm", icon: Paperclip },
  { type: "table", label: "Bảng chi tiết", icon: Table2 },
  { type: "section", label: "Tiêu đề phần", icon: Heading },
];
export const FIELD_META = Object.fromEntries(FIELD_TYPES.map((t) => [t.type, t]));
/** Loại trường luôn chiếm cả dòng */
export const FULL_WIDTH_TYPES = ["textarea", "files", "multiselect", "section", "table"];

/** Loại cột của trường bảng. formula = tích 2 cột số, tự tính (vd Thành tiền = SL × Đơn giá) */
export const COLUMN_TYPES = [
  { type: "text", label: "Chữ" },
  { type: "number", label: "Số" },
  { type: "currency", label: "Tiền (VNĐ)" },
  { type: "date", label: "Ngày" },
  { type: "formula", label: "Tự tính = A × B" },
];

export const APPROVER_TYPES = [
  { value: "users", label: "Người cụ thể", hint: "Chọn sẵn người duyệt" },
  { value: "dept_head", label: "Trưởng phòng của người gửi", hint: "Theo phòng ban của người gửi (cấu hình ở Trưởng phòng & tổ trưởng)" },
  { value: "team_head", label: "Tổ trưởng của người gửi", hint: "Tổ chưa có tổ trưởng → chuyển trưởng phòng" },
  { value: "requester_pick", label: "Người gửi tự chọn", hint: "Người gửi chọn người duyệt khi tạo (có thể giới hạn danh sách, số người, cho phép bỏ qua)" },
];
export const APPROVER_META = Object.fromEntries(APPROVER_TYPES.map((t) => [t.value, t]));

const uidCounter = { n: 0 };
export const uid = (p) => `${p}${Date.now().toString(36).slice(-4)}${(uidCounter.n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const newColumn = (label = "", type = "text", extra = {}) => ({ key: uid("c"), label, type, ...extra });

export function newField(type) {
  const f = { key: uid("f"), type, label: "", required: false, width: "full" };
  if (type === "select" || type === "multiselect") f.options = [{ id: uid("o"), label: "Lựa chọn 1" }, { id: uid("o"), label: "Lựa chọn 2" }];
  if (type === "files") f.maxFiles = 10;
  if (type === "table") {
    const qty = newColumn("SL", "number"), price = newColumn("Đơn giá", "currency");
    f.columns = [newColumn("Nội dung"), newColumn("ĐVT"), qty, price, newColumn("Thành tiền", "formula", { of: [qty.key, price.key], sum: true })];
    f.maxRows = 50;
  }
  return f;
}

export const isEmptyValue = (v) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && !v.from && !v.to);

/* ============================ TỰ TÍNH (bản sao của backend definition.js) ============================ */

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
function readTriple(n, full) {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10;
  const out = [];
  if (tr > 0 || full) out.push(DIGITS[tr], "trăm");
  if (ch === 0) { if (dv > 0 && (tr > 0 || full)) out.push("lẻ"); }
  else if (ch === 1) out.push("mười");
  else out.push(DIGITS[ch], "mươi");
  if (dv > 0) {
    if (dv === 1 && ch > 1) out.push("mốt");
    else if (dv === 5 && ch > 0) out.push("lăm");
    else out.push(DIGITS[dv]);
  }
  return out.join(" ");
}
/** 2329544 → "Hai triệu ba trăm hai mươi chín nghìn năm trăm bốn mươi bốn đồng" */
export function moneyToWords(value) {
  let n = Math.round(Math.abs(Number(value)));
  if (!Number.isFinite(n) || n > 1e15) return "";
  const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  const groups = [];
  do { groups.push(n % 1000); n = Math.floor(n / 1000); } while (n > 0);
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0 && groups.length > 1) continue;
    parts.push(`${readTriple(groups[i], i < groups.length - 1) || "không"}${units[i] ? ` ${units[i]}` : ""}`);
  }
  const s = `${Number(value) < 0 ? "âm " : ""}${parts.join(" ")} đồng`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Ô số đang gõ ("1,5") hoặc số → số; trống/sai → NaN */
export function toNum(v) {
  if (typeof v === "number") return v;
  if (v === undefined || v === null || String(v).trim() === "") return NaN;
  return Number(String(v).replace(/\s/g, "").replace(",", "."));
}
const round4 = (n) => Math.round(n * 10000) / 10000;
export const isNumericCol = (c) => !!c && (c.type === "number" || c.type === "currency" || c.type === "formula");
export const isMoneyCol = (cols, c) => c.type === "currency" || (c.type === "formula" && (c.of || []).some((k) => cols.find((x) => x.key === k)?.type === "currency"));

/** Tính các cột "= A × B" của 1 dòng → dòng mới */
export function computeRow(columns, row) {
  const out = { ...row };
  for (const c of columns) {
    if (c.type !== "formula") continue;
    const a = toNum(out[c.of?.[0]]), b = toNum(out[c.of?.[1]]);
    if (Number.isFinite(a) && Number.isFinite(b)) out[c.key] = isMoneyCol(columns, c) ? Math.round(a * b) : round4(a * b);
    else delete out[c.key];
  }
  return out;
}
/** Tổng 1 cột số của bảng (null nếu không dòng nào có số) */
export function columnSum(columns, rows, colKey) {
  const c = columns.find((x) => x.key === colKey);
  if (!c) return null;
  const nums = (Array.isArray(rows) ? rows : []).map((r) => toNum(r?.[colKey])).filter(Number.isFinite);
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return isMoneyCol(columns, c) ? Math.round(s) : round4(s);
}
/** Dòng có ô nào đã điền (không tính cột tự tính) */
export const rowHasData = (columns, row) => columns.some((c) => c.type !== "formula" && row?.[c.key] !== undefined && row[c.key] !== null && String(row[c.key]).trim() !== "");

export const isComputed = (f) => !!(f.sumOf || f.wordsOf);

/** Điền các trường tự tính (tổng của cột bảng, số tiền bằng chữ) → object giá trị mới */
export function withComputed(fields, values) {
  if (!fields.some(isComputed)) return values;
  const out = { ...values };
  for (const f of fields) {
    if (!f.sumOf) continue;
    const t = fields.find((x) => x.key === f.sumOf.table && x.type === "table");
    const s = t ? columnSum(t.columns, out[t.key], f.sumOf.column) : null;
    if (s === null) delete out[f.key];
    else out[f.key] = s;
  }
  for (const f of fields) {
    if (!f.wordsOf) continue;
    const n = toNum(out[f.wordsOf]);
    if (Number.isFinite(n)) out[f.key] = moneyToWords(n);
    else delete out[f.key];
  }
  return out;
}

/* ============================ HIỂN THỊ / KIỂM TRA ============================ */

/** 1 ô của bảng → chữ */
export function cellText(columns, c, v) {
  if (v === undefined || v === null || v === "") return "";
  if (c.type === "date") return fmtYmd(v);
  if (isNumericCol(c)) {
    const n = toNum(v);
    return Number.isFinite(n) ? n.toLocaleString("vi-VN", { maximumFractionDigits: 4 }) : String(v);
  }
  return String(v);
}

/** Giá trị → chữ để hiển thị (userName: id → tên) */
export function displayValue(field, v, userName) {
  if (isEmptyValue(v) && field.type !== "checkbox") return "";
  switch (field.type) {
    case "currency": return fmtMoney(v);
    case "number": return `${Number(v).toLocaleString("vi-VN")}${field.unit ? ` ${field.unit}` : ""}`;
    case "date": return fmtYmd(v);
    case "daterange": {
      const n = daysBetween(v.from, v.to);
      return `${fmtYmd(v.from)} → ${fmtYmd(v.to)}${n ? ` (${n} ngày)` : ""}`;
    }
    case "select": return field.options?.find((o) => o.id === v)?.label || "(lựa chọn đã xoá)";
    case "multiselect": return (Array.isArray(v) ? v : []).map((id) => field.options?.find((o) => o.id === id)?.label || "?").join(", ");
    case "checkbox": return v === true ? "✔ Có" : v === false ? "Không" : "";
    case "user": return (Array.isArray(v) ? v : [v]).map((id) => userName(id)).join(", ");
    case "table": return `${(Array.isArray(v) ? v : []).length} dòng`;
    default: return String(v);
  }
}

/** Kiểm tra phía trình duyệt (backend kiểm lại) → { [key]: thông báo } */
export function validateValues(fields, values, filesByField) {
  const errs = {};
  for (const f of fields) {
    if (f.type === "section") continue;
    const v = values[f.key];
    if (isComputed(f)) {
      if (f.required && isEmptyValue(v)) errs[f.key] = f.sumOf ? "Điền số liệu vào bảng để tự tính" : "Điền số tiền để tự đọc bằng chữ";
      continue;
    }
    if (f.type === "table") {
      const rows = (Array.isArray(v) ? v : []).filter((r) => rowHasData(f.columns, r));
      if (f.required && !rows.length) errs[f.key] = "Cần ít nhất 1 dòng";
      else if (rows.length > (f.maxRows || 50)) errs[f.key] = `Tối đa ${f.maxRows || 50} dòng`;
      else if (rows.some((r) => f.columns.some((c) => c.type === "number" && r[c.key] !== undefined && r[c.key] !== "" && !Number.isFinite(toNum(r[c.key]))))) errs[f.key] = "Có ô số nhập chưa đúng";
      continue;
    }
    if (f.type === "files") {
      if (f.required && !(filesByField[f.key] || 0)) errs[f.key] = "Cần ít nhất 1 tệp";
      continue;
    }
    if (f.type === "checkbox") {
      if (f.required && v !== true) errs[f.key] = "Vui lòng xác nhận";
      continue;
    }
    if (f.type === "daterange" && v && (v.from || v.to)) {
      if (!v.from || !v.to) errs[f.key] = "Chọn đủ từ ngày – đến ngày";
      else if (v.from > v.to) errs[f.key] = "Ngày bắt đầu sau ngày kết thúc";
      continue;
    }
    if (f.required && isEmptyValue(typeof v === "string" ? v.trim() : v)) errs[f.key] = "Bắt buộc";
    if (f.type === "number" && !isEmptyValue(v)) {
      const n = Number(String(v).replace(",", "."));
      if (!Number.isFinite(n)) errs[f.key] = "Phải là số";
      else if (f.min !== undefined && n < f.min) errs[f.key] = `Tối thiểu ${f.min}`;
      else if (f.max !== undefined && n > f.max) errs[f.key] = `Tối đa ${f.max}`;
    }
  }
  return errs;
}
