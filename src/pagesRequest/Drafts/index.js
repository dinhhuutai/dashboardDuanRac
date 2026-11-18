// Trang "Lưu tạm" (/request/drafts): đề xuất đã điền sẵn nhưng chưa gửi của tôi.
// Nhóm: Đến ngày gửi (ngày định gửi ≤ hôm nay) · Sắp tới · Chưa đặt ngày. Bấm 1 bản → form điền sẵn → Gửi đề xuất.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FileClock, Plus } from "lucide-react";
import config from "~/config";
import { EmptyState, Skeleton } from "~/pagesForm/shared/ui";
import { PageScroll } from "../shared/components";
import { DraftCard, dueInfo, useDrafts } from "../shared/drafts";

const R = config.routes;
const SECTIONS = [
  ["due", "Đến ngày gửi"],
  ["later", "Sắp tới"],
  ["none", "Chưa đặt ngày gửi"],
];

export default function Drafts() {
  const { rows, today, error, needSql, remove } = useDrafts();
  const groups = useMemo(() => {
    const g = { due: [], later: [], none: [] };
    for (const d of rows || []) g[dueInfo(d.sendDate, today).key].push(d);
    return g;
  }, [rows, today]);

  return (
    <PageScroll max="max-w-4xl">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-800"><FileClock className="h-6 w-6 text-blue-700" /> Đề xuất lưu tạm</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Điền sẵn đề xuất rồi bấm <b>Lưu tạm</b> — chưa gửi, chưa ai thấy. Tới ngày, bấm vào đề xuất để mở ra, kiểm tra lại và bấm <b>Gửi đề xuất</b>.
          </p>
        </div>
        <Link to={R.requestNew} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Tạo đề xuất
        </Link>
      </div>

      {error && (
        <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {needSql ? "Chức năng lưu tạm chưa sẵn sàng — IT cần chạy sql/18_request_drafts.sql." : error}
        </p>
      )}

      {!rows && (
        <div className="mt-5 space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      )}

      {rows?.length === 0 && !needSql && (
        <div className="mt-5">
          <EmptyState icon={FileClock} title="Chưa có đề xuất lưu tạm">
            Khi đang điền đề xuất, bấm <b>Lưu tạm</b> (cạnh nút Gửi đề xuất) để gửi vào ngày khác.
          </EmptyState>
        </div>
      )}

      {SECTIONS.map(([key, label]) => groups[key].length > 0 && (
        <section key={key} className="mt-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label} ({groups[key].length})</h2>
          <ul className="space-y-2">
            {groups[key].map((d) => <DraftCard key={d.draftId} d={d} today={today} onDelete={remove} />)}
          </ul>
        </section>
      ))}
    </PageScroll>
  );
}
