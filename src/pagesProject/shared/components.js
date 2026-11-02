// Thành phần giao diện dùng chung của module 3 "Quản lý dự án" (Tailwind, ưu tiên điện thoại)
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Flag, Search, X } from "lucide-react";
import config from "~/config";
import { cn, inputCls } from "~/pagesForm/shared/ui";
import { TASK_STATUS, PROJECT_STATUS, dueInfo, fmtYmd, norm, resultText, taskCode } from "./meta";
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

/** Trạng thái = chấm màu + chữ, không viền/nền — bớt nhiễu để mắt đọc nội dung công việc */
export function StatusChip({ status, className }) {
  const s = TASK_STATUS[status] || TASK_STATUS.new;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-600", className)}>
      <span className={cn("h-2 w-2 rounded-full", s.dot)} /> {s.label}
    </span>
  );
}

/** Chỉ hiện khi dự án không chạy bình thường */
export function ProjectStatusChip({ status }) {
  const s = PROJECT_STATUS[status] || PROJECT_STATUS.active;
  if (status === "active") return null;
  return <span className="whitespace-nowrap text-xs text-slate-500">{s.label}</span>;
}

export function DueBadge({ task, today }) {
  const d = dueInfo(task, today);
  if (!d) return null;
  return (
    <span className={cn("whitespace-nowrap text-xs",
      d.tone === "red" ? "font-semibold text-red-600" : d.tone === "amber" ? "font-medium text-amber-700" : "text-slate-500")}>
      {d.text}
    </span>
  );
}

/** 1 công việc dạng thẻ (điện thoại): nội dung là chính, dòng dưới gọn. Ai xem cũng thấy người phụ trách + hạn + trạng thái. */
export function TaskCard({ t, today, showProject }) {
  return (
    <Link to={`${R.projectTask}/${t.taskId}`} data-task={t.taskId}
      className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 active:bg-slate-50">
      <p className="line-clamp-2 font-medium text-slate-900">
        {t.priority === "high" && <Flag className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-red-500" />}
        {t.title}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <StatusChip status={t.status} />
        <DueBadge task={t} today={today} />
        <span className="truncate">{t.assigneeName}</span>
        <span className="ml-auto tabular-nums text-slate-400">{taskCode(t.taskId)}</span>
      </div>
      {showProject && <p className="mt-1 truncate text-xs text-slate-400">{t.projectName}</p>}
    </Link>
  );
}

/** true từ 1024 px trở lên — để chỉ dựng 1 bản (bảng hoặc thẻ), không có 2 bản trong DOM */
export function useIsDesktop() {
  const [v, setV] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)");
    const on = () => setV(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return v;
}

/**
 * Danh sách công việc theo đúng các trường đã thống nhất:
 * Mã · Nội dung · Kết quả đầu ra · Người phụ trách · Hạn hoàn thành · Trạng thái · Kết quả · Ghi chú.
 * Máy tính = bảng; điện thoại = thẻ (bấm vào xem đủ).
 */
export function TaskList({ rows, today, showProject }) {
  const desktop = useIsDesktop();
  if (!desktop) return <div className="space-y-2">{rows.map((t) => <TaskCard key={t.taskId} t={t} today={today} showProject={showProject} />)}</div>;
  const th = "whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-slate-500";
  const clip = "line-clamp-2 break-words";
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[1000px] text-sm" data-task-table>
        <thead className="border-b border-slate-200">
          <tr>
            <th className={th}>Mã</th><th className={cn(th, "w-[26%]")}>Nội dung</th><th className={cn(th, "w-[15%]")}>Kết quả đầu ra</th><th className={th}>Người phụ trách</th>
            <th className={th}>Hạn</th><th className={th}>Trạng thái</th><th className={cn(th, "w-[15%]")}>Kết quả</th><th className={cn(th, "w-[14%]")}>Ghi chú</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((t) => {
            const d = dueInfo(t, today);
            const to = `${R.projectTask}/${t.taskId}`;
            return (
              <tr key={t.taskId} className="align-top hover:bg-slate-50" data-task={t.taskId}>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-slate-500">{taskCode(t.taskId)}</td>
                <td className="px-3 py-2.5">
                  <Link to={to} className={cn(clip, "font-medium text-slate-900 hover:text-blue-700")}>
                    {t.priority === "high" && <Flag className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-red-500" />}{t.title}
                  </Link>
                  {showProject && <p className="mt-0.5 truncate text-xs text-slate-400">{t.projectName}</p>}
                </td>
                <td className="px-3 py-2.5 text-slate-700"><span className={clip}>{t.expectedOutput}</span></td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">{t.assigneeName}</td>
                <td className={cn("whitespace-nowrap px-3 py-2.5 tabular-nums", d?.tone === "red" ? "font-semibold text-red-600" : "text-slate-700")}>{fmtYmd(t.dueDate || t.expectedDate)}</td>
                <td className="px-3 py-2.5"><StatusChip status={t.status} /></td>
                <td className="px-3 py-2.5 text-slate-700"><span className={clip}>{resultText(t)}</span></td>
                <td className="px-3 py-2.5 text-slate-500"><span className={clip}>{t.notePreview}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Nhóm nút lọc dạng viên thuốc (cuộn ngang khi hẹp). Không dùng lề âm: thành phần này hay nằm cạnh nút khác trong cùng hàng,
 * lề âm làm nó chồng lên nút bên cạnh trên điện thoại (lỗi thật 2026-11-02).
 */
export function Pills({ value, onChange, items }) {
  return (
    <div className="flex min-w-0 max-w-full gap-1.5 overflow-x-auto pb-1">
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
