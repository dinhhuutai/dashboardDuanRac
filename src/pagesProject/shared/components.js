// Thành phần giao diện dùng chung của module 3 "Quản lý dự án" (Tailwind, ưu tiên điện thoại)
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Check, ChevronRight, Flag, MessageSquare, Paperclip, Search, X } from "lucide-react";
import config from "~/config";
import { cn, inputCls } from "~/pagesForm/shared/ui";
import { TASK_STATUS, PROJECT_STATUS, ROLE_LABEL, dueInfo, norm } from "./meta";
import { ensureDirectory, usePj } from "./store";

const R = config.routes;

/** Vùng nội dung 1 trang — rộng vừa phải, chừa chỗ thanh tab dưới trên điện thoại */
export function Page({ children, className, wide }) {
  return <div className={cn("mx-auto px-3 py-4 sm:px-4 lg:px-6 lg:py-6", wide ? "max-w-6xl" : "max-w-4xl", className)}>{children}</div>;
}

const initials = (name) => String(name || "?").trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();
const HUES = ["bg-blue-100 text-blue-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-800", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700", "bg-cyan-100 text-cyan-700"];

export function Avatar({ name, src, size = 32, className }) {
  const [bad, setBad] = useState(false);
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.36) };
  if (src && !bad) return <img src={src} alt="" style={style} onError={() => setBad(true)} className={cn("shrink-0 rounded-full object-cover", className)} />;
  const hue = HUES[[...String(name || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return <span style={style} className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold", hue, className)}>{initials(name)}</span>;
}

export function StatusChip({ status, className }) {
  const s = TASK_STATUS[status] || TASK_STATUS.new;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1", s.cls, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} /> {s.label}
    </span>
  );
}

export function ProjectStatusChip({ status }) {
  const s = PROJECT_STATUS[status] || PROJECT_STATUS.active;
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1", s.cls)}>{s.label}</span>;
}

export function RoleBadge({ role }) {
  if (!role) return null;
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
      role === "assignee" ? "bg-slate-100 text-slate-600" : "bg-blue-600 text-white")}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function DueBadge({ task, today }) {
  const d = dueInfo(task, today);
  if (!d) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap text-xs",
      d.tone === "red" ? "font-semibold text-red-600" : d.tone === "amber" ? "font-medium text-amber-700" : "text-slate-500")}>
      <CalendarClock className="h-3.5 w-3.5" /> {d.text}
    </span>
  );
}

/** Ô số nhỏ (thống kê) */
export function Stat({ n, label, tone = "slate" }) {
  const tones = { slate: "text-slate-800", blue: "text-blue-700", amber: "text-amber-700", red: "text-red-600", green: "text-emerald-600", violet: "text-violet-700" };
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5 text-center">
      <p className={cn("text-lg font-bold leading-tight tabular-nums", n ? tones[tone] : "text-slate-300")}>{n || 0}</p>
      <p className="truncate text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

/** Thanh tiến độ hoàn thành */
export function Progress({ done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
      <span className="w-9 text-right text-xs tabular-nums text-slate-500">{pct}%</span>
    </div>
  );
}

/** 1 công việc trong danh sách — bấm mở chi tiết. showProject / showAssignee: hiện thêm dự án / người nhận */
export function TaskCard({ t, today, showProject, showAssignee, showAssigner }) {
  return (
    <Link to={`${R.projectTask}/${t.taskId}`}
      className={cn("block rounded-xl border bg-white p-3 transition hover:border-blue-300 hover:shadow-sm active:bg-slate-50",
        t.overdue ? "border-red-200" : "border-slate-200")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {showProject && (
            <p className="mb-0.5 flex items-center gap-1.5 truncate text-xs text-slate-500">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: t.projectColor || "#94a3b8" }} /> {t.projectName}
            </p>
          )}
          <p className="line-clamp-2 font-medium text-slate-900">
            {t.priority === "high" && <Flag className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-red-500" />}
            {t.title}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <StatusChip status={t.status} />
        <DueBadge task={t} today={today} />
        {showAssignee && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Avatar name={t.assigneeName} size={18} /> {t.assigneeName}</span>}
        {showAssigner && <span className="text-xs text-slate-500">Giao bởi {t.assignerName}</span>}
        <span className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          {t.fileCount > 0 && <span className="inline-flex items-center gap-0.5"><Paperclip className="h-3.5 w-3.5" />{t.fileCount}</span>}
          {t.eventCount > 1 && <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3.5 w-3.5" />{t.eventCount - 1}</span>}
        </span>
      </div>
    </Link>
  );
}

/** Nhóm nút lọc dạng viên thuốc (cuộn ngang trên điện thoại) */
export function Pills({ value, onChange, items }) {
  return (
    <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pb-1 sm:mx-0 sm:px-0">
      {items.map(([k, label, n]) => (
        <button key={k} type="button" onClick={() => onChange(k)}
          className={cn("shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
            value === k ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>
          {label}{n ? <span className={cn("ml-1.5 tabular-nums", value === k ? "text-blue-100" : "text-slate-400")}>{n}</span> : null}
        </button>
      ))}
    </div>
  );
}

/**
 * Ô chọn người (tìm không dấu theo tên / MSNV / phòng) từ danh bạ nhân viên đang làm việc.
 * value: id được chọn gần nhất (chọn xong gọi onPick(user) và xoá ô tìm). excludeIds: ẩn người đã chọn.
 */
export function PersonPicker({ onPick, excludeIds = [], placeholder = "Tìm nhân viên theo tên, MSNV…", autoFocus }) {
  const dir = usePj((s) => s.dir);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => { ensureDirectory().catch(() => {}); }, []);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("touchstart", onDown); };
  }, [open]);
  const ex = useMemo(() => new Set(excludeIds), [excludeIds]);
  const results = useMemo(() => {
    if (!dir) return [];
    const words = norm(q.trim()).split(/\s+/).filter(Boolean);
    const out = [];
    for (const u of dir) {
      if (ex.has(u.id)) continue;
      const hay = norm(`${u.name} ${u.msnv || ""} ${u.dept || ""}`);
      if (words.every((w) => hay.includes(w))) out.push(u);
      if (out.length >= 40) break;
    }
    return out;
  }, [dir, q, ex]);

  return (
    <div ref={box} className="relative">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <input value={q} autoFocus={autoFocus} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder={placeholder} className={cn(inputCls, "pl-9")} />
        {q && <button type="button" onClick={() => setQ("")} className="absolute right-2 top-2 rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Xoá"><X className="h-4 w-4" /></button>}
      </label>
      {open && (
        <ul className="absolute inset-x-0 z-40 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {!dir && <li className="px-3 py-3 text-sm text-slate-400">Đang tải danh bạ…</li>}
          {dir && !results.length && <li className="px-3 py-3 text-sm text-slate-400">Không tìm thấy</li>}
          {results.map((u) => (
            <li key={u.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onPick(u); setQ(""); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50">
                <Avatar name={u.name} src={u.avatar} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-slate-800">{u.name}</span>
                  <span className="block truncate text-xs text-slate-400">{[u.msnv, u.dept].filter(Boolean).join(" · ")}</span>
                </span>
                <Check className="h-4 w-4 text-transparent" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
