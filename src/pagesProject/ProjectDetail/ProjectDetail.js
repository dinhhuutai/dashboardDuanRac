// Chi tiết dự án — 5 tab (?tab=):
//   tasks    Công việc: người giao việc thấy thành viên (đang làm gì, số việc, khoá nếu còn việc mình giao chưa xong) → việc của từng người;
//            người được giao thấy việc của mình
//   info     Thông tin chung: đặc tả, mục tiêu + bài thông tin (nội dung / tệp) thành viên đăng
//   timeline Tiến độ: sơ đồ công việc theo thời gian, nhóm theo người nhận
//   chat     Trò chuyện của dự án (@nhắc tên)
//   files    Mọi tệp của dự án
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarRange, ChevronRight, Files, GanttChartSquare, Info, ListTodo, Lock, MessagesSquare, Pencil, Plus, Users } from "lucide-react";
import config from "~/config";
import { CardListSkeleton, EmptyState, ErrorBox, Refreshing, Skeleton, cn } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { TASK_STATUS, fmtYmd } from "../shared/meta";
import { Avatar, Page, Pills, ProjectStatusChip, RoleBadge, TaskCard } from "../shared/components";
import TaskForm from "../shared/TaskForm";
import Gantt from "../shared/Gantt";
import InfoTab from "./InfoTab";
import ChatTab from "./ChatTab";
import FilesTab from "./FilesTab";

const R = config.routes;

export function ProjectHeader({ p, actions, back = R.project }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <Link to={back} className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 h-10 w-1.5 shrink-0 rounded-full" style={{ background: p.color || "#2563eb" }} />
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">{p.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <ProjectStatusChip status={p.status} />
            <RoleBadge role={p.role} />
            {p.code && <span>{p.code}</span>}
            {(p.startDate || p.endDate) && <span className="inline-flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" /> {fmtYmd(p.startDate) || "…"} → {fmtYmd(p.endDate) || "…"}</span>}
          </div>
        </div>
        {actions && <div className="flex w-full gap-2 sm:w-auto">{actions}</div>}
      </div>
    </div>
  );
}

function MemberRow({ m, projectId, showBlock }) {
  const s = m.stats || {};
  const cur = m.current;
  return (
    <Link to={`${R.projectView}/${projectId}/member/${m.userId}`} data-member={m.userId}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:shadow-sm active:bg-slate-50">
      <Avatar name={m.name} src={m.avatar} size={40} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-medium text-slate-900">
          {m.name}{m.role === "assigner" && <span className="rounded bg-blue-50 px-1.5 text-[11px] font-medium text-blue-700">Giao việc</span>}
          {!m.active && <span className="rounded bg-slate-100 px-1.5 text-[11px] text-slate-500">Đã nghỉ</span>}
          {showBlock && m.blockedBy && <span title={`Còn việc bạn giao chưa xong: ${m.blockedBy.title}`} className="inline-flex items-center gap-0.5 rounded bg-amber-50 px-1.5 text-[11px] font-medium text-amber-800"><Lock className="h-3 w-3" /> chờ xong việc</span>}
        </p>
        <p className="truncate text-xs text-slate-500">{[m.msnv, m.dept].filter(Boolean).join(" · ") || "—"}</p>
        {cur && (
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TASK_STATUS[cur.status]?.hex }} />
            <span className="shrink-0 text-slate-500">{TASK_STATUS[cur.status]?.label}:</span>
            <span className="truncate font-medium text-slate-700">{cur.title}</span>
          </p>
        )}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
          {s.pendingAccept > 0 && <span className="text-amber-700">{s.pendingAccept} chờ xác nhận</span>}
          {s.doing > 0 && <span className="text-blue-700">{s.doing} đang làm</span>}
          {s.waiting > 0 && <span className="font-medium text-violet-700">{s.waiting} chờ phản hồi</span>}
          {s.overdue > 0 && <span className="font-semibold text-red-600">{s.overdue} quá hạn</span>}
          {s.done > 0 && <span className="text-emerald-600">{s.done} xong</span>}
          {!s.total && <span className="text-slate-400">Chưa có việc</span>}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
    </Link>
  );
}

function MyTasks({ projectId, today }) {
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setRows((await pjApi.projectTasks(projectId, { status })).rows); } catch { setRows([]); } finally { setLoading(false); }
  }, [projectId, status]);
  useEffect(() => { load(); }, [load]);
  return (
    <section>
      <h2 className="mb-2 font-semibold text-slate-800">Việc của tôi</h2>
      <Pills value={status} onChange={setStatus} items={[["open", "Đang mở"], ["done", "Hoàn thành"], ["all", "Tất cả"]]} />
      <div className="mt-3">
        {!rows ? <CardListSkeleton rows={3} /> : (
          <Refreshing active={loading}>
            {rows.length ? <div className="space-y-2">{rows.map((t) => <TaskCard key={t.taskId} t={t} today={today} showAssigner />)}</div>
              : <EmptyState title={status === "open" ? "Không có việc đang mở" : "Chưa có việc"}>Khi được giao việc, việc sẽ hiện ở đây.</EmptyState>}
          </Refreshing>
        )}
      </div>
    </section>
  );
}

function TasksTab({ p, today }) {
  const assigners = p.members.filter((m) => m.role === "assigner");
  const assignees = p.members.filter((m) => m.role === "assignee");
  if (!p.permissions.assign) {
    return (
      <div className="space-y-4">
        {assigners.length > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            Người giao việc: {assigners.map((m) => <span key={m.userId} className="inline-flex items-center gap-1 font-medium text-slate-800"><Avatar name={m.name} src={m.avatar} size={20} /> {m.name}</span>)}
          </p>
        )}
        <MyTasks projectId={p.projectId} today={today} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <section>
        <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-800"><Users className="h-4 w-4" /> Người được giao việc <span className="text-sm font-normal text-slate-400">{assignees.length}</span></h2>
        {assignees.length ? <div className="grid gap-2 md:grid-cols-2">{assignees.map((m) => <MemberRow key={m.userId} m={m} projectId={p.projectId} showBlock />)}</div>
          : <EmptyState icon={Users} title="Dự án chưa có người được giao việc">{p.permissions.manage ? "Bấm “Sửa dự án” để thêm thành viên." : "Liên hệ quản trị để thêm thành viên."}</EmptyState>}
      </section>
      <section>
        <h2 className="mb-2 font-semibold text-slate-800">Người giao việc <span className="text-sm font-normal text-slate-400">{assigners.length}</span></h2>
        <div className="grid gap-2 md:grid-cols-2">{assigners.map((m) => <MemberRow key={m.userId} m={m} projectId={p.projectId} showBlock />)}</div>
      </section>
    </div>
  );
}

function TimelineTab({ p, today }) {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("all");
  useEffect(() => {
    let alive = true;
    pjApi.projectTasks(p.projectId, { status: "all" }).then((r) => alive && setRows(r.rows)).catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, [p.projectId]);
  const shown = useMemo(() => (rows || []).filter((t) => status === "all" ? t.status !== "cancelled" : status === "open" ? !["done", "cancelled"].includes(t.status) : t.status === "done"), [rows, status]);
  return (
    <div className="space-y-3">
      <Pills value={status} onChange={setStatus} items={[["all", "Tất cả"], ["open", "Đang mở"], ["done", "Hoàn thành"]]} />
      {!rows ? <Skeleton className="h-64 w-full rounded-xl" /> : <Gantt tasks={shown} today={today} groupBy={p.permissions.assign ? "assignee" : null} />}
    </div>
  );
}

const TABS = [
  { k: "tasks", label: "Công việc", icon: ListTodo },
  { k: "info", label: "Thông tin chung", icon: Info },
  { k: "timeline", label: "Tiến độ", icon: GanttChartSquare },
  { k: "chat", label: "Trò chuyện", icon: MessagesSquare },
  { k: "files", label: "Tệp", icon: Files },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const today = usePj((s) => s.boot?.today);
  const [p, setP] = useState(null);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const tab = TABS.some((t) => t.k === params.get("tab")) ? params.get("tab") : "tasks";

  const load = useCallback(async () => {
    try { setP(await pjApi.project(id)); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [id]);
  useEffect(() => { setP(null); load(); }, [load]);

  if (error && !p) return <Page><ErrorBox message={error} onRetry={load} /></Page>;
  if (!p) return <Page wide><Skeleton className="h-28 w-full rounded-xl" /><div className="mt-4"><CardListSkeleton rows={4} /></div></Page>;

  const canAssign = p.permissions.assign;
  const go = (k) => setParams(k === "tasks" ? {} : { tab: k }, { replace: true });
  return (
    <Page wide>
      <div className="space-y-4">
        <ProjectHeader p={p} actions={(
          <>
            {p.permissions.manage && (
              <Link to={`${R.projectEdit}/${p.projectId}`} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 sm:flex-none">
                <Pencil className="h-4 w-4" /> Sửa dự án
              </Link>
            )}
            {canAssign && (
              <button type="button" onClick={() => setAssigning(true)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 sm:flex-none">
                <Plus className="h-4 w-4" /> Giao việc
              </button>
            )}
          </>
        )} />

        <nav className="-mx-3 flex gap-1 overflow-x-auto border-b border-slate-200 px-3 sm:mx-0 sm:px-0" role="tablist" aria-label="Phần của dự án">
          {TABS.map((t) => {
            const badge = t.k === "chat" ? p.chatUnread : t.k === "info" ? p.postCount : 0;
            return (
              <button key={t.k} type="button" role="tab" aria-selected={tab === t.k} onClick={() => go(t.k)} data-tab={t.k}
                className={cn("relative -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition",
                  tab === t.k ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800")}>
                <t.icon className="h-4 w-4" /> {t.label}
                {badge > 0 && (
                  <span className={cn("ml-0.5 min-w-[18px] rounded-full px-1.5 text-center text-[11px] font-semibold leading-[18px]",
                    t.k === "chat" ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500")}>{badge > 99 ? "99+" : badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {tab === "tasks" && <TasksTab p={p} today={today} />}
        {tab === "info" && <InfoTab p={p} />}
        {tab === "timeline" && <TimelineTab p={p} today={today} />}
        {tab === "chat" && <ChatTab p={p} onRead={() => setP((x) => (x ? { ...x, chatUnread: 0 } : x))} />}
        {tab === "files" && <FilesTab p={p} />}
      </div>
      {assigning && (
        <TaskForm open onClose={() => setAssigning(false)} projectId={p.projectId} members={p.members}
          onDone={(taskId) => navigate(`${R.projectTask}/${taskId}`)} />
      )}
    </Page>
  );
}
