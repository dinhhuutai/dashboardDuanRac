// Layout module 3 "Quản lý dự án" (khung chung ModuleShell, giống module 18) — 1 layout cho cả nhân viên + quản trị.
// Khởi động 1 lần (vai trò, cấu hình tệp, con số); huy hiệu cập nhật 60 giây/lần khi tab đang mở.
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Bell, FolderKanban, ListTodo, X } from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import { Skeleton, cn, toast } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "~/pagesProject/shared/api";
import { ensureBoot, pjStore, refreshCounts, usePj } from "~/pagesProject/shared/store";
import { fmtWhen, notificationLink } from "~/pagesProject/shared/meta";
import { Avatar } from "~/pagesProject/shared/components";
import { preloadWhenIdle } from "~/utils/lazyPage";

const R = config.routes;
const PULSE_MS = 60000;

const PAGES = [
  { preload: () => import("~/pagesProject/TaskInbox") },
  { preload: () => import("~/pagesProject/TaskDetail") },
  { preload: () => import("~/pagesProject/Dashboard") },
  { preload: () => import("~/pagesProject/ProjectList") },
  { preload: () => import("~/pagesProject/ProjectDetail") },
];

function NotificationPanel({ onClose, mobile }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const load = useCallback(async () => {
    try { setRows(await pjApi.notifications()); } catch (e) { setRows([]); toast.error(errorMessage(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const open = (n) => {
    onClose();
    if (!n.isRead) pjApi.readNotifications({ ids: [n.notificationId] }).then(refreshCounts).catch(() => {});
    navigate(notificationLink(n, R));
  };
  const readAll = async () => {
    try { await pjApi.readNotifications({ all: true }); setRows((xs) => xs?.map((x) => ({ ...x, isRead: true }))); refreshCounts(); } catch (e) { toast.error(errorMessage(e)); }
  };
  return (
    <div className={cn("flex flex-col bg-white", mobile ? "h-full" : "max-h-[70vh] w-[380px] rounded-xl border border-slate-200 shadow-2xl")}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="flex-1 font-semibold text-slate-800">Thông báo</h3>
        <button type="button" onClick={readAll} className="text-xs font-medium text-blue-700 hover:underline">Đánh dấu đã đọc</button>
        {mobile && <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {!rows && <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>}
        {rows?.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-400">Chưa có thông báo</p>}
        {rows?.map((n) => (
          <button key={n.notificationId} type="button" onClick={() => open(n)} className={cn("flex w-full gap-3 px-4 py-2.5 text-left hover:bg-slate-50", !n.isRead && "bg-blue-50/50")}>
            <span className="relative mt-0.5 shrink-0">
              <Avatar name={n.actorName || "?"} src={n.actorAvatar} size={30} />
              {!n.isRead && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm", n.isRead ? "text-slate-600" : "font-medium text-slate-900")}>{n.title}</span>
              {n.body && <span className="mt-0.5 block truncate text-xs text-slate-500">{n.body}</span>}
              <span className="mt-0.5 block text-[11px] text-slate-400">{fmtWhen(n.createdAt)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BootSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4" role="status" aria-label="Đang tải">
      <Skeleton className="h-8 w-1/2" />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
    </div>
  );
}

export default function DefaultLayoutProject({ children }) {
  const { pathname } = useLocation();
  const boot = usePj((s) => s.boot);
  const bootError = usePj((s) => s.bootError);
  const counts = usePj((s) => s.counts);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => { ensureBoot().catch(() => {}); preloadWhenIdle(...PAGES); }, []);
  useEffect(() => {
    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(refreshCounts, PULSE_MS); };
    const onVis = () => { if (document.visibilityState === "visible") { refreshCounts(); start(); } else clearInterval(timer); };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  // có thông báo mới → toast tiêu đề thông báo mới nhất
  const lastSeen = useRef(null);
  useEffect(() => {
    if (lastSeen.current !== null && counts.lastNotificationId > lastSeen.current && document.visibilityState === "visible") {
      pjApi.notifications().then((rows) => { const n = rows.find((x) => !x.isRead); if (n) toast.info(n.title); }).catch(() => {});
    }
    lastSeen.current = counts.lastNotificationId;
  }, [counts.lastNotificationId]);
  useEffect(() => { setNotifOpen(false); }, [pathname]);
  useEffect(() => {
    if (!notifOpen) return undefined;
    const onDown = (e) => { if (window.innerWidth >= 1024 && !notifRef.current?.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  // 3 mục để demo 1 lần là nhớ: Công việc · Báo cáo · Dự án
  const onTasks = pathname === R.projectTasks || pathname.startsWith(`${R.projectTask}/`);
  const onReport = pathname === R.projectDashboard || pathname === R.projectPeople || pathname.startsWith(`${R.projectPeople}/`);
  const onProjects = pathname === R.project || [R.projectView, R.projectEdit].some((p) => pathname.startsWith(`${p}/`)) || pathname === R.projectNew;
  const tasks = { to: R.projectTasks, label: "Công việc", icon: ListTodo, active: onTasks, badge: counts.todo + counts.overdue + counts.waiting };
  const report = { to: R.projectDashboard, label: "Báo cáo", icon: BarChart3, active: onReport };
  const projects = { to: R.project, label: "Dự án", icon: FolderKanban, active: onProjects, badge: counts.chatUnread };

  return (
    <ModuleShell
      title="Quản lý dự án" icon={FolderKanban} home={R.projectTasks} moduleId={3}
      // điện thoại: thông báo nổi nằm trên ô soạn tin + thanh tab (thấp hơn sẽ che nút gửi của tab Trò chuyện; đặt ở trên thì che
      // danh sách thông báo mở toàn màn hình — cả 2 E2E bắt được)
      toasterPosition="bottom-[8.5rem] lg:bottom-6"
      sections={[{ items: [tasks, report, projects] }]}
      tabs={[tasks, report, projects]}
      headerActions={(
        <div ref={notifRef} className="relative">
          <button type="button" onClick={() => setNotifOpen((v) => !v)} title="Thông báo"
            className={cn("relative rounded-lg p-2 hover:bg-slate-100", notifOpen ? "bg-slate-100 text-blue-700" : "text-slate-600")}>
            <Bell className="h-5 w-5" />
            {counts.unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-[18px] text-white">
                {counts.unread > 99 ? "99+" : counts.unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-50 lg:hidden"><NotificationPanel mobile onClose={() => setNotifOpen(false)} /></div>
              <div className="absolute right-0 top-11 z-50 hidden lg:block"><NotificationPanel onClose={() => setNotifOpen(false)} /></div>
            </>
          )}
        </div>
      )}
    >
      {bootError && !boot ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-slate-600">{errorMessage(bootError, "Không tải được module Quản lý dự án")}</p>
          <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => { pjStore.set({ bootError: null }); ensureBoot(true).catch(() => {}); }}>
            Thử lại
          </button>
          <Link to={R.homeMain} className="text-sm text-blue-700 hover:underline">Về trang chủ</Link>
        </div>
      ) : !boot ? (
        <BootSkeleton />
      ) : (
        <Suspense fallback={<BootSkeleton />}>{children}</Suspense>
      )}
    </ModuleShell>
  );
}
