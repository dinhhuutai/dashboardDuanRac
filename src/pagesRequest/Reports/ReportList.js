// Danh sách báo cáo (/request/reports): báo cáo mình được xem. Quản trị viên: tạo / sửa / xoá.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Copy, Pencil, Plus, Trash2, Users } from "lucide-react";
import config from "~/config";
import { Button, CardListSkeleton, EmptyState, ErrorBox, IconButton, confirmDialog, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { PageScroll } from "../shared/components";
import { TypeIcon } from "../shared/typeIcons";
import { ensureBoot, useRq } from "../shared/store";
import { timeAgo } from "../shared/format";
import { DIMENSION_LABEL, PERIOD_LABEL } from "./shared";

const R = config.routes;

export default function ReportList() {
  const navigate = useNavigate();
  const isAdmin = useRq((s) => s.boot?.me?.isAdmin);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try { setRows(await rqApi.reports()); } catch (e) { setError(errorMessage(e, "Không tải được danh sách báo cáo")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (r) => {
    if (!(await confirmDialog({ title: "Xoá báo cáo", message: `Xoá báo cáo "${r.name}"? Người được chia sẻ sẽ không xem được nữa (dữ liệu đề xuất không bị ảnh hưởng).`, confirmText: "Xoá", danger: true }))) return;
    setBusy(r.reportId);
    try {
      await rqApi.deleteReport(r.reportId);
      setRows((xs) => xs.filter((x) => x.reportId !== r.reportId));
      ensureBoot(true).catch(() => {});
      toast.success("Đã xoá báo cáo");
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  };

  return (
    <PageScroll>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-800">Báo cáo đề xuất</h1>
          <p className="text-sm text-slate-500">Số liệu tổng hợp theo mẫu đề xuất — {isAdmin ? "tự thiết kế chỉ số, cách nhóm, biểu đồ và chia sẻ cho người cần xem." : "báo cáo quản trị viên chia sẻ cho bạn."}</p>
        </div>
        {isAdmin && <Button icon={Plus} onClick={() => navigate(R.adminRequestReportBuilder)}>Thiết kế báo cáo</Button>}
      </div>

      <div className="mt-5">
        {error ? <ErrorBox message={error} onRetry={load} /> : !rows ? <CardListSkeleton rows={3} /> : rows.length === 0 ? (
          <EmptyState icon={BarChart3} title="Chưa có báo cáo nào">
            {isAdmin ? <>Bấm <b>Thiết kế báo cáo</b> để chọn mẫu đề xuất, các chỉ số cần theo dõi (số đề xuất, tổng tiền, thời gian duyệt…) và cách nhóm.</> : "Chưa có báo cáo nào được chia sẻ cho bạn."}
          </EmptyState>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {rows.map((r) => (
              <div key={r.reportId} className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
                <Link to={`${R.requestReports}/${r.reportId}`} className="absolute inset-0 rounded-xl" aria-label={`Xem báo cáo ${r.name}`} />
                <div className="flex items-start gap-3">
                  {r.typeId ? <TypeIcon icon={r.icon} color={r.color} /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><BarChart3 className="h-5 w-5" /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 group-hover:text-blue-700">{r.name}</p>
                    <p className="truncate text-xs text-slate-500">{r.typeName || "Mọi mẫu đề xuất"}</p>
                  </div>
                </div>
                {r.description && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{r.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">{PERIOD_LABEL[r.period] || "Tháng này"}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Nhóm: {r.groupBy === "field" || r.groupBy === "column" ? "theo trường" : DIMENSION_LABEL[r.groupBy] || "—"}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{r.metricCount} chỉ số</span>
                  {isAdmin && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-600"><Users className="h-3 w-3" />{r.viewerCount ? `${r.viewerCount} người xem` : "chỉ quản trị"}</span>}
                </div>
                <div className="mt-auto flex items-center gap-1 pt-3">
                  <span className="flex-1 text-[11px] text-slate-400">Sửa {timeAgo(r.updatedAt)}{r.updatedByName ? ` · ${r.updatedByName}` : ""}</span>
                  {isAdmin && (
                    <span className="relative z-10 flex">
                      <IconButton icon={Pencil} title="Sửa thiết kế" onClick={() => navigate(`${R.adminRequestReportBuilder}/${r.reportId}`)} />
                      <IconButton icon={Copy} title="Nhân bản" onClick={() => navigate(`${R.adminRequestReportBuilder}?copy=${r.reportId}`)} />
                      <IconButton icon={Trash2} title="Xoá" danger loading={busy === r.reportId} onClick={() => remove(r)} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageScroll>
  );
}
