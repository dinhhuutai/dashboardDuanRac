// Biểu đồ tiến độ (sơ đồ công việc theo thời gian) — mỗi việc 1 dòng:
//   thanh = từ lúc giao tới lúc xong (chưa xong: tới bây giờ), chia giai đoạn theo trạng thái (chờ xác nhận / đang làm / chờ duyệt…)
//   ● xác nhận  ◆ nộp lần cuối  ✓ hoàn thành  ▏hạn hoàn thành (đỏ = quá hạn)  ┆ hôm nay
// Dùng ở: trang công việc của 1 người, tab "Tiến độ" của dự án, việc của 1 thành viên.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { cn } from "~/pagesForm/shared/ui";
import config from "~/config";
import { TASK_STATUS, fmtWhen, fmtYmd } from "./meta";
import { dateRange, nowVN, phasesFromTask } from "./flow";

const R = config.routes;
const DAY = 86400000;
const ms = (s) => Date.parse(`${s.length === 10 ? `${s}T00:00:00` : s}Z`);

function axisTicks(from, to) {
  const days = Math.round((ms(to) - ms(from)) / DAY) + 1;
  const step = days <= 21 ? 1 : days <= 70 ? 7 : days <= 200 ? 14 : 30;
  const out = [];
  for (let i = 0; i < days; i += step) {
    const d = new Date(ms(from) + i * DAY).toISOString().slice(0, 10);
    out.push({ d, i, label: `${d.slice(8, 10)}/${d.slice(5, 7)}` });
  }
  return { days, ticks: out };
}

/**
 * @param tasks    việc (createdAt, acceptedAt, submittedAt, doneAt, dueDate, status, title, projectName, assigneeName…)
 * @param groupBy  'assignee' | 'project' | null
 * @param minFrom  không vẽ trước ngày này (vd. đầu kỳ đang xem)
 */
export default function Gantt({ tasks, today, groupBy = null, minFrom, emptyText = "Chưa có công việc trong khoảng thời gian này" }) {
  const { from, to } = useMemo(() => dateRange(tasks, today, { minFrom }), [tasks, today, minFrom]);
  const { days, ticks } = useMemo(() => axisTicks(from, to), [from, to]);
  const start = ms(from);
  const span = (days) * DAY;
  const pct = (s) => Math.min(100, Math.max(0, ((ms(s) - start) / span) * 100));
  const now = nowVN();
  const groups = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    if (!groupBy) return [{ key: "all", label: null, rows: sorted }];
    const m = new Map();
    for (const t of sorted) {
      const k = groupBy === "project" ? t.projectId : t.assigneeId;
      if (!m.has(k)) m.set(k, { key: k, label: groupBy === "project" ? t.projectName : t.assigneeName, color: groupBy === "project" ? t.projectColor : null, rows: [] });
      m.get(k).rows.push(t);
    }
    return [...m.values()];
  }, [tasks, groupBy]);

  if (!tasks.length) return <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-400">{emptyText}</p>;

  const width = Math.max(560, days * (days <= 31 ? 28 : days <= 92 ? 12 : 5));
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto" data-gantt>
        <div className="grid" style={{ gridTemplateColumns: `minmax(150px, 240px) minmax(${width}px, 1fr)` }}>
          {/* trục thời gian */}
          <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">Công việc</div>
          <div className="relative h-9 border-b border-slate-200">
            {ticks.map((t) => (
              <span key={t.d} className="absolute top-0 h-full border-l border-slate-100 pl-1 pt-2 text-[11px] tabular-nums text-slate-400" style={{ left: `${(t.i / days) * 100}%` }}>{t.label}</span>
            ))}
            {today >= from && today <= to && <span className="absolute bottom-0 h-2 w-0.5 bg-blue-600" style={{ left: `${pct(now)}%` }} />}
          </div>
          {groups.map((g) => (
            <GroupRows key={g.key} g={g} pct={pct} ticks={ticks} days={days} now={now} today={today} from={from} to={to} />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
        {["new", "clarify", "doing", "submitted", "revise"].map((s) => (
          <span key={s} className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: TASK_STATUS[s].hex }} />{TASK_STATUS[s].label}</span>
        ))}
        <span className="inline-flex items-center gap-1"><span className="h-3 w-0.5 bg-slate-700" />Hạn hoàn thành</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 border-l-2 border-dotted border-slate-400" />Hạn mong muốn (chưa xác nhận)</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 w-0.5 bg-red-600" />Quá hạn</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white ring-2 ring-slate-700" />Xác nhận</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rotate-45 bg-white ring-2 ring-violet-700" />Nộp</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" />Hoàn thành</span>
        <span className="inline-flex items-center gap-1"><span className="h-3 border-l-2 border-dashed border-blue-600" />Hôm nay</span>
      </div>
    </div>
  );
}

function GroupRows({ g, pct, ticks, days, now, today, from, to }) {
  return (
    <>
      {g.label && (
        <>
          <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {g.color && <span className="h-2 w-2 rounded-sm" style={{ background: g.color }} />}<span className="truncate">{g.label}</span>
            <span className="ml-auto font-normal text-slate-400">{g.rows.length}</span>
          </div>
          <div className="border-b border-slate-100 bg-slate-50" />
        </>
      )}
      {g.rows.map((t) => <Row key={t.taskId} t={t} pct={pct} ticks={ticks} days={days} now={now} today={today} from={from} to={to} />)}
    </>
  );
}

function Row({ t, pct, ticks, days, now, today, from, to }) {
  const phases = phasesFromTask(t);
  const s = TASK_STATUS[t.status] || TASK_STATUS.new;
  const end = t.doneAt || (t.status === "cancelled" ? t.lastActivityAt || t.createdAt : now);
  const left = pct(t.createdAt);
  const right = pct(end);
  const dueX = t.dueDate && t.dueDate >= from && t.dueDate <= to ? pct(`${t.dueDate}T23:59:59`) : null;
  // chưa xác nhận hạn → vạch chấm ở hạn người giao mong muốn
  const expX = !t.dueDate && t.expectedDate && t.expectedDate >= from && t.expectedDate <= to ? pct(`${t.expectedDate}T23:59:59`) : null;
  const overdue = t.overdue || (t.dueDate && ["doing", "revise"].includes(t.status) && t.dueDate < today);
  const title = `${t.title}\n${s.label} · giao ${fmtWhen(t.createdAt)}${t.dueDate ? ` · hạn ${fmtYmd(t.dueDate)}` : ""}${t.doneAt ? ` · xong ${fmtWhen(t.doneAt)}` : ""}`;
  return (
    <>
      <Link to={`${R.projectTask}/${t.taskId}`} title={title}
        className="sticky left-0 z-10 block min-w-0 border-b border-r border-slate-100 bg-white px-3 py-1.5 hover:bg-blue-50/60">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.hex }} />
          <span className="truncate text-[13px] font-medium text-slate-800">{t.title}</span>
        </span>
        <span className="block truncate text-[11px] text-slate-400">{[t.projectName, t.assigneeName].filter(Boolean).join(" · ")}</span>
      </Link>
      <div className="relative border-b border-slate-100" data-row={t.taskId}>
        {ticks.map((x) => <span key={x.d} className="absolute inset-y-0 border-l border-slate-50" style={{ left: `${(x.i / days) * 100}%` }} />)}
        {today >= from && today <= to && <span className="absolute inset-y-0 border-l-2 border-dashed border-blue-600/60" style={{ left: `${pct(now)}%` }} />}
        <Link to={`${R.projectTask}/${t.taskId}`} title={title} className="absolute top-1/2 flex h-3.5 -translate-y-1/2 gap-[2px] overflow-hidden rounded"
          style={{ left: `${left}%`, width: `max(4px, ${Math.max(0, right - left)}%)` }}>
          {phases.map((p, i) => (
            <span key={i} className={cn("h-full min-w-[2px]", t.status === "cancelled" && "opacity-50")}
              style={{ flexGrow: Math.max(0.0001, ms(p.to) - ms(p.from)), flexBasis: 0, background: TASK_STATUS[p.status]?.hex,
                backgroundImage: p.open ? "repeating-linear-gradient(45deg, rgba(255,255,255,.4) 0 3px, transparent 3px 6px)" : undefined }} />
          ))}
        </Link>
        {t.acceptedAt && <Dot x={pct(t.acceptedAt)} cls="rounded-full bg-white ring-2 ring-slate-700" title={`Xác nhận ${fmtWhen(t.acceptedAt)}`} />}
        {t.submittedAt && <Dot x={pct(t.submittedAt)} cls="rotate-45 bg-white ring-2 ring-violet-700" title={`Nộp ${fmtWhen(t.submittedAt)}`} />}
        {t.doneAt && t.status === "done" && <Dot x={pct(t.doneAt)} cls="rounded-full bg-emerald-600 ring-2 ring-white" title={`Hoàn thành ${fmtWhen(t.doneAt)}`} />}
        {expX !== null && <span title={`Hạn mong muốn ${fmtYmd(t.expectedDate)}`} className="absolute top-1 bottom-1 border-l-2 border-dotted border-slate-400" style={{ left: `calc(${expX}% - 1px)` }} />}
        {dueX !== null && <span title={`Hạn ${fmtYmd(t.dueDate)}`} className={cn("absolute top-1 bottom-1 w-[3px] rounded", overdue ? "bg-red-600" : "bg-slate-700")} style={{ left: `calc(${dueX}% - 1px)` }} />}
      </div>
    </>
  );
}

const Dot = ({ x, cls, title }) => (
  <span title={title} className={cn("absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2", cls)} style={{ left: `${x}%` }} />
);
