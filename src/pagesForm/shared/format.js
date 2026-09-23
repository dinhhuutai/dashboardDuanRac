// Định dạng dữ liệu của module Biểu mẫu.
// API trả thời gian dạng 'YYYY-MM-DDTHH:mm:ss' = giờ Việt Nam, KHÔNG có múi giờ.
// new Date('YYYY-MM-DDTHH:mm:ss') (không có Z) được trình duyệt hiểu là giờ địa phương → đúng.

const pad = (n) => String(n).padStart(2, "0");

export function parseLocal(s) {
  if (!s) return null;
  const d = new Date(String(s).slice(0, 19));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDateTime(s) {
  const d = parseLocal(s);
  if (!d) return "";
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDate(s) {
  const d = parseLocal(s);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : "";
}

/** Giá trị cho <input type="datetime-local"> */
export const toInputDateTime = (s) => (s ? String(s).slice(0, 16) : "");

export function fmtNumber(n, digits = 2) {
  if (n === null || n === undefined || n === "" || !Number.isFinite(Number(n))) return "";
  return Number(n).toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

export const fmtPercent = (r) => (r === null || r === undefined ? "—" : `${Math.round(r * 100)}%`);

/** "Còn 3 ngày", "Hết hạn hôm nay 17:00", "Đã hết hạn" */
export function deadlineText(closeAt) {
  const d = parseLocal(closeAt);
  if (!d) return null;
  const now = new Date();
  const ms = d - now;
  if (ms < 0) return { text: `Đã hết hạn ${fmtDateTime(closeAt)}`, urgent: false, expired: true };
  const days = Math.floor(ms / 86400000);
  if (days === 0) return { text: `Hạn chót hôm nay ${pad(d.getHours())}:${pad(d.getMinutes())}`, urgent: true };
  if (days <= 2) return { text: `Còn ${days} ngày (hạn ${fmtDateTime(closeAt)})`, urgent: true };
  return { text: `Hạn chót ${fmtDateTime(closeAt)}`, urgent: false };
}

export function todayText() {
  const d = new Date();
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
