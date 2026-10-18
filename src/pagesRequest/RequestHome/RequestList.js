// Danh sách đề xuất (khung trái): lọc theo trạng thái / mẫu / phòng ban / ngày, tìm kiếm, tải thêm,
// chọn nhiều để duyệt hàng loạt (hộp "Cần tôi duyệt").
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckSquare, Flag, Inbox, ListFilter, Loader2, MessageCircle, Paperclip, Search, X, Zap } from "lucide-react";
import { Button, Refreshing, Skeleton, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { StatusBadge, UserAvatar } from "../shared/components";
import { rqEvents, refreshCounts, useRq, userName } from "../shared/store";
import { deadlineInfo, timeAgo } from "../shared/format";
import ActionDialog from "./ActionDialog";

export const BOX_TITLE = {
  inbox: "Cần tôi duyệt",
  mine: "Đề xuất của tôi",
  processed: "Tôi đã xử lý",
  following: "Đang theo dõi",
  all: "Tất cả đề xuất",
};
const STATUS_TABS = [
  ["", "Tất cả"], ["pending", "Chờ duyệt"], ["approved", "Đã duyệt"], ["rejected", "Từ chối"], ["returned", "Cần bổ sung"], ["cancelled", "Đã huỷ"],
];
const PAGE = 30;

// Màn hình rộng: mỗi đề xuất 1 dòng chia cột (như bảng); điện thoại: thẻ gọn.
const COLS = "md:grid md:grid-cols-[minmax(0,1fr)_minmax(160px,220px)_150px_minmax(150px,220px)_92px] md:items-center md:gap-4";

const Row = memo(function Row({ r, selected, onOpen, picking, picked, onPick }) {
  const dl = deadlineInfo(r.deadline, r.status);
  const waiting = r.status === "pending" && r.waitingIds.length ? r.waitingIds.map((id) => userName(id)).join(", ") : null;
  const badges = (
    <>
      {r.myTurn && <span className="rounded-full bg-amber-500 px-2 py-0.5 font-semibold text-white">Đến lượt bạn</span>}
      {r.priority === "high" && <span className="inline-flex items-center gap-0.5 font-semibold text-red-600"><Zap className="h-3 w-3" />Gấp</span>}
      {dl && dl.tone !== "slate" && <span className={cn("inline-flex items-center gap-0.5", dl.tone === "red" ? "text-red-600" : "text-amber-700")}><Flag className="h-3 w-3" />{dl.text}</span>}
      {r.commentCount > 0 && <span className="inline-flex items-center gap-0.5 text-slate-400"><MessageCircle className="h-3 w-3" />{r.commentCount}</span>}
      {r.fileCount > 0 && <span className="inline-flex items-center gap-0.5 text-slate-400"><Paperclip className="h-3 w-3" />{r.fileCount}</span>}
    </>
  );
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={() => (picking ? onPick(r.requestId) : onOpen(r.requestId))}
        onKeyDown={(e) => e.key === "Enter" && onOpen(r.requestId)}
        className={cn(
          "flex cursor-pointer gap-3 border-l-[3px] px-3 py-3 transition-colors md:px-5",
          COLS,
          selected ? "border-blue-600 bg-blue-50/70" : r.myTurn ? "border-amber-400 bg-amber-50/30 hover:bg-amber-50/60" : "border-transparent hover:bg-slate-50"
        )}
      >
        {/* cột 1: đề xuất */}
        <div className="flex min-w-0 flex-1 gap-3">
          {picking && (
            <input type="checkbox" checked={picked} onChange={() => onPick(r.requestId)} onClick={(e) => e.stopPropagation()}
              className="mt-2.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600" />
          )}
          <span className="md:hidden"><UserAvatar id={r.requesterId} name={r.requesterName} size={36} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <p className={cn("min-w-0 flex-1 truncate text-sm md:text-[15px]", r.myTurn ? "font-bold text-slate-900" : "font-semibold text-slate-800")}>{r.title}</p>
              <span className="shrink-0 text-[11px] text-slate-400 md:hidden">{timeAgo(r.lastActivityAt)}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              <span className="text-slate-400">#{r.requestId}</span> · <span className="font-medium" style={{ color: r.color || undefined }}>{r.typeName}</span>
              <span className="md:hidden"> · {r.requesterName}{r.departmentName ? ` · ${r.departmentName}` : ""}</span>
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] md:mt-1">
              <span className="md:hidden"><StatusBadge status={r.status} /></span>
              {badges}
            </div>
            {waiting && !r.myTurn && r.stepCount > 0 && (
              <p className="mt-1 truncate text-[11px] text-slate-400 md:hidden">Bước {r.currentStep}/{r.stepCount} · chờ {waiting}</p>
            )}
          </div>
        </div>
        {/* các cột trên màn hình rộng */}
        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <UserAvatar id={r.requesterId} name={r.requesterName} size={30} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-800">{r.requesterName}</span>
            <span className="block truncate text-xs text-slate-500">{[r.departmentName, r.teamName].filter(Boolean).join(" · ") || "—"}</span>
          </span>
        </div>
        <div className="hidden md:block"><StatusBadge status={r.status} /></div>
        <div className="hidden min-w-0 text-xs md:block">
          {r.status === "pending" && r.stepCount > 0 ? (
            <>
              <p className="font-medium text-slate-700">Bước {r.currentStep}/{r.stepCount}</p>
              <p className="truncate text-slate-500" title={waiting || ""}>{r.myTurn ? <b className="text-amber-700">Bạn</b> : waiting ? `Chờ ${waiting}` : "—"}</p>
            </>
          ) : <span className="text-slate-400">{r.finishedAt ? `Xong ${timeAgo(r.finishedAt)}` : "—"}</span>}
        </div>
        <div className="hidden text-right text-xs text-slate-500 md:block">{timeAgo(r.lastActivityAt)}</div>
      </div>
    </li>
  );
});

function ListSkeleton() {
  return (
    <ul className="divide-y divide-slate-100" role="status" aria-label="Đang tải danh sách">
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="flex gap-3 px-3 py-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /><Skeleton className="h-4 w-24 rounded-full" /></div>
        </li>
      ))}
    </ul>
  );
}

export default function RequestList({ box, filters, setFilter, selectedId, onOpen }) {
  const boot = useRq((s) => s.boot);
  const dir = useRq((s) => s.dir);
  const [rows, setRows] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [q, setQ] = useState(filters.q || "");
  const [showFilters, setShowFilters] = useState(false);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const seq = useRef(0);
  const sentinel = useRef(null);

  const params = useMemo(() => ({
    box,
    status: filters.status || undefined,
    typeId: filters.typeId || undefined,
    groupId: filters.groupId || undefined,
    departmentId: filters.departmentId || undefined,
    q: filters.q || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    pageSize: PAGE,
  }), [box, filters]);

  const load = useCallback(async (quiet) => {
    const my = ++seq.current;
    setLoading(true);
    if (!quiet) setError(null);
    try {
      const d = await rqApi.list({ ...params, page: 1 }, quiet ? { silent: true } : undefined);
      if (my !== seq.current) return;
      setRows(d.rows);
      setTotal(d.total);
      setPage(1);
    } catch (e) {
      if (my === seq.current && !quiet) setError(errorMessage(e, "Không tải được danh sách"));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPicking(false); setPicked(new Set()); }, [box]);
  // URL đổi từ bên ngoài (ô tìm trên thanh trên) → cập nhật ô tìm; không đè chữ đang gõ (vd. dấu cách cuối)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if ((filters.q || "") !== q.trim()) setQ(filters.q || ""); }, [filters.q]);

  // có thay đổi (duyệt, gửi mới, huy hiệu đổi) → tải lại ngầm
  useEffect(() => rqEvents.on("changed", () => load(true)), [load]);

  const more = useCallback(async () => {
    if (loadingMore || !rows || rows.length >= total) return;
    setLoadingMore(true);
    try {
      const d = await rqApi.list({ ...params, page: page + 1 });
      setRows((xs) => {
        const have = new Set(xs.map((x) => x.requestId));
        return [...xs, ...d.rows.filter((x) => !have.has(x.requestId))];
      });
      setPage(page + 1);
      setTotal(d.total);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, rows, total, params, page]);

  // cuộn tới cuối → tự tải thêm
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es[0].isIntersecting && more(), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more]);

  // gõ tìm kiếm: chờ 350 ms rồi mới lọc
  useEffect(() => {
    if ((filters.q || "") === q.trim()) return;
    const t = setTimeout(() => setFilter({ q: q.trim() || null }), 350);
    return () => clearTimeout(t);
  }, [q, filters.q, setFilter]);

  const pick = useCallback((rid) => setPicked((s) => { const n = new Set(s); n.has(rid) ? n.delete(rid) : n.add(rid); return n; }), []);
  const pickable = (rows || []).filter((r) => r.myTurn);

  const doBulk = async (note) => {
    try {
      const r = await rqApi.bulk([...picked], bulkAction, note);
      const fail = r.results.filter((x) => !x.ok);
      toast[fail.length ? "info" : "success"](`${bulkAction === "approve" ? "Đã duyệt" : "Đã từ chối"} ${r.done} đề xuất${fail.length ? ` · ${fail.length} lỗi: ${fail[0].message}` : ""}`);
      setBulkAction(null);
      setPicking(false);
      setPicked(new Set());
      load(true);
      refreshCounts();
      rqEvents.emit("changed", {});
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const activeFilterCount = ["typeId", "departmentId", "from", "to"].filter((k) => filters[k]).length;
  const types = boot?.types || [];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Đầu danh sách */}
      <div className="shrink-0 space-y-2 border-b border-slate-200 px-3 pb-2 pt-3 md:px-5">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 truncate text-base font-bold text-slate-800">
            {filters.groupId ? boot?.groups?.find((g) => String(g.groupId) === String(filters.groupId))?.name || "Nhóm" : BOX_TITLE[box]}
            <span className="ml-1.5 text-sm font-normal text-slate-400">{rows ? total : ""}</span>
          </h2>
          {loading && rows && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          {box === "inbox" && pickable.length > 0 && (
            <button type="button" onClick={() => { setPicking((v) => !v); setPicked(new Set()); }}
              className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium", picking ? "bg-blue-600 text-white" : "text-blue-700 hover:bg-blue-50")}>
              <CheckSquare className="h-3.5 w-3.5" /> {picking ? "Thôi chọn" : "Duyệt nhiều"}
            </button>
          )}
          <button type="button" onClick={() => setShowFilters((v) => !v)} title="Bộ lọc"
            className={cn("relative rounded-lg p-1.5", showFilters || activeFilterCount ? "bg-blue-50 text-blue-700" : "text-slate-500 hover:bg-slate-100")}>
            <ListFilter className="h-4 w-4" />
            {activeFilterCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">{activeFilterCount}</span>}
          </button>
        </div>
        <label className="relative block md:max-w-xl">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tiêu đề, người gửi, #mã…"
            className="h-8 w-full rounded-lg border-0 bg-slate-100 pl-8 pr-7 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" />
          {q && <button type="button" onClick={() => setQ("")} className="absolute right-1.5 top-1.5 rounded p-0.5 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
        </label>
        {showFilters && (
          <div className="grid grid-cols-2 items-end gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-[repeat(4,minmax(0,220px))_auto]">
            <select className={cn(inputCls, "col-span-2 py-1.5 md:col-span-1")} value={filters.typeId || ""} onChange={(e) => setFilter({ typeId: e.target.value || null })}>
              <option value="">Mọi mẫu đề xuất</option>
              {types.map((t) => <option key={t.typeId} value={t.typeId}>{t.name}</option>)}
            </select>
            <select className={cn(inputCls, "col-span-2 py-1.5 md:col-span-1")} value={filters.departmentId || ""} onChange={(e) => setFilter({ departmentId: e.target.value || null })}>
              <option value="">Mọi phòng ban</option>
              {dir?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <label className="text-xs text-slate-500">Từ ngày<input type="date" className={cn(inputCls, "mt-0.5 py-1")} value={filters.from || ""} onChange={(e) => setFilter({ from: e.target.value || null })} /></label>
            <label className="text-xs text-slate-500">Đến ngày<input type="date" className={cn(inputCls, "mt-0.5 py-1")} value={filters.to || ""} onChange={(e) => setFilter({ to: e.target.value || null })} /></label>
            {activeFilterCount > 0 && (
              <button type="button" className="col-span-2 py-2 text-xs font-medium text-blue-700 hover:underline md:col-span-1" onClick={() => setFilter({ typeId: null, departmentId: null, from: null, to: null })}>Xoá bộ lọc</button>
            )}
          </div>
        )}
        <div className="-mx-1 flex gap-1 overflow-x-auto pb-0.5">
          {STATUS_TABS.filter(([k]) => box !== "inbox" || k === "").map(([k, label]) => (
            <button key={k || "all"} type="button" onClick={() => setFilter({ status: k || null })}
              className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition", (filters.status || "") === k ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && !rows ? (
          <div className="p-6 text-center text-sm text-red-600">{error}<br /><button type="button" className="mt-2 font-medium underline" onClick={() => load()}>Thử lại</button></div>
        ) : !rows ? (
          <ListSkeleton />
        ) : rows.length === 0 ? (
          <Refreshing active={loading}>
            <div className="flex flex-col items-center px-6 py-16 text-center text-slate-400">
              <Inbox className="mb-2 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">{box === "inbox" && !filters.q ? "Không có đề xuất nào chờ bạn duyệt 🎉" : "Không có đề xuất phù hợp"}</p>
            </div>
          </Refreshing>
        ) : (
          <Refreshing active={loading}>
            <div className={cn("sticky top-0 z-10 hidden border-b border-slate-200 bg-slate-50 px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500", COLS)}>
              <span className="pl-[3px]">Đề xuất</span><span>Người gửi</span><span>Trạng thái</span><span>Đang chờ</span><span className="text-right">Cập nhật</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => (
                <Row key={r.requestId} r={r} selected={String(selectedId) === String(r.requestId)} onOpen={onOpen}
                  picking={picking && r.myTurn} picked={picked.has(r.requestId)} onPick={pick} />
              ))}
            </ul>
            <div ref={sentinel} className="py-4 text-center text-xs text-slate-400">
              {loadingMore ? <span className="inline-flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải thêm…</span>
                : rows.length < total ? <button type="button" onClick={more} className="font-medium text-blue-700 hover:underline">Tải thêm</button>
                : rows.length > 5 ? "Đã hết danh sách" : null}
            </div>
          </Refreshing>
        )}
      </div>

      {picking && (
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white p-2">
          <span className="flex-1 text-sm text-slate-600">
            Đã chọn {picked.size}
            <button type="button" className="ml-2 text-xs font-medium text-blue-700 hover:underline" onClick={() => setPicked(new Set(pickable.map((r) => r.requestId)))}>Chọn tất cả ({pickable.length})</button>
          </span>
          <Button size="sm" variant="secondary" className="!text-red-600" disabled={!picked.size} onClick={() => setBulkAction("reject")}>Từ chối</Button>
          <Button size="sm" className="!bg-emerald-600" disabled={!picked.size} onClick={() => setBulkAction("approve")}>Duyệt {picked.size || ""}</Button>
        </div>
      )}
      {bulkAction && <ActionDialog action={bulkAction} count={picked.size} onClose={() => setBulkAction(null)} onConfirm={doBulk} />}
    </div>
  );
}
