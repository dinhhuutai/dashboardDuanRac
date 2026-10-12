// Thành phần giao diện dùng chung của module 18 "Quản lý đề xuất"
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, ServerOff, X } from "lucide-react";
import { cn, inputCls } from "~/pagesForm/shared/ui";
import { useRq, userOrg } from "./store";
import { STATUS } from "./format";

export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

/* ------------------------------ Ảnh đại diện ------------------------------ */
const AV_COLORS = ["#2563eb", "#0891b2", "#16a34a", "#ca8a04", "#ea580c", "#dc2626", "#db2777", "#9333ea", "#4f46e5", "#0d9488"];
function initials(name) {
  const parts = String(name || "?").trim().split(/\s+/);
  return ((parts.length > 1 ? parts[parts.length - 2][0] : "") + (parts[parts.length - 1][0] || "?")).toUpperCase();
}

export function Avatar({ user, name, size = 32, className, ring }) {
  const [broken, setBroken] = useState(false);
  const label = user?.name || name || "";
  const src = user?.avatar && /^https?:\/\//.test(user.avatar) && !broken ? user.avatar : null;
  const color = AV_COLORS[Math.abs([...label].reduce((a, c) => a + c.charCodeAt(0), 0)) % AV_COLORS.length];
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (src) {
    return <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} style={style}
      className={cn("shrink-0 rounded-full object-cover", ring && "ring-2 ring-white", className)} />;
  }
  return (
    <span title={label} style={{ ...style, background: color }}
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white", ring && "ring-2 ring-white", className)}>
      {initials(label)}
    </span>
  );
}

/** Ảnh đại diện theo id (đọc danh bạ) */
export function UserAvatar({ id, name, size, className, ring }) {
  const u = useRq((s) => s.dir?.userById.get(id));
  return <Avatar user={u} name={u?.name || name} size={size} className={className} ring={ring} />;
}

export function AvatarStack({ ids, max = 4, size = 24 }) {
  const shown = ids.slice(0, max);
  return (
    <span className="flex -space-x-1.5">
      {shown.map((id) => <UserAvatar key={id} id={id} size={size} ring />)}
      {ids.length > max && (
        <span className="inline-flex items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 ring-2 ring-white" style={{ width: size, height: size }}>
          +{ids.length - max}
        </span>
      )}
    </span>
  );
}

/* ------------------------------ Nhãn ------------------------------ */
export function StatusBadge({ status, className }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1", s.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function CountBadge({ n, tone = "red", className }) {
  if (!n) return null;
  const t = tone === "red" ? "bg-red-500 text-white" : tone === "blue" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700";
  return <span className={cn("inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-[18px]", t, className)}>{n > 99 ? "99+" : n}</span>;
}

/* ------------------------------ Máy chủ tệp ------------------------------ */
/** Chỉ hiện khi API chưa cấu hình máy chủ tệp nội bộ (RQ_FILE_SERVER_URL / RQ_FILE_SECRET) */
export function FileServerNotice({ compact, className }) {
  const fileState = useRq((s) => s.fileState);
  if (fileState !== "disabled") return null;
  return (
    <div className={cn("flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200", className)}>
      <ServerOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{compact ? "Chưa có máy chủ tệp" : "Chưa cấu hình máy chủ tệp nội bộ — chưa đính kèm/xem tệp được."}</span>
    </div>
  );
}

/* ------------------------------ Chọn nhân viên ------------------------------ */
/**
 * Ô chọn người (1 hoặc nhiều) từ danh bạ module.
 * value: number[] (multiple) hoặc number|null. allowIds: chỉ cho chọn trong danh sách này.
 */
export function UserPicker({ value, onChange, multiple = true, placeholder = "Chọn người…", allowIds, excludeIds, disabled, autoFocus, max, className }) {
  const dir = useRq((s) => s.dir);
  const [open, setOpen] = useState(!!autoFocus);
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const selected = useMemo(() => (multiple ? (Array.isArray(value) ? value : []) : value ? [value] : []), [value, multiple]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
  }, [open]);

  const results = useMemo(() => {
    if (!dir) return [];
    const nq = norm(q.trim());
    const allow = allowIds?.length ? new Set(allowIds) : null;
    const ex = new Set(excludeIds || []);
    const out = [];
    for (const u of dir.users) {
      if (allow && !allow.has(u.id)) continue;
      if (ex.has(u.id)) continue;
      if (dept && String(u.d) !== String(dept)) continue;
      if (nq) {
        const hay = norm(`${u.name} ${u.msnv || ""} ${dir.deptById.get(u.d)?.name || ""} ${dir.teamById.get(u.t)?.name || ""} ${u.j || ""}`);
        if (!nq.split(/\s+/).every((w) => hay.includes(w))) continue;
      }
      out.push(u);
      if (out.length >= 60) break;
    }
    return out;
  }, [dir, q, dept, allowIds, excludeIds]);

  const toggle = (id) => {
    if (!multiple) {
      onChange(selected[0] === id ? null : id);
      setOpen(false);
      setQ("");
      return;
    }
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (max === 1) { onChange([id]); setOpen(false); setQ(""); return; } // chỉ chọn 1: chọn người khác = thay
    else if (!max || selected.length < max) onChange([...selected, id]);
    setQ("");
    inputRef.current?.focus();
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div
        className={cn(inputCls, "flex min-h-[40px] cursor-text flex-wrap items-center gap-1.5 py-1.5", disabled && "pointer-events-none")}
        onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus(); } }}
      >
        {selected.map((id) => {
          const u = dir?.userById.get(id);
          return (
            <span key={id} className="inline-flex max-w-full items-center gap-1 rounded-full bg-blue-50 py-0.5 pl-0.5 pr-1.5 text-xs text-blue-800 ring-1 ring-blue-200">
              <Avatar user={u} name={u?.name || `#${id}`} size={18} />
              <span className="truncate">{u?.name || `Người dùng #${id}`}</span>
              {!disabled && (
                <button type="button" className="rounded-full p-0.5 hover:bg-blue-100" aria-label="Bỏ chọn"
                  onClick={(e) => { e.stopPropagation(); toggle(id); }}>
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          );
        })}
        <input
          ref={inputRef}
          value={q}
          disabled={disabled}
          autoFocus={autoFocus}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) { e.preventDefault(); toggle(results[0].id); }
            if (e.key === "Backspace" && !q && selected.length && multiple) onChange(selected.slice(0, -1));
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={selected.length ? "" : placeholder}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none focus:ring-0"
        />
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </div>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Tìm tên, MSNV, phòng, tổ</span>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="ml-auto max-w-[45%] rounded-md border-slate-200 py-0.5 text-xs">
              <option value="">Mọi phòng ban</option>
              {dir?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {!dir && <li className="px-3 py-3 text-sm text-slate-400">Đang tải danh bạ…</li>}
            {dir && results.length === 0 && <li className="px-3 py-3 text-sm text-slate-400">Không tìm thấy</li>}
            {results.map((u) => {
              const on = selected.includes(u.id);
              return (
                <li key={u.id}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => toggle(u.id)}
                    className={cn("flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50", on && "bg-blue-50/60")}>
                    <Avatar user={u} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-800">{u.name}</span>
                      <span className="block truncate text-xs text-slate-400">{[u.msnv, userOrg(u), u.j].filter(Boolean).join(" · ")}</span>
                    </span>
                    {on && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Danh sách người (avatar + tên) chỉ đọc */
export function UserList({ ids, empty = "—" }) {
  const dir = useRq((s) => s.dir);
  if (!ids?.length) return <span className="text-sm text-slate-400">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {ids.map((id) => {
        const u = dir?.userById.get(id);
        return (
          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2 text-xs text-slate-700">
            <Avatar user={u} name={u?.name || `#${id}`} size={18} /> {u?.name || `Người dùng #${id}`}
          </span>
        );
      })}
    </span>
  );
}

/* ------------------------------ Bố cục ------------------------------ */
/** Vùng cuộn của 1 trang trong layout (layout cố định chiều cao, trang tự cuộn) */
export function PageScroll({ children, className, max = "max-w-5xl" }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className={cn("mx-auto px-4 py-5 pb-24 lg:px-6 lg:pb-10", max, className)}>{children}</div>
    </div>
  );
}

export function Card({ title, actions, children, className, bodyClass }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {actions}
        </div>
      )}
      <div className={cn("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

/** Văn bản có link + @tên được tô màu */
export function RichText({ text, mentionNames = [] }) {
  if (!text) return null;
  const names = mentionNames.filter(Boolean).sort((a, b) => b.length - a.length);
  const parts = [];
  const re = /(https?:\/\/[^\s<]+)/g;
  let last = 0;
  let m;
  const pushText = (s, keyBase) => {
    if (!names.length) { parts.push(s); return; }
    let rest = s;
    let i = 0;
    while (rest) {
      let at = -1, hit = null;
      for (const n of names) {
        const k = rest.indexOf(`@${n}`);
        if (k >= 0 && (at < 0 || k < at)) { at = k; hit = n; }
      }
      if (at < 0) { parts.push(rest); break; }
      if (at > 0) parts.push(rest.slice(0, at));
      parts.push(<span key={`${keyBase}m${i++}`} className="rounded bg-blue-50 px-0.5 font-medium text-blue-700">@{hit}</span>);
      rest = rest.slice(at + hit.length + 1);
    }
  };
  while ((m = re.exec(text))) {
    if (m.index > last) pushText(text.slice(last, m.index), `t${last}`);
    parts.push(<a key={`l${m.index}`} href={m[1]} target="_blank" rel="noreferrer" className="break-all text-blue-700 underline">{m[1]}</a>);
    last = m.index + m[1].length;
  }
  if (last < text.length) pushText(text.slice(last), `t${last}`);
  return <span className="whitespace-pre-wrap break-words">{parts}</span>;
}
