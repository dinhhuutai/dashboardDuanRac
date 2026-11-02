// Công việc của 1 người: đang làm gì (dự án nào), sơ đồ công việc theo mốc thời gian (biểu đồ tiến độ),
// nhật ký thao tác (giao / hỏi lại / xác nhận / nộp / duyệt… theo ngày), số liệu trong kỳ.
// Ai xem: chính mình · admin module · người giao việc của dự án có người này (chỉ thấy việc trong dự án mình giao).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlarmClock, ArrowLeft, CheckCircle2, Clock, Hourglass, Inbox, ListTodo, Timer } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, Skeleton, cn } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { EVENT_TEXT, ROLE_LABEL, fmtYmd } from "../shared/meta";
import { STEP_META } from "../shared/flow";
import { Avatar, Page, Pills, TaskCard } from "../shared/components";
import { KpiTile, TrendChart } from "../shared/Charts";
import Gantt from "../shared/Gantt";

const R = config.routes;
const TONE_DOT = { slate: "bg-slate-400", orange: "bg-orange-500", blue: "bg-blue-500", emerald: "bg-emerald-500", violet: "bg-violet-500", rose: "bg-rose-500", amber: "bg-amber-500" };

function ActivityLog({ events, userId }) {
  const [kind, setKind] = useState("all");
  const shown = events.filter((e) => (kind === "all" ? true : kind === "own" ? e.userId === userId : e.userId !== userId));
  const days = [];
  for (const e of shown) {
    const d = e.createdAt.slice(0, 10);
    if (!days.length || days[days.length - 1].d !== d) days.push({ d, list: [] });
    days[days.length - 1].list.push(e);
  }
  return (
    <div>
      <Pills value={kind} onChange={setKind} items={[["all", "Tất cả"], ["own", "Người này làm"], ["others", "Người khác làm trên việc của họ"]]} />
      {!days.length ? <p className="mt-3 text-sm text-slate-400">Không có thao tác trong kỳ</p> : (
        <ol className="mt-3 space-y-4" data-activity>
          {days.map((g) => (
            <li key={g.d}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{fmtYmd(g.d)}</p>
              <ul className="space-y-1.5 border-l-2 border-slate-100 pl-4">
                {g.list.map((e) => (
                  <li key={e.eventId} className="relative text-sm">
                    <span className={cn("absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white", TONE_DOT[STEP_META[e.kind]?.tone] || "bg-slate-300")} />
                    <span className="mr-1.5 tabular-nums text-xs text-slate-400">{e.createdAt.slice(11, 16)}</span>
                    <b className="text-slate-800">{e.fullName}</b> <span className="text-slate-600">{EVENT_TEXT[e.kind] || e.kind}</span>{" "}
                    <Link to={`${R.projectTask}/${e.taskId}`} className="font-medium text-blue-700 hover:underline">{e.taskTitle}</Link>
                    <span className="text-xs text-slate-400"> · {e.projectName}</span>
                    {e.dueDate && <span className="ml-1 text-xs font-medium text-emerald-700">· hạn {fmtYmd(e.dueDate)}</span>}
                    {e.body && <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">“{e.body}”</p>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function UserWork() {
  const { userId } = useParams();
  const boot = usePj((s) => s.boot);
  const today = boot?.today;
  const [days, setDays] = useState("90");
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState("open");
  const seq = useRef(0);
  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try { const r = await pjApi.person(userId, { days }); if (my === seq.current) { setD(r); setError(null); } }
    catch (e) { if (my === seq.current) setError(errorMessage(e)); } finally { if (my === seq.current) setLoading(false); }
  }, [userId, days]);
  useEffect(() => { setD(null); }, [userId]);
  useEffect(() => { load(); }, [load]);

  const isSelf = Number(userId) === boot?.me?.userId;
  const tasks = useMemo(() => {
    const xs = d?.tasks || [];
    return taskFilter === "open" ? xs.filter((t) => !["done", "cancelled"].includes(t.status)) : taskFilter === "done" ? xs.filter((t) => t.status === "done") : xs;
  }, [d, taskFilter]);
  const ganttTasks = useMemo(() => (d?.tasks || []).filter((t) => t.status !== "cancelled"), [d]);

  if (error && !d) return <Page wide><ErrorBox message={error} onRetry={load} /></Page>;
  const u = d?.user;
  const k = d?.kpi;
  return (
    <Page wide>
      <Link to={isSelf && !boot?.me?.isAdmin ? `${R.projectTasks}?scope=mine` : R.projectPeople} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {isSelf && !boot?.me?.isAdmin ? "Việc của tôi" : "Nhân sự"}
      </Link>
      {!d ? <><Skeleton className="h-28 w-full rounded-xl" /><div className="mt-4"><CardListSkeleton rows={3} /></div></> : (
        <Refreshing active={loading}>
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar name={u.name} src={u.avatar} size={52} />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold text-slate-900">{u.name}{!u.active && <span className="ml-2 rounded bg-slate-100 px-1.5 text-xs font-normal text-slate-500">Đã nghỉ</span>}</h1>
                <p className="truncate text-sm text-slate-500">{[u.msnv, u.jobTitle, u.dept, u.team].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <Pills value={days} onChange={setDays} items={[["30", "30 ngày"], ["90", "90 ngày"], ["180", "6 tháng"], ["365", "1 năm"]]} />
            </div>
            {d.projects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.projects.map((p) => (
                  <Link key={p.projectId} to={`${R.projectView}/${p.projectId}/member/${u.userId}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
                    <span className="h-2 w-2 rounded-sm" style={{ background: p.color || "#94a3b8" }} />{p.name}<span className="text-slate-400">· {ROLE_LABEL[p.role]}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            <KpiTile label="Đang mở" value={k.open} icon={ListTodo} />
            <KpiTile label="Chờ xác nhận" value={k.pendingAccept} icon={Inbox} />
            <KpiTile label="Đang làm" value={k.doing} icon={Clock} />
            <KpiTile label="Chờ duyệt" value={k.waitingReview} icon={Hourglass} />
            <KpiTile label="Quá hạn" value={k.overdue} tone="critical" icon={AlarmClock} />
            <KpiTile label="Hoàn thành" value={k.doneInPeriod} icon={CheckCircle2} sub={`trong ${d.days} ngày${k.onTimeRate === null ? "" : ` · ${k.onTimeRate}% đúng hạn`}`} />
            <KpiTile label="TB hoàn thành" value={k.avgDays === null ? null : `${k.avgDays} ngày`} icon={Timer} />
          </div>

          <section className="mt-4">
            <h2 className="mb-2 font-semibold text-slate-800">Sơ đồ công việc theo thời gian</h2>
            <Gantt tasks={ganttTasks} today={today} groupBy="project" minFrom={d.from} emptyText="Không có công việc trong kỳ" />
          </section>

          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            <section className="lg:col-span-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="flex-1 font-semibold text-slate-800">Công việc</h2>
                <Pills value={taskFilter} onChange={setTaskFilter} items={[["open", "Đang mở"], ["done", "Hoàn thành"], ["all", "Trong kỳ"]]} />
              </div>
              {tasks.length ? <div className="space-y-2">{tasks.map((t) => <TaskCard key={t.taskId} t={t} today={today} showProject showAssigner />)}</div>
                : <EmptyState title={taskFilter === "open" ? "Không có việc đang mở" : "Không có việc"} />}
            </section>
            <div className="space-y-4 lg:col-span-2">
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-2 font-semibold text-slate-800">Giao mới và hoàn thành theo tuần</h2>
                <TrendChart data={d.weekly} height={180} />
              </section>
              <section className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 font-semibold text-slate-800">Nhật ký thao tác <span className="text-sm font-normal text-slate-400">{d.events.length}</span></h2>
                <ActivityLog events={d.events} userId={u.userId} />
                {d.events.length >= 500 && <p className="mt-2 text-xs text-slate-400">Hiện 500 thao tác gần nhất — thu ngắn kỳ để xem đủ.</p>}
              </section>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">Kỳ: {fmtYmd(d.from)} → {fmtYmd(d.today)}</p>
        </Refreshing>
      )}
    </Page>
  );
}
