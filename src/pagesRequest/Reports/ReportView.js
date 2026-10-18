// Xem 1 báo cáo (/request/reports/:id): đổi kỳ ngay trên trang (lưu trên URL), tải lại, xuất Excel.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BarChart3, FileSpreadsheet, Pencil, RefreshCw } from "lucide-react";
import config from "~/config";
import { Button, ErrorBox, IconButton, Refreshing, Skeleton, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { PageScroll } from "../shared/components";
import { TypeIcon } from "../shared/typeIcons";
import ReportResult, { exportReportExcel } from "./ReportResult";
import { PERIODS } from "./shared";

const R = config.routes;

export function ResultSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Đang tải báo cáo">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

/** Chọn kỳ: danh sách kỳ + 2 ô ngày khi "Tuỳ chọn" */
export function PeriodPicker({ value, onChange, className }) {
  const v = value || { period: "this_month" };
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <select className={cn(inputCls, "w-auto py-1.5")} value={v.period} onChange={(e) => onChange({ ...v, period: e.target.value })} aria-label="Kỳ báo cáo">
        {PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      {v.period === "custom" && (
        <>
          <input type="date" className={cn(inputCls, "w-auto py-1.5")} value={v.from || ""} onChange={(e) => onChange({ ...v, from: e.target.value })} aria-label="Từ ngày" />
          <span className="text-slate-400">→</span>
          <input type="date" className={cn(inputCls, "w-auto py-1.5")} value={v.to || ""} onChange={(e) => onChange({ ...v, to: e.target.value })} aria-label="Đến ngày" />
        </>
      )}
    </div>
  );
}

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [rep, setRep] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const seq = useRef(0);

  // kỳ đang xem: trên URL (?period=&from=&to=), chưa có thì kỳ mặc định của báo cáo
  const period = params.get("period") ? { period: params.get("period"), from: params.get("from") || "", to: params.get("to") || "" } : null;
  const shown = period || (rep ? { period: rep.definition.period, from: rep.definition.from || "", to: rep.definition.to || "" } : null);

  useEffect(() => {
    let alive = true;
    setRep(null); setResult(null); setError(null);
    rqApi.report(id).then((r) => { if (alive) setRep(r); }).catch((e) => { if (alive) setError(errorMessage(e, "Không tải được báo cáo")); });
    return () => { alive = false; };
  }, [id]);

  const run = useCallback(async () => {
    if (!rep) return;
    if (period?.period === "custom" && (!period.from || !period.to)) return; // chờ chọn đủ 2 ngày
    const my = ++seq.current;
    setLoading(true);
    try {
      const r = await rqApi.runReport(id, period || undefined);
      if (my === seq.current) { setResult(r); setError(null); }
    } catch (e) {
      if (my === seq.current) setError(errorMessage(e, "Không chạy được báo cáo"));
    } finally {
      if (my === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rep, params]);
  useEffect(() => { run(); }, [run]);

  const setPeriod = (v) => {
    const next = new URLSearchParams(params);
    next.set("period", v.period);
    if (v.period === "custom") { if (v.from) next.set("from", v.from); else next.delete("from"); if (v.to) next.set("to", v.to); else next.delete("to"); }
    else { next.delete("from"); next.delete("to"); }
    setParams(next, { replace: true });
  };

  const doExport = async () => {
    setExporting(true);
    try { await exportReportExcel({ name: rep.name, result, definition: rep.definition, fields: rep.type?.fields }); }
    catch { toast.error("Xuất Excel thất bại"); } finally { setExporting(false); }
  };

  if (error && !rep) return <PageScroll max="max-w-xl"><ErrorBox message={error} onRetry={() => navigate(0)} /></PageScroll>;

  return (
    <PageScroll>
      <Link to={R.requestReports} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> Danh sách báo cáo</Link>
      {!rep ? (
        <div className="space-y-3"><Skeleton className="h-10 w-1/2" /><ResultSkeleton /></div>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-3">
            {rep.type ? <TypeIcon icon={rep.type.icon} color={rep.type.color} size="lg" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><BarChart3 className="h-6 w-6" /></span>}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-slate-900">{rep.name}</h1>
              <p className="text-sm text-slate-500">{rep.type ? `Mẫu: ${rep.type.name}${rep.type.isDeleted ? " (đã xoá)" : ""}` : "Mọi mẫu đề xuất"}{rep.description ? ` · ${rep.description}` : ""}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PeriodPicker value={shown} onChange={setPeriod} />
              <IconButton icon={RefreshCw} title="Tải lại" spin={loading} disabled={loading} onClick={run} />
              <Button variant="secondary" icon={FileSpreadsheet} loading={exporting} disabled={!result} onClick={doExport}>Xuất Excel</Button>
              {rep.canEdit && <Button variant="secondary" icon={Pencil} onClick={() => navigate(`${R.adminRequestReportBuilder}/${rep.reportId}`)}>Sửa thiết kế</Button>}
            </div>
          </div>
          <div className="mt-5">
            {error && !result ? <ErrorBox message={error} onRetry={run} /> : !result ? <ResultSkeleton /> : (
              <Refreshing active={loading}>
                <ReportResult result={result} definition={rep.definition} fields={rep.type?.fields} linkRows={rep.canEdit} />
              </Refreshing>
            )}
          </div>
        </>
      )}
    </PageScroll>
  );
}
