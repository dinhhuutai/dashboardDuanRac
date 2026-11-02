// Danh sách dự án — bấm vào dự án: người giao việc thấy thành viên, người được giao thấy việc của mình.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, ChevronRight, FolderKanban, Plus, Search, Users } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, cn } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { fmtYmd, norm } from "../shared/meta";
import { Page, Pills, Progress, ProjectStatusChip, RoleBadge, Stat } from "../shared/components";

const R = config.routes;
const prefetchDetail = () => import("../ProjectDetail").catch(() => {});

function ProjectCard({ p }) {
  const s = p.stats;
  const m = p.mine;
  return (
    <Link to={`${R.projectView}/${p.projectId}`} onMouseEnter={prefetchDetail}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm active:bg-slate-50">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: p.color || "#2563eb" }}>
          <FolderKanban className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-semibold text-slate-900">{p.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <ProjectStatusChip status={p.status} />
            <RoleBadge role={p.role} />
            {p.code && <span className="text-xs text-slate-400">{p.code}</span>}
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
      </div>
      {(p.startDate || p.endDate) && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarRange className="h-3.5 w-3.5" /> {fmtYmd(p.startDate) || "…"} → {fmtYmd(p.endDate) || "…"}
          <span className="ml-auto inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {p.memberCount}</span>
        </p>
      )}
      {s ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat n={s.open} label="Đang mở" tone="blue" />
            <Stat n={s.waiting} label="Chờ phản hồi" tone="violet" />
            <Stat n={s.overdue} label="Quá hạn" tone="red" />
          </div>
          {s.total > 0 && <div className="mt-3"><Progress done={s.done} total={s.total} /></div>}
        </>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat n={m.pendingAccept} label="Chờ xác nhận" tone="amber" />
          <Stat n={m.doing} label="Đang làm" tone="blue" />
          <Stat n={m.overdue} label="Quá hạn" tone="red" />
        </div>
      )}
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
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">Dự án</h1>
          <p className="text-sm text-slate-500">{boot?.me?.isAdmin ? "Mọi dự án của công ty" : "Các dự án bạn tham gia"}</p>
        </div>
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
              <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3")}>{shown.map((p) => <ProjectCard key={p.projectId} p={p} />)}</div>
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
