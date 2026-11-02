// Khung dùng chung cho MỌI module (giao diện của module 18 "Quản lý đề xuất" — kiểu request.base.vn).
// Mỗi module chỉ khai báo menu; nội dung trang giữ nguyên.
//   - Thanh trên: ☰ (điện thoại) · biểu tượng + tên module · ô giữa (tuỳ chọn, vd ô tìm) · nút phải (tuỳ chọn) · ảnh đại diện
//     + menu tài khoản (về trang chủ, đăng xuất).
//   - Menu trái (máy tính) / ngăn kéo (điện thoại): nút chính (tuỳ chọn), các nhóm mục, chuyển "Trang quản trị" ⇄
//     "Giao diện nhân viên" theo vai trò module, "Về trang chủ NOIBO".
//   - Thanh tab dưới trên điện thoại (tuỳ chọn).
// 2 cách cuộn:
//   - mặc định: trang cuộn theo CỬA SỔ (thanh trên dính, menu trái dính) → trang cũ (window.scroll, min-h-[100dvh]…) chạy như trước;
//   - fixedHeight: khung cao đúng màn hình, vùng nội dung tự cuộn (module 18 — trang dùng h-full).
//
// <ModuleShell title icon home moduleId adminTo userTo side="user|admin" primary sections tabs headerCenter headerActions
//   sidebar={(onNavigate) => …} guestBare fixedHeight extras>{children}</ModuleShell>
//   sections: [{ title?, items: [{ to, label, icon, end?, badge?, badgeTone?, active?, also?: [đường dẫn], hidden? }] }]
//   tabs:     [{ to, label, icon, end?, badge?, active?, center? }]
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ChevronDown, Eye, Home, LogIn, LogOut, Menu, Settings2, X } from "lucide-react";
import config from "~/config";
import http from "~/api/http";
import authSlice from "~/redux/slices/authSlice";
import { userSelector } from "~/redux/selectors";
import { ConfirmHost, Toaster, cn } from "~/pagesForm/shared/ui";

const R = config.routes;

/* ------------------------------ tiện ích ------------------------------ */
const pathOf = (to) => String(to || "").split("?")[0];

/** Mục menu đang mở? item.active (bool) > khớp đường dẫn (end = đúng tuyệt đối) > item.also (đường dẫn con) */
export function isItemActive(item, pathname) {
  if (typeof item.active === "boolean") return item.active;
  const p = pathOf(item.to);
  const hit = (x) => pathname === x || (!item.end && x !== "/" && pathname.startsWith(`${x}/`));
  return hit(p) || (item.also || []).some((x) => pathname === x || pathname.startsWith(`${x}/`));
}

const initials = (name) => String(name || "?").trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();

function UserAvatarImg({ user, size = 32 }) {
  const [bad, setBad] = useState(false);
  const style = { width: size, height: size };
  if (user?.avatar && !bad) {
    return <img src={user.avatar} alt="" style={style} onError={() => setBad(true)} className="shrink-0 rounded-full object-cover ring-1 ring-slate-200" />;
  }
  return (
    <span style={style} className="flex shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
      {initials(user?.fullName || user?.username)}
    </span>
  );
}

const Badge = ({ n, tone = "red" }) => (!n ? null : (
  <span className={cn("inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-[18px]",
    tone === "red" ? "bg-red-500 text-white" : tone === "blue" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700")}>
    {n > 99 ? "99+" : n}
  </span>
));

/** Vai trò của người đang đăng nhập trong 1 module ('admin' | 'user' | null) — từ quyền lúc đăng nhập */
export function useModuleRole(moduleId) {
  const mods = useSelector(userSelector)?.login?.permissions?.modules || [];
  if (!moduleId) return null;
  const m = mods.find((x) => Number(x.moduleId) === Number(moduleId));
  return m ? String(m.role || "").toLowerCase() : null;
}

/* ------------------------------ menu tài khoản ------------------------------ */
function AccountMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const logout = async () => {
    try { await http.post("/auth/logout"); } catch { /* vẫn đăng xuất ở trình duyệt */ }
    dispatch(authSlice.actions.logoutSuccess());
    navigate(R.login);
  };

  return (
    <div ref={ref} className="relative ml-1">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} title={user.fullName || user.username}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-1 hover:bg-slate-100">
        <UserAvatarImg user={user} size={32} />
        <ChevronDown className={cn("hidden h-4 w-4 text-slate-400 transition sm:block", open && "rotate-180")} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <UserAvatarImg user={user} size={36} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-800">{user.fullName || "Người dùng"}</span>
              <span className="block truncate text-xs text-slate-500">@{user.username}</span>
            </span>
          </div>
          <Link to={R.homeMain} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
            <Home className="h-4 w-4 text-slate-500" /> Về trang chủ NOIBO
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ menu trái ------------------------------ */
const itemCls = (active) => cn(
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
  active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
);

function NavSections({ sections, primary, switchLink, onNavigate }) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col">
      {primary && (
        <div className="p-3">
          <Link to={primary.to} onClick={onNavigate}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]">
            {primary.icon && <primary.icon className="h-4 w-4" />} {primary.label}
          </Link>
        </div>
      )}
      <nav className={cn("min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3", !primary && "pt-3")}>
        {(sections || []).map((s, si) => {
          const items = (s.items || []).filter((it) => !it.hidden);
          if (!items.length) return null;
          return (
            <div key={s.title || si} className="space-y-0.5">
              {s.title && <p className={cn("px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400", si > 0 || primary ? "pt-4" : "pt-1")}>{s.title}</p>}
              {items.map((it) => (
                <Link key={`${it.to}|${it.label}`} to={it.to} onClick={onNavigate} className={itemCls(isItemActive(it, pathname))}>
                  {it.icon ? <it.icon className="h-4 w-4 shrink-0" /> : <span className="ml-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: it.color || "#94a3b8" }} />}
                  <span className="flex-1 truncate">{it.label}</span>
                  <Badge n={it.badge} tone={it.badgeTone} />
                </Link>
              ))}
            </div>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-slate-100 p-2">
        {switchLink && (
          <Link to={switchLink.to} onClick={onNavigate} className={itemCls(false)}>
            <switchLink.icon className="h-4 w-4" /> {switchLink.label}
          </Link>
        )}
        <Link to={R.homeMain} className={itemCls(false)}><Home className="h-4 w-4" /> Về trang chủ NOIBO</Link>
      </div>
    </div>
  );
}

/* ------------------------------ khung ------------------------------ */
export default function ModuleShell({
  title, icon: Icon, home, moduleId, side = "user", adminTo, userTo,
  primary, sections, sidebar, tabs, headerCenter, headerActions,
  guestBare = false, fixedHeight = false, extras, toasterPosition, children,
}) {
  const user = useSelector(userSelector)?.login?.currentUser;
  const role = useModuleRole(moduleId);
  const { pathname, search } = useLocation();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { setDrawer(false); }, [pathname, search]);

  // trang công khai (vd hòm thư góp ý quét QR, chưa đăng nhập) → chỉ nội dung
  if (guestBare && !user) {
    return (
      <>
        {children}
        {extras}
        <Toaster />
        <ConfirmHost />
      </>
    );
  }

  // chuyển giao diện: nhân viên ⇄ quản trị (chỉ khi là admin của module)
  const switchLink = side === "admin" && userTo
    ? { to: userTo, label: "Giao diện nhân viên", icon: Eye }
    : side === "user" && adminTo && role === "admin"
      ? { to: adminTo, label: "Trang quản trị", icon: Settings2 }
      : null;

  const renderSidebar = (onNavigate) => (sidebar
    ? sidebar(onNavigate)
    : <NavSections sections={sections} primary={primary} switchLink={switchLink} onNavigate={onNavigate} />);

  const hasTabs = Array.isArray(tabs) && tabs.length > 0;
  const tabActive = (t) => isItemActive(t, pathname);

  return (
    <div className={cn("bg-slate-100 text-slate-800", fixedHeight ? "flex h-[100dvh] flex-col overflow-hidden" : "min-h-[100dvh]")}>
      {/* Thanh trên */}
      <header className={cn("z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 sm:px-3", !fixedHeight && "sticky top-0")}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setDrawer(true)} aria-label="Mở menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to={home || R.homeMain} className="flex min-w-0 items-center gap-2 lg:w-[220px]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">{Icon && <Icon className="h-5 w-5" />}</span>
          <span className="truncate font-bold text-slate-800">{title}</span>
        </Link>
        {headerCenter ? <div className="mx-2 hidden max-w-xl flex-1 md:block">{headerCenter}</div> : <div className="flex-1" />}
        <div className="ml-auto flex items-center gap-1">
          {headerActions}
          {user ? <AccountMenu user={user} /> : (
            <Link to={R.login} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-blue-700 hover:bg-blue-50">
              <LogIn className="h-4 w-4" /> Đăng nhập
            </Link>
          )}
        </div>
      </header>

      <div className={cn("flex", fixedHeight && "min-h-0 flex-1")}>
        {/* Menu trái — máy tính */}
        <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
          <div className={cn(fixedHeight ? "h-full" : "sticky top-14 h-[calc(100dvh-3.5rem)]")}>{renderSidebar()}</div>
        </aside>

        {/* Ngăn kéo — điện thoại */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl">
              <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
                <span className="flex min-w-0 items-center gap-2 font-bold">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">{Icon && <Icon className="h-4 w-4" />}</span>
                  <span className="truncate">{title}</span>
                </span>
                <button type="button" onClick={() => setDrawer(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
              </div>
              <div className="h-[calc(100%-56px)]">{renderSidebar(() => setDrawer(false))}</div>
            </aside>
          </div>
        )}

        <main className={cn("min-w-0 flex-1", fixedHeight && "min-h-0", hasTabs && "pb-14 lg:pb-0")}>
          {fixedHeight ? children : <Suspense fallback={null}>{children}</Suspense>}
        </main>
      </div>

      {/* Thanh tab dưới — điện thoại */}
      {hasTabs && (
        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {tabs.filter((t) => !t.hidden).map((t) => (t.center ? (
            <Link key={t.to} to={t.to} className="flex flex-1 items-center justify-center" aria-label={t.label}>
              <span className="flex h-11 w-11 -translate-y-2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"><t.icon className="h-6 w-6" /></span>
            </Link>
          ) : (
            <Link key={t.to} to={t.to} className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px]", tabActive(t) ? "text-blue-700" : "text-slate-500")}>
              <t.icon className="h-5 w-5" />
              {t.label}
              {t.badge > 0 && <span className="absolute right-[22%] top-0.5"><Badge n={t.badge} /></span>}
            </Link>
          )))}
        </nav>
      )}

      {extras}
      <Toaster position={toasterPosition || (hasTabs ? "bottom-[5rem] lg:bottom-6" : undefined)} />
      <ConfirmHost />
    </div>
  );
}
