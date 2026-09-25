// Admin: kết quả & thống kê của 1 biểu mẫu
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Eye, Inbox, Pencil, RefreshCw, Search, Trash2, UserX } from "lucide-react";
import config from "~/config";
import { errorMessage, fmApi } from "~/pagesForm/shared/api";
import { exportMissingToExcel, exportResponsesToExcel } from "~/pagesForm/shared/exportExcel";
import { fmtDate, fmtDateTime, fmtNumber, fmtPercent } from "~/pagesForm/shared/format";
import { TYPE_META } from "~/pagesForm/shared/questionTypes";
import { Badge, Button, EmptyState, ErrorBox, IconButton, Modal, Spinner, Toggle, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "questions", label: "Theo câu hỏi" },
  { key: "responses", label: "Danh sách phiếu" },
  { key: "missing", label: "Chưa nộp" },
];

function Bar({ value, max, tone = "bg-blue-600" }) {
  const pct = max ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full", tone)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

/* ------------------------------- Tổng quan ------------------------------- */
function Overview({ stats }) {
  const { summary, byDepartment, timeline } = stats;
  const maxDay = Math.max(1, ...timeline.map((t) => t.count));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Tỷ lệ hoàn thành" value={fmtPercent(summary.completionRate)} sub={`${summary.targetDone}/${summary.targetCount} người thuộc đối tượng`} />
        <StatCard label="Số phiếu" value={summary.responseCount.toLocaleString("vi-VN")} sub={`${summary.respondentCount} người đã nộp`} />
        <StatCard label="Chưa nộp" value={Math.max(0, summary.targetCount - summary.targetDone).toLocaleString("vi-VN")} sub="người thuộc đối tượng" />
        <StatCard label="Phiếu mới nhất" value={summary.lastSubmittedAt ? fmtDate(summary.lastSubmittedAt) : "—"} sub={summary.lastSubmittedAt ? fmtDateTime(summary.lastSubmittedAt).slice(11) : ""} />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Tiến độ theo phòng ban</h3>
        {byDepartment.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có ai thuộc đối tượng của biểu mẫu.</p>
        ) : (
          <div className="space-y-3">
            {byDepartment.map((d) => {
              const rate = d.target ? d.done / d.target : 0;
              return (
                <div key={d.departmentId ?? "none"} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[200px_minmax(0,1fr)_110px]">
                  <span className={cn("truncate text-sm", d.departmentId ? "text-slate-700" : "italic text-amber-700")}>{d.departmentName}</span>
                  <span className="text-right text-sm text-slate-500 sm:order-last">{d.done}/{d.target} · <b className="text-slate-800">{fmtPercent(rate)}</b></span>
                  <div className="col-span-2 sm:col-span-1"><Bar value={d.done} max={d.target} tone={rate >= 1 ? "bg-emerald-500" : "bg-blue-600"} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-slate-800">Số phiếu theo ngày</h3>
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có phiếu nào.</p>
        ) : (
          <div className="flex h-40 items-end gap-1 overflow-x-auto pb-6">
            {timeline.map((t) => (
              <div key={t.day} className="group relative flex h-full min-w-[22px] flex-1 flex-col justify-end" title={`${fmtDate(t.day)}: ${t.count} phiếu`}>
                <span className="mb-1 text-center text-[10px] text-slate-500">{t.count}</span>
                <div className="rounded-t bg-blue-600/80 group-hover:bg-blue-700" style={{ height: `${(t.count / maxDay) * 100}%`, minHeight: 2 }} />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-slate-400">{fmtDate(t.day).slice(0, 5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Theo câu hỏi ------------------------------ */
function QuestionStat({ q, index }) {
  const Icon = TYPE_META[q.type]?.icon;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium text-slate-800">
          <span className="mr-1 text-slate-400">{index}.</span>{q.label}
          {!q.isActive && <Badge className="ml-2">Đã gỡ khỏi biểu mẫu</Badge>}
        </p>
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">{Icon && <Icon className="h-3.5 w-3.5" />} {q.answered} trả lời</span>
      </div>

      {q.kind === "choice" && (() => {
        const total = q.type === "multiple_choice" ? q.answered : q.options.reduce((a, o) => a + o.count, 0);
        const max = Math.max(1, ...q.options.map((o) => o.count));
        return (
          <div className="space-y-2.5">
            {q.options.map((o) => (
              <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="truncate text-sm text-slate-700">{o.label}</span>
                <span className="text-right text-sm text-slate-500">{o.count} · <b className="text-slate-800">{total ? fmtPercent(o.count / total) : "0%"}</b></span>
                <div className="col-span-2"><Bar value={o.count} max={max} /></div>
              </div>
            ))}
            {q.type === "multiple_choice" && <p className="text-xs text-slate-400">Chọn nhiều — tỷ lệ tính trên số người trả lời, tổng có thể vượt 100%.</p>}
            {q.otherTexts?.length > 0 && (
              <details className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <summary className="cursor-pointer text-slate-600">Nội dung "Khác" ({q.otherTexts.length})</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">{q.otherTexts.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </details>
            )}
          </div>
        );
      })()}

      {q.kind === "number" && (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Tổng", q.sum], ["Trung bình", q.avg], ["Thấp nhất", q.min], ["Cao nhất", q.max]].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs text-slate-500">{k}</p>
                <p className="font-semibold text-slate-800">{v === null ? "—" : `${fmtNumber(v, 1)}${q.unit ? ` ${q.unit}` : ""}`}</p>
              </div>
            ))}
          </div>
          {q.distribution && (
            <div className="mt-4 flex h-28 items-end gap-2">
              {(() => {
                const max = Math.max(1, ...q.distribution.map((d) => d.count));
                return q.distribution.map((d) => (
                  <div key={d.value} className="flex h-full flex-1 flex-col items-center justify-end">
                    <span className="text-[11px] text-slate-500">{d.count}</span>
                    <div className="w-full rounded-t bg-amber-400" style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }} />
                    <span className="mt-1 text-xs text-slate-600">{d.value}{q.type === "rating" ? "★" : ""}</span>
                  </div>
                ));
              })()}
            </div>
          )}
          {(q.minLabel || q.maxLabel) && (
            <div className="mt-1 flex justify-between text-xs text-slate-400"><span>{q.minLabel}</span><span>{q.maxLabel}</span></div>
          )}
        </div>
      )}

      {q.kind === "text" && (
        q.samples.length === 0 ? <p className="text-sm text-slate-400">Chưa có câu trả lời.</p> : (
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-lg bg-slate-50">
            {q.samples.map((s, i) => (
              <li key={i} className="px-3 py-2 text-sm">
                <p className="whitespace-pre-line text-slate-800">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.fullName} · {s.departmentName || "—"}</p>
              </li>
            ))}
            {q.answered > q.samples.length && <li className="px-3 py-2 text-xs text-slate-400">… xem đủ {q.answered} câu trả lời trong file Excel</li>}
          </ul>
        )
      )}
    </div>
  );
}

/* ------------------------------ Danh sách phiếu ------------------------------ */
function ResponsesTab({ formId, departments, onChanged }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");
  const [detail, setDetail] = useState(null);
  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      setData(await fmApi.responses(formId, { page, pageSize, search: search.trim() || undefined, departmentId: dept || undefined }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }, [formId, page, search, dept]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const remove = async (r) => {
    const ok = await confirmDialog({ title: "Xoá phiếu", message: `Xoá phiếu của ${r.fullName || "nhân viên này"}? Không hoàn tác được.`, confirmText: "Xoá", danger: true });
    if (!ok) return;
    try {
      await fmApi.removeResponse(r.responseId);
      toast.success("Đã xoá phiếu");
      setDetail(null);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const preview = data?.questions.slice(0, 3) || [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={cn(inputCls, "pl-9")} placeholder="Tìm theo tên / MSNV" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className={cn(inputCls, "w-auto")} value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }}>
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {!data ? <Spinner /> : data.rows.length === 0 ? (
        <EmptyState icon={Inbox} title="Chưa có phiếu nào" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Nhân viên</th>
                <th className="px-3 py-2">Phòng ban / Tổ · Chức danh</th>
                {preview.map((q) => <th key={q.questionId} className="max-w-[180px] truncate px-3 py-2" title={q.label}>{q.label}</th>)}
                <th className="px-3 py-2">Nộp lúc</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.rows.map((r) => (
                <tr key={r.responseId} className="hover:bg-slate-50">
                  <td className="px-3 py-2"><p className="font-medium text-slate-800">{r.fullName}</p><p className="text-xs text-slate-400">{r.msnv}</p></td>
                  <td className="px-3 py-2 text-slate-600"><p>{r.departmentName || "—"}</p><p className="text-xs text-slate-400">{[r.teamName, r.jobTitleName].filter(Boolean).join(" · ")}</p></td>
                  {preview.map((q) => <td key={q.questionId} className="max-w-[180px] truncate px-3 py-2 text-slate-700" title={r.answers[q.questionId]?.display}>{r.answers[q.questionId]?.display || "—"}</td>)}
                  <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                    {fmtDateTime(r.submittedAt)}
                    {r.editCount > 0 && <p className="text-xs text-amber-600">sửa {r.editCount} lần</p>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <IconButton icon={Eye} title="Xem chi tiết" onClick={() => setDetail(r)} />
                      <IconButton icon={Trash2} title="Xoá phiếu" danger onClick={() => remove(r)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > pageSize && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{data.total} phiếu</span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
            <span>{page}/{pages}</span>
            <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Chi tiết phiếu" size="lg"
        footer={detail && <Button variant="danger" icon={Trash2} onClick={() => remove(detail)}>Xoá phiếu</Button>}>
        {detail && (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm sm:grid-cols-5">
              {[["Họ tên", detail.fullName], ["MSNV", detail.msnv], ["Phòng ban", detail.departmentName], ["Tổ", detail.teamName], ["Chức danh", detail.jobTitleName]].map(([k, v]) => (
                <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="font-medium text-slate-800">{v || "—"}</dd></div>
              ))}
            </dl>
            <p className="text-xs text-slate-500">Nộp {fmtDateTime(detail.submittedAt)}{detail.updatedAt ? ` · sửa lần cuối ${fmtDateTime(detail.updatedAt)}` : ""}</p>
            <ol className="space-y-3">
              {data.questions.map((q, i) => (
                <li key={q.questionId} className="border-b border-slate-100 pb-3 last:border-0">
                  <p className="text-sm font-medium text-slate-600">{i + 1}. {q.label}</p>
                  <p className="mt-1 whitespace-pre-line text-slate-800">{detail.answers[q.questionId]?.display || <span className="italic text-slate-400">(không trả lời)</span>}</p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* -------------------------------- Chưa nộp -------------------------------- */
function MissingTab({ formId, form }) {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    fmApi.missing(formId).then(setRows).catch((e) => toast.error(errorMessage(e)));
  }, [formId]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows || []).filter((r) => !q || `${r.fullName} ${r.msnv} ${r.departmentName} ${r.teamName}`.toLowerCase().includes(q));
  }, [rows, search]);

  if (!rows) return <Spinner />;
  if (rows.length === 0) return <EmptyState icon={UserX} title="Tất cả mọi người đã nộp 🎉" />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={cn(inputCls, "pl-9")} placeholder="Tìm theo tên / MSNV / phòng ban" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="secondary" icon={Download} onClick={() => exportMissingToExcel(form, rows)}>Xuất danh sách</Button>
      </div>
      <p className="text-sm text-slate-500">{rows.length} người thuộc đối tượng chưa nộp</p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2">Nhân viên</th><th className="px-3 py-2">MSNV</th><th className="px-3 py-2">Phòng ban</th><th className="px-3 py-2">Tổ</th><th className="px-3 py-2">Chức danh</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={r.userId}>
                <td className="px-3 py-2 font-medium text-slate-800">{r.fullName}</td>
                <td className="px-3 py-2 text-slate-500">{r.msnv}</td>
                <td className={cn("px-3 py-2", r.departmentName ? "text-slate-600" : "italic text-amber-700")}>{r.departmentName || "Chưa có"}</td>
                <td className="px-3 py-2 text-slate-600">{r.teamName || "—"}</td>
                <td className="px-3 py-2 text-slate-600">{r.jobTitleName || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------- Trang chính -------------------------------- */
export default function FormResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [dept, setDept] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [perDept, setPerDept] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [departments, setDepartments] = useState([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      setStats(await fmApi.stats(id, { departmentId: dept || undefined }));
    } catch (e) {
      setError(errorMessage(e, "Không tải được kết quả"));
    }
  }, [id, dept]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fmApi.orgList("departments").then((d) => setDepartments(d.filter((x) => x.isActive))).catch(() => {});
  }, []);

  const doExport = async () => {
    setExporting(true);
    try {
      const data = await fmApi.responses(id, { all: 1, departmentId: dept || undefined });
      if (!data.rows.length) { toast.info("Chưa có phiếu để xuất"); return; }
      const deptName = departments.find((d) => String(d.id) === String(dept))?.name;
      exportResponsesToExcel(data, { perDepartment: perDept && !dept, departmentLabel: deptName || "Tất cả phòng ban" });
      setExportOpen(false);
    } catch (e) {
      toast.error(errorMessage(e, "Xuất Excel thất bại"));
    } finally {
      setExporting(false);
    }
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!stats) return <Spinner />;
  const { form } = stats;
  const qStats = stats.questions;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <Link to={config.routes.adminFormList} className="mt-0.5 rounded-md p-1.5 text-slate-500 hover:bg-slate-200" title="Danh sách biểu mẫu">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-800">{form.title}</h1>
          <p className="text-sm text-slate-500">
            {form.audienceType === "all" ? "Tất cả nhân viên" : "Nhóm được chọn"}
            {form.closeAt ? ` · hạn ${fmtDateTime(form.closeAt)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <IconButton icon={RefreshCw} title="Tải lại" onClick={load} />
          <Button variant="secondary" size="sm" icon={Pencil} onClick={() => navigate(`${config.routes.adminFormBuilder}/${id}`)}>Sửa biểu mẫu</Button>
          <Button size="sm" icon={Download} onClick={() => setExportOpen(true)}>Xuất Excel</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-200/60 p-1">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn("shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
              {t.label}
              {t.key === "missing" && stats.summary.targetCount - stats.summary.targetDone > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-xs text-white">{stats.summary.targetCount - stats.summary.targetDone}</span>
              )}
            </button>
          ))}
        </div>
        {(tab === "overview" || tab === "questions") && (
          <select className={cn(inputCls, "w-auto")} value={dept} onChange={(e) => setDept(e.target.value)} title="Lọc số liệu theo phòng ban của người nộp">
            <option value="">Tất cả phòng ban</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {tab === "overview" && <Overview stats={stats} />}
      {tab === "questions" && (
        qStats.length === 0 ? <EmptyState icon={Inbox} title="Biểu mẫu chưa có câu hỏi" /> : (
          <div className="space-y-3">{qStats.map((q, i) => <QuestionStat key={q.questionId} q={q} index={i + 1} />)}</div>
        )
      )}
      {tab === "responses" && <ResponsesTab formId={id} departments={departments} onChanged={load} />}
      {tab === "missing" && <MissingTab formId={id} form={form} />}

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title="Xuất Excel" size="sm"
        footer={<><Button variant="secondary" onClick={() => setExportOpen(false)}>Huỷ</Button><Button icon={Download} loading={exporting} onClick={doExport}>Tải file</Button></>}>
        <div className="space-y-4 text-sm text-slate-600">
          <p>File theo mẫu phiếu tổng hợp của công ty: STT, Phòng ban, Họ tên, MSNV, Chức danh và từng câu hỏi.</p>
          <p>Phạm vi: <b>{dept ? departments.find((d) => String(d.id) === String(dept))?.name : "Tất cả phòng ban"}</b> (đổi bằng bộ lọc phòng ban).</p>
          {!dept && <Toggle label="Thêm mỗi phòng ban 1 sheet" hint="Ngoài sheet Tổng hợp" checked={perDept} onChange={setPerDept} />}
        </div>
      </Modal>
    </div>
  );
}
