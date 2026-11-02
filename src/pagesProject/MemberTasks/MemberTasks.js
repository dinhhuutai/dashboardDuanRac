// Việc của 1 thành viên trong dự án (người giao việc / quản trị) — lọc theo trạng thái, giao thêm việc cho người này.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GanttChartSquare, List, Lock, Plus } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, Skeleton, cn } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { TASK_STATUS } from "../shared/meta";
import { Avatar, Page, Pills, Stat, TaskCard } from "../shared/components";
import TaskForm from "../shared/TaskForm";
import Gantt from "../shared/Gantt";

const R = config.routes;

export default function MemberTasks() {
  const { id, userId } = useParams();
  const navigate = useNavigate();
  const today = usePj((s) => s.boot?.today);
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [view, setView] = useState("list");

  const loadProject = useCallback(() => pjApi.project(id).then(setP).catch((e) => setError(errorMessage(e))), [id]);
  useEffect(() => { loadProject(); }, [loadProject]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await pjApi.projectTasks(id, { assigneeId: userId, status })).rows); } catch (e) { setError(errorMessage(e)); setRows([]); } finally { setLoading(false); }
  }, [id, userId, status]);
  useEffect(() => { load(); }, [load]);

  const m = useMemo(() => p?.members.find((x) => String(x.userId) === String(userId)), [p, userId]);
  const s = m?.stats || {};

  if (error && !p) return <Page><ErrorBox message={error} /></Page>;

  return (
    <Page>
      <Link to={`${R.projectView}/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {p?.name || "Dự án"}
      </Link>
      {!p ? <Skeleton className="h-24 w-full rounded-xl" /> : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={m?.name} src={m?.avatar} size={48} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-slate-900">{m?.name || "Thành viên"}</h1>
              <p className="truncate text-sm text-slate-500">{[m?.msnv, m?.dept, m?.role === "assigner" ? "Người giao việc" : "Người được giao"].filter(Boolean).join(" · ")}</p>
            </div>
            {p.permissions.assign && m && (
              <button type="button" onClick={() => setAssigning(true)} disabled={!!m.blockedBy}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto">
                {m.blockedBy ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Giao việc cho {m.name.split(" ").slice(-1)[0]}
              </button>
            )}
          </div>
          {p.permissions.assign && m?.blockedBy && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200" data-blocked>
              Còn việc <Link to={`${R.projectTask}/${m.blockedBy.taskId}`} className="font-semibold underline">{m.blockedBy.title}</Link>{" "}
              ({TASK_STATUS[m.blockedBy.status]?.label.toLowerCase()}) bạn giao chưa xong — người nhận hoàn thành (bạn duyệt) hoặc huỷ việc đó thì mới giao được việc tiếp theo.
            </p>
          )}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <Stat n={s.pendingAccept} label="Chờ xác nhận" tone="amber" />
            <Stat n={s.doing} label="Đang làm" tone="blue" />
            <Stat n={s.waiting} label="Chờ phản hồi" tone="violet" />
            <Stat n={s.overdue} label="Quá hạn" tone="red" />
          </div>
          {m && (
            <Link to={`${R.projectPeople}/${m.userId}`} className="mt-3 inline-flex text-sm font-medium text-blue-700 hover:underline">
              Xem công việc của {m.name} ở mọi dự án + sơ đồ thao tác →
            </Link>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1"><Pills value={status} onChange={setStatus} items={[["open", "Đang mở"], ["done", "Hoàn thành"], ["cancelled", "Đã huỷ"], ["all", "Tất cả"]]} /></div>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-sm font-medium">
          {[["list", "Danh sách", List], ["gantt", "Sơ đồ", GanttChartSquare]].map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => setView(k)} className={cn("inline-flex items-center gap-1 rounded-md px-2.5 py-1.5", view === k ? "bg-white text-slate-800 shadow-sm" : "text-slate-500")}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        {!rows ? <CardListSkeleton rows={3} /> : view === "gantt" ? <Gantt tasks={rows} today={today} /> : (
          <Refreshing active={loading}>
            {rows.length ? <div className="space-y-2">{rows.map((t) => <TaskCard key={t.taskId} t={t} today={today} showAssigner />)}</div>
              : <EmptyState title={status === "open" ? "Không có việc đang mở" : "Không có việc"}>{p?.permissions.assign ? "Bấm “Giao việc” để giao việc mới." : ""}</EmptyState>}
          </Refreshing>
        )}
      </div>
      {assigning && p && (
        <TaskForm open onClose={() => setAssigning(false)} projectId={p.projectId} members={p.members} assigneeId={Number(userId)}
          onDone={(taskId) => navigate(`${R.projectTask}/${taskId}`)} />
      )}
    </Page>
  );
}
