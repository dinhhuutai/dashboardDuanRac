// Trang "Công việc" — trang chính của module: danh sách công việc trên mọi dự án.
// Người giao việc / quản trị chọn phạm vi: Tất cả · Của tôi · Tôi giao · Chờ tôi. Người được giao chỉ thấy việc của mình.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ListTodo, Plus, Search } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, cn, inputCls } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { norm, taskCode } from "../shared/meta";
import { Page, Pills, TaskList } from "../shared/components";
import TaskForm from "../shared/TaskForm";

const R = config.routes;
const STATUS = [["open", "Đang mở"], ["closed", "Đã đóng"], ["all", "Tất cả"]];

export default function TaskInbox() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const boot = usePj((s) => s.boot);
  const counts = usePj((s) => s.counts);
  const today = boot?.today;
  const canGive = !!boot?.me?.isAdmin || counts.isAssigner;
  const scopes = useMemo(() => [["all", "Tất cả"], ["mine", "Của tôi"], ["assigned", "Tôi giao"], ["waiting", "Chờ tôi", counts.waiting]], [counts.waiting]);
  const asked = params.get("scope");
  const scope = canGive ? (scopes.some(([k]) => k === asked) ? asked : "all") : "mine";

  const [status, setStatus] = useState("open");
  const [projectId, setProjectId] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const r = await pjApi.tasks({ scope, status: scope === "waiting" ? "all" : status, projectId: projectId || undefined });
      if (my === seq.current) { setData(r); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(errorMessage(e));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [scope, status, projectId]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const words = norm(q.trim()).split(/\s+/).filter(Boolean);
    return (data?.rows || []).filter((t) => {
      if (!words.length) return true;
      const hay = norm(`${taskCode(t.taskId)} ${t.title} ${t.assigneeName} ${t.projectName} ${t.expectedOutput || ""}`);
      return words.every((w) => hay.includes(w));
    });
  }, [data, q]);

  const giveable = (data?.projects || []).filter((p) => p.canAssign);
  const projects = data?.projects || [];

  return (
    <Page wide>
      <div className="flex items-center gap-3">
        <h1 className="min-w-0 flex-1 text-xl font-bold text-slate-900">Công việc</h1>
        {giveable.length > 0 && (
          <button type="button" onClick={() => setAssigning(true)} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Giao việc
          </button>
        )}
      </div>

      {canGive && (
        <div className="mt-3">
          <Pills value={scope} onChange={(k) => setParams({ scope: k }, { replace: true })} items={scopes} />
        </div>
      )}

      <div className={cn("mt-3 grid grid-cols-2 gap-2", projects.length > 1 ? "lg:grid-cols-[1fr_180px_240px]" : "lg:grid-cols-[1fr_180px]")}>
        <label className="relative col-span-2 block lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo mã, nội dung, người phụ trách" className={cn(inputCls, "pl-9")} />
        </label>
        {scope !== "waiting" && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls} aria-label="Trạng thái" data-filter="status">
            {STATUS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        )}
        {projects.length > 1 && (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls} aria-label="Dự án" data-filter="project">
            <option value="">Mọi dự án</option>
            {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
          </select>
        )}
      </div>

      <div className="mt-3">
        {error && !data ? <ErrorBox message={error} onRetry={load} /> : !data ? <CardListSkeleton rows={4} /> : (
          <Refreshing active={loading}>
            {shown.length ? <TaskList rows={shown} today={today} showProject={projects.length > 1} />
              : <EmptyState icon={ListTodo} title={data.rows.length ? "Không có việc nào khớp" : "Không có việc"} />}
          </Refreshing>
        )}
      </div>

      {assigning && (
        <TaskForm open onClose={() => setAssigning(false)} projects={giveable}
          onDone={(taskId) => navigate(`${R.projectTask}/${taskId}`)} />
      )}
    </Page>
  );
}
