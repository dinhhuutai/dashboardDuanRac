// Ô nhập cho 1 trường của mẫu đề xuất + hiển thị giá trị đã gửi
import { Calculator, Check, Plus, Trash2 } from "lucide-react";
import { cn, inputCls } from "~/pagesForm/shared/ui";
import { UserPicker } from "./components";
import { AttachmentPicker } from "./Attachments";
import { cellText, columnSum, computeRow, displayValue, isComputed, isNumericCol, rowHasData } from "./fieldTypes";
import { userName } from "./store";
import { daysBetween, fmtMoney } from "./format";

const fmtThousands = (v) => {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("vi-VN") : "";
};

/* ============================ BẢNG CHI TIẾT ============================ */
const COL_MIN = { text: "min-w-[180px]", number: "min-w-[90px]", currency: "min-w-[130px]", date: "min-w-[140px]", formula: "min-w-[130px]" };
const cellCls = "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none hover:border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed";

/** 1 ô nhập của bảng (dùng cho cả dạng bảng trên máy tính và dạng thẻ trên điện thoại) */
function CellInput({ columns, col: c, value, onChange, disabled, boxed }) {
  const cls = boxed ? cn(inputCls, "py-1.5") : cellCls;
  if (c.type === "formula") {
    return <div className={cn("px-2 py-1.5 text-right text-sm font-medium text-slate-700", boxed && "rounded-lg bg-slate-50")} title="Tự tính">{cellText(columns, c, value) || <span className="font-normal text-slate-300">—</span>}</div>;
  }
  if (c.type === "currency") {
    return <input className={cn(cls, "text-right")} inputMode="numeric" value={fmtThousands(value)} placeholder="0" disabled={disabled} aria-label={c.label}
      onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); onChange(d ? Number(d) : ""); }} />;
  }
  if (c.type === "number") {
    return <input className={cn(cls, "text-right")} inputMode="decimal" value={value ?? ""} placeholder="0" disabled={disabled} aria-label={c.label}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.,-]/g, ""))} />;
  }
  if (c.type === "date") return <input type="date" className={cls} value={value || ""} disabled={disabled} aria-label={c.label} onChange={(e) => onChange(e.target.value)} />;
  return (
    <textarea rows={1} className={cn(cls, "block resize-none overflow-hidden")} value={value || ""} maxLength={1000} disabled={disabled} aria-label={c.label}
      ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; } }}
      onChange={(e) => onChange(e.target.value)} />
  );
}

/** Dòng tổng của các cột bật "Tính tổng" */
function totalsOf(columns, rows) {
  const sums = {};
  let any = false;
  for (const c of columns) {
    if (!c.sum || !isNumericCol(c)) continue;
    any = true;
    sums[c.key] = columnSum(columns, rows, c.key);
  }
  return any ? sums : null;
}

/** Ô nhập kiểu bảng: thêm/xoá dòng, cột "= A × B" tự tính, dòng tổng. Điện thoại: mỗi dòng 1 thẻ. */
export function TableInput({ field: f, value, onChange, error, disabled }) {
  const cols = f.columns || [];
  const stored = Array.isArray(value) ? value : [];
  const rows = stored.length ? stored : [{}]; // luôn có 1 dòng trống để gõ ngay
  const maxRows = f.maxRows || 50;
  const setCell = (i, key, v) => {
    const next = rows.map((r, j) => (j === i ? computeRow(cols, { ...r, [key]: v }) : r));
    onChange(next);
  };
  const addRow = () => onChange([...rows, {}]);
  const removeRow = (i) => onChange(rows.filter((_, j) => j !== i));
  const totals = totalsOf(cols, rows);
  const canAdd = !disabled && rows.length < maxRows;

  return (
    <div data-table-field={f.key}>
      {/* Máy tính / máy tính bảng */}
      <div className={cn("hidden overflow-x-auto rounded-xl border sm:block", error ? "border-red-300" : "border-slate-200")}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="w-10 px-2 py-2 text-center">#</th>
              {cols.map((c) => <th key={c.key} className={cn("px-2 py-2", COL_MIN[c.type], isNumericCol(c) && "text-right")}>{c.label}{c.type === "formula" && <Calculator className="ml-1 inline h-3 w-3 text-slate-400" />}</th>)}
              <th className="w-9" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100 align-top">
                <td className="px-2 py-2 text-center text-xs font-medium text-slate-400">{String(i + 1).padStart(2, "0")}</td>
                {cols.map((c) => <td key={c.key} className="px-0.5 py-0.5"><CellInput columns={cols} col={c} value={r[c.key]} disabled={disabled} onChange={(v) => setCell(i, c.key, v)} /></td>)}
                <td className="px-1 py-1 text-center">
                  {!disabled && (rows.length > 1 || rowHasData(cols, r)) && (
                    <button type="button" onClick={() => removeRow(i)} title="Xoá dòng" className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
                <td className="px-2 py-2" />
                {cols.map((c, ci) => (
                  <td key={c.key} className={cn("px-2 py-2", isNumericCol(c) && "text-right")}>
                    {c.key in totals ? (cellText(cols, c, totals[c.key]) || "0") : ci === 0 ? "Tổng cộng" : ""}
                  </td>
                ))}
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Điện thoại: mỗi dòng 1 thẻ */}
      <div className="space-y-2 sm:hidden">
        {rows.map((r, i) => (
          <div key={i} className={cn("rounded-xl border bg-white p-2.5", error ? "border-red-300" : "border-slate-200")}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Dòng {i + 1}</span>
              {!disabled && (rows.length > 1 || rowHasData(cols, r)) && (
                <button type="button" onClick={() => removeRow(i)} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Xoá</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {cols.map((c) => (
                <label key={c.key} className={cn("block", c.type === "text" ? "col-span-2" : "col-span-1")}>
                  <span className="mb-0.5 block text-[11px] font-medium text-slate-500">{c.label}</span>
                  <CellInput boxed columns={cols} col={c} value={r[c.key]} disabled={disabled} onChange={(v) => setCell(i, c.key, v)} />
                </label>
              ))}
            </div>
          </div>
        ))}
        {totals && (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
            {cols.filter((c) => c.key in totals).map((c) => (
              <p key={c.key} className="flex justify-between gap-3"><span className="text-slate-500">Tổng {c.label.toLowerCase()}</span><b className="text-slate-800">{cellText(cols, c, totals[c.key]) || "0"}</b></p>
            ))}
          </div>
        )}
      </div>

      {canAdd && (
        <button type="button" onClick={addRow} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-50">
          <Plus className="h-4 w-4" /> Thêm dòng
        </button>
      )}
    </div>
  );
}

/** Bảng đã gửi (chỉ xem) */
export function TableValue({ field: f, rows }) {
  const cols = f.columns || [];
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return <span className="text-slate-400">—</span>;
  const totals = totalsOf(cols, list);
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-10 px-3 py-2 text-center">#</th>
            {cols.map((c) => <th key={c.key} className={cn("whitespace-nowrap px-3 py-2", isNumericCol(c) && "text-right")}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr key={i} className="border-t border-slate-100 align-top">
              <td className="px-3 py-2 text-center text-xs font-semibold text-slate-400">{String(i + 1).padStart(2, "0")}</td>
              {cols.map((c) => (
                <td key={c.key} className={cn("px-3 py-2 text-slate-800", isNumericCol(c) ? "whitespace-nowrap text-right tabular-nums" : "min-w-[120px] whitespace-pre-wrap break-words")}>{cellText(cols, c, r[c.key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold text-slate-800">
              <td className="px-3 py-2" />
              {cols.map((c, ci) => (
                <td key={c.key} className={cn("px-3 py-2", isNumericCol(c) && "whitespace-nowrap text-right tabular-nums")}>
                  {c.key in totals ? (cellText(cols, c, totals[c.key]) || "0") : ci === 0 ? "Tổng cộng" : ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function FieldInput({ field: f, value, onChange, error, att, disabled }) {
  const errCls = error ? "border-red-400 focus:border-red-500 focus:ring-red-100" : "";
  // trường tự tính (tổng của cột bảng / số tiền bằng chữ): chỉ hiện kết quả
  if (isComputed(f)) {
    const text = value === undefined || value === null || value === "" ? "" : f.type === "currency" ? fmtMoney(value) : f.type === "number" ? `${Number(value).toLocaleString("vi-VN")}${f.unit ? ` ${f.unit}` : ""}` : String(value);
    return (
      <div className={cn("flex min-h-[40px] items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm", error ? "border-red-300" : "border-slate-200", f.type !== "text" && "justify-end font-semibold")} data-computed={f.key}>
        <Calculator className="h-4 w-4 shrink-0 text-slate-400" />
        <span className={cn("min-w-0 flex-1 break-words", f.type !== "text" && "text-right", text ? "text-slate-800" : "font-normal text-slate-400")}>{text || (f.sumOf ? "Tự tính từ bảng" : "Tự đọc từ số tiền")}</span>
      </div>
    );
  }
  switch (f.type) {
    case "table":
      return <TableInput field={f} value={value} onChange={onChange} error={error} disabled={disabled} />;
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

/**
 * Nội dung đề xuất đã gửi — kiểu Base Request: mỗi trường 1 dòng, nhãn bên trái (xám), GIÁ TRỊ IN ĐẬM bên phải;
 * số tiền to + đậm, "bằng chữ" in nghiêng; bảng / đoạn văn / tệp chiếm cả dòng dưới nhãn; tiêu đề phần có vạch màu mẫu.
 */
export function FieldValues({ fields, values, filesByField, renderFiles, accent = "#2563eb" }) {
  const rows = [];
  for (const f of fields || []) {
    if (f.type === "section") {
      rows.push(
        <div key={f.key} className="border-l-4 bg-slate-50 px-4 py-2" style={{ borderLeftColor: accent }}>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">{f.label}</h4>
          {f.description && <p className="text-xs text-slate-500">{f.description}</p>}
        </div>
      );
      continue;
    }
    const block = f.type === "table" || f.type === "files" || f.type === "textarea";
    let content;
    if (f.type === "files") {
      const fs = filesByField?.[f.key] || [];
      content = fs.length ? renderFiles(fs) : <span className="font-normal text-slate-400">—</span>;
    } else if (f.type === "table") {
      content = <TableValue field={f} rows={values?.[f.key]} />;
    } else {
      const text = displayValue(f, values?.[f.key], (id) => userName(id));
      const money = f.type === "currency" && text;
      content = text ? (
        <span className={cn("whitespace-pre-wrap break-words",
          money ? "text-lg font-bold tabular-nums text-slate-900" : f.wordsOf ? "font-semibold italic text-slate-700" : f.type === "textarea" ? "font-normal leading-relaxed text-slate-800" : "font-semibold text-slate-900")}>{text}</span>
      ) : <span className="font-normal text-slate-400">—</span>;
    }
    rows.push(
      <div key={f.key} className={cn("min-w-0 px-4 py-3", block ? "space-y-1.5" : "grid gap-0.5 sm:grid-cols-[minmax(150px,32%)_minmax(0,1fr)] sm:items-baseline sm:gap-4")}>
        <dt className="text-sm text-slate-500">{f.label}</dt>
        <dd className="min-w-0 text-[15px]">{content}</dd>
      </div>
    );
  }
  if (!rows.length) return null;
  return <dl className="divide-y divide-slate-100">{rows}</dl>;
}
