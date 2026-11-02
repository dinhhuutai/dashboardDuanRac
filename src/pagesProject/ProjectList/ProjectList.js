// Danh sách dự án — bấm vào dự án: người giao việc thấy thành viên, người được giao thấy việc của mình.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FolderKanban, Plus, Search } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, cn } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { norm } from "../shared/meta";
import { Page, Pills, ProjectStatusChip } from "../shared/components";

const R = config.routes;
const prefetchDetail = () => import("../ProjectDetail").catch(() => {});

function ProjectCard({ p }) {
  const s = p.stats || p.mine || {};
  return (
    <Link to={`${R.projectView}/${p.projectId}`} onMouseEnter={prefetchDetail}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 active:bg-slate-50">
      <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: p.color || "#2563eb" }} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium text-slate-900">{p.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          <span>{s.open || 0} việc đang mở</span>
          {s.overdue > 0 && <span className="font-semibold text-red-600">{s.overdue} quá hạn</span>}
          <ProjectStatusChip status={p.status} />
          {p.chatUnread > 0 && <span className="font-medium text-blue-700">{p.chatUnread} tin mới</span>}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
    </Link>
  );
}

export default function ProjectList() {
  const boot = usePj((s) => s.boot);
  const [filter, setFilter] = useState("open");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState("");
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const r = await pjApi.projects({ status: filter === "archived" ? "all" : undefined });
      if (my === seq.current) { setRows(r); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(errorMessage(e));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return (rows || []).filter((p) => (filter === "archived" ? p.status === "archived" : filter === "open" ? ["active", "paused"].includes(p.status) : p.status === "done")
      && (!nq || norm(`${p.name} ${p.code || ""}`).includes(nq)));
  }, [rows, filter, q]);

  return (
    <Page wide>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-xl font-bold text-slate-900">Dự án</h1>
        {boot?.me?.isAdmin && (
          <Link to={R.projectNew} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Tạo dự án
          </Link>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Pills value={filter} onChange={setFilter} items={[["open", "Đang chạy"], ["done", "Hoàn thành"], ["archived", "Lưu trữ"]]} />
        <label className="relative block sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm dự án"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </label>
      </div>
      <div className="mt-4">
        {error && !rows ? <ErrorBox message={error} onRetry={load} /> : !rows ? <CardListSkeleton rows={4} /> : (
          <Refreshing active={loading}>
            {shown.length ? (
              <div className={cn("grid gap-2 md:grid-cols-2 xl:grid-cols-3")}>{shown.map((p) => <ProjectCard key={p.projectId} p={p} />)}</div>
            ) : (
              <EmptyState icon={FolderKanban} title={rows.length ? "Không có dự án nào khớp" : "Bạn chưa tham gia dự án nào"}>
                {boot?.me?.isAdmin ? "Bấm “Tạo dự án” để bắt đầu." : "Khi được thêm vào dự án, dự án sẽ hiện ở đây."}
              </EmptyState>
            )}
          </Refreshing>
        )}
      </div>
    </Page>
  );
}
