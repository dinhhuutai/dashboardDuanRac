// Kết quả 1 báo cáo: thẻ tổng của từng chỉ số, biểu đồ, bảng theo nhóm (+ dòng tổng), danh sách đề xuất, xuất Excel.
// Dùng chung cho trang xem báo cáo và khung xem trước của trang thiết kế.
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import config from "~/config";
import { cn } from "~/pagesForm/shared/ui";
import { StatusBadge } from "../shared/components";
import { displayValue } from "../shared/fieldTypes";
import { userName } from "../shared/store";
import { fmtDateTime } from "../shared/format";
import { BASE_COLUMN_LABEL, CHART_COLORS, compact, fmtMetric, groupByText, rangeText } from "./shared";

const R = config.routes;

/** Có chỉ số "Số đề xuất" (không lọc trạng thái) → bỏ cột số đề xuất mặc định của bảng cho khỏi trùng */
const hasPlainCount = (metrics) => metrics.some((m) => m.source === "request" && !m.statuses?.length);
/** Tên cách nhóm trong câu "… theo <nhóm>": chiều chung viết thường, tên trường giữ nguyên */
const groupPhrase = (g, fields) => (g.by === "field" || g.by === "column" ? groupByText(g, fields) : groupByText(g, fields).toLowerCase());

function Kpis({ result }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
      {result.metrics.map((m, i) => (
        <div key={m.key} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4" data-kpi={m.key}>
          <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="truncate" title={m.label}>{m.label}</span>
          </p>
          <p className={cn("mt-1 break-words font-bold tabular-nums text-slate-900", fmtMetric(m, result.totals[m.key]).length > 11 ? "text-xl" : "text-2xl")}>{fmtMetric(m, result.totals[m.key])}</p>
          {m.statuses?.length > 0 && <p className="mt-0.5 truncate text-[11px] text-slate-400">chỉ tính: {m.statuses.map((s) => ({ pending: "chờ duyệt", approved: "đã duyệt", rejected: "từ chối", returned: "cần bổ sung", cancelled: "đã huỷ" })[s]).join(", ")}</p>}
        </div>
      ))}
    </div>
  );
}

function Chart({ result, chart }) {
  const m = result.metrics.find((x) => x.key === chart.metric) || result.metrics[0];
  const data = result.groups.map((g) => ({ name: g.label, value: g.values[m.key] ?? 0 }));
  if (!m || chart.type === "none" || result.groupBy.by === "none" || !data.length) return null;
  const tip = (v) => [fmtMetric(m, v), m.label];
  const short = (s) => (String(s).length > 18 ? `${String(s).slice(0, 17)}…` : s);
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{m.label} <span className="font-normal text-slate-400">theo {groupPhrase(result.groupBy, result.__fields)}</span></h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "pie" ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="80%" paddingAngle={1} label={({ name, percent }) => `${short(name)} ${(percent * 100).toFixed(0)}%`} isAnimationActive={false}>
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={tip} />
            </PieChart>
          ) : chart.type === "line" ? (
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={short} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={compact} width={56} allowDecimals={m.format !== "int"} />
              <Tooltip formatter={tip} />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={short} interval={0} angle={data.length > 8 ? -30 : 0} textAnchor={data.length > 8 ? "end" : "middle"} height={data.length > 8 ? 70 : 30} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={compact} width={56} allowDecimals={m.format !== "int"} />
              <Tooltip formatter={tip} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {data.map((_, i) => <Cell key={i} fill={result.groupBy.by === "status" ? CHART_COLORS[i % CHART_COLORS.length] : "#2563eb"} />)}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function GroupTable({ result, chartMetric }) {
  const cm = result.metrics.find((m) => m.key === chartMetric) || result.metrics[0];
  const max = Math.max(0, ...result.groups.map((g) => Number(g.values[cm?.key]) || 0));
  if (result.groupBy.by === "none") return null;
  const countCol = !hasPlainCount(result.metrics);
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" data-report-groups>
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <th className="px-4 py-2.5">{groupByText(result.groupBy, result.__fields)}</th>
              {countCol && <th className="whitespace-nowrap px-4 py-2.5 text-right">Số đề xuất</th>}
              {result.metrics.map((m) => <th key={m.key} className="whitespace-nowrap px-4 py-2.5 text-right">{m.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.groups.length === 0 && <tr><td colSpan={2 + result.metrics.length} className="px-4 py-8 text-center text-slate-400">Không có đề xuất nào trong kỳ này</td></tr>}
            {result.groups.map((g) => (
              <tr key={g.key} className="border-t border-slate-100 hover:bg-slate-50/60">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-slate-800">{g.label}</p>
                  {max > 0 && cm && <div className="mt-1 h-1.5 max-w-[240px] overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(2, ((Number(g.values[cm.key]) || 0) / max) * 100)}%` }} /></div>}
                </td>
                {countCol && <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-slate-500">{g.requests.toLocaleString("vi-VN")}</td>}
                {result.metrics.map((m) => <td key={m.key} className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">{fmtMetric(m, g.values[m.key])}</td>)}
              </tr>
            ))}
          </tbody>
          {result.groups.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                <td className="px-4 py-2.5">Tổng cộng</td>
                {countCol && <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{result.requestCount.toLocaleString("vi-VN")}</td>}
                {result.metrics.map((m) => <td key={m.key} className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums">{fmtMetric(m, result.totals[m.key])}</td>)}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}

/** 1 ô của danh sách đề xuất */
export function listCell(col, r, fieldByKey) {
  switch (col) {
    case "requestId": return `#${r.requestId}`;
    case "title": return r.title;
    case "type": return r.typeName;
    case "requester": return r.requesterName;
    case "department": return r.departmentName || "";
    case "team": return r.teamName || "";
    case "status": return r.status;
    case "priority": return r.priority === "high" ? "Gấp" : "Bình thường";
    case "createdAt": return fmtDateTime(r.createdAt);
    case "finishedAt": return r.finishedAt ? fmtDateTime(r.finishedAt) : "";
    default: {
      const f = fieldByKey.get(col.slice(2));
      return f ? displayValue(f, r.values?.[f.key], (id) => userName(id)) : "";
    }
  }
}
export const columnLabel = (col, fieldByKey) => BASE_COLUMN_LABEL[col] || fieldByKey.get(col.slice(2))?.label || col;

function RequestRows({ result, columns, fieldByKey, linkRows }) {
  const [open, setOpen] = useState(true);
  if (!result.list) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <h3 className="flex-1 text-sm font-semibold text-slate-700">Danh sách đề xuất <span className="font-normal text-slate-400">({result.listTotal.toLocaleString("vi-VN")}{result.list.length < result.listTotal ? `, hiện ${result.list.length} mới nhất` : ""})</span></h3>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div className="max-h-[560px] overflow-auto border-t border-slate-100">
          <table className="w-full border-collapse text-sm" data-report-list>
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                {columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2">{columnLabel(c, fieldByKey)}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.list.length === 0 && <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400">Không có đề xuất</td></tr>}
              {result.list.map((r) => (
                <tr key={r.requestId} className="border-t border-slate-100 align-top hover:bg-slate-50/60">
                  {columns.map((c) => {
                    const v = listCell(c, r, fieldByKey);
                    if (c === "status") return <td key={c} className="px-3 py-2"><StatusBadge status={r.status} /></td>;
                    if (c === "title" || c === "requestId") {
                      return (
                        <td key={c} className={cn("px-3 py-2", c === "title" ? "min-w-[220px] font-medium text-slate-800" : "whitespace-nowrap text-slate-400")}>
                          {linkRows ? <Link to={`${R.request}?box=all&id=${r.requestId}`} className="hover:text-blue-700 hover:underline">{v}</Link> : v}
                        </td>
                      );
                    }
                    const f = c.startsWith("f:") ? fieldByKey.get(c.slice(2)) : null;
                    const numeric = f && (f.type === "currency" || f.type === "number");
                    return <td key={c} className={cn("px-3 py-2 text-slate-700", numeric ? "whitespace-nowrap text-right font-semibold tabular-nums" : "min-w-[100px]")}>{v}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/**
 * @param result     kết quả API (/reports/:id/run hoặc /reports/preview)
 * @param definition thiết kế (lấy biểu đồ + cột danh sách)
 * @param fields     trường của mẫu đề xuất (định dạng giá trị trong danh sách)
 */
export default function ReportResult({ result, definition, fields, linkRows }) {
  const fieldByKey = useMemo(() => new Map((fields || []).map((f) => [f.key, f])), [fields]);
  const r = useMemo(() => ({ ...result, __fields: fields }), [result, fields]);
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Kỳ: <b className="text-slate-700">{rangeText(result.range)}</b> · {result.requestCount.toLocaleString("vi-VN")} đề xuất{definition?.dateBasis === "finished" ? " (theo ngày kết thúc)" : " (theo ngày gửi)"}</p>
      {result.warnings?.length > 0 && (
        <div className="space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
          {result.warnings.map((w) => <p key={w} className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{w}</p>)}
        </div>
      )}
      <Kpis result={r} />
      <div className={cn("grid gap-4", definition?.chart?.type !== "none" && result.groupBy.by !== "none" && "2xl:grid-cols-2")}>
        <Chart result={r} chart={definition?.chart || { type: "bar", metric: result.metrics[0]?.key }} />
        <GroupTable result={r} chartMetric={definition?.chart?.metric} />
      </div>
      <RequestRows result={result} columns={definition?.list?.columns || []} fieldByKey={fieldByKey} linkRows={linkRows} />
    </div>
  );
}

/** Xuất Excel trên trình duyệt (xlsx-js-style, tải lười): trang "Tổng hợp" + "Danh sách" */
export async function exportReportExcel({ name, result, definition, fields }) {
  const XLSX = await import("xlsx-js-style");
  const fieldByKey = new Map((fields || []).map((f) => [f.key, f]));
  const head = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "1D4ED8" } }, alignment: { vertical: "center", wrapText: true }, border: { bottom: { style: "thin", color: { rgb: "94A3B8" } } } };
  const bold = { font: { bold: true } };
  const numFmt = (m) => (m.format === "money" ? "#,##0" : m.format === "int" ? "#,##0" : "#,##0.##");
  const value = (m, v) => (v === null || v === undefined ? "" : m.format === "hours" ? Math.round(v * 10) / 10 : v);

  const aoa = [[name], [`Kỳ: ${rangeText(result.range)} · ${result.requestCount} đề xuất`], []];
  const countCol = hasPlainCount(result.metrics) ? [] : [null]; // như bảng trên trang: không lặp cột "Số đề xuất"
  const first = 1 + countCol.length; // cột đầu tiên của chỉ số
  const header = [result.groupBy.by === "none" ? "" : groupByText(result.groupBy, fields), ...countCol.map(() => "Số đề xuất"), ...result.metrics.map((m) => (m.format === "hours" ? `${m.label} (giờ)` : m.label))];
  aoa.push(header);
  const rows = result.groupBy.by === "none" ? [] : result.groups;
  for (const g of rows) aoa.push([g.label, ...countCol.map(() => g.requests), ...result.metrics.map((m) => value(m, g.values[m.key]))]);
  aoa.push(["Tổng cộng", ...countCol.map(() => result.requestCount), ...result.metrics.map((m) => value(m, result.totals[m.key]))]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 36 }, ...countCol.map(() => ({ wch: 12 })), ...result.metrics.map(() => ({ wch: 20 }))];
  ws.A1.s = { font: { bold: true, sz: 14 } };
  const hr = 3; // dòng tiêu đề cột (0-based)
  header.forEach((_, c) => { const a = XLSX.utils.encode_cell({ r: hr, c }); if (ws[a]) ws[a].s = head; });
  for (let r = hr + 1; r < aoa.length; r++) {
    result.metrics.forEach((m, i) => { const a = XLSX.utils.encode_cell({ r, c: first + i }); if (ws[a]) ws[a].z = numFmt(m); });
    if (r === aoa.length - 1) header.forEach((_, c) => { const a = XLSX.utils.encode_cell({ r, c }); if (ws[a]) ws[a].s = bold; }); // dòng tổng
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tổng hợp");

  if (result.list?.length) {
    const cols = definition?.list?.columns || [];
    const lh = cols.map((c) => columnLabel(c, fieldByKey));
    const STATUS_VI = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", returned: "Cần bổ sung", cancelled: "Đã huỷ" };
    const la = [lh, ...result.list.map((r) => cols.map((c) => {
      if (c === "status") return STATUS_VI[r.status] || r.status;
      if (c === "requestId") return r.requestId;
      const f = c.startsWith("f:") ? fieldByKey.get(c.slice(2)) : null;
      if (f && (f.type === "currency" || f.type === "number") && typeof r.values?.[f.key] === "number") return r.values[f.key];
      return listCell(c, r, fieldByKey);
    }))];
    const ls = XLSX.utils.aoa_to_sheet(la);
    ls["!cols"] = cols.map((c) => ({ wch: c === "title" ? 40 : c === "requestId" ? 8 : 18 }));
    lh.forEach((_, c) => { const a = XLSX.utils.encode_cell({ r: 0, c }); if (ls[a]) ls[a].s = head; });
    cols.forEach((c, ci) => {
      const f = c.startsWith("f:") ? fieldByKey.get(c.slice(2)) : null;
      if (f?.type === "currency") for (let r = 1; r < la.length; r++) { const a = XLSX.utils.encode_cell({ r, c: ci }); if (ls[a] && typeof ls[a].v === "number") ls[a].z = "#,##0"; }
    });
    XLSX.utils.book_append_sheet(wb, ls, "Danh sách");
  }
  const safe = name.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80) || "bao-cao";
  XLSX.writeFile(wb, `${safe} - ${rangeText(result.range).replace(/\//g, "-")}.xlsx`);
}
