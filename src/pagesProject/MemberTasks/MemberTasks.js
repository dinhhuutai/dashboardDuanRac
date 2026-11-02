// Việc của 1 thành viên trong dự án (người giao việc / quản trị) — lọc theo trạng thái, giao thêm việc cho người này.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Lock, Plus } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, Skeleton } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { TASK_STATUS } from "../shared/meta";
import { Avatar, Page, Pills, TaskList } from "../shared/components";
import TaskForm from "../shared/TaskForm";

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

  const loadProject = useCallback(() => pjApi.project(id).then(setP).catch((e) => setError(errorMessage(e))), [id]);
  useEffect(() => { loadProject(); }, [loadProject]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await pjApi.projectTasks(id, { assigneeId: userId, status })).rows); } catch (e) { setError(errorMessage(e)); setRows([]); } finally { setLoading(false); }
  }, [id, userId, status]);
  useEffect(() => { load(); }, [load]);

  const m = useMemo(() => p?.members.find((x) => String(x.userId) === String(userId)), [p, userId]);

  if (error && !p) return <Page><ErrorBox message={error} /></Page>;

  return (
    <Page wide>
      <Link to={`${R.projectView}/${id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {p?.name || "Dự án"}
      </Link>
      {!p ? <Skeleton className="h-16 w-full rounded-xl" /> : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar name={m?.name} src={m?.avatar} size={40} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-slate-900">{m?.name || "Thành viên"}</h1>
              <Link to={`${R.projectPeople}/${userId}`} className="text-sm text-blue-700 hover:underline">Xem ở mọi dự án</Link>
            </div>
            {p.permissions.assign && m && (
              <button type="button" onClick={() => setAssigning(true)} disabled={!!m.blockedBy}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {m.blockedBy ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Giao việc
              </button>
            )}
          </div>
          {p.permissions.assign && m?.blockedBy && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" data-blocked>
              Còn việc <Link to={`${R.projectTask}/${m.blockedBy.taskId}`} className="font-semibold underline">{m.blockedBy.title}</Link>{" "}
              ({TASK_STATUS[m.blockedBy.status]?.label.toLowerCase()}) chưa xong — xong việc đó mới giao tiếp được.
            </p>
          )}
        </>
      )}
      <div className="mt-4"><Pills value={status} onChange={setStatus} items={[["open", "Đang mở"], ["closed", "Đã đóng"], ["all", "Tất cả"]]} /></div>
      <div className="mt-3">
        {!rows ? <CardListSkeleton rows={3} /> : (
          <Refreshing active={loading}>
            {rows.length ? <TaskList rows={rows} today={today} />
              : <EmptyState title={status === "open" ? "Không có việc đang mở" : "Không có việc"} />}
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
