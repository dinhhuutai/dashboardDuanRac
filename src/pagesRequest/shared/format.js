// Định dạng thời gian / trạng thái của module 18. API trả giờ VN dạng 'YYYY-MM-DDTHH:mm:ss' (không múi giờ).
import { fmtDate, fmtDateTime, parseLocal } from "~/pagesForm/shared/format";

export { fmtDate, fmtDateTime, parseLocal };

const pad = (n) => String(n).padStart(2, "0");

/** "vừa xong", "5 phút", "3 giờ", "hôm qua 14:20", "12/09" */
export function timeAgo(s) {
  const d = parseLocal(s);
  if (!d) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`;
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return `${Math.floor(diff / 3600)} giờ`;
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `hôm qua ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.getFullYear() === today.getFullYear()) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`;
}

/** Giờ:phút (tin nhắn) */
export function hm(s) {
  const d = parseLocal(s);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
}

/** Nhãn ngày phân cách trong chat */
export function dayLabel(s) {
  const d = parseLocal(s);
  if (!d) return "";
  const t = new Date();
  if (d.toDateString() === t.toDateString()) return "Hôm nay";
  const y = new Date(t);
  y.setDate(t.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Hôm qua";
  return fmtDate(s);
}

export const fmtMoney = (n) => (Number.isFinite(Number(n)) ? `${Number(n).toLocaleString("vi-VN")} đ` : "");

/** 'YYYY-MM-DD' → dd/mm/yyyy */
export function fmtYmd(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s || "";
}

/** Số ngày giữa 2 ngày 'YYYY-MM-DD' (tính cả 2 đầu) */
export function daysBetween(a, b) {
  const x = Date.parse(`${a}T00:00:00`), y = Date.parse(`${b}T00:00:00`);
  return Number.isFinite(x) && Number.isFinite(y) ? Math.round((y - x) / 86400000) + 1 : null;
}

export const STATUS = {
  pending: { label: "Chờ duyệt", cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  approved: { label: "Đã duyệt", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  rejected: { label: "Từ chối", cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  returned: { label: "Cần bổ sung", cls: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  cancelled: { label: "Đã huỷ", cls: "bg-slate-100 text-slate-600 ring-slate-200", dot: "bg-slate-400" },
};

export const APPROVER_STATUS = {
  waiting: { label: "Chưa tới lượt", cls: "text-slate-400" },
  pending: { label: "Đang chờ duyệt", cls: "text-amber-600" },
  approved: { label: "Đã duyệt", cls: "text-emerald-600" },
  rejected: { label: "Từ chối", cls: "text-red-600" },
  returned: { label: "Trả lại", cls: "text-violet-600" },
  skipped: { label: "Không cần duyệt", cls: "text-slate-400" },
};

/** Hạn xử lý: { text, tone } */
export function deadlineInfo(ymd, status) {
  if (!ymd) return null;
  const d = Date.parse(`${ymd}T23:59:59`);
  if (!Number.isFinite(d)) return null;
  const days = Math.ceil((d - Date.now()) / 86400000);
  if (status !== "pending") return { text: `Hạn ${fmtYmd(ymd)}`, tone: "slate" };
  if (days < 0) return { text: `Quá hạn ${-days} ngày`, tone: "red" };
  if (days <= 1) return { text: days === 0 ? "Hạn hôm nay" : "Hạn ngày mai", tone: "amber" };
  return { text: `Hạn ${fmtYmd(ymd)}`, tone: "slate" };
}
