// Layout module 18 "Quản lý đề xuất" (giao diện kiểu request.base.vn) — dùng chung cho trang nhân viên + quản trị.
// Thanh trên: tìm kiếm, Tạo đề xuất, Tin nhắn, Thông báo. Menu trái: hộp đề xuất, nhóm, chat, quản trị.
// Điện thoại: menu trái thành ngăn kéo + thanh tab dưới.
// Khung (thanh trên, menu trái, ngăn kéo, tab dưới) là ModuleShell dùng chung cho mọi module — giao diện module này là mẫu.
// Khởi động 1 lần (bootstrap + danh bạ) cho mọi trang; huy hiệu cập nhật mỗi 30 giây khi tab đang mở.
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart3, Bell, BellRing, Building2, CheckCheck, ClipboardCheck, FileStack, FileUp, Home, Inbox, Layers, ListChecks, Loader2,
  MessagesSquare, PieChart, Plus, Search, Send, Star, UserCog, X,
} from "lucide-react";
import config from "~/config";
import ModuleShell from "~/components/ModuleShell";
import { Skeleton, cn, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { ensureBoot, ensureDirectory, refreshCounts, rqEvents, useRq } from "~/pagesRequest/shared/store";
import { Avatar, CountBadge } from "~/pagesRequest/shared/components";
import { timeAgo } from "~/pagesRequest/shared/format";
import { preloadWhenIdle } from "~/utils/lazyPage";

const R = config.routes;
const PULSE_MS = 30000;

const BOXES = [
  { box: "inbox", label: "Cần tôi duyệt", icon: Inbox, count: "inbox", tone: "red" },
  { box: "mine", label: "Đề xuất của tôi", icon: Send, count: "returned", tone: "blue", countHint: "cần bổ sung" },
  { box: "processed", label: "Tôi đã xử lý", icon: CheckCheck },
  { box: "following", label: "Đang theo dõi", icon: Star },
  { box: "all", label: "Tất cả đề xuất", icon: FileStack },
];
const ADMIN = [
  { to: R.adminRequestTypes, label: "Mẫu đề xuất", icon: ClipboardCheck },
  { to: R.adminRequestHeads, label: "Trưởng phòng & tổ trưởng", icon: UserCog },
  { to: R.adminRequestOrg, label: "Phòng ban & tổ", icon: Building2 },
  { to: R.adminRequestStats, label: "Thống kê", icon: BarChart3 },
  { to: R.adminRequestImport, label: "Nhập từ Base", icon: FileUp },
];

// trang con của module — tải trước khi rảnh để chuyển trang tức thì
const prefetchPages = [
  { preload: () => import("~/pagesRequest/RequestHome") },
  { preload: () => import("~/pagesRequest/RequestCreate") },
  { preload: () => import("~/pagesRequest/Chat") },
];

/* ------------------------------ Thông báo ------------------------------ */
function NotificationPanel({ onClose, mobile }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pushState, setPushState] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const load = useCallback(async () => {
    try {
      const r = await rqApi.notifications({ limit: 30 });
      setRows(r.rows);
    } catch (e) {
      setRows([]);
      toast.error(errorMessage(e));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = async (n) => {
    onClose();
    if (!n.isRead) rqApi.readNotifications({ ids: [n.notificationId] }).then(refreshCounts).catch(() => {});
    navigate(n.url || (n.requestId ? `${R.request}?id=${n.requestId}` : R.request));
  };
  const readAll = async () => {
    setBusy(true);
    try {
      await rqApi.readNotifications({ all: true });
      setRows((xs) => xs?.map((x) => ({ ...x, isRead: true })));
      refreshCounts();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  const enablePush = async () => {
    setBusy(true);
    try {
      const { registerPush } = await import("~/push/registerPush");
      await registerPush();
      setPushState("granted");
      toast.success("Đã bật thông báo trên thiết bị này");
    } catch (e) {
      toast.error(e.message || "Không bật được thông báo");
      if (typeof Notification !== "undefined") setPushState(Notification.permission);
    } finally { setBusy(false); }
  };

  return (
    <div className={cn("flex flex-col bg-white", mobile ? "h-full" : "max-h-[70vh] w-[380px] rounded-xl border border-slate-200 shadow-2xl")}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="flex-1 font-semibold text-slate-800">Thông báo</h3>
        <button type="button" disabled={busy} onClick={readAll} className="text-xs font-medium text-blue-700 hover:underline disabled:opacity-50">Đánh dấu đã đọc</button>
        {mobile && <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>}
      </div>
      {pushState !== "granted" && pushState !== "unsupported" && (
        <button type="button" onClick={enablePush} disabled={busy}
          className="mx-3 mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-left text-sm text-blue-800 hover:bg-blue-100">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
          <span><b>Bật thông báo</b> trên điện thoại/máy này để biết ngay khi có đề xuất cần duyệt</span>
        </button>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {!rows && <div className="space-y-3 p-4">{[0, 1, 2, 3].map((i) => <div key={i} className="flex gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div>}
        {rows?.length === 0 && <p className="px-4 py-10 text-center text-sm text-slate-400">Chưa có thông báo</p>}
        {rows?.map((n) => (
          <button key={n.notificationId} type="button" onClick={() => open(n)}
            className={cn("flex w-full gap-3 px-4 py-2.5 text-left hover:bg-slate-50", !n.isRead && "bg-blue-50/50")}>
            <span className="relative mt-0.5">
              <Avatar name={n.title} size={32} />
              {!n.isRead && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm", n.isRead ? "text-slate-600" : "font-medium text-slate-900")}>{n.title}</span>
              {n.body && <span className="mt-0.5 block truncate text-xs text-slate-500">{n.body}</span>}
              <span className="mt-0.5 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ Menu trái ------------------------------ */
function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const boot = useRq((s) => s.boot);
  const counts = useRq((s) => s.counts);
  const isHome = pathname === R.request;
  const box = params.get("box") || "";
  const groupId = params.get("groupId") || "";
  const item = (active) => cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  );

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Link to={R.requestNew} onClick={onNavigate}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]">
          <Plus className="h-4 w-4" /> Tạo đề xuất
        </Link>
      </div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {BOXES.map((b) => {
          const n = b.count ? counts[b.count] : 0;
          const active = isHome && !groupId && (box === b.box || (!box && b.box === "default"));
          return (
            <Link key={b.box} to={`${R.request}?box=${b.box}`} onClick={onNavigate} className={item(active)}>
              <b.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{b.label}</span>
              {n > 0 && <CountBadge n={n} tone={b.tone} />}
            </Link>
          );
        })}

        {boot?.groups?.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nhóm đề xuất</p>
            {boot.groups.map((g) => (
              <Link key={g.groupId} to={`${R.request}?box=all&groupId=${g.groupId}`} onClick={onNavigate} className={item(isHome && groupId === String(g.groupId))}>
                <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: g.color || "#64748b" }} />
                <span className="flex-1 truncate">{g.name}</span>
              </Link>
            ))}
          </>
        )}

        {(boot?.me?.isAdmin || boot?.reportCount > 0) && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phân tích</p>
            <NavLink to={R.requestReports} onClick={onNavigate}
              className={() => item(pathname.startsWith(R.requestReports) || pathname.startsWith(R.adminRequestReportBuilder))}>
              <PieChart className="h-4 w-4 shrink-0" />
              <span className="flex-1">Báo cáo</span>
              {boot?.reportCount > 0 && <CountBadge n={boot.reportCount} tone="slate" />}
            </NavLink>
          </>
        )}

        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Trao đổi</p>
        <NavLink to={R.requestChat} onClick={onNavigate} className={({ isActive }) => item(isActive)}>
          <MessagesSquare className="h-4 w-4 shrink-0" />
          <span className="flex-1">Tin nhắn</span>
          <CountBadge n={counts.unreadChat} tone="red" />
        </NavLink>

        {boot?.me?.isAdmin && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quản trị</p>
            {ADMIN.map((a) => (
              <NavLink key={a.to} to={a.to} onClick={onNavigate} className={({ isActive }) => item(isActive || (a.to === R.adminRequestTypes && pathname.startsWith(R.adminRequestTypeBuilder)))}>
                <a.icon className="h-4 w-4 shrink-0" /> <span className="flex-1 truncate">{a.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="border-t border-slate-100 p-2">
        <Link to={R.homeMain} className={item(false)}><Home className="h-4 w-4" /> Về trang chủ NOIBO</Link>
      </div>
    </div>
  );
}

/* ------------------------------ Khung chờ ------------------------------ */
function BootSkeleton() {
  return (
    <div className="flex h-full" role="status" aria-label="Đang tải">
      <div className="w-full space-y-3 border-r border-slate-200 bg-white p-4 lg:w-[380px]">
        <Skeleton className="h-9 w-full" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 py-2"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /></div></div>
        ))}
      </div>
      <div className="hidden flex-1 p-6 lg:block"><Skeleton className="h-8 w-1/2" /><Skeleton className="mt-4 h-40 w-full" /></div>
    </div>
  );
}

/* ------------------------------ Layout ------------------------------ */
export default function DefaultLayoutRequest({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const boot = useRq((s) => s.boot);
  const bootError = useRq((s) => s.bootError);
  const counts = useRq((s) => s.counts);
  const [notifOpen, setNotifOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");
  const notifRef = useRef(null);

  // khởi động: bootstrap + danh bạ
  useEffect(() => {
    ensureBoot().catch(() => {});
    ensureDirectory().catch(() => {});
    preloadWhenIdle(...prefetchPages);
  }, []);

  // huy hiệu: 30 giây / lần khi tab đang mở, dừng khi ẩn tab
  useEffect(() => {
    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(refreshCounts, PULSE_MS); };
    const onVis = () => {
      if (document.visibilityState === "visible") { refreshCounts(); start(); }
      else clearInterval(timer);
    };
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // có thông báo mới → hiện toast tiêu đề thông báo mới nhất
  useEffect(() => rqEvents.on("notifications", async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const r = await rqApi.notifications({ limit: 1, unread: 1 });
      if (r.rows[0]) toast.info(r.rows[0].title);
    } catch { /* bỏ qua */ }
  }), []);

  useEffect(() => { setNotifOpen(false); }, [pathname]);
  useEffect(() => { setQ(params.get("q") || ""); }, [params]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e) => { if (window.innerWidth >= 1024 && !notifRef.current?.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  const search = (e) => {
    e.preventDefault();
    const v = q.trim();
    navigate(`${R.request}?box=all${v ? `&q=${encodeURIComponent(v)}` : ""}`);
  };

  const box = params.get("box");
  const onHome = pathname === R.request;

  // Khung chung (ModuleShell) — module này dùng chế độ fixedHeight: vùng nội dung tự cuộn (trang dùng h-full)
  return (
    <ModuleShell
      title="Quản lý đề xuất" icon={ListChecks} home={R.request} moduleId={18} fixedHeight
      sidebar={(onNavigate) => <Sidebar onNavigate={onNavigate} />}
      headerCenter={(
        <form onSubmit={search}>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm đề xuất theo tên, người gửi, mã số…"
              className="h-9 w-full rounded-lg border-0 bg-slate-100 pl-9 pr-3 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-blue-300" />
          </label>
        </form>
      )}
      headerActions={(
        <>
          <Link to={R.requestNew} className="hidden h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 sm:inline-flex lg:hidden">
            <Plus className="h-4 w-4" /> Tạo
          </Link>
          <Link to={R.requestChat} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100" title="Tin nhắn">
            <MessagesSquare className="h-5 w-5" />
            {counts.unreadChat > 0 && <span className="absolute -right-0.5 -top-0.5"><CountBadge n={counts.unreadChat} /></span>}
          </Link>
          <div ref={notifRef} className="relative">
            <button type="button" onClick={() => setNotifOpen((v) => !v)} className={cn("relative rounded-lg p-2 hover:bg-slate-100", notifOpen ? "bg-slate-100 text-blue-700" : "text-slate-600")} title="Thông báo">
              <Bell className="h-5 w-5" />
              {counts.unreadNotifications > 0 && <span className="absolute -right-0.5 -top-0.5"><CountBadge n={counts.unreadNotifications} /></span>}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-50 lg:hidden"><NotificationPanel mobile onClose={() => setNotifOpen(false)} /></div>
                <div className="absolute right-0 top-11 z-50 hidden lg:block"><NotificationPanel onClose={() => setNotifOpen(false)} /></div>
              </>
            )}
          </div>
        </>
      )}
      tabs={[
        { to: `${R.request}?box=inbox`, label: "Cần duyệt", icon: Inbox, active: onHome && box === "inbox", badge: counts.inbox },
        { to: `${R.request}?box=mine`, label: "Của tôi", icon: Send, active: onHome && box === "mine", badge: counts.returned },
        { to: R.requestNew, label: "Tạo đề xuất", icon: Plus, center: true },
        { to: R.requestChat, label: "Tin nhắn", icon: MessagesSquare, active: pathname.startsWith(R.requestChat), badge: counts.unreadChat },
        { to: `${R.request}?box=all`, label: "Tất cả", icon: Layers, active: onHome && ["all", "following", "processed"].includes(box) },
      ]}
      toasterPosition="bottom-[7.5rem] lg:bottom-6"
    >
      {bootError && !boot ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-slate-600">{errorMessage(bootError, "Không tải được module Quản lý đề xuất")}</p>
          <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => ensureBoot(true).catch(() => {})}>Thử lại</button>
        </div>
      ) : !boot ? (
        <BootSkeleton />
      ) : (
        <Suspense fallback={<BootSkeleton />}>{children}</Suspense>
      )}
    </ModuleShell>
  );
}
