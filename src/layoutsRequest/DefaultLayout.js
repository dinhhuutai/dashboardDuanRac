// Layout module 18 "Quản lý yêu cầu" (giao diện kiểu request.base.vn) — dùng chung cho trang nhân viên + quản trị.
// Thanh trên: tìm kiếm, Tạo đề xuất, Tin nhắn, Thông báo. Menu trái: hộp đề xuất, nhóm, chat, quản trị.
// Điện thoại: menu trái thành ngăn kéo + thanh tab dưới.
// Khởi động 1 lần (bootstrap + danh bạ) cho mọi trang; huy hiệu cập nhật mỗi 30 giây khi tab đang mở.
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  BarChart3, Bell, BellRing, Building2, CheckCheck, ClipboardCheck, FileStack, Home, Inbox, Layers, ListChecks, Loader2,
  Menu, MessagesSquare, Plus, Search, Send, Star, UserCog, X,
} from "lucide-react";
import config from "~/config";
import { ConfirmHost, Skeleton, Toaster, cn, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { ensureBoot, ensureDirectory, refreshCounts, rqEvents, useRq } from "~/pagesRequest/shared/store";
import { checkLan } from "~/pagesRequest/shared/files";
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
  const [drawer, setDrawer] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [q, setQ] = useState(params.get("q") || "");
  const notifRef = useRef(null);

  // khởi động: bootstrap → danh bạ + kiểm tra mạng công ty
  useEffect(() => {
    ensureBoot().then(() => { checkLan(); }).catch(() => {});
    ensureDirectory().catch(() => {});
    preloadWhenIdle(...prefetchPages);
  }, []);

  // huy hiệu: 30 giây / lần khi tab đang mở, dừng khi ẩn tab
  useEffect(() => {
    let timer = null;
    const start = () => { clearInterval(timer); timer = setInterval(refreshCounts, PULSE_MS); };
    const onVis = () => {
      if (document.visibilityState === "visible") { refreshCounts(); start(); checkLan(); }
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

  useEffect(() => { setDrawer(false); setNotifOpen(false); }, [pathname]);
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

  const me = boot?.me;
  const tab = (to, active, Icon, label, badge) => (
    <Link to={to} className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px]", active ? "text-blue-700" : "text-slate-500")}>
      <Icon className="h-5 w-5" />
      {label}
      {badge > 0 && <span className="absolute right-[22%] top-0.5"><CountBadge n={badge} /></span>}
    </Link>
  );
  const box = params.get("box");

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-100 text-slate-800">
      {/* Thanh trên */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-3" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Mở menu"><Menu className="h-5 w-5" /></button>
        <Link to={R.request} className="flex min-w-0 items-center gap-2 lg:w-[220px]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white"><ListChecks className="h-5 w-5" /></span>
          <span className="truncate font-bold text-slate-800">Quản lý yêu cầu</span>
        </Link>
        <form onSubmit={search} className="mx-2 hidden max-w-xl flex-1 md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm đề xuất theo tên, người gửi, mã số…"
              className="h-9 w-full rounded-lg border-0 bg-slate-100 pl-9 pr-3 text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-blue-300" />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-1">
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
          {me && (
            <span className="ml-1 hidden items-center gap-2 sm:flex" title={[me.fullName, me.departmentName, me.teamName].filter(Boolean).join(" · ")}>
              <Avatar user={{ name: me.fullName, avatar: me.avatar }} size={32} />
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block"><Sidebar /></aside>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">
              <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
                <span className="font-bold">Quản lý yêu cầu</span>
                <button type="button" onClick={() => setDrawer(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
              </div>
              <div className="h-[calc(100%-56px)]"><Sidebar onNavigate={() => setDrawer(false)} /></div>
            </aside>
          </div>
        )}

        <main className="min-h-0 min-w-0 flex-1 pb-14 lg:pb-0">
          {bootError && !boot ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-slate-600">{errorMessage(bootError, "Không tải được module Quản lý yêu cầu")}</p>
              <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => ensureBoot(true).catch(() => {})}>Thử lại</button>
            </div>
          ) : !boot ? (
            <BootSkeleton />
          ) : (
            <Suspense fallback={<BootSkeleton />}>{children}</Suspense>
          )}
        </main>
      </div>

      {/* Thanh tab dưới (điện thoại) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {tab(`${R.request}?box=inbox`, pathname === R.request && box === "inbox", Inbox, "Cần duyệt", counts.inbox)}
        {tab(`${R.request}?box=mine`, pathname === R.request && box === "mine", Send, "Của tôi", counts.returned)}
        <Link to={R.requestNew} className="flex flex-1 items-center justify-center">
          <span className="flex h-11 w-11 -translate-y-2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"><Plus className="h-6 w-6" /></span>
        </Link>
        {tab(R.requestChat, pathname.startsWith(R.requestChat), MessagesSquare, "Tin nhắn", counts.unreadChat)}
        {tab(`${R.request}?box=all`, pathname === R.request && (box === "all" || box === "following" || box === "processed"), Layers, "Tất cả", 0)}
      </nav>

      <Toaster position="bottom-[7.5rem] lg:bottom-6" />
      <ConfirmHost />
    </div>
  );
}
