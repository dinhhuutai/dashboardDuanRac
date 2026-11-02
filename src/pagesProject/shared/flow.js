// Sơ đồ thao tác + mốc thời gian của công việc (module 3) — chỉ tính toán, không giao diện.
//   flowSteps(task)    các bước theo thứ tự thời gian (giao → hỏi lại ↔ trả lời → xác nhận → nộp ↔ làm lại → duyệt) + bước đang chờ
//   phasesFromEvents   các giai đoạn trạng thái [từ, đến, trạng thái] từ dòng thời gian (sơ đồ 1 việc)
//   phasesFromTask     như trên nhưng chỉ từ mốc của việc (giao / xác nhận / nộp cuối / hoàn thành) — biểu đồ nhiều việc
//   milestones(task)   bảng mốc: giao, hạn mong muốn, xác nhận, hạn hoàn thành, nộp, hoàn thành, đúng/trễ hạn
import { fmtDuration } from "./meta";

/** Bây giờ theo giờ VN, dạng 'YYYY-MM-DDTHH:mm:ss' (cùng dạng với API) */
export const nowVN = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 19);
const ts = (s) => Date.parse(`${s}Z`);

/** Thao tác làm đổi trạng thái (comment / edit không đổi) */
const KIND_STATUS = { assign: "new", question: "clarify", answer: "new", accept: "doing", submit: "submitted", revise: "revise", approve: "done", cancel: "cancelled" };

export const STEP_META = {
  assign: { label: "Giao việc", tone: "slate" },
  question: { label: "Hỏi lại", tone: "orange" },
  answer: { label: "Trả lời", tone: "blue" },
  accept: { label: "Xác nhận + hạn", tone: "emerald" },
  submit: { label: "Nộp kết quả", tone: "violet" },
  revise: { label: "Yêu cầu làm lại", tone: "rose" },
  approve: { label: "Duyệt hoàn thành", tone: "emerald" },
  cancel: { label: "Huỷ việc", tone: "slate" },
  reopen: { label: "Mở lại", tone: "amber" },
  edit: { label: "Sửa nội dung", tone: "slate" },
};

/** Bước đang chờ (chưa xảy ra) theo trạng thái hiện tại */
const PENDING = {
  new: { label: "Chờ xác nhận", who: "assignee" },
  clarify: { label: "Chờ trả lời câu hỏi", who: "assigner" },
  doing: { label: "Chờ nộp kết quả", who: "assignee" },
  revise: { label: "Chờ nộp lại", who: "assignee" },
  submitted: { label: "Chờ duyệt", who: "assigner" },
};

/**
 * @param t chi tiết công việc từ API (events, status, dueDate, assigneeName, assignerName)
 * @returns [{ key, kind, label, tone, who, at, gap (thời gian từ bước trước), body, dueDate, pending? }]
 */
export function flowSteps(t, { includeEdits = false } = {}) {
  const evs = (t.events || []).filter((e) => e.kind !== "comment" && (includeEdits || e.kind !== "edit"));
  const steps = [];
  let prev = null;
  for (const e of evs) {
    const m = STEP_META[e.kind] || { label: e.kind, tone: "slate" };
    steps.push({ key: `e${e.eventId}`, kind: e.kind, label: m.label, tone: m.tone, who: e.fullName, at: e.createdAt,
      gap: prev ? fmtDuration(prev, e.createdAt) : "", body: e.body, dueDate: e.dueDate || null, files: e.files?.length || 0 });
    prev = e.createdAt;
  }
  const p = PENDING[t.status];
  if (p) {
    steps.push({ key: "pending", kind: "pending", label: p.label, tone: "pending", pending: true,
      who: p.who === "assignee" ? t.assigneeName : t.assignerName, at: null,
      gap: prev ? `đã ${fmtDuration(prev, nowVN())}` : "", dueDate: ["doing", "revise"].includes(t.status) ? t.dueDate : null });
  }
  return steps;
}

/** Giai đoạn trạng thái từ dòng thời gian: [{ status, from, to, open }] (to = bây giờ nếu chưa kết thúc) */
export function phasesFromEvents(t) {
  const out = [];
  let cur = null;
  let accepted = false;
  for (const e of t.events || []) {
    let s = KIND_STATUS[e.kind];
    if (e.kind === "accept") accepted = true;
    if (e.kind === "reopen") s = accepted ? "doing" : "new";
    if (!s) continue;
    if (cur) { cur.to = e.createdAt; out.push(cur); }
    cur = { status: s, from: e.createdAt, to: null };
  }
  if (cur) {
    const end = ["done", "cancelled"].includes(cur.status);
    if (!end) { cur.to = nowVN(); cur.open = true; out.push(cur); } // trạng thái đang diễn ra
  }
  return out.filter((x) => x.to && ts(x.to) >= ts(x.from));
}

/** Giai đoạn từ mốc của việc (không cần dòng thời gian) */
export function phasesFromTask(t) {
  const now = nowVN();
  const end = t.doneAt || (t.status === "cancelled" ? t.lastActivityAt : null) || now;
  const out = [];
  const push = (status, from, to, open) => { if (from && to && ts(to) >= ts(from)) out.push({ status, from, to, open }); };
  if (t.status === "cancelled") { push("cancelled", t.createdAt, end); return out; }
  const acc = t.acceptedAt;
  const sub = t.submittedAt && (!acc || ts(t.submittedAt) >= ts(acc)) ? t.submittedAt : null;
  if (!acc) { push(t.status === "clarify" ? "clarify" : "new", t.createdAt, end, !t.doneAt); return out; }
  push("new", t.createdAt, acc);
  if (!sub) { push(t.status === "revise" ? "revise" : "doing", acc, end, !t.doneAt); return out; }
  push("doing", acc, sub);
  push(t.status === "revise" ? "revise" : "submitted", sub, end, !t.doneAt);
  return out;
}

/** Đúng hạn? (lần nộp cuối — chưa có thì lúc duyệt — không sau hạn đã xác nhận) — null = chưa biết */
export function onTime(t) {
  if (!t.dueDate) return null;
  const at = (t.submittedAt || t.doneAt || "").slice(0, 10);
  return at ? at <= t.dueDate : null;
}

export function milestones(t) {
  const evs = t.events || [];
  const count = (k) => evs.filter((e) => e.kind === k).length;
  return {
    assignedAt: t.createdAt,
    expectedDate: t.expectedDate,
    acceptedAt: t.acceptedAt,
    dueDate: t.dueDate,
    submittedAt: t.submittedAt,
    doneAt: t.doneAt,
    questions: count("question"),
    revisions: count("revise"),
    submissions: count("submit"),
    total: fmtDuration(t.createdAt, t.doneAt || nowVN()),
    onTime: t.status === "done" ? onTime(t) : null,
  };
}

/** Khoảng ngày bao mọi việc (biểu đồ tiến độ): từ ngày giao sớm nhất tới max(hôm nay, hạn, ngày xong) — 'YYYY-MM-DD' */
export function dateRange(tasks, today, { minFrom } = {}) {
  let a = today, b = today;
  for (const x of tasks) {
    for (const s of [x.createdAt, x.acceptedAt]) if (s && s.slice(0, 10) < a) a = s.slice(0, 10);
    for (const s of [x.doneAt, x.dueDate, x.expectedDate]) if (s && s.slice(0, 10) > b) b = s.slice(0, 10);
  }
  if (minFrom && a < minFrom) a = minFrom;
  return { from: a, to: b };
}
