// Dashboard công việc — phạm vi theo vai trò: admin = cả công ty · người giao việc = dự án mình giao (+ việc của mình) · người nhận = việc của mình.
// Lọc kỳ (7/30/90/365 ngày) + dự án. Số liệu tính ở backend (ProjectManagement/dashboard.js).
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlarmClock, CheckCircle2, Clock, FolderKanban, Hourglass, Inbox, ListTodo, Timer } from "lucide-react";
import config from "~/config";
import { EmptyState, ErrorBox, Refreshing, Skeleton, cn, inputCls } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { EVENT_TEXT, TASK_STATUS, dueInfo, fmtWhen } from "../shared/meta";
import { Avatar, Page, Pills, Progress, StatusChip } from "../shared/components";
import { KpiTile, RankBars, TrendChart } from "../shared/Charts";

const R = config.routes;
const SCOPE_TEXT = { company: "Toàn bộ dự án của công ty", assigner: "Các dự án bạn giao việc + việc của bạn", mine: "Công việc của bạn" };

const Card = ({ title, children, className, right }) => (
  <section className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
    <div className="mb-3 flex items-center gap-2"><h2 className="flex-1 font-semibold text-slate-800">{title}</h2>{right}</div>
    {children}
  </section>
);

function TaskLine({ t, today }) {
  const d = dueInfo(t, today);
  return (
    <li>
      <Link to={`${R.projectTask}/${t.taskId}`} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-sm" style={{ background: t.projectColor || "#94a3b8" }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-800">{t.title}</span>
          <span className="block truncate text-xs text-slate-500">{t.assigneeName} · {t.projectName}</span>
        </span>
        {d && <span className={cn("shrink-0 text-xs", d.tone === "red" ? "font-semibold text-red-600" : d.tone === "amber" ? "font-medium text-amber-700" : "text-slate-500")}>{d.text}</span>}
      </Link>
    </li>
  );
}

export default function Dashboard() {
  const today = usePj((s) => s.boot?.today);
  const [days, setDays] = useState("30");
  const [projectId, setProjectId] = useState("");
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const r = await pjApi.dashboard({ days, projectId: projectId || undefined });
      if (my === seq.current) { setD(r); setError(null); }
    } catch (e) { if (my === seq.current) setError(errorMessage(e)); } finally { if (my === seq.current) setLoading(false); }
  }, [days, projectId]);
  useEffect(() => { load(); }, [load]);

  if (error && !d) return <Page wide><ErrorBox message={error} onRetry={load} /></Page>;
  const k = d?.kpi;
  return (
    <Page wide>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">Dashboard công việc</h1>
          <p className="text-sm text-slate-500">{d ? SCOPE_TEXT[d.scope] : "Đang tải…"}</p>
        </div>
        <Pills value={days} onChange={setDays} items={[["7", "7 ngày"], ["30", "30 ngày"], ["90", "90 ngày"], ["365", "1 năm"]]} />
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={cn(inputCls, "h-9 w-full py-1 sm:w-60")} aria-label="Dự án">
          <option value="">Mọi dự án</option>
          {(d?.projects || []).map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
        </select>
      </div>

      {!d ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <Refreshing active={loading}>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8" data-kpis>
            <KpiTile label="Đang mở" value={k.open} icon={ListTodo} />
            <KpiTile label="Chờ xác nhận" value={k.pendingAccept} icon={Inbox} />
            <KpiTile label="Đang làm" value={k.doing} icon={Clock} />
            <KpiTile label="Chờ duyệt" value={k.waitingReview} icon={Hourglass} />
            <KpiTile label="Quá hạn" value={k.overdue} tone="critical" icon={AlarmClock} sub={k.dueSoon ? `${k.dueSoon} việc tới hạn trong 7 ngày` : undefined} />
            <KpiTile label="Hoàn thành" value={k.doneInPeriod} icon={CheckCircle2} sub={`trong ${d.days} ngày · ${k.createdInPeriod} việc giao mới`} />
            <KpiTile label="Đúng hạn" value={k.onTimeRate === null ? null : `${k.onTimeRate}%`} sub="việc xong trong kỳ có hạn" />
            <KpiTile label="TB hoàn thành" value={k.avgDays === null ? null : `${k.avgDays} ngày`} icon={Timer} sub="từ lúc giao tới lúc duyệt" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card title="Giao mới và hoàn thành theo tuần" className="lg:col-span-2"><TrendChart data={d.weekly} /></Card>
            <Card title="Việc đang mở theo trạng thái">
              <RankBars items={d.byStatus.map((x) => ({ key: x.status, label: TASK_STATUS[x.status].label, n: x.n }))} />
              {!k.open && <p className="mt-3 text-sm text-slate-400">Không có việc đang mở</p>}
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title={<span className="text-red-700">Quá hạn <span className="font-normal text-slate-400">{d.overdueList.length}</span></span>}>
              {d.overdueList.length ? <ul className="-mx-2">{d.overdueList.map((t) => <TaskLine key={t.taskId} t={t} today={today} />)}</ul>
                : <p className="text-sm text-slate-400">Không có việc quá hạn</p>}
            </Card>
            <Card title={<>Tới hạn trong 7 ngày <span className="font-normal text-slate-400">{d.upcoming.length}</span></>}>
              {d.upcoming.length ? <ul className="-mx-2">{d.upcoming.map((t) => <TaskLine key={t.taskId} t={t} today={today} />)}</ul>
                : <p className="text-sm text-slate-400">Không có việc sắp tới hạn</p>}
            </Card>
          </div>

          <Card title="Theo người" className="mt-4" right={d.scope !== "mine" && <Link to={R.projectPeople} className="text-sm font-medium text-blue-700 hover:underline">Trang nhân sự →</Link>}>
            {d.byPerson.length ? (
              <div className="-mx-4 overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm" data-by-person>
                  <thead><tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-2 font-medium">Người nhận</th><th className="px-2 py-2 font-medium">Đang làm gì</th>
                    <th className="px-2 py-2 text-right font-medium">Mở</th><th className="px-2 py-2 text-right font-medium">Quá hạn</th>
                    <th className="px-2 py-2 text-right font-medium">Xong ({d.days} ngày)</th><th className="px-4 py-2 text-right font-medium">Đúng hạn</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {d.byPerson.map((x) => (
                      <tr key={x.userId} className="hover:bg-slate-50/60">
                        <td className="px-4 py-2">
                          <Link to={`${R.projectPeople}/${x.userId}`} className="flex items-center gap-2 font-medium text-slate-800 hover:text-blue-700"><Avatar name={x.name} size={26} />{x.name}</Link>
                        </td>
                        <td className="max-w-[320px] px-2 py-2">
                          {x.current ? (
                            <Link to={`${R.projectTask}/${x.current.taskId}`} className="flex min-w-0 items-center gap-2 hover:underline">
                              <StatusChip status={x.current.status} /><span className="truncate text-slate-700">{x.current.title}</span>
                            </Link>
                          ) : <span className="text-slate-400">—</span>}
                          {x.current && <p className="truncate text-xs text-slate-400">{x.current.projectName}</p>}
                        </td>
                        <td className="px-2 py-2 text-right tabular-nums">{x.open}</td>
                        <td className={cn("px-2 py-2 text-right tabular-nums", x.overdue ? "font-semibold text-red-600" : "text-slate-400")}>{x.overdue}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{x.doneInPeriod}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{x.onTimeRate === null ? <span className="text-slate-300">—</span> : `${x.onTimeRate}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState title="Chưa có công việc" />}
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card title="Theo dự án">
              {d.byProject.length ? (
                <ul className="space-y-3">
                  {d.byProject.map((p) => (
                    <li key={p.projectId}>
                      <Link to={`${R.projectView}/${p.projectId}`} className="block rounded-lg px-1 hover:bg-slate-50">
                        <p className="flex items-center gap-2 text-sm">
                          <FolderKanban className="h-4 w-4 shrink-0" style={{ color: p.color || "#2563eb" }} />
                          <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{p.name}</span>
                          <span className="shrink-0 text-xs text-slate-500">{p.open} mở{p.overdue ? <b className="ml-1 text-red-600">· {p.overdue} quá hạn</b> : ""} · {p.done}/{p.total} xong</span>
                        </p>
                        <div className="mt-1"><Progress done={p.done} total={p.total} /></div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">Chưa có dự án có việc</p>}
            </Card>
            <Card title="Hoạt động gần đây">
              {d.activity.length ? (
                <ul className="space-y-2.5">
                  {d.activity.map((e) => (
                    <li key={e.eventId} className="flex gap-2.5 text-sm">
                      <Avatar name={e.fullName} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-700"><b className="text-slate-900">{e.fullName}</b> {EVENT_TEXT[e.kind] || e.kind}{" "}
                          <Link to={`${R.projectTask}/${e.taskId}`} className="font-medium text-blue-700 hover:underline">{e.taskTitle}</Link></p>
                        <p className="truncate text-xs text-slate-400">{fmtWhen(e.createdAt)} · {e.projectName}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-slate-400">Chưa có hoạt động</p>}
            </Card>
          </div>
        </Refreshing>
      )}
    </Page>
  );
}
