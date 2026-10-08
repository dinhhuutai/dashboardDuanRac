// Sửa danh sách trường của mẫu đề xuất: thêm, sắp xếp, nhân bản, xoá; lựa chọn của trường "Chọn"
import { ArrowDown, ArrowUp, ChevronDown, Copy, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Field, IconButton, Toggle, cn, inputCls } from "~/pagesForm/shared/ui";
import { FIELD_META, FIELD_TYPES, newField, uid } from "~/pagesRequest/shared/fieldTypes";

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

function FieldRow({ field: f, index, total, expanded, onExpand, onChange, onMove, onDuplicate, onRemove, error }) {
  const meta = FIELD_META[f.type] || FIELD_META.text;
  const Icon = meta.icon;
  const canHalf = !["textarea", "files", "multiselect", "section"].includes(f.type);
  return (
    <div id={`fld-${f.key}`} className={cn("rounded-xl border bg-white transition", expanded ? "border-blue-300 shadow-sm" : error ? "border-red-300" : "border-slate-200")}>
      <div className="flex items-center gap-2 px-3 py-2">
        <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
        <button type="button" onClick={onExpand} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <Icon className="h-4 w-4 shrink-0 text-blue-700" />
          <span className={cn("min-w-0 truncate text-sm", f.type === "section" ? "font-bold text-slate-800" : "font-medium text-slate-700", !f.label && "italic text-red-500")}>
            {f.label || "(chưa đặt tên)"}{f.required && <span className="text-red-500"> *</span>}
          </span>
          <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{meta.label}{f.width === "half" ? " · nửa dòng" : ""}</span>
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
                onChange({ ...n, key: f.key, label: f.label, required: f.required, description: f.description, width: ["textarea", "files", "multiselect", "section"].includes(e.target.value) ? "full" : f.width, options: f.options?.length && n.options ? f.options : n.options });
              }}>
                {FIELD_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label={f.type === "checkbox" ? "Nội dung xác nhận" : "Mô tả / hướng dẫn"} hint={f.type === "checkbox" ? "VD: Tôi cam kết hoàn ứng đúng hạn" : "Không bắt buộc"}>
            <input className={inputCls} value={f.description || ""} maxLength={1000} onChange={(e) => onChange({ ...f, description: e.target.value })} />
          </Field>
          {["text", "textarea", "number", "currency"].includes(f.type) && (
            <Field label="Gợi ý trong ô nhập"><input className={inputCls} value={f.placeholder || ""} maxLength={200} onChange={(e) => onChange({ ...f, placeholder: e.target.value })} /></Field>
          )}
          {(f.type === "select" || f.type === "multiselect") && <Field label="Các lựa chọn" hint="Enter để thêm dòng mới"><OptionsEditor field={f} onChange={onChange} /></Field>}
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
        <FieldRow key={f.key} field={f} index={i} total={fields.length} expanded={expanded === f.key} error={problems[f.key]}
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
