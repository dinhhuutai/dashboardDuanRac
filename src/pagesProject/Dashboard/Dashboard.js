// Báo cáo công việc — phạm vi theo vai trò: admin = cả công ty · người giao việc = dự án mình giao + việc của mình · người nhận = việc của mình.
// Tổng việc · Còn mở · Đã đóng (hoàn thành + huỷ, huỷ nêu lý do) · Quá hạn · Tỷ lệ đã đóng + danh sách việc nghẽn. Số liệu tính ở backend (dashboard.js report).
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import config from "~/config";
import { EmptyState, ErrorBox, Refreshing, Skeleton, cn, inputCls } from "~/pagesForm/shared/ui";
import { errorMessage, pjApi } from "../shared/api";
import { fmtSpan, taskCode, waitReason } from "../shared/meta";
import { Page, useIsDesktop } from "../shared/components";
import { KpiTile } from "../shared/Charts";

const R = config.routes;

const Card = ({ title, sub, children, right }) => (
  <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {sub && <span className="text-sm text-slate-400">{sub}</span>}
      {right && <span className="ml-auto">{right}</span>}
    </div>
    {children}
  </section>
);

function Bottlenecks({ rows, canSeePeople }) {
  const desktop = useIsDesktop();
  if (!rows.length) return <p className="text-sm text-slate-400">Không có việc nghẽn</p>;
  const person = (x) => (canSeePeople ? <Link to={`${R.projectPeople}/${x.assigneeId}`} className="hover:text-blue-700 hover:underline">{x.assigneeName}</Link> : x.assigneeName);
  if (!desktop) {
    return (
      <ul className="-my-2 divide-y divide-slate-100" data-bottlenecks>
        {rows.map((x) => (
          <li key={x.taskId} className="py-2.5">
            <Link to={`${R.projectTask}/${x.taskId}`} className="line-clamp-2 text-sm font-medium text-slate-900">{x.title}</Link>
            <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-slate-500">
              <b className="font-semibold text-red-600">Chờ {fmtSpan(x.waitMs)}</b>
              <span>{waitReason(x)}</span>
              <span>· {x.assigneeName}</span>
            </p>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <table className="w-full text-sm" data-bottlenecks>
      <thead className="border-b border-slate-100 text-left text-xs text-slate-500">
        <tr>
          <th className="py-2 pr-3 font-medium">Mã</th><th className="py-2 pr-3 font-medium">Công việc nghẽn</th><th className="py-2 pr-3 font-medium">Đang kẹt ở</th>
          <th className="py-2 pr-3 font-medium">Thời gian chờ</th><th className="py-2 font-medium">Người thực hiện</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {rows.map((x) => (
          <tr key={x.taskId} className="align-top hover:bg-slate-50/60">
            <td className="whitespace-nowrap py-2 pr-3 text-xs tabular-nums text-slate-500">{taskCode(x.taskId)}</td>
            <td className="py-2 pr-3"><Link to={`${R.projectTask}/${x.taskId}`} className="font-medium text-slate-900 hover:text-blue-700">{x.title}</Link><p className="text-xs text-slate-400">{x.projectName}</p></td>
            <td className="whitespace-nowrap py-2 pr-3 text-slate-600">{waitReason(x)}</td>
            <td className="whitespace-nowrap py-2 pr-3 font-semibold text-red-600">{fmtSpan(x.waitMs)}</td>
            <td className="whitespace-nowrap py-2 text-slate-700">{person(x)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Dashboard() {
  const [projectId, setProjectId] = useState("");
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    setLoading(true);
    try {
      const r = await pjApi.dashboard({ projectId: projectId || undefined });
      if (my === seq.current) { setD(r); setError(null); }
    } catch (e) { if (my === seq.current) setError(errorMessage(e)); } finally { if (my === seq.current) setLoading(false); }
  }, [projectId]);
  useEffect(() => { load(); }, [load]);

  if (error && !d) return <Page wide><ErrorBox message={error} onRetry={load} /></Page>;
  const k = d?.kpi;
  const canSeePeople = d && d.scope !== "mine";
  return (
    <Page wide>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 text-xl font-bold text-slate-900">Báo cáo</h1>
        {d?.projects?.length > 1 && (
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={cn(inputCls, "w-full sm:w-60")} aria-label="Dự án" data-filter="project">
            <option value="">Mọi dự án</option>
            {d.projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
          </select>
        )}
      </div>

      {!d ? (
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <Refreshing active={loading}>
          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5" data-kpis>
            <KpiTile label="Tổng việc" value={k.total} />
            <KpiTile label="Còn mở" value={k.open} />
            <KpiTile label="Đã đóng" value={k.closed} sub={`${k.done} hoàn thành · ${k.cancelled} huỷ`} />
            <KpiTile label="Quá hạn" value={k.overdue} tone="critical" />
            <KpiTile label="Tỷ lệ đã đóng" value={k.closedRate === null ? null : `${k.closedRate}%`} />
          </div>

          <Card title="Công việc nghẽn" sub={d.bottlenecks.length || null}
            right={canSeePeople ? <Link to={R.projectPeople} className="text-sm font-medium text-blue-700 hover:underline">Theo nhân sự</Link> : null}>
            <Bottlenecks rows={d.bottlenecks} canSeePeople={canSeePeople} />
          </Card>

          {d.cancelledList.length > 0 && (
            <Card title="Việc đã huỷ" sub={k.cancelled}>
              <ul className="-my-2 divide-y divide-slate-100" data-cancelled>
                {d.cancelledList.map((x) => (
                  <li key={x.taskId} className="py-2.5">
                    <Link to={`${R.projectTask}/${x.taskId}`} className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-blue-700">{x.title}</Link>
                    <p className="mt-0.5 text-sm text-slate-600">{x.reason || <span className="text-slate-400">Không ghi lý do</span>}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {!k.total && <div className="mt-4"><EmptyState title="Chưa có công việc" /></div>}
        </Refreshing>
      )}
    </Page>
  );
}
