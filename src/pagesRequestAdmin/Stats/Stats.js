// Quản trị: thống kê đề xuất theo trạng thái, mẫu, phòng ban; ai đang giữ nhiều đề xuất chờ duyệt.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import config from "~/config";
import { IconButton, Refreshing, Skeleton, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { PageScroll, UserAvatar } from "~/pagesRequest/shared/components";
import { STATUS, fmtYmd } from "~/pagesRequest/shared/format";

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Bar({ value, max, cls = "bg-blue-600" }) {
  return <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={cn("h-full rounded-full", cls)} style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} /></div>;
}

export default function Stats() {
  const now = new Date();
  const [from, setFrom] = useState(ymd(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(ymd(now));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await rqApi.stats({ from: from || undefined, to: to || undefined })); } catch (e) { toast.error(errorMessage(e)); } finally { setLoading(false); }
  }, [from, to]);
  useEffect(() => { load(); }, [load]);

  const count = (s) => data?.byStatus.find((x) => x.status === s)?.n || 0;
  const total = data?.byStatus.reduce((a, x) => a + x.n, 0) || 0;
  const maxType = Math.max(1, ...(data?.byType || []).map((x) => x.total));
  const maxDept = Math.max(1, ...(data?.byDepartment || []).map((x) => x.total));
  const maxDay = Math.max(1, ...(data?.timeline || []).map((x) => x.n));
  const decided = (data?.byType || []).filter((t) => t.avgHours !== null);
  const avgHours = decided.length ? decided.reduce((a, t) => a + Number(t.avgHours) * (t.approved + t.rejected), 0) / Math.max(1, decided.reduce((a, t) => a + t.approved + t.rejected, 0)) : null;

  return (
    <PageScroll>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800">Thống kê đề xuất</h1>
          <p className="text-sm text-slate-500">Theo ngày gửi.</p>
        </div>
        <label className="text-xs text-slate-500">Từ ngày<input type="date" className={cn(inputCls, "mt-0.5 py-1.5")} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-slate-500">Đến ngày<input type="date" className={cn(inputCls, "mt-0.5 py-1.5")} value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <IconButton icon={RefreshCw} title="Tải lại" spin={loading} disabled={loading} onClick={load} />
      </div>

      {!data ? (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <Refreshing active={loading} className="mt-5"><div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[["Tổng đề xuất", total, "text-slate-800"], [STATUS.pending.label, count("pending"), "text-amber-600"], [STATUS.approved.label, count("approved"), "text-emerald-600"],
              [STATUS.rejected.label, count("rejected"), "text-red-600"], ["Thời gian xử lý TB", avgHours === null ? "—" : avgHours < 24 ? `${avgHours.toFixed(1)} giờ` : `${(avgHours / 24).toFixed(1)} ngày`, "text-blue-700"]].map(([k, v, c]) => (
              <div key={k} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{k}</p><p className={cn("mt-1 text-2xl font-bold", c)}>{v}</p></div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 font-semibold text-slate-800">Theo mẫu đề xuất</h3>
              {data.byType.length === 0 ? <p className="text-sm text-slate-400">Chưa có đề xuất</p> : (
                <ul className="space-y-2.5">
                  {data.byType.map((t) => (
                    <li key={t.typeId}>
                      <div className="flex justify-between text-sm"><Link to={`${config.routes.request}?box=all&typeId=${t.typeId}`} className="truncate text-slate-700 hover:text-blue-700">{t.typeName}</Link><span className="shrink-0 text-slate-500">{t.total} · <span className="text-amber-600">{t.pending} chờ</span></span></div>
                      <Bar value={t.total} max={maxType} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 font-semibold text-slate-800">Theo phòng ban người gửi</h3>
              {data.byDepartment.length === 0 ? <p className="text-sm text-slate-400">Chưa có đề xuất</p> : (
                <ul className="space-y-2.5">
                  {data.byDepartment.map((d) => (
                    <li key={d.departmentId ?? "none"}>
                      <div className="flex justify-between text-sm"><span className="truncate text-slate-700">{d.departmentName}</span><span className="shrink-0 text-slate-500">{d.total}{d.pending ? ` · ${d.pending} chờ` : ""}</span></div>
                      <Bar value={d.total} max={maxDept} cls="bg-sky-500" />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-1 font-semibold text-slate-800">Đang giữ đề xuất chờ duyệt</h3>
            <p className="mb-3 text-xs text-slate-500">Tất cả thời gian — để nhắc người duyệt chậm.</p>
            {data.pendingByApprover.length === 0 ? <p className="text-sm text-slate-400">Không có đề xuất nào đang chờ 🎉</p> : (
              <ul className="divide-y divide-slate-100">
                {data.pendingByApprover.map((p) => (
                  <li key={p.userId} className="flex items-center gap-3 py-2">
                    <UserAvatar id={p.userId} name={p.fullName} size={30} />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{p.fullName}</span>
                    <span className="text-sm font-semibold text-amber-600">{p.pending} đề xuất</span>
                    <span className={cn("w-28 text-right text-xs", p.oldestHours > 48 ? "text-red-600" : "text-slate-400")}>lâu nhất {p.oldestHours < 24 ? `${p.oldestHours} giờ` : `${Math.floor(p.oldestHours / 24)} ngày`}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.timeline.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 font-semibold text-slate-800">Số đề xuất theo ngày</h3>
              <div className="flex h-36 items-end gap-1 overflow-x-auto pb-5">
                {data.timeline.map((t) => (
                  <div key={t.day} className="relative flex h-full min-w-[18px] flex-1 flex-col justify-end" title={`${fmtYmd(t.day)}: ${t.n}`}>
                    <span className="mb-0.5 text-center text-[10px] text-slate-500">{t.n}</span>
                    <div className="rounded-t bg-blue-600/80" style={{ height: `${(t.n / maxDay) * 100}%`, minHeight: 2 }} />
                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-400">{fmtYmd(t.day).slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div></Refreshing>
      )}
    </PageScroll>
  );
}
