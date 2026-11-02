// Nhãn / màu trạng thái của module 3 — bản mô tả phía frontend của ApiDuAnRac/src/ProjectManagement/rules.js
// (sửa trạng thái / thao tác ở backend thì sửa cả ở đây).
// hex = cùng màu với `dot` — dùng cho thanh giai đoạn / biểu đồ tiến độ (luôn kèm nhãn hoặc chú thích, không chỉ màu)
export const TASK_STATUS = {
  new: { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500", hex: "#f59e0b" },
  clarify: { label: "Đang hỏi lại", cls: "bg-orange-50 text-orange-700 ring-orange-200", dot: "bg-orange-500", hex: "#f97316" },
  doing: { label: "Đang làm", cls: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500", hex: "#3b82f6" },
  submitted: { label: "Chờ duyệt", cls: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500", hex: "#8b5cf6" },
  revise: { label: "Làm lại", cls: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500", hex: "#f43f5e" },
  done: { label: "Hoàn thành", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", hex: "#10b981" },
  cancelled: { label: "Đã huỷ", cls: "bg-slate-100 text-slate-500 ring-slate-200", dot: "bg-slate-400", hex: "#94a3b8" },
};

export const PROJECT_STATUS = {
  active: { label: "Đang chạy", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  paused: { label: "Tạm dừng", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  done: { label: "Hoàn thành", cls: "bg-blue-50 text-blue-700 ring-blue-200" },
  archived: { label: "Lưu trữ", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

export const ROLE_LABEL = { admin: "Quản trị", assigner: "Người giao việc", assignee: "Người được giao" };

/** Nội dung từng mục trên dòng thời gian công việc */
export const EVENT_TEXT = {
  assign: "giao việc",
  question: "hỏi lại",
  answer: "trả lời",
  accept: "xác nhận đã hiểu",
  comment: "bình luận",
  submit: "nộp kết quả",
  approve: "duyệt hoàn thành",
  revise: "yêu cầu làm lại",
  edit: "sửa công việc",
  cancel: "huỷ công việc",
  reopen: "mở lại công việc",
};

/** Bấm 1 thông báo → trang nào (kind từ backend: assign, question, …, mention, mention_chat, post, member) */
export function notificationLink(n, R) {
  if (n.taskId) return `${R.projectTask}/${n.taskId}`;
  if (n.projectId && n.kind === "mention_chat") return `${R.projectView}/${n.projectId}?tab=chat`;
  if (n.projectId) return `${R.projectView}/${n.projectId}`;
  return R.project;
}

/** Thời lượng giữa 2 mốc 'YYYY-MM-DDTHH:mm:ss' → "35 phút" / "3 giờ" / "2 ngày 4 giờ" */
export function fmtDuration(a, b) {
  if (!a || !b) return "";
  return fmtSpan(Date.parse(`${b}Z`) - Date.parse(`${a}Z`));
}
/** Số mili-giây → "35 phút" / "3 giờ" / "2 ngày 4 giờ" */
export function fmtSpan(ms) {
  if (!(ms >= 0)) return "";
  const min = Math.round(ms / 60000);
  if (min < 1) return "dưới 1 phút";
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ${min % 60 >= 10 && h < 6 ? ` ${min % 60} phút` : ""}`;
  const d = Math.floor(h / 24);
  return `${d} ngày${h % 24 ? ` ${h % 24} giờ` : ""}`;
}

export const PROJECT_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#db2777", "#9333ea", "#475569"];

const pad = (n) => String(n).padStart(2, "0");
/** 'YYYY-MM-DD' → 'dd/mm/yyyy' */
export const fmtYmd = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s.split("-").reverse().join("/") : s || "");
/** 'YYYY-MM-DDTHH:mm:ss' (giờ VN) → 'dd/mm HH:mm' (năm khác → 'dd/mm/yy') */
export function fmtWhen(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s || "");
  if (!m) return "";
  const thisYear = String(new Date().getFullYear()) === m[1];
  return `${m[3]}/${m[2]}${thisYear ? "" : `/${m[1].slice(2)}`} ${m[4]}:${m[5]}`;
}
/** Số ngày từ hôm nay tới hạn (âm = đã quá) */
export function daysLeft(ymd, today) {
  if (!ymd || !today) return null;
  return Math.round((Date.parse(`${ymd}T00:00:00`) - Date.parse(`${today}T00:00:00`)) / 86400000);
}
/** Hạn → { text, tone } để hiển thị */
export function dueInfo(t, today) {
  if (!t.dueDate) return t.expectedDate ? { text: `Hạn mong muốn ${fmtYmd(t.expectedDate)}`, tone: "slate" } : null;
  if (!["doing", "revise"].includes(t.status)) return { text: `Hạn ${fmtYmd(t.dueDate)}`, tone: "slate" };
  const d = daysLeft(t.dueDate, today);
  if (d < 0) return { text: `Quá hạn ${-d} ngày`, tone: "red" };
  if (d === 0) return { text: "Hạn hôm nay", tone: "amber" };
  if (d === 1) return { text: "Hạn ngày mai", tone: "amber" };
  return { text: `Hạn ${fmtYmd(t.dueDate)}`, tone: "slate" };
}
export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
