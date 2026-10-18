// Quản trị: thiết kế báo cáo theo mẫu đề xuất (/admin/request/report-builder[/:id][?copy=id]).
// Trái: cấu hình (mẫu, kỳ, lọc, nhóm theo, chỉ số, biểu đồ, danh sách, người được xem). Phải: XEM TRƯỚC bằng số liệu thật
// (gọi /reports/preview mỗi khi đổi cấu hình, chờ 600 ms). Luật kiểm tra + tính ở backend report.js.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowDown, ArrowLeft, ArrowUp, BarChart3, Eye, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import config from "~/config";
import { Badge, Button, Field, IconButton, Refreshing, Skeleton, Toggle, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { UserPicker } from "~/pagesRequest/shared/components";
import { isNumericCol } from "~/pagesRequest/shared/fieldTypes";
import { STATUS } from "~/pagesRequest/shared/format";
import { ensureBoot, useRq } from "~/pagesRequest/shared/store";
import ReportResult from "~/pagesRequest/Reports/ReportResult";
import { PeriodPicker, ResultSkeleton } from "~/pagesRequest/Reports/ReportView";
import { AGG_LABEL, BASE_COLUMNS, DIMENSION_LABEL, EMPTY_DEFINITION, GROUP_COLUMN_TYPES, GROUP_FIELD_TYPES, TIME_DIMS } from "~/pagesRequest/Reports/shared";

const R = config.routes;
const STATUS_KEYS = ["pending", "approved", "rejected", "returned", "cancelled"];

/** Các "nguồn" chỉ số chọn được với mẫu hiện tại: [{ value, label, source, field?, column?, numeric }] */
function metricSources(fields) {
  const out = [
    { value: "request", label: "Số đề xuất", source: "request" },
    { value: "duration", label: "Thời gian xử lý (gửi → kết thúc)", source: "duration", numeric: true },
  ];
  for (const f of fields || []) {
    if (f.type === "number" || f.type === "currency") out.push({ value: `field:${f.key}`, label: `${f.label}${f.sumOf ? " (tổng tự tính)" : ""}`, source: "field", field: f.key, numeric: true, group: "Trường của mẫu" });
    if (f.type === "table") {
      out.push({ value: `rows:${f.key}`, label: `Số dòng của bảng "${f.label}"`, source: "rows", field: f.key, group: "Bảng" });
      for (const c of f.columns || []) if (isNumericCol(c)) out.push({ value: `column:${f.key}:${c.key}`, label: `Cột "${c.label}" (bảng ${f.label})`, source: "column", field: f.key, column: c.key, numeric: true, group: "Bảng" });
    }
  }
  return out;
}
const sourceValue = (m) => (m.source === "field" ? `field:${m.field}` : m.source === "rows" ? `rows:${m.field}` : m.source === "column" ? `column:${m.field}:${m.column}` : m.source);

function autoLabel(m, sources) {
  const s = sources.find((x) => x.value === sourceValue(m));
  if (!s) return "";
  const base = s.source === "request" ? "Số đề xuất" : s.source === "rows" ? s.label : s.source === "duration" ? `${AGG_LABEL[m.agg]} thời gian xử lý` : `${AGG_LABEL[m.agg]} ${s.label.replace(/ \(tổng tự tính\)$/, "").replace(/^Cột "(.+)" \(bảng .+\)$/, "$1")}`;
  const st = m.statuses?.length ? ` (${m.statuses.map((x) => STATUS[x]?.label.toLowerCase()).join(", ")})` : "";
  return `${base}${st}`.slice(0, 150);
}

/** Cách nhóm chọn được: [{ value, label, group }] */
function groupOptions(fields, typeId) {
  const out = Object.entries(DIMENSION_LABEL).filter(([k]) => k !== "type" || !typeId).map(([k, l]) => ({ value: k, label: l, group: TIME_DIMS.includes(k) ? "Thời gian" : "Chung" }));
  for (const f of fields || []) {
    if (GROUP_FIELD_TYPES.includes(f.type) && !f.wordsOf) out.push({ value: `field:${f.key}`, label: f.label, group: "Trường của mẫu" });
    if (f.type === "table") for (const c of f.columns || []) if (GROUP_COLUMN_TYPES.includes(c.type)) out.push({ value: `column:${f.key}:${c.key}`, label: `${c.label} (bảng ${f.label})`, group: "Từng dòng của bảng" });
  }
  return out;
}
const groupValue = (g) => (g.by === "field" ? `field:${g.field}` : g.by === "column" ? `column:${g.field}:${g.column}` : g.by);
function parseGroup(v) {
  const [by, field, column] = v.split(":");
  return by === "field" ? { by, field } : by === "column" ? { by, field, column } : { by };
}

/** Chỉ số gợi ý theo mẫu: số đề xuất, đã duyệt, tổng tiền (mọi trạng thái + đã duyệt), thời gian xử lý TB */
function suggested(fields) {
  const out = [
    { source: "request", agg: "count", label: "Số đề xuất" },
    { source: "request", agg: "count", statuses: ["approved"], label: "Đã duyệt" },
    { source: "request", agg: "count", statuses: ["pending"], label: "Đang chờ duyệt" },
  ];
  const money = (fields || []).find((f) => f.type === "currency" && f.sumOf) || (fields || []).find((f) => f.type === "currency");
  if (money) {
    out.push({ source: "field", field: money.key, agg: "sum", label: /^tổng/i.test(money.label) ? money.label : `Tổng ${money.label.toLowerCase()}` });
    out.push({ source: "field", field: money.key, agg: "sum", statuses: ["approved"], label: `${money.label} đã duyệt` });
  }
  out.push({ source: "duration", agg: "avg", label: "Thời gian duyệt TB" });
  return out;
}

const Section = ({ title, hint, children, right }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="mb-3 flex items-start gap-2">
      <div className="min-w-0 flex-1"><h3 className="font-semibold text-slate-800">{title}</h3>{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
      {right}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

function Chips({ options, value, onChange, small }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([k, l]) => {
        const on = value.includes(k);
        return (
          <button key={k} type="button" onClick={() => onChange(on ? value.filter((x) => x !== k) : [...value, k])}
            className={cn("rounded-full border px-2.5 py-0.5", small ? "text-[11px]" : "text-xs", on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-600 hover:border-blue-400")}>{l}</button>
        );
      })}
    </div>
  );
}

let mseq = 0;
function newKey(metrics) {
  const used = new Set(metrics.map((m) => m.key));
  let k = `m${Date.now().toString(36).slice(-3)}${(mseq++).toString(36)}`;
  while (used.has(k)) k = `m${Date.now().toString(36).slice(-3)}${(mseq++).toString(36)}`;
  return k;
}

export default function ReportBuilder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dir = useRq((s) => s.dir);
  const isNew = !id;
  const [rep, setRep] = useState(null); // { name, description, typeId, viewerIds, definition }
  const [types, setTypes] = useState([]);
  const [fields, setFields] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [preview, setPreview] = useState({ loading: false, result: null, error: null });
  const [range, setRange] = useState(null); // kỳ xem thử (null = kỳ mặc định của thiết kế)
  const seq = useRef(0);
  const typeCache = useRef(new Map());

  const loadFields = useCallback(async (typeId) => {
    if (!typeId) return [];
    if (!typeCache.current.has(typeId)) typeCache.current.set(typeId, (await rqApi.type(typeId)).fields || []);
    return typeCache.current.get(typeId);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await rqApi.types();
        if (!alive) return;
        setTypes(list);
        const srcId = isNew ? Number(params.get("copy")) || null : id;
        if (srcId) {
          const src = await rqApi.report(srcId);
          const f = src.type?.fields || [];
          if (src.typeId) typeCache.current.set(src.typeId, f);
          if (!alive) return;
          setFields(f);
          setRep({ name: isNew ? `${src.name} (bản sao)`.slice(0, 200) : src.name, description: src.description || "", typeId: src.typeId, viewerIds: src.viewerIds || [], definition: { ...EMPTY_DEFINITION, ...src.definition } });
          setDirty(isNew);
        } else {
          const first = list.find((t) => t.isActive) || null;
          const f = first ? await loadFields(first.typeId) : [];
          if (!alive) return;
          setFields(f);
          setRep({ name: first ? `Báo cáo ${first.name}` : "Báo cáo đề xuất", description: "", typeId: first?.typeId || null, viewerIds: [], definition: { ...EMPTY_DEFINITION, metrics: suggested(f).map((m, i) => ({ ...m, key: `m${i + 1}` })), chart: { type: "bar", metric: "m1" } } });
          setDirty(true);
        }
      } catch (e) {
        if (alive) setLoadError(errorMessage(e, "Không tải được thiết kế báo cáo"));
      }
    })();
    return () => { alive = false; };
  }, [id, isNew, params, loadFields]);

  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const def = rep?.definition;
  const update = (patch) => { setRep((r) => ({ ...r, ...patch })); setDirty(true); };
  const setDef = (patch) => { setRep((r) => ({ ...r, definition: { ...r.definition, ...patch } })); setDirty(true); };
  const sources = useMemo(() => metricSources(fields), [fields]);
  const groups = useMemo(() => groupOptions(fields, rep?.typeId), [fields, rep?.typeId]);

  // xem trước: chạy lại 600 ms sau lần sửa cuối (mẫu / thiết kế / kỳ xem thử), chỉ nhận kết quả của lần gọi mới nhất
  const typeId = rep?.typeId ?? null;
  const definition = rep?.definition;
  useEffect(() => {
    if (!definition) return undefined;
    const my = ++seq.current;
    setPreview((p) => ({ ...p, loading: true }));
    const t = setTimeout(async () => {
      try {
        const result = await rqApi.previewReport({ typeId, definition, range: range || undefined }, { silent: true });
        if (my === seq.current) setPreview({ loading: false, result, error: null });
      } catch (e) {
        if (my === seq.current) setPreview((p) => ({ loading: false, result: p.result, error: errorMessage(e, "Không xem trước được") }));
      }
    }, 600);
    return () => clearTimeout(t);
  }, [typeId, definition, range]);

  const changeType = async (typeId) => {
    const f = await loadFields(typeId).catch(() => []);
    setFields(f);
    const keep = (m) => m.source === "request" || m.source === "duration";
    setRep((r) => {
      const metrics = r.definition.metrics.filter(keep);
      const by = r.definition.groupBy.by;
      return {
        ...r, typeId,
        name: r.name.startsWith("Báo cáo ") || !r.name ? `Báo cáo ${types.find((t) => t.typeId === typeId)?.name || "đề xuất"}` : r.name,
        definition: {
          ...r.definition,
          metrics: metrics.length ? metrics : [{ key: "m1", label: "Số đề xuất", source: "request", agg: "count" }],
          groupBy: by === "field" || by === "column" || (by === "type" && typeId) ? { by: "status" } : r.definition.groupBy,
          list: { ...r.definition.list, columns: r.definition.list.columns.filter((c) => !c.startsWith("f:")) },
        },
      };
    });
    setDirty(true);
  };

  const setMetric = (i, patch) => {
    const metrics = def.metrics.map((m, j) => {
      if (j !== i) return m;
      const next = { ...m, ...patch };
      // tên đang là tên tự đặt (hoặc trống) → đặt lại theo lựa chọn mới
      if (!("label" in patch) && (!m.label || m.label === autoLabel(m, sources))) next.label = autoLabel(next, sources);
      return next;
    });
    setDef({ metrics });
  };
  const pickSource = (i, value) => {
    const s = sources.find((x) => x.value === value);
    const cur = def.metrics[i];
    setMetric(i, { source: s.source, field: s.field, column: s.column, agg: s.source === "request" || s.source === "rows" ? "count" : ["sum", "avg", "min", "max"].includes(cur.agg) ? cur.agg : s.source === "duration" ? "avg" : "sum" });
  };
  const addMetric = (m) => {
    const key = newKey(def.metrics);
    const metric = m ? { ...m, key } : { key, source: "request", agg: "count", label: "Số đề xuất" };
    setDef({ metrics: [...def.metrics, metric].slice(0, 12) });
  };
  const removeMetric = (i) => {
    const metrics = def.metrics.filter((_, j) => j !== i);
    const gone = def.metrics[i].key;
    setDef({ metrics, chart: def.chart.metric === gone ? { ...def.chart, metric: metrics[0]?.key } : def.chart, sort: def.sort.by === gone ? { by: "label", dir: "asc" } : def.sort });
  };
  const moveMetric = (i, d) => {
    const metrics = [...def.metrics];
    [metrics[i], metrics[i + d]] = [metrics[i + d], metrics[i]];
    setDef({ metrics });
  };
  const addSuggested = () => {
    const have = new Set(def.metrics.map((m) => `${sourceValue(m)}|${m.agg}|${(m.statuses || []).join()}`));
    const add = suggested(fields).filter((m) => !have.has(`${sourceValue(m)}|${m.agg}|${(m.statuses || []).join()}`));
    if (!add.length) return toast.info("Đã có đủ chỉ số gợi ý");
    const metrics = [...def.metrics];
    for (const m of add) metrics.push({ ...m, key: newKey(metrics) });
    setDef({ metrics: metrics.slice(0, 12) });
  };

  const save = useCallback(async () => {
    if (!rep || saving) return;
    if (!rep.name.trim()) return toast.error("Chưa nhập tên báo cáo");
    if (!rep.definition.metrics.length) return toast.error("Cần ít nhất 1 chỉ số");
    setSaving(true);
    try {
      const saved = isNew ? await rqApi.createReport(rep) : await rqApi.updateReport(id, rep);
      setRep((r) => ({ ...r, definition: { ...EMPTY_DEFINITION, ...saved.definition } }));
      setDirty(false);
      ensureBoot(true).catch(() => {});
      toast.success(isNew ? "Đã tạo báo cáo" : "Đã lưu");
      if (isNew) navigate(`${R.adminRequestReportBuilder}/${saved.reportId}`, { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  }, [rep, saving, isNew, id, navigate]);

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  if (loadError) return <div className="p-6 text-center text-sm text-red-600">{loadError}</div>;
  if (!rep) return <div className="space-y-4 p-6" role="status" aria-label="Đang tải"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-64 w-full" /></div>;

  const fieldCols = fields.filter((f) => !["section", "files"].includes(f.type)).map((f) => [`f:${f.key}`, f.label]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:px-5">
        <Link to={R.requestReports} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Danh sách báo cáo"><ArrowLeft className="h-5 w-5" /></Link>
        <BarChart3 className="h-5 w-5 text-blue-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-800">{rep.name || "Báo cáo mới"}</p>
          <div className="flex items-center gap-2 text-xs">{isNew ? <Badge tone="blue">Chưa lưu</Badge> : dirty ? <span className="text-amber-600">● Có thay đổi chưa lưu</span> : <span className="text-slate-400">Đã lưu</span>}</div>
        </div>
        {!isNew && <Button variant="secondary" icon={Eye} onClick={() => navigate(`${R.requestReports}/${id}`)}>Xem</Button>}
        <Button icon={Save} loading={saving} disabled={!dirty && !isNew} onClick={save} title="Ctrl+S">{isNew ? "Tạo báo cáo" : "Lưu"}</Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto xl:flex xl:overflow-hidden">
        {/* CẤU HÌNH */}
        <div className="space-y-4 p-3 pb-6 lg:p-5 xl:w-[440px] xl:shrink-0 xl:overflow-y-auto xl:border-r xl:border-slate-200 2xl:w-[480px]">
          <Section title="1. Thông tin">
            <Field label="Tên báo cáo" required><input className={inputCls} value={rep.name} maxLength={200} onChange={(e) => update({ name: e.target.value })} placeholder="VD: Tạm ứng theo phòng ban" /></Field>
            <Field label="Mô tả"><input className={inputCls} value={rep.description} maxLength={1000} onChange={(e) => update({ description: e.target.value })} placeholder="Không bắt buộc" /></Field>
            <Field label="Mẫu đề xuất" hint="Chọn mẫu để dùng được trường thông tin của mẫu (số tiền, bảng chi tiết, lựa chọn…) làm chỉ số hoặc cách nhóm">
              <select className={inputCls} value={rep.typeId || ""} onChange={(e) => changeType(Number(e.target.value) || null)} aria-label="Mẫu đề xuất">
                <option value="">— Mọi mẫu đề xuất —</option>
                {types.map((t) => <option key={t.typeId} value={t.typeId}>{t.name}{t.isActive ? "" : " (đã tắt)"}</option>)}
              </select>
            </Field>
          </Section>

          <Section title="2. Lấy đề xuất nào" hint="Người xem đổi được kỳ khi xem báo cáo">
            <Field label="Kỳ mặc định"><PeriodPicker value={{ period: def.period, from: def.from, to: def.to }} onChange={(v) => setDef({ period: v.period, from: v.from || null, to: v.to || null })} /></Field>
            <Field label="Tính theo ngày">
              <div className="flex gap-2">
                {[["created", "Ngày gửi"], ["finished", "Ngày kết thúc (duyệt xong / từ chối / huỷ)"]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setDef({ dateBasis: k })} className={cn("flex-1 rounded-lg border px-2 py-1.5 text-xs", def.dateBasis === k ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-slate-300 text-slate-600")}>{l}</button>
                ))}
              </div>
            </Field>
            <Field label="Trạng thái" hint="Không chọn = mọi trạng thái"><Chips options={STATUS_KEYS.map((k) => [k, STATUS[k].label])} value={def.statuses} onChange={(statuses) => setDef({ statuses })} /></Field>
            <Field label="Phòng ban người gửi" hint="Không chọn = mọi phòng ban"><Chips small options={(dir?.departments || []).map((d) => [d.id, d.name])} value={def.departmentIds} onChange={(departmentIds) => setDef({ departmentIds })} /></Field>
            <Toggle label="Chỉ đề xuất Gấp" checked={def.priority === "high"} onChange={(v) => setDef({ priority: v ? "high" : null })} />
          </Section>

          <Section title="3. Nhóm theo" hint="Mỗi nhóm là 1 dòng của bảng và 1 cột/ô của biểu đồ">
            <select className={inputCls} value={groupValue(def.groupBy)} aria-label="Nhóm theo"
              onChange={(e) => { const g = parseGroup(e.target.value); setDef({ groupBy: g, chart: { ...def.chart, type: g.by === "none" ? "none" : TIME_DIMS.includes(g.by) ? "line" : def.chart.type === "none" || def.chart.type === "line" ? "bar" : def.chart.type }, sort: TIME_DIMS.includes(g.by) || g.by === "status" ? { by: "label", dir: "asc" } : { by: def.metrics[0]?.key || "label", dir: "desc" } }); }}>
              {["Chung", "Thời gian", "Trường của mẫu", "Từng dòng của bảng"].map((grp) => {
                const opts = groups.filter((o) => o.group === grp);
                return opts.length ? <optgroup key={grp} label={grp}>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup> : null;
              })}
            </select>
            {def.groupBy.by === "column" && <p className="text-xs text-slate-500">Mỗi dòng của bảng chi tiết được xếp vào nhóm theo giá trị cột này (vd. tổng tiền theo từng mặt hàng). Chỉ số cột của cùng bảng chỉ tính các dòng trong nhóm.</p>}
          </Section>

          <Section title="4. Chỉ số" hint="Mỗi chỉ số là 1 cột số liệu + 1 thẻ tổng ở đầu báo cáo"
            right={<button type="button" onClick={addSuggested} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50" title="Thêm các chỉ số hay dùng"><Sparkles className="h-3.5 w-3.5" /> Gợi ý</button>}>
            {def.metrics.map((m, i) => {
              const s = sources.find((x) => x.value === sourceValue(m));
              return (
                <div key={m.key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3" data-metric={i}>
                  <div className="flex items-center gap-1">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">{i + 1}</span>
                    <input className={cn(inputCls, "py-1.5 font-medium")} value={m.label} maxLength={150} aria-label="Tên chỉ số" onChange={(e) => setMetric(i, { label: e.target.value })} />
                    <IconButton icon={ArrowUp} title="Lên" disabled={i === 0} onClick={() => moveMetric(i, -1)} />
                    <IconButton icon={ArrowDown} title="Xuống" disabled={i === def.metrics.length - 1} onClick={() => moveMetric(i, 1)} />
                    <IconButton icon={Trash2} title="Bỏ chỉ số" danger disabled={def.metrics.length === 1} onClick={() => removeMetric(i)} />
                  </div>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <select className={cn(inputCls, "py-1.5")} value={s ? s.value : ""} onChange={(e) => pickSource(i, e.target.value)} aria-label="Tính gì">
                      {!s && <option value="">(trường không còn trong mẫu)</option>}
                      {["", "Trường của mẫu", "Bảng"].map((grp) => {
                        const opts = sources.filter((x) => (x.group || "") === grp);
                        if (!opts.length) return null;
                        const els = opts.map((x) => <option key={x.value} value={x.value}>{x.label}</option>);
                        return grp ? <optgroup key={grp} label={grp}>{els}</optgroup> : els;
                      })}
                    </select>
                    {s?.numeric ? (
                      <select className={cn(inputCls, "w-auto py-1.5")} value={m.agg} onChange={(e) => setMetric(i, { agg: e.target.value })} aria-label="Cách tính">
                        {["sum", "avg", "min", "max"].map((a) => <option key={a} value={a}>{AGG_LABEL[a]}</option>)}
                      </select>
                    ) : <span className="self-center px-2 text-xs text-slate-400">đếm</span>}
                  </div>
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] text-slate-500">Chỉ tính đề xuất đang (không chọn = theo bộ lọc ở mục 2):</p>
                    <Chips small options={STATUS_KEYS.map((k) => [k, STATUS[k].label])} value={m.statuses || []} onChange={(statuses) => setMetric(i, { statuses })} />
                  </div>
                </div>
              );
            })}
            <button type="button" onClick={() => addMetric()} disabled={def.metrics.length >= 12}
              className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40">
              <Plus className="h-4 w-4" /> Thêm chỉ số
            </button>
          </Section>

          <Section title="5. Hiển thị">
            <Field label="Biểu đồ">
              <div className="flex flex-wrap gap-1.5">
                {[["bar", "Cột"], ["line", "Đường"], ["pie", "Tròn"], ["none", "Không"]].map(([k, l]) => (
                  <button key={k} type="button" disabled={def.groupBy.by === "none" && k !== "none"} onClick={() => setDef({ chart: { ...def.chart, type: k } })}
                    className={cn("rounded-lg border px-3 py-1 text-xs disabled:opacity-40", def.chart.type === k ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-slate-300 text-slate-600")}>{l}</button>
                ))}
              </div>
            </Field>
            {def.chart.type !== "none" && (
              <Field label="Vẽ chỉ số">
                <select className={inputCls} value={def.chart.metric} onChange={(e) => setDef({ chart: { ...def.chart, metric: e.target.value } })} aria-label="Chỉ số vẽ biểu đồ">
                  {def.metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Field label="Sắp xếp nhóm theo">
                <select className={inputCls} value={def.sort.by} onChange={(e) => setDef({ sort: { ...def.sort, by: e.target.value } })} aria-label="Sắp xếp theo">
                  <option value="label">Tên nhóm / thời gian</option>
                  {def.metrics.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </Field>
              <Field label="Chiều">
                <select className={inputCls} value={def.sort.dir} onChange={(e) => setDef({ sort: { ...def.sort, dir: e.target.value } })} aria-label="Chiều sắp xếp">
                  <option value="asc">Tăng dần</option><option value="desc">Giảm dần</option>
                </select>
              </Field>
            </div>
            <Field label="Chỉ hiện nhiều nhất" hint="0 = mọi nhóm. Các nhóm còn lại gộp thành 1 dòng “Khác”">
              <input type="number" min={0} max={100} className={cn(inputCls, "w-28")} value={def.limit} onChange={(e) => setDef({ limit: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
            </Field>
          </Section>

          <Section title="6. Danh sách đề xuất" right={<Toggle checked={def.list.show} onChange={(v) => setDef({ list: { ...def.list, show: v } })} />}>
            {def.list.show ? (
              <>
                <p className="text-xs text-slate-500">Cột hiện trong danh sách (theo thứ tự bấm chọn):</p>
                <Chips small options={BASE_COLUMNS} value={def.list.columns} onChange={(columns) => setDef({ list: { ...def.list, columns } })} />
                {fieldCols.length > 0 && <><p className="text-xs text-slate-500">Trường của mẫu:</p><Chips small options={fieldCols} value={def.list.columns} onChange={(columns) => setDef({ list: { ...def.list, columns } })} /></>}
              </>
            ) : <p className="text-xs text-slate-400">Chỉ hiện số liệu tổng hợp.</p>}
          </Section>

          <Section title="7. Ai được xem" hint="Quản trị viên module luôn xem được. Người được chọn thấy mục Báo cáo ở menu trái (chỉ xem, không sửa) — kể cả số liệu đề xuất họ không tham gia">
            <UserPicker value={rep.viewerIds} onChange={(viewerIds) => update({ viewerIds })} placeholder="Chọn người được xem…" />
          </Section>
        </div>

        {/* XEM TRƯỚC */}
        <div className="min-w-0 flex-1 bg-slate-50 p-3 lg:p-5 xl:overflow-y-auto" data-report-preview>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="flex-1 text-sm font-semibold text-slate-500">Xem trước — số liệu thật</h2>
            <span className="text-xs text-slate-400">Xem thử kỳ khác:</span>
            <PeriodPicker value={range || { period: def.period, from: def.from, to: def.to }} onChange={setRange} />
          </div>
          {preview.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{preview.error}</p>}
          {!preview.result ? <ResultSkeleton /> : (
            <Refreshing active={preview.loading}>
              <ReportResult result={preview.result} definition={def} fields={fields} />
            </Refreshing>
          )}
        </div>
      </div>
    </div>
  );
}
