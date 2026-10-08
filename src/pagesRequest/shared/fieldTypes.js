// Loại trường của mẫu đề xuất — bản mô tả phía frontend.
// Backend kiểm tra/chuẩn hoá ở ApiDuAnRac/src/RequestManagement/definition.js — sửa một bên phải sửa cả hai.
import {
  AlignLeft, Banknote, Calendar, CalendarRange, CheckSquare, ChevronDownSquare, Hash, Heading, ListChecks, Paperclip, Type, UserRound,
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
  { type: "section", label: "Tiêu đề phần", icon: Heading },
];
export const FIELD_META = Object.fromEntries(FIELD_TYPES.map((t) => [t.type, t]));

export const APPROVER_TYPES = [
  { value: "users", label: "Người cụ thể", hint: "Chọn sẵn người duyệt" },
  { value: "dept_head", label: "Trưởng phòng của người gửi", hint: "Theo phòng ban của người gửi (cấu hình ở Trưởng phòng & tổ trưởng)" },
  { value: "team_head", label: "Tổ trưởng của người gửi", hint: "Tổ chưa có tổ trưởng → chuyển trưởng phòng" },
  { value: "requester_pick", label: "Người gửi tự chọn", hint: "Người gửi chọn người duyệt khi tạo (có thể giới hạn danh sách)" },
];
export const APPROVER_META = Object.fromEntries(APPROVER_TYPES.map((t) => [t.value, t]));

const uidCounter = { n: 0 };
export const uid = (p) => `${p}${Date.now().toString(36).slice(-4)}${(uidCounter.n++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function newField(type) {
  const f = { key: uid("f"), type, label: "", required: false, width: "full" };
  if (type === "select" || type === "multiselect") f.options = [{ id: uid("o"), label: "Lựa chọn 1" }, { id: uid("o"), label: "Lựa chọn 2" }];
  if (type === "files") f.maxFiles = 10;
  return f;
}

export const isEmptyValue = (v) =>
  v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && !v.from && !v.to);

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
    default: return String(v);
  }
}

/** Kiểm tra phía trình duyệt (backend kiểm lại) → { [key]: thông báo } */
export function validateValues(fields, values, filesByField) {
  const errs = {};
  for (const f of fields) {
    if (f.type === "section") continue;
    const v = values[f.key];
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
