// Sửa danh sách trường của mẫu đề xuất: thêm, sắp xếp, nhân bản, xoá; lựa chọn của trường "Chọn";
// cột của trường "Bảng chi tiết"; trường tự tính (tổng 1 cột của bảng, số tiền bằng chữ)
import { ArrowDown, ArrowUp, Calculator, ChevronDown, Copy, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Field, IconButton, Toggle, cn, inputCls } from "~/pagesForm/shared/ui";
import { COLUMN_TYPES, FIELD_META, FIELD_TYPES, FULL_WIDTH_TYPES, isNumericCol, newColumn, newField, uid } from "~/pagesRequest/shared/fieldTypes";

/** Các cột của trường bảng: tên, loại, tính tổng, cột tự tính = A × B */
function ColumnsEditor({ field, onChange }) {
  const cols = field.columns || [];
  const set = (next) => onChange({ ...field, columns: next });
  const patch = (key, p) => set(cols.map((c) => (c.key === key ? { ...c, ...p } : c)));
  const plain = cols.filter((c) => c.type === "number" || c.type === "currency");
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= cols.length) return; const n = [...cols]; [n[i], n[j]] = [n[j], n[i]]; set(n); };
  const changeType = (c, type) => {
    const next = { key: c.key, label: c.label, type };
    if (type === "formula") next.of = [plain[0]?.key || "", plain[1]?.key || plain[0]?.key || ""];
    if (["number", "currency", "formula"].includes(type) && c.sum) next.sum = true;
    // cột đang được cột tự tính khác dùng mà đổi sang loại không phải số → gỡ khỏi công thức
    set(cols.map((x) => (x.key === c.key ? next : x)));
  };
  return (
    <div className="space-y-1.5">
      {cols.map((c, i) => (
        <div key={c.key} className="rounded-lg border border-slate-200 bg-slate-50/60 p-2">
          <div className="flex items-center gap-1.5">
            <span className="w-5 shrink-0 text-right text-xs text-slate-400">{i + 1}.</span>
            {/* inputCls có sẵn w-full → bọc trong khung để chia chiều rộng (cn không gộp lớp trùng) */}
            <div className="min-w-0 flex-1">
              <input className={cn(inputCls, "py-1.5", !c.label.trim() && "border-red-300")} value={c.label} maxLength={150} placeholder="Tên cột" aria-label={`Tên cột ${i + 1}`}
                onChange={(e) => patch(c.key, { label: e.target.value })} />
            </div>
            <div className="w-32 shrink-0 sm:w-40">
              <select className={cn(inputCls, "py-1.5")} value={c.type} aria-label={`Loại cột ${i + 1}`} onChange={(e) => changeType(c, e.target.value)}>
                {COLUMN_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>
            <IconButton icon={ArrowUp} title="Lên" disabled={i === 0} onClick={() => move(i, -1)} />
            <IconButton icon={ArrowDown} title="Xuống" disabled={i === cols.length - 1} onClick={() => move(i, 1)} />
            <IconButton icon={X} title="Xoá cột" danger disabled={cols.length <= 1} onClick={() => set(cols.filter((x) => x.key !== c.key))} />
          </div>
          {(isNumericCol(c)) && (
            <div className="ml-6 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
              {c.type === "formula" && (
                <span className="inline-flex flex-wrap items-center gap-1">
                  <Calculator className="h-3.5 w-3.5 text-slate-400" /> =
                  <span className="inline-block w-32">
                    <select className={cn(inputCls, "py-1 text-xs")} value={c.of?.[0] || ""} aria-label="Cột nhân thứ nhất" onChange={(e) => patch(c.key, { of: [e.target.value, c.of?.[1] || ""] })}>
                      <option value="">— cột số —</option>
                      {plain.map((p) => <option key={p.key} value={p.key}>{p.label || "(chưa đặt tên)"}</option>)}
                    </select>
                  </span>
                  ×
                  <span className="inline-block w-32">
                    <select className={cn(inputCls, "py-1 text-xs")} value={c.of?.[1] || ""} aria-label="Cột nhân thứ hai" onChange={(e) => patch(c.key, { of: [c.of?.[0] || "", e.target.value] })}>
                      <option value="">— cột số —</option>
                      {plain.map((p) => <option key={p.key} value={p.key}>{p.label || "(chưa đặt tên)"}</option>)}
                    </select>
                  </span>
                </span>
              )}
              <label className="inline-flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" checked={!!c.sum} onChange={(e) => patch(c.key, { sum: e.target.checked })} /> Hiện tổng cuối bảng
              </label>
            </div>
          )}
        </div>
      ))}
      <button type="button" disabled={cols.length >= 12} onClick={() => set([...cols, newColumn(`Cột ${cols.length + 1}`)])}
        className="ml-6 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline disabled:opacity-40">
        <Plus className="h-3.5 w-3.5" /> Thêm cột
      </button>
    </div>
  );
}

/** Cột số của mọi trường bảng trong mẫu → lựa chọn cho "tự tính tổng" */
function sumSources(allFields) {
  const out = [];
  for (const t of allFields) {
    if (t.type !== "table") continue;
    for (const c of t.columns || []) if (isNumericCol(c)) out.push({ value: `${t.key}|${c.key}`, label: `${t.label || "(bảng chưa đặt tên)"} › ${c.label || "(cột)"}` });
  }
  return out;
}

function OptionsEditor({ field, onChange }) {
  const opts = field.options || [];
  const set = (next) => onChange({ ...field, options: next });
  return (
    <div className="space-y-1.5">
      {opts.map((o, i) => (
        <div key={o.id} className="flex items-center gap-2">
          <span className="w-5 text-right text-xs text-slate-400">{i + 1}.</span>
          <input className={cn(inputCls, "py-1.5")} value={o.label} maxLength={200} onChange={(e) => set(opts.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); set([...opts.slice(0, i + 1), { id: uid("o"), label: "" }, ...opts.slice(i + 1)]); } }} />
          <IconButton icon={X} title="Xoá lựa chọn" disabled={opts.length <= 1} onClick={() => set(opts.filter((x) => x.id !== o.id))} />
        </div>
      ))}
      <button type="button" onClick={() => set([...opts, { id: uid("o"), label: `Lựa chọn ${opts.length + 1}` }])} className="ml-7 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline">
        <Plus className="h-3.5 w-3.5" /> Thêm lựa chọn
      </button>
    </div>
  );
}

function FieldRow({ field: f, allFields, index, total, expanded, onExpand, onChange, onMove, onDuplicate, onRemove, error }) {
  const meta = FIELD_META[f.type] || FIELD_META.text;
  const Icon = meta.icon;
  const canHalf = !FULL_WIDTH_TYPES.includes(f.type);
  const sums = f.type === "number" || f.type === "currency" ? sumSources(allFields) : [];
  const moneyFields = f.type === "text" ? allFields.filter((x) => (x.type === "currency" || x.type === "number") && x.key !== f.key) : [];
  const computed = !!(f.sumOf || f.wordsOf);
  return (
    <div id={`fld-${f.key}`} className={cn("rounded-xl border bg-white transition", expanded ? "border-blue-300 shadow-sm" : error ? "border-red-300" : "border-slate-200")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
        <button type="button" onClick={onExpand} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Icon className="h-4 w-4 shrink-0 text-blue-700" />
          <span className={cn("min-w-0 truncate text-sm", f.type === "section" ? "font-bold text-slate-800" : "font-medium text-slate-700", !f.label && "italic text-red-500")}>
            {f.label || "(chưa đặt tên)"}{f.required && <span className="text-red-500"> *</span>}
          </span>
          <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{meta.label}{f.type === "table" ? ` · ${(f.columns || []).length} cột` : ""}{computed ? " · tự tính" : ""}{f.width === "half" ? " · nửa dòng" : ""}</span>
          <ChevronDown className={cn("ml-auto h-4 w-4 shrink-0 text-slate-400 transition", expanded && "rotate-180")} />
        </button>
        <IconButton icon={ArrowUp} title="Lên" disabled={index === 0} onClick={() => onMove(-1)} />
        <IconButton icon={ArrowDown} title="Xuống" disabled={index === total - 1} onClick={() => onMove(1)} />
        <IconButton icon={Copy} title="Nhân bản" onClick={onDuplicate} />
        <IconButton icon={Trash2} title="Xoá" danger onClick={onRemove} />
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Field label={f.type === "section" ? "Tiêu đề phần" : "Tên trường"} required>
              <input className={inputCls} autoFocus value={f.label} maxLength={300} onChange={(e) => onChange({ ...f, label: e.target.value })} placeholder="VD: Lý do nghỉ" />
            </Field>
            <Field label="Loại">
              <select className={inputCls} value={f.type} onChange={(e) => {
                const n = newField(e.target.value);
                onChange({ ...n, key: f.key, label: f.label, required: f.required, description: f.description, width: FULL_WIDTH_TYPES.includes(e.target.value) ? "full" : f.width, options: f.options?.length && n.options ? f.options : n.options });
              }}>
                {FIELD_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label={f.type === "checkbox" ? "Nội dung xác nhận" : "Mô tả / hướng dẫn"} hint={f.type === "checkbox" ? "VD: Tôi cam kết hoàn ứng đúng hạn" : "Không bắt buộc"}>
            <input className={inputCls} value={f.description || ""} maxLength={1000} onChange={(e) => onChange({ ...f, description: e.target.value })} />
          </Field>
          {["text", "textarea", "number", "currency"].includes(f.type) && !computed && (
            <Field label="Gợi ý trong ô nhập"><input className={inputCls} value={f.placeholder || ""} maxLength={200} onChange={(e) => onChange({ ...f, placeholder: e.target.value })} /></Field>
          )}
          {(f.type === "select" || f.type === "multiselect") && <Field label="Các lựa chọn" hint="Enter để thêm dòng mới"><OptionsEditor field={f} onChange={onChange} /></Field>}
          {f.type === "table" && (
            <>
              <Field label="Các cột của bảng" hint='Cột "Tự tính = A × B": vd Thành tiền = SL × Đơn giá. Số thứ tự dòng (#) tự có, không cần tạo cột.'>
                <ColumnsEditor field={f} onChange={onChange} />
              </Field>
              <Field label="Số dòng tối đa"><div className="w-28"><input type="number" min={1} max={200} className={inputCls} value={f.maxRows || 50} onChange={(e) => onChange({ ...f, maxRows: Math.min(200, Math.max(1, Number(e.target.value) || 1)) })} /></div></Field>
            </>
          )}
          {sums.length > 0 && (
            <Field label="Tự tính tổng từ bảng" hint="Chọn 1 cột số của bảng → trường này tự bằng tổng cột đó, người gửi không phải nhập">
              <select className={inputCls} value={f.sumOf ? `${f.sumOf.table}|${f.sumOf.column}` : ""} aria-label="Tự tính tổng từ bảng"
                onChange={(e) => { const [table, column] = e.target.value.split("|"); const { sumOf, ...rest } = f; onChange(e.target.value ? { ...rest, sumOf: { table, column } } : rest); }}>
                <option value="">— Không, người gửi tự nhập —</option>
                {sums.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          )}
          {moneyFields.length > 0 && (
            <Field label="Tự đọc số tiền bằng chữ" hint='Chọn 1 trường số tiền → trường này tự thành chữ, vd "Hai triệu ba trăm nghìn đồng"'>
              <select className={inputCls} value={f.wordsOf || ""} aria-label="Tự đọc số tiền bằng chữ"
                onChange={(e) => { const { wordsOf, ...rest } = f; onChange(e.target.value ? { ...rest, wordsOf: e.target.value } : rest); }}>
                <option value="">— Không, người gửi tự nhập —</option>
                {moneyFields.map((m) => <option key={m.key} value={m.key}>{m.label || "(chưa đặt tên)"}</option>)}
              </select>
            </Field>
          )}
          {f.type === "number" && (
            <div className="grid grid-cols-3 gap-2">
              <Field label="Đơn vị"><input className={inputCls} value={f.unit || ""} maxLength={30} placeholder="ngày, cái…" onChange={(e) => onChange({ ...f, unit: e.target.value })} /></Field>
              <Field label="Nhỏ nhất"><input type="number" className={inputCls} value={f.min ?? ""} onChange={(e) => onChange({ ...f, min: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>
              <Field label="Lớn nhất"><input type="number" className={inputCls} value={f.max ?? ""} onChange={(e) => onChange({ ...f, max: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>
            </div>
          )}
          {f.type === "files" && (
            <Field label="Số tệp tối đa"><input type="number" min={1} max={20} className={cn(inputCls, "w-28")} value={f.maxFiles || 10} onChange={(e) => onChange({ ...f, maxFiles: Math.min(20, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
          )}
          {f.type !== "section" && (
            <div className="flex flex-wrap gap-6">
              <Toggle label="Bắt buộc" checked={!!f.required} onChange={(v) => onChange({ ...f, required: v })} />
              {canHalf && <Toggle label="Nửa dòng" hint="2 trường đứng cạnh nhau trên máy tính" checked={f.width === "half"} onChange={(v) => onChange({ ...f, width: v ? "half" : "full" })} />}
              {f.type === "user" && <Toggle label="Chọn nhiều người" checked={!!f.multiple} onChange={(v) => onChange({ ...f, multiple: v })} />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FieldsEditor({ fields, onChange, expanded, setExpanded, problems }) {
  const set = (fn) => onChange(fn(fields));
  const add = (type) => {
    const f = newField(type);
    set((fs) => {
      const at = expanded ? fs.findIndex((x) => x.key === expanded) : -1;
      if (at < 0) return [...fs, f];
      const next = [...fs];
      next.splice(at + 1, 0, f);
      return next;
    });
    setExpanded(f.key);
    setTimeout(() => document.getElementById(`fld-${f.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Họ tên, MSNV, phòng ban, tổ, chức danh của người gửi được lấy tự động — không cần tạo trường. Tiêu đề, mức độ gấp, hạn xử lý, tệp đính kèm chung có sẵn (bật/tắt ở tab Tuỳ chọn).</p>
      {fields.map((f, i) => (
        <FieldRow key={f.key} field={f} allFields={fields} index={i} total={fields.length} expanded={expanded === f.key} error={problems[f.key]}
          onExpand={() => setExpanded((k) => (k === f.key ? null : f.key))}
          onChange={(n) => set((fs) => fs.map((x) => (x.key === f.key ? n : x)))}
          onMove={(d) => set((fs) => { const j = i + d; if (j < 0 || j >= fs.length) return fs; const n = [...fs]; [n[i], n[j]] = [n[j], n[i]]; return n; })}
          onDuplicate={() => set((fs) => { const n = [...fs]; const c = { ...f, key: uid("f"), label: `${f.label} (bản sao)`.slice(0, 300), options: f.options?.map((o) => ({ ...o, id: uid("o") })) }; n.splice(i + 1, 0, c); return n; })}
          onRemove={() => set((fs) => fs.filter((x) => x.key !== f.key))} />
      ))}
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-3">
        <p className="mb-2 text-xs font-medium text-slate-600">Thêm trường{expanded && fields.some((f) => f.key === expanded) ? " (chèn sau trường đang mở)" : ""}</p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
          {FIELD_TYPES.map((t) => (
            <button key={t.type} type="button" onClick={() => add(t.type)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-sm text-slate-700 hover:border-blue-400 hover:bg-blue-50">
              <t.icon className="h-4 w-4 shrink-0 text-blue-700" /> {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
