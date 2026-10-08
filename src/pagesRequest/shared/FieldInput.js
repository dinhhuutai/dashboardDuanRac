// Ô nhập cho 1 trường của mẫu đề xuất + hiển thị giá trị đã gửi
import { Check } from "lucide-react";
import { cn, inputCls } from "~/pagesForm/shared/ui";
import { UserPicker } from "./components";
import { AttachmentPicker } from "./Attachments";
import { displayValue } from "./fieldTypes";
import { userName } from "./store";
import { daysBetween } from "./format";

const fmtThousands = (v) => {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("vi-VN") : "";
};

export function FieldInput({ field: f, value, onChange, error, att, disabled }) {
  const errCls = error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "";
  switch (f.type) {
    case "text":
      return <input className={cn(inputCls, errCls)} value={value || ""} maxLength={500} placeholder={f.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "textarea":
      return <textarea className={cn(inputCls, errCls, "min-h-[96px] resize-y")} value={value || ""} maxLength={5000} placeholder={f.placeholder} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <div className="relative">
          <input className={cn(inputCls, errCls, f.unit && "pr-14")} inputMode="decimal" value={value ?? ""} placeholder={f.placeholder} disabled={disabled}
            onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))} />
          {f.unit && <span className="pointer-events-none absolute right-3 top-2 text-sm text-slate-400">{f.unit}</span>}
        </div>
      );
    case "currency":
      return (
        <div className="relative">
          <input className={cn(inputCls, errCls, "pr-10 text-right font-medium")} inputMode="numeric" value={fmtThousands(value)} placeholder={f.placeholder || "0"} disabled={disabled}
            onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); onChange(d ? Number(d) : ""); }} />
          <span className="pointer-events-none absolute right-3 top-2 text-sm text-slate-400">đ</span>
        </div>
      );
    case "date":
      return <input type="date" className={cn(inputCls, errCls)} value={value || ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "daterange": {
      const v = value || {};
      const n = v.from && v.to && v.from <= v.to ? daysBetween(v.from, v.to) : null;
      return (
        <div>
          <div className="flex items-center gap-2">
            <input type="date" className={cn(inputCls, errCls)} value={v.from || ""} disabled={disabled} onChange={(e) => onChange({ ...v, from: e.target.value })} />
            <span className="text-slate-400">→</span>
            <input type="date" className={cn(inputCls, errCls)} value={v.to || ""} min={v.from || undefined} disabled={disabled} onChange={(e) => onChange({ ...v, to: e.target.value })} />
          </div>
          {n && <p className="mt-1 text-xs text-slate-500">Tổng {n} ngày</p>}
        </div>
      );
    }
    case "select":
      if ((f.options || []).length <= 4) {
        return (
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => (
              <button key={o.id} type="button" disabled={disabled} onClick={() => onChange(value === o.id ? "" : o.id)}
                className={cn("rounded-lg border px-3 py-1.5 text-sm transition", value === o.id ? "border-blue-600 bg-blue-50 font-medium text-blue-700" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400", error && value !== o.id && "border-red-300")}>
                {o.label}
              </button>
            ))}
          </div>
        );
      }
      return (
        <select className={cn(inputCls, errCls)} value={value || ""} disabled={disabled} onChange={(e) => onChange(e.target.value)}>
          <option value="">— Chọn —</option>
          {f.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
      );
    case "multiselect": {
      const arr = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {f.options.map((o) => {
            const on = arr.includes(o.id);
            return (
              <button key={o.id} type="button" disabled={disabled} onClick={() => onChange(on ? arr.filter((x) => x !== o.id) : [...arr, o.id])}
                className={cn("inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition", on ? "border-blue-600 bg-blue-50 font-medium text-blue-700" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400")}>
                {on && <Check className="h-3.5 w-3.5" />} {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "checkbox":
      return (
        <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm", value === true ? "border-blue-300 bg-blue-50/50" : error ? "border-red-300" : "border-slate-200")}>
          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" checked={value === true} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
          <span className="text-slate-700">{f.description || "Tôi xác nhận"}</span>
        </label>
      );
    case "user":
      return <UserPicker multiple={!!f.multiple} value={f.multiple ? value || [] : value || null} onChange={onChange} disabled={disabled} placeholder="Tìm nhân viên…" />;
    case "files":
      return att ? <AttachmentPicker att={att} fieldKey={f.key} max={f.maxFiles || 10} label={`Đính kèm (tối đa ${f.maxFiles || 10} tệp)`} /> : null;
    default:
      return null;
  }
}

/** Bảng thông tin đề xuất đã gửi (2 cột cho trường "nửa dòng") */
export function FieldValues({ fields, values, filesByField, renderFiles }) {
  const rows = [];
  for (const f of fields || []) {
    if (f.type === "section") {
      rows.push(<h4 key={f.key} className="col-span-2 mt-2 border-b border-slate-100 pb-1 text-sm font-semibold text-slate-700 first:mt-0">{f.label}</h4>);
      continue;
    }
    let content;
    if (f.type === "files") {
      const fs = filesByField?.[f.key] || [];
      content = fs.length ? renderFiles(fs) : <span className="text-slate-400">—</span>;
    } else {
      const text = displayValue(f, values?.[f.key], (id) => userName(id));
      content = text ? <span className="whitespace-pre-wrap break-words text-slate-800">{text}</span> : <span className="text-slate-400">—</span>;
    }
    rows.push(
      <div key={f.key} className={cn("min-w-0", f.width === "half" && f.type !== "files" ? "col-span-2 sm:col-span-1" : "col-span-2")}>
        <dt className="text-xs font-medium text-slate-500">{f.label}</dt>
        <dd className="mt-0.5 text-sm">{content}</dd>
      </div>
    );
  }
  if (!rows.length) return null;
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{rows}</dl>;
}
