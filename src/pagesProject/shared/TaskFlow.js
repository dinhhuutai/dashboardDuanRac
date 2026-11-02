// "Sơ đồ thao tác & mốc thời gian" của 1 công việc (chi tiết việc):
//   1) thanh giai đoạn: thời gian ở từng trạng thái (chờ xác nhận → đang làm → chờ duyệt…) theo tỉ lệ thời gian thật
//   2) sơ đồ các bước: ai làm gì, lúc nào, cách bước trước bao lâu (máy tính: nằm ngang; điện thoại: dọc) + bước đang chờ
//   3) mốc: giao, hạn mong muốn, xác nhận, hạn hoàn thành, nộp lần cuối, hoàn thành, đúng / trễ hạn
import { useMemo, useState } from "react";
import {
  CalendarCheck, CheckCircle2, ChevronDown, Clock, FileUp, Hourglass, MessageCircleQuestion, MessageSquareReply, Paperclip, Pencil,
  RotateCcw, Send, Undo2, XCircle,
} from "lucide-react";
import { cn } from "~/pagesForm/shared/ui";
import { TASK_STATUS, fmtDuration, fmtSpan, fmtWhen, fmtYmd } from "./meta";
import { flowSteps, milestones, phasesFromEvents } from "./flow";

const ICONS = {
  assign: Send, question: MessageCircleQuestion, answer: MessageSquareReply, accept: CheckCircle2, submit: FileUp,
  revise: Undo2, approve: CheckCircle2, cancel: XCircle, reopen: RotateCcw, edit: Pencil, pending: Hourglass,
};
const TONE = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  orange: "bg-orange-100 text-orange-700 ring-orange-200",
  blue: "bg-blue-100 text-blue-700 ring-blue-200",
  emerald: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  violet: "bg-violet-100 text-violet-700 ring-violet-200",
  rose: "bg-rose-100 text-rose-700 ring-rose-200",
  amber: "bg-amber-100 text-amber-800 ring-amber-200",
  pending: "border-2 border-dashed border-slate-300 bg-white text-slate-400 ring-transparent",
};

/** Thanh giai đoạn theo thời gian (dùng cả ở biểu đồ tiến độ) */
export function PhaseBar({ phases, height = 10, className }) {
  const total = phases.reduce((a, p) => a + Math.max(0, Date.parse(`${p.to}Z`) - Date.parse(`${p.from}Z`)), 0);
  if (!phases.length || !total) return null;
  return (
    <div className={cn("flex w-full gap-[2px] overflow-hidden rounded", className)} style={{ height }} role="img"
      aria-label={phases.map((p) => `${TASK_STATUS[p.status]?.label}: ${fmtDuration(p.from, p.to)}`).join(", ")}>
      {phases.map((p, i) => {
        const w = Math.max(0, Date.parse(`${p.to}Z`) - Date.parse(`${p.from}Z`)) / total;
        const s = TASK_STATUS[p.status] || TASK_STATUS.new;
        return (
          <span key={i} title={`${s.label} · ${fmtDuration(p.from, p.to)} (${fmtWhen(p.from)} → ${p.open ? "bây giờ" : fmtWhen(p.to)})`}
            className={cn("h-full min-w-[3px] first:rounded-l last:rounded-r", p.open && "opacity-70")}
            style={{ flexGrow: Math.max(w, 0.0001), flexBasis: 0, background: s.hex,
              backgroundImage: p.open ? "repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 4px, transparent 4px 8px)" : undefined }} />
        );
      })}
    </div>
  );
}

function PhaseSummary({ phases }) {
  // cộng dồn thời gian theo trạng thái (vd. làm lại 2 lần)
  const sum = new Map();
  for (const p of phases) {
    const ms = Date.parse(`${p.to}Z`) - Date.parse(`${p.from}Z`);
    sum.set(p.status, (sum.get(p.status) || 0) + Math.max(0, ms));
  }
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
      {[...sum.entries()].map(([s, ms]) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: TASK_STATUS[s]?.hex }} />
          {TASK_STATUS[s]?.label}: <b className="font-semibold text-slate-800">{fmtSpan(ms)}</b>
        </li>
      ))}
    </ul>
  );
}

function Step({ s, last, horizontal }) {
  const Icon = ICONS[s.kind] || Clock;
  return (
    <li className={cn("relative flex", horizontal ? "w-44 shrink-0 flex-col items-center text-center" : "gap-3 pb-4")}>
      {/* đường nối */}
      {!last && (horizontal
        ? <span className="absolute left-[calc(50%+22px)] right-[calc(-50%+22px)] top-[17px] h-0.5 bg-slate-200" />
        : <span className="absolute bottom-0 left-[17px] top-9 w-0.5 bg-slate-200" />)}
      <span className={cn("relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1", TONE[s.tone] || TONE.slate)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className={cn("min-w-0", horizontal ? "mt-2 px-1" : "flex-1 pt-0.5")}>
        <p className={cn("text-sm font-semibold", s.pending ? "text-slate-500" : "text-slate-800")}>{s.label}</p>
        <p className="truncate text-xs text-slate-500">{s.who || "—"}</p>
        <p className="text-xs tabular-nums text-slate-400">
          {s.at ? fmtWhen(s.at) : s.pending ? "chưa xảy ra" : ""}
          {!horizontal && s.gap && <span className="ml-1.5 text-slate-400">· {s.pending ? s.gap : `sau ${s.gap}`}</span>}
        </p>
        {s.dueDate && <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CalendarCheck className="h-3 w-3" /> hạn {fmtYmd(s.dueDate)}</p>}
        {s.files > 0 && <p className="inline-flex items-center gap-1 text-xs text-slate-500"><Paperclip className="h-3 w-3" />{s.files} tệp</p>}
        {!horizontal && s.body && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{s.body}</p>}
      </div>
      {/* thời gian từ bước trước — hiện trên đường nối */}
      {s.gap && (horizontal
        ? <span className="absolute -left-[50%] top-[22px] w-full text-center text-[11px] text-slate-400">{s.gap}</span>
        : null)}
    </li>
  );
}

const Mile = ({ label, value, sub, tone }) => (
  <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className={cn("truncate text-sm font-semibold", tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-700" : value ? "text-slate-800" : "text-slate-300")}>{value || "—"}</p>
    {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
  </div>
);

export default function TaskFlow({ t }) {
  const [open, setOpen] = useState(true);
  const steps = useMemo(() => flowSteps(t), [t]);
  const phases = useMemo(() => phasesFromEvents(t), [t]);
  const m = useMemo(() => milestones(t), [t]);
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className="flex-1 font-semibold text-slate-800">Sơ đồ thao tác & mốc thời gian</span>
        <span className="text-xs text-slate-400">{m.total ? `tổng ${m.total}` : ""}</span>
        <ChevronDown className={cn("h-5 w-5 text-slate-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Mile label="Giao việc" value={fmtWhen(m.assignedAt)} sub={t.assignerName} />
            <Mile label="Hạn mong muốn" value={fmtYmd(m.expectedDate)} />
            <Mile label="Xác nhận" value={fmtWhen(m.acceptedAt)} sub={m.acceptedAt ? `sau ${fmtDuration(m.assignedAt, m.acceptedAt)}` : t.assigneeName} />
            <Mile label="Hạn hoàn thành" value={fmtYmd(m.dueDate)} tone={t.overdue ? "red" : undefined} sub={t.overdue ? "đã quá hạn" : undefined} />
            <Mile label="Nộp lần cuối" value={fmtWhen(m.submittedAt)} sub={m.submissions > 1 ? `${m.submissions} lần nộp` : undefined} />
            <Mile label="Hoàn thành" value={fmtWhen(m.doneAt)} tone={m.onTime === true ? "green" : m.onTime === false ? "red" : undefined}
              sub={m.onTime === true ? "đúng hạn" : m.onTime === false ? "trễ hạn" : undefined} />
          </div>
          {(m.questions > 0 || m.revisions > 0) && (
            <p className="flex flex-wrap gap-2 text-xs">
              {m.questions > 0 && <span className="rounded-full bg-orange-50 px-2 py-0.5 font-medium text-orange-700 ring-1 ring-orange-200">Hỏi lại {m.questions} lần</span>}
              {m.revisions > 0 && <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700 ring-1 ring-rose-200">Làm lại {m.revisions} lần</span>}
            </p>
          )}
          {phases.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Thời gian theo giai đoạn</p>
              <PhaseBar phases={phases} height={14} />
              <PhaseSummary phases={phases} />
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Các bước</p>
            {/* máy tính: ngang, cuộn được nếu nhiều bước */}
            <ol className="hidden overflow-x-auto pb-2 pt-1 lg:flex" data-flow="h">
              {steps.map((s, i) => <Step key={s.key} s={s} last={i === steps.length - 1} horizontal />)}
            </ol>
            {/* điện thoại: dọc, ghi thời gian từ bước trước */}
            <ol className="lg:hidden" data-flow="v">
              {steps.map((s, i) => <Step key={s.key} s={s} last={i === steps.length - 1} />)}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}
