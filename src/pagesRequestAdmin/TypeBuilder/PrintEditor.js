// Thiết kế MẪU IN của mẫu đề xuất (tab "Mẫu in" của TypeBuilder) — giống "In đề xuất" của Base nhưng soạn ngay trên web.
// Trái: cài đặt khổ giấy + các khối (tiêu đề, đoạn văn, bảng tự do gộp ô, danh sách trường, bảng chi tiết, ký duyệt…).
// Phải: xem trước đúng khổ A4/A5 bằng dữ liệu mẫu hoặc 1 đề xuất thật. Chữ có biến ${...}: bấm vào ô chữ rồi "Chèn dữ liệu".
// Dựng trang in + danh sách biến: pagesRequest/shared/print.js. Lưu cùng mẫu đề xuất (options.printTemplates).
// Loại thứ 2 — TẢI LÊN TỆP WORD (.docx) có biến ${…} như Base (DocxEditor bên dưới, xử lý ở shared/docxTemplate.js).
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowUp, Bold, Braces, Check, Copy, FileDown, FileText, Italic, Loader2, Plus, Printer, Search, Star, Trash2,
  Underline, Upload,
} from "lucide-react";
import { Button, Field, IconButton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "~/pagesRequest/shared/api";
import { useRq, userName } from "~/pagesRequest/shared/store";
import PrintPreview from "~/pagesRequest/shared/PrintPreview";
import {
  BLOCK_LABEL, BLOCK_TYPES, PRINT_FONTS, T, defaultTemplate, downloadWord, itemColumnsOf, newBlock, printDocument, printVariables,
  renderPrintHtml, sampleRequest, stepTokens,
} from "~/pagesRequest/shared/print";
import { uid } from "~/pagesRequest/shared/fieldTypes";
import { fileHref, fmtSize, uploadFile } from "~/pagesRequest/shared/files";
import DocxPreview, { useFilledDocx } from "~/pagesRequest/shared/DocxPreview";
import {
  docxVariables, downloadBlob, loadDocx, mappingRows, printDocx, rememberDocx, sampleDocx, scanDocx, targetOptions,
} from "~/pagesRequest/shared/docxTemplate";

/* ------------------------------ ô chữ có thể chèn biến ------------------------------ */
// Ô chữ đang được chọn (để nút "Chèn dữ liệu" biết chèn vào đâu)
const ActiveInput = createContext(null);

function TokenInput({ value, onChange, multiline, rows, className, placeholder, ariaLabel }) {
  const active = useContext(ActiveInput);
  const ref = useRef(null);
  const latest = useRef(onChange);
  latest.current = onChange; // "Chèn dữ liệu" gọi bản onChange MỚI NHẤT (không mất chữ vừa gõ)
  const focus = () => { active.current = { el: ref.current, set: (v) => latest.current(v) }; };
  // ô nhiều dòng tự cao theo nội dung (kể cả chữ tự xuống dòng trong ô hẹp của bảng)
  useLayoutEffect(() => {
    const el = ref.current;
    if (!multiline || !el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value, multiline]);
  const common = { ref, value: value || "", placeholder, "aria-label": ariaLabel, onFocus: focus, onChange: (e) => onChange(e.target.value) };
  if (multiline) {
    return <textarea {...common} rows={rows || 1} className={cn(inputCls, "resize-none overflow-hidden py-1.5 font-mono text-[13px]", className)} />;
  }
  return <input {...common} className={cn(inputCls, "py-1.5", className)} />;
}

/** Danh sách biến — bấm 1 biến là chèn vào ô chữ đang chọn */
function VarPicker({ vars }) {
  const active = useContext(ActiveInput);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
  const shown = vars.filter((v) => !q || norm(`${v.label} ${v.token}`).includes(norm(q)));
  const groups = [...new Set(shown.map((v) => v.group))];
  const insert = (token) => {
    const a = active.current;
    const text = T(token);
    if (!a?.el || !document.body.contains(a.el)) {
      navigator.clipboard?.writeText(text).catch(() => {});
      toast.info(`Chưa chọn ô chữ — đã chép ${text}, dán vào ô cần chèn`);
      return;
    }
    const el = a.el;
    const v = el.value || "";
    const s = el.selectionStart ?? v.length, e = el.selectionEnd ?? v.length;
    a.set(v.slice(0, s) + text + v.slice(e));
    setOpen(false);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + text.length, s + text.length); });
  };
  return (
    <div ref={boxRef} className="relative">
      <Button size="sm" icon={Braces} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((x) => !x)}>Chèn dữ liệu</Button>
      {open && (
        <div className="absolute left-0 z-40 mt-1 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl" data-var-picker>
          <label className="relative block border-b border-slate-100 p-2">
            <Search className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
            <input autoFocus={false} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm dữ liệu (tên trường, người duyệt…)" className={cn(inputCls, "py-1.5 pl-8")} />
          </label>
          <div className="max-h-80 overflow-y-auto py-1">
            {groups.map((g) => (
              <div key={g}>
                <p className="px-3 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g}</p>
                {shown.filter((v) => v.group === g).map((v) => (
                  <button key={v.token} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insert(v.token)}
                    className="flex w-full items-baseline justify-between gap-2 px-3 py-1 text-left text-sm hover:bg-blue-50">
                    <span className="min-w-0 truncate text-slate-700">{v.label}</span>
                    <code className="shrink-0 text-[11px] text-slate-400">{T(v.token)}</code>
                  </button>
                ))}
              </div>
            ))}
            {!shown.length && <p className="px-3 py-4 text-center text-sm text-slate-400">Không tìm thấy</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ nút định dạng nhỏ ------------------------------ */
const Tg = ({ on, onClick, title, children }) => (
  <button type="button" title={title} aria-label={title} aria-pressed={!!on} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
    className={cn("inline-flex h-7 min-w-[28px] items-center justify-center rounded-md px-1.5 text-xs", on ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")}>{children}</button>
);
// ô số gọn: bỏ nút tăng/giảm của trình duyệt (chiếm chỗ làm "15" chỉ hiện "1")
const Num = ({ value, onChange, min, max, step = 1, w = "w-16", title, suffix }) => (
  <label className="inline-flex items-center gap-1 text-xs text-slate-500" title={title}>
    {title && <span className="hidden sm:inline">{title}</span>}
    <span className={w}><input type="number" min={min} max={max} step={step} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={cn(inputCls, "px-1.5 py-1 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none")} /></span>
    {suffix}
  </label>
);
const BG = ["", "#f1f5f9", "#e2e8f0", "#fef9c3", "#dbeafe", "#dcfce7", "#fee2e2"];
function AlignBtns({ value, onChange }) {
  return [["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]].map(([k, I]) => <Tg key={k} on={(value || "left") === k} title={{ left: "Căn trái", center: "Căn giữa", right: "Căn phải" }[k]} onClick={() => onChange(k)}><I className="h-3.5 w-3.5" /></Tg>);
}

/* ------------------------------ BẢNG TỰ DO ------------------------------ */
const emptyCell = () => ({ t: "" });
function spanOf(c) { return { cs: Math.max(1, c?.cs || 1), rs: Math.max(1, c?.rs || 1) }; }

function GridEditor({ b, set }) {
  const [sel, setSel] = useState({ r: 0, c: 0 });
  const cols = useMemo(() => (b.cols?.length ? b.cols : [1]), [b.cols]);
  const rows = useMemo(() => b.rows || [], [b.rows]);
  const covered = useMemo(() => {
    const m = new Map();
    rows.forEach((row, r) => cols.forEach((_, c) => {
      if (m.has(`${r}:${c}`)) return;
      const { cs, rs } = spanOf(row.cells?.[c]);
      for (let y = r; y < Math.min(rows.length, r + rs); y++) for (let x = c; x < Math.min(cols.length, c + cs); x++) if (y !== r || x !== c) m.set(`${y}:${x}`, `${r}:${c}`);
    }));
    return m;
  }, [rows, cols]);
  const isFree = (r, c) => !covered.has(`${r}:${c}`) && spanOf(rows[r]?.cells?.[c]).cs === 1 && spanOf(rows[r]?.cells?.[c]).rs === 1;
  const cur = rows[sel.r]?.cells?.[sel.c] || {};
  const { cs, rs } = spanOf(cur);
  const setRows = (next) => set({ rows: next });
  const setCell = (r, c, patch) => setRows(rows.map((row, i) => (i !== r ? row : { ...row, cells: row.cells.map((x, j) => (j !== c ? x : { ...x, ...patch })) })));
  const fmt = (patch) => setCell(sel.r, sel.c, patch);

  const mergeRight = () => {
    const x = sel.c + cs;
    if (x >= cols.length) return toast.info("Đã tới cột cuối");
    for (let y = sel.r; y < sel.r + rs; y++) if (!isFree(y, x)) return toast.info("Ô bên phải đang gộp với ô khác — tách ô đó trước");
    fmt({ cs: cs + 1 });
  };
  const mergeDown = () => {
    const y = sel.r + rs;
    if (y >= rows.length) return toast.info("Đã tới dòng cuối");
    for (let x = sel.c; x < sel.c + cs; x++) if (!isFree(y, x)) return toast.info("Ô bên dưới đang gộp với ô khác — tách ô đó trước");
    fmt({ rs: rs + 1 });
  };
  const addRow = (at) => {
    const next = rows.map((row, r) => ({ ...row, cells: row.cells.map((c) => { const s = spanOf(c); return r < at && r + s.rs > at ? { ...c, rs: s.rs + 1 } : c; }) }));
    next.splice(at, 0, { cells: cols.map(emptyCell) });
    setRows(next);
    setSel({ r: at, c: 0 });
  };
  const delRow = (at) => {
    if (rows.length <= 1) return;
    const next = rows.map((row, r) => ({ ...row, cells: row.cells.map((c) => { const s = spanOf(c); return r < at && r + s.rs > at ? { ...c, rs: s.rs - 1 } : c; }) }));
    // ô gộp bắt đầu ở dòng bị xoá → chuyển xuống dòng dưới
    next[at].cells.forEach((c, x) => { const s = spanOf(c); if (s.rs > 1 && next[at + 1]) next[at + 1].cells[x] = { ...c, rs: s.rs - 1 }; });
    next.splice(at, 1);
    setRows(next);
    setSel({ r: Math.max(0, at - 1), c: 0 });
  };
  const addCol = (at) => {
    const w = Math.round(cols.reduce((a, x) => a + x, 0) / cols.length) || 1;
    const nextCols = [...cols];
    nextCols.splice(at, 0, w);
    set({
      cols: nextCols,
      rows: rows.map((row) => {
        const cells = row.cells.map((c, x) => { const s = spanOf(c); return x < at && x + s.cs > at ? { ...c, cs: s.cs + 1 } : c; });
        cells.splice(at, 0, emptyCell());
        return { ...row, cells };
      }),
    });
    setSel({ r: sel.r, c: at });
  };
  const delCol = (at) => {
    if (cols.length <= 1) return;
    const nextCols = cols.filter((_, i) => i !== at);
    set({
      cols: nextCols,
      rows: rows.map((row) => {
        const cells = row.cells.map((c, x) => { const s = spanOf(c); return x < at && x + s.cs > at ? { ...c, cs: s.cs - 1 } : c; });
        const gone = cells[at];
        if (spanOf(gone).cs > 1 && cells[at + 1] !== undefined) cells[at + 1] = { ...gone, cs: spanOf(gone).cs - 1 };
        cells.splice(at, 1);
        return { ...row, cells };
      }),
    });
    setSel({ r: sel.r, c: Math.max(0, at - 1) });
  };
  const total = cols.reduce((a, x) => a + x, 0);

  return (
    <div className="space-y-2" data-grid-editor>
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 p-1">
        <Tg on={cur.b} title="Đậm" onClick={() => fmt({ b: !cur.b })}><Bold className="h-3.5 w-3.5" /></Tg>
        <Tg on={cur.i} title="Nghiêng" onClick={() => fmt({ i: !cur.i })}><Italic className="h-3.5 w-3.5" /></Tg>
        <Tg on={cur.u} title="Gạch chân" onClick={() => fmt({ u: !cur.u })}><Underline className="h-3.5 w-3.5" /></Tg>
        <Tg on={cur.up} title="VIẾT HOA" onClick={() => fmt({ up: !cur.up })}>AA</Tg>
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <AlignBtns value={cur.a} onChange={(a) => fmt({ a })} />
        <select value={cur.v || "top"} onChange={(e) => fmt({ v: e.target.value })} className="h-7 rounded-md border-slate-200 py-0 text-xs" aria-label="Căn dọc">
          <option value="top">Trên</option><option value="middle">Giữa</option><option value="bottom">Dưới</option>
        </select>
        <Num value={cur.s} onChange={(s) => fmt({ s })} min={6} max={40} title="Cỡ" suffix="pt" w="w-12" />
        <span className="flex items-center gap-0.5" title="Màu nền">
          {BG.map((c) => <button key={c || "none"} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => fmt({ bg: c })} aria-label={c ? `Nền ${c}` : "Bỏ màu nền"}
            className={cn("h-5 w-5 rounded border", (cur.bg || "") === c ? "border-blue-600 ring-1 ring-blue-600" : "border-slate-300")} style={{ background: c || "#fff" }} />)}
        </span>
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <Tg title="Gộp với ô bên phải" onClick={mergeRight}>Gộp →</Tg>
        <Tg title="Gộp với ô bên dưới" onClick={mergeDown}>Gộp ↓</Tg>
        {(cs > 1 || rs > 1) && <Tg title="Tách ô" onClick={() => fmt({ cs: 1, rs: 1 })}>Tách</Tg>}
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <Tg title="Thêm dòng phía dưới" onClick={() => addRow(sel.r + rs)}>+ Dòng</Tg>
        <Tg title="Thêm cột bên phải" onClick={() => addCol(sel.c + cs)}>+ Cột</Tg>
        <Tg title="Xoá dòng đang chọn" onClick={() => delRow(sel.r)}>− Dòng</Tg>
        <Tg title="Xoá cột đang chọn" onClick={() => delCol(sel.c)}>− Cột</Tg>
        <Num value={rows[sel.r]?.h} onChange={(h) => setRows(rows.map((row, i) => (i === sel.r ? { ...row, h } : row)))} min={3} max={200} title="Cao dòng" suffix="mm" w="w-14" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>{cols.map((w, i) => <col key={i} style={{ width: `${(w / total) * 100}%` }} />)}</colgroup>
          <thead>
            <tr>{cols.map((w, i) => (
              <th key={i} className="px-0.5 pb-1 font-normal">
                <span className="flex items-center justify-center gap-1 text-[10px] text-slate-400">rộng
                  <input type="number" min={1} max={100} value={w} aria-label={`Độ rộng cột ${i + 1}`}
                    onChange={(e) => set({ cols: cols.map((x, j) => (j === i ? Math.max(1, Math.min(100, Number(e.target.value) || 1)) : x)) })}
                    className="w-11 rounded border border-slate-200 px-1 py-0 text-[11px]" />
                </span>
              </th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {cols.map((_, c) => {
                  if (covered.has(`${r}:${c}`)) return null;
                  const cell = row.cells?.[c] || {};
                  const sp = spanOf(cell);
                  const on = sel.r === r && sel.c === c;
                  return (
                    <td key={c} colSpan={sp.cs > 1 ? Math.min(sp.cs, cols.length - c) : undefined} rowSpan={sp.rs > 1 ? Math.min(sp.rs, rows.length - r) : undefined}
                      className={cn("border p-0 align-top", b.border === "none" ? "border-dashed border-slate-200" : "border-slate-400", on && "outline outline-2 -outline-offset-2 outline-blue-500")}
                      style={{ background: cell.bg || undefined }} onFocus={() => setSel({ r, c })}>
                      <TokenInput multiline value={cell.t} onChange={(t) => setCell(r, c, { t })} ariaLabel={`Ô dòng ${r + 1} cột ${c + 1}`}
                        className={cn("!rounded-none !border-0 !bg-transparent !px-1.5 !font-sans focus:!ring-0", cell.b && "font-bold", cell.i && "italic", cell.u && "underline", cell.up && "uppercase",
                          cell.a === "center" ? "text-center" : cell.a === "right" ? "text-right" : "")} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Khung:</span>
        {[["all", "Kẻ hết"], ["outer", "Chỉ viền ngoài"], ["inner", "Chỉ đường trong"], ["none", "Không kẻ"]].map(([k, l]) => (
          <label key={k} className="inline-flex items-center gap-1"><input type="radio" checked={(b.border || "all") === k} onChange={() => set({ border: k })} />{l}</label>
        ))}
        <Num value={b.fontSize} onChange={(fontSize) => set({ fontSize })} min={6} max={28} title="Cỡ chữ cả bảng" suffix="pt" w="w-12" />
      </div>
    </div>
  );
}

/* ------------------------------ các khối khác ------------------------------ */
function TextEditor({ b, set, heading }) {
  return (
    <div className="space-y-2">
      <TokenInput multiline rows={heading ? 1 : 3} value={b.text} onChange={(text) => set({ text })} ariaLabel={heading ? "Chữ tiêu đề" : "Nội dung đoạn văn"}
        placeholder={heading ? "VD: PHIẾU ĐỀ NGHỊ MUA" : `Gõ chữ, chèn dữ liệu ${T("…")}. **đậm** *nghiêng* __gạch chân__`} />
      <div className="flex flex-wrap items-center gap-1">
        <AlignBtns value={b.align || (heading ? "center" : "left")} onChange={(align) => set({ align })} />
        <Tg on={b.bold ?? heading} title="Đậm" onClick={() => set({ bold: !(b.bold ?? heading) })}><Bold className="h-3.5 w-3.5" /></Tg>
        <Tg on={b.italic} title="Nghiêng" onClick={() => set({ italic: !b.italic })}><Italic className="h-3.5 w-3.5" /></Tg>
        <Tg on={b.upper} title="VIẾT HOA" onClick={() => set({ upper: !b.upper })}>AA</Tg>
        <Num value={b.size} onChange={(size) => set({ size })} min={6} max={40} title="Cỡ" suffix="pt" w="w-12" />
      </div>
    </div>
  );
}

function FieldsBlockEditor({ b, set, fields }) {
  const list = fields.filter((f) => !["section", "files"].includes(f.type));
  const keys = b.keys?.length ? b.keys : list.map((f) => f.key);
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">Mỗi trường 1 dòng "Nhãn: giá trị" (trường bảng → in cả bảng). Bỏ chọn trường không muốn in.</p>
      <div className="flex flex-wrap gap-1.5">
        {list.map((f) => {
          const on = keys.includes(f.key);
          return (
            <button key={f.key} type="button" onClick={() => set({ keys: on ? keys.filter((k) => k !== f.key) : [...keys, f.key] })}
              className={cn("rounded-full border px-2.5 py-0.5 text-xs", on ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-slate-500")}>{f.label}</button>
          );
        })}
        {!list.length && <span className="text-xs text-slate-400">Mẫu chưa có trường thông tin</span>}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {[[1, "1 cột"], [2, "2 cột"]].map(([k, l]) => <label key={k} className="inline-flex items-center gap-1"><input type="radio" checked={(b.columns || 1) === k} onChange={() => set({ columns: k })} />{l}</label>)}
        <Num value={b.labelWidth} onChange={(labelWidth) => set({ labelWidth })} min={10} max={60} title="Rộng cột nhãn" suffix="%" w="w-14" />
        <label className="inline-flex items-center gap-1"><input type="checkbox" checked={!!b.border} onChange={(e) => set({ border: e.target.checked })} />Kẻ khung</label>
      </div>
    </div>
  );
}

function ItemsEditor({ b, set, fields }) {
  const tables = fields.filter((f) => f.type === "table");
  const f = tables.find((x) => x.key === b.field);
  const cols = b.columns?.length ? b.columns : itemColumnsOf(f);
  const setCol = (i, patch) => set({ columns: cols.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  if (!tables.length) return <p className="text-xs text-amber-700">Mẫu chưa có trường "Bảng chi tiết" — thêm ở tab Trường thông tin.</p>;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Lấy từ bảng">
          <select className={cn(inputCls, "py-1.5")} value={b.field || ""} onChange={(e) => { const t = tables.find((x) => x.key === e.target.value); set({ field: t?.key || null, columns: itemColumnsOf(t) }); }} aria-label="Trường bảng">
            <option value="">— Chọn bảng —</option>
            {tables.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Dòng chữ phía trên bảng"><TokenInput value={b.title} onChange={(title) => set({ title })} placeholder="VD: Đính kèm nội dung chi tiết mua" /></Field>
      </div>
      {f && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-500"><th className="py-1 pr-2">Cột in</th><th className="py-1 pr-2">Tiêu đề</th><th className="w-20 py-1 pr-2">Rộng</th><th className="w-8" /></tr></thead>
              <tbody>
                {cols.map((c, i) => (
                  <tr key={`${c.src}${i}`}>
                    <td className="py-0.5 pr-2 text-slate-600">{c.src === "#" ? "Số thứ tự" : f.columns.find((x) => x.key === c.src)?.label || "(cột đã xoá)"}</td>
                    <td className="py-0.5 pr-2"><input className={cn(inputCls, "px-1.5 py-1 text-xs")} value={c.label || ""} onChange={(e) => setCol(i, { label: e.target.value })} /></td>
                    <td className="py-0.5 pr-2"><input type="number" min={1} max={100} className={cn(inputCls, "px-1.5 py-1 text-xs")} value={c.w ?? ""} onChange={(e) => setCol(i, { w: Number(e.target.value) || null })} /></td>
                    <td><IconButton icon={Trash2} title="Bỏ cột" danger onClick={() => set({ columns: cols.filter((_, j) => j !== i) })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <button type="button" className="font-medium text-blue-700 hover:underline" onClick={() => set({ columns: itemColumnsOf(f) })}>Lấy lại đủ cột</button>
            <label className="inline-flex items-center gap-1"><input type="checkbox" checked={b.showTotal !== false} onChange={(e) => set({ showTotal: e.target.checked })} />Dòng tổng cộng</label>
            {b.showTotal !== false && <input className={cn(inputCls, "w-32 px-1.5 py-1 text-xs")} value={b.totalLabel || ""} onChange={(e) => set({ totalLabel: e.target.value })} placeholder="Tổng cộng" aria-label="Chữ dòng tổng" />}
            <Num value={b.minRows} onChange={(minRows) => set({ minRows })} min={0} max={50} title="Ít nhất" suffix="dòng (thêm dòng trống)" w="w-14" />
            <Num value={b.fontSize} onChange={(fontSize) => set({ fontSize })} min={6} max={20} title="Cỡ chữ" suffix="pt" w="w-12" />
          </div>
        </>
      )}
    </div>
  );
}

function SignaturesEditor({ b, set, flow }) {
  const cols = b.cols || [];
  const setCol = (i, patch) => set({ cols: cols.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const fromFlow = () => set({
    cols: [{ title: "Người đề nghị", sub: "(Ký, ghi rõ họ tên)", name: T("nguoi_de_xuat") },
      ...stepTokens(flow.map((s) => s.name)).map((s) => ({ title: s.name, sub: "(Ký, ghi rõ họ tên)", name: T(`${s.token}_nguoi`) }))].slice(0, 8),
  });
  return (
    <div className="space-y-2">
      <Field label="Dòng ngày (căn phải, phía trên)"><TokenInput value={b.dateLine} onChange={(dateLine) => set({ dateLine })} placeholder={`VD: Long An, ${T("ngay_tao_chu")}`} /></Field>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {cols.map((c, i) => (
          <div key={i} className="space-y-1 rounded-lg border border-slate-200 p-2">
            <div className="flex items-center gap-1"><span className="flex-1 text-[11px] font-semibold text-slate-500">Cột ký {i + 1}</span><IconButton icon={Trash2} title="Bỏ cột ký" danger onClick={() => set({ cols: cols.filter((_, j) => j !== i) })} /></div>
            <TokenInput value={c.title} onChange={(title) => setCol(i, { title })} placeholder="Chức danh (in đậm)" ariaLabel="Chức danh ký" />
            <TokenInput value={c.sub} onChange={(sub) => setCol(i, { sub })} placeholder="(Ký, ghi rõ họ tên)" ariaLabel="Dòng nghiêng" />
            <TokenInput value={c.name} onChange={(name) => setCol(i, { name })} placeholder="Họ tên — chèn dữ liệu" ariaLabel="Họ tên ký" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <button type="button" className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline" disabled={cols.length >= 8} onClick={() => set({ cols: [...cols, { title: "", sub: "(Ký, ghi rõ họ tên)", name: "" }] })}><Plus className="h-3.5 w-3.5" /> Thêm cột ký</button>
        <button type="button" className="font-medium text-blue-700 hover:underline" onClick={fromFlow}>Lấy theo quy trình duyệt</button>
        <Num value={b.height} onChange={(height) => set({ height })} min={5} max={80} title="Chỗ ký cao" suffix="mm" w="w-14" />
      </div>
    </div>
  );
}

function BlockBody({ b, set, fields, flow }) {
  switch (b.type) {
    case "heading": return <TextEditor b={b} set={set} heading />;
    case "text": return <TextEditor b={b} set={set} />;
    case "grid": return <GridEditor b={b} set={set} />;
    case "fields": return <FieldsBlockEditor b={b} set={set} fields={fields} />;
    case "items": return <ItemsEditor b={b} set={set} fields={fields} />;
    case "signatures": return <SignaturesEditor b={b} set={set} flow={flow} />;
    case "spacer": return <Num value={b.height} onChange={(height) => set({ height })} min={1} max={200} title="Cao" suffix="mm" />;
    case "divider": return <label className="inline-flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={!!b.dashed} onChange={(e) => set({ dashed: e.target.checked })} />Nét đứt</label>;
    case "pagebreak": return <p className="text-xs text-slate-500">Phần sau khối này in sang trang mới.</p>;
    default: return null;
  }
}

/* ------------------------------ MẪU WORD (.docx) ------------------------------ */
function DocxEditor({ tpl, setTpl, type, fields, flow, data, sourceSelect, onReplace, uploading }) {
  const [tokens, setTokens] = useState(null);
  const [scanErr, setScanErr] = useState(null);
  const [showVars, setShowVars] = useState(false);
  useEffect(() => {
    let alive = true;
    setTokens(null);
    setScanErr(null);
    loadDocx(tpl.file).then(scanDocx).then((t) => { if (alive) setTokens(t); }).catch((e) => { if (alive) setScanErr(e.message); });
    return () => { alive = false; };
  }, [tpl.file]);
  const rows = useMemo(() => (tokens ? mappingRows(tokens, tpl, fields, flow) : []), [tokens, tpl, fields, flow]);
  const options = useMemo(() => targetOptions(fields, flow), [fields, flow]);
  const optLabel = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);
  const groups = useMemo(() => [...new Set(options.map((o) => o.group))], [options]);
  const vars = useMemo(() => docxVariables(fields, flow), [fields, flow]);
  const { blob, size, error } = useFilledDocx(tpl, data);
  const unmatched = rows.filter((r) => !r.target);
  const setMap = (name, value) => {
    const map = { ...(tpl.map || {}) };
    if (value) map[name] = value;
    else delete map[name];
    setTpl({ map });
  };
  const copy = (token) => { navigator.clipboard?.writeText(T(token)).then(() => toast.success(`Đã chép ${T(token)} — dán vào tệp Word`)).catch(() => toast.info(T(token))); };
  const original = async () => {
    if (tpl.file.downloadUrl) { window.location.href = fileHref(tpl.file.downloadUrl); return; }
    try { downloadBlob(new Blob([await loadDocx(tpl.file)]), tpl.file.name); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start" data-docx-editor>
      <div className="space-y-3">
        <section className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><FileText className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-800">{tpl.file.name}</p>
            <p className="text-xs text-slate-500">{fmtSize(tpl.file.size)}{size ? ` · khổ ${size.name}${size.landscape ? " ngang" : " dọc"} (theo tệp Word)` : ""}</p>
          </div>
          <Button size="sm" variant="secondary" icon={Upload} loading={!!uploading} onClick={onReplace}>Đổi tệp khác</Button>
          <Button size="sm" variant="ghost" icon={FileDown} onClick={original}>Tệp gốc</Button>
        </section>

        <section className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-semibold">Cách soạn tệp Word mẫu</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[13px]">
            <li>Gõ biến vào đúng chỗ cần điền, dạng <code>{T("nguoi_de_xuat")}</code>, <code>{T("so_tien|chu")}</code> (bằng chữ). Bảng, khung, logo, phông chữ… giữ nguyên như tệp.</li>
            <li>Bảng chi tiết: đặt biến cột vào <b>1 dòng</b> của bảng Word, vd. <code>{T("noi_dung_de_nghi.stt")}</code> <code>{T("noi_dung_de_nghi.so_tien")}</code> — dòng đó tự nhân theo số dòng của đề xuất.</li>
            <li>Dùng lại được tệp Word của Base (<code>{T("creator_name")}</code>, <code>{T("block_approvals_..._name")}</code>, <code>{T("column.nddn.1")}</code>…): biến nào chưa tự khớp thì chọn ở bảng dưới.</li>
          </ul>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={FileDown} onClick={async () => downloadBlob(await sampleDocx(type), `Mẫu gợi ý - ${type.name || "de xuat"}.docx`)}>Tải tệp Word gợi ý (đủ biến)</Button>
            <Button size="sm" variant="ghost" icon={Braces} onClick={() => setShowVars((v) => !v)}>{showVars ? "Ẩn" : "Xem"} danh sách biến</Button>
          </div>
        </section>

        {showVars && (
          <section className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2" data-docx-vars>
            {[...new Set(vars.map((v) => v.group))].map((g) => (
              <div key={g}>
                <p className="px-2 pb-0.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g}</p>
                {vars.filter((v) => v.group === g).map((v) => (
                  <button key={v.token} type="button" onClick={() => copy(v.token)} title="Bấm để chép"
                    className="flex w-full items-baseline justify-between gap-2 rounded px-2 py-0.5 text-left text-sm hover:bg-blue-50">
                    <span className="min-w-0 truncate text-slate-700">{v.label}</span><code className="shrink-0 text-[11px] text-slate-500">{T(v.token)}</code>
                  </button>
                ))}
              </div>
            ))}
          </section>
        )}

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <p className="flex-1 text-sm font-semibold text-slate-700">Biến trong tệp Word {tokens ? `(${tokens.length})` : ""}</p>
            {tokens && (unmatched.length
              ? <span className="text-xs font-medium text-amber-700">{unmatched.length} biến chưa khớp → sẽ để trống</span>
              : <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Check className="h-3.5 w-3.5" /> Đã khớp hết</span>)}
          </div>
          {scanErr ? <p className="p-3 text-sm text-red-600">{scanErr}</p> : !tokens ? <p className="flex items-center gap-2 p-3 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Đang đọc tệp…</p>
            : !tokens.length ? <p className="p-3 text-sm text-amber-700">Tệp chưa có biến nào dạng {T("ten_bien")} — mở tệp bằng Word, gõ biến vào chỗ cần điền rồi tải lên lại.</p> : (
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm" data-docx-map>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.name} className="border-t border-slate-100 first:border-0">
                        <td className="w-[40%] px-3 py-1.5 align-middle"><code className="break-all text-xs text-slate-700">{T(r.name)}</code></td>
                        <td className="px-2 py-1.5">
                          <select className={cn(inputCls, "py-1 text-xs", !r.target && "border-amber-400 bg-amber-50")} value={tpl.map?.[r.name] || ""} onChange={(e) => setMap(r.name, e.target.value)} aria-label={`Dữ liệu cho ${r.name}`}>
                            <option value="">{r.auto ? `Tự khớp: ${optLabel.get(r.auto) || r.auto}` : "— chưa khớp (để trống) —"}</option>
                            {groups.map((g) => <optgroup key={g} label={g}>{options.filter((o) => o.group === g).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>

      <div className="space-y-2 xl:sticky xl:top-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Xem trước tệp Word đã điền</span>
          {sourceSelect}
          <Button size="sm" variant="secondary" icon={Printer} disabled={!blob} onClick={() => printDocx(blob, size, tpl.name).catch((e) => toast.error(e.message))}>In thử</Button>
          <Button size="sm" variant="secondary" icon={FileDown} disabled={!blob} onClick={() => downloadBlob(blob, `${tpl.name}.docx`)}>Tải Word</Button>
        </div>
        <DocxPreview blob={blob} error={error || scanErr} height="78vh" />
      </div>
    </div>
  );
}

/* ------------------------------ trang ------------------------------ */
export default function PrintEditor({ type, value, onChange }) {
  const me = useRq((s) => s.boot?.me);
  const templates = useMemo(() => value || [], [value]);
  const [selId, setSelId] = useState(templates[0]?.id || null);
  const tpl = templates.find((x) => x.id === selId) || templates[0] || null;
  const [addOpen, setAddOpen] = useState(false);
  const [source, setSource] = useState("sample"); // "sample" | requestId
  const [real, setReal] = useState({ list: null, detail: null, loading: false });
  const active = useRef(null);
  const fields = useMemo(() => type.fields || [], [type.fields]);
  const flow = useMemo(() => type.flow || [], [type.flow]);
  const vars = useMemo(() => printVariables(fields, flow), [fields, flow]);
  const sample = useMemo(() => sampleRequest({ name: type.name, fields, flow }, me), [type.name, fields, flow, me]);

  // đề xuất thật của mẫu này (mẫu đã lưu) để xem trước bằng dữ liệu thật
  useEffect(() => {
    if (!type.typeId) return;
    rqApi.list({ box: "all", typeId: type.typeId, pageSize: 20 }).then((d) => setReal((x) => ({ ...x, list: d.rows }))).catch(() => setReal((x) => ({ ...x, list: [] })));
  }, [type.typeId]);
  useEffect(() => {
    if (source === "sample") return;
    setReal((x) => ({ ...x, loading: true }));
    rqApi.detail(source).then((d) => setReal((x) => ({ ...x, detail: d, loading: false }))).catch((e) => { toast.error(errorMessage(e)); setReal((x) => ({ ...x, loading: false })); setSource("sample"); });
  }, [source]);
  const data = source !== "sample" && real.detail && String(real.detail.requestId) === String(source) ? real.detail : sample;

  const setTpl = useCallback((patch) => onChange(templates.map((x) => (x.id === tpl.id ? { ...x, ...patch } : x))), [onChange, templates, tpl]);
  const setBlock = (i, patch) => setTpl({ blocks: tpl.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const moveBlock = (i, d) => { const j = i + d; if (j < 0 || j >= tpl.blocks.length) return; const bl = [...tpl.blocks]; [bl[i], bl[j]] = [bl[j], bl[i]]; setTpl({ blocks: bl }); };
  const addTemplate = (kind) => {
    setAddOpen(false);
    if (templates.length >= 10) return toast.info("Tối đa 10 mẫu in cho 1 mẫu đề xuất");
    const t = kind === "copy" && tpl ? { ...JSON.parse(JSON.stringify(tpl)), id: uid("p"), name: `${tpl.name} (bản sao)`, isDefault: false }
      : kind === "blank" ? { id: uid("p"), name: `Mẫu in ${templates.length + 1}`, paper: "A4", orientation: "portrait", margins: { top: 15, right: 12, bottom: 15, left: 15 }, font: "Times New Roman", fontSize: 12, isDefault: !templates.length, blocks: [newBlock("heading")] }
        : { ...defaultTemplate(type), isDefault: !templates.length };
    onChange([...templates, t]);
    setSelId(t.id);
  };
  const removeTemplate = async () => {
    if (!(await confirmDialog({ title: "Xoá mẫu in", message: `Xoá mẫu in "${tpl.name}"? Bấm Lưu mẫu đề xuất để áp dụng.`, confirmText: "Xoá", danger: true }))) return;
    const rest = templates.filter((x) => x.id !== tpl.id);
    if (tpl.isDefault && rest[0]) rest[0] = { ...rest[0], isDefault: true };
    onChange(rest);
    setSelId(rest[0]?.id || null);
  };
  const setDefault = () => onChange(templates.map((x) => ({ ...x, isDefault: x.id === tpl.id })));
  const html = (mode) => renderPrintHtml(tpl, data, { mode, userName: (id) => userName(id) });

  // tải lên tệp Word mẫu (mới, hoặc đổi tệp của mẫu Word đang mở)
  const fileInput = useRef(null);
  const uploadMode = useRef("new");
  const [uploading, setUploading] = useState(null); // { name, progress }
  const pickWord = (mode) => {
    setAddOpen(false);
    if (mode === "new" && templates.length >= 10) return toast.info("Tối đa 10 mẫu in cho 1 mẫu đề xuất");
    uploadMode.current = mode;
    fileInput.current?.click();
  };
  const onWordFile = async (file) => {
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) return toast.error("Chỉ nhận tệp Word .docx — tệp .doc đời cũ: mở bằng Word rồi Lưu thành (.docx)");
    try {
      const buf = await file.arrayBuffer();
      await scanDocx(buf); // đọc thử trước khi tải lên
      setUploading({ name: file.name, progress: 0 });
      const res = await uploadFile(file, { onProgress: (p) => setUploading({ name: file.name, progress: p }) }).promise;
      rememberDocx(res.key, buf);
      const f = { key: res.key, name: file.name, size: res.size ?? file.size, sig: res.sig };
      if (uploadMode.current === "replace" && tpl?.kind === "docx") setTpl({ file: f });
      else {
        const t = { id: uid("p"), name: file.name.replace(/\.docx$/i, "").slice(0, 150), kind: "docx", file: f, map: {}, isDefault: !templates.length };
        onChange([...templates, t]);
        setSelId(t.id);
      }
      toast.success("Đã tải lên tệp Word — bấm Lưu mẫu đề xuất để áp dụng");
    } catch (e) {
      toast.error(e.message || "Tải tệp thất bại");
    } finally {
      setUploading(null);
    }
  };
  const wordInput = <input ref={fileInput} type="file" hidden accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => { onWordFile(e.target.files?.[0]); e.target.value = ""; }} data-word-input />;
  const uploadingNote = uploading && <p className="flex items-center gap-2 text-sm text-blue-700"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải lên {uploading.name} — {Math.round(uploading.progress * 100)}%</p>;
  const sourceSelect = (
    <select className={cn(inputCls, "w-auto flex-1 py-1 text-xs")} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Dữ liệu xem trước">
      <option value="sample">Dữ liệu mẫu</option>
      {(real.list || []).map((r) => <option key={r.requestId} value={r.requestId}>#{r.requestId} · {r.title}</option>)}
    </select>
  );

  if (!tpl) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <Printer className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 font-semibold text-slate-800">Chưa có mẫu in</p>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
          Mẫu in là "phiếu giấy" của đề xuất (như "In đề xuất" của Base): bố cục khổ A4/A5 với dữ liệu tự điền — người gửi, nội dung, bảng chi tiết, tổng tiền bằng chữ,
          người duyệt từng bước. Ai xem được đề xuất bấm <b>In</b> là in / lưu PDF / tải Word.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button icon={Plus} onClick={() => addTemplate("auto")}>Tạo tự động từ trường của mẫu</Button>
          <Button variant="secondary" icon={Upload} loading={!!uploading} onClick={() => pickWord("new")}>Tải lên mẫu Word (.docx)</Button>
          <Button variant="ghost" onClick={() => addTemplate("blank")}>Mẫu trống</Button>
        </div>
        <div className="mt-3 flex justify-center">{uploadingNote}</div>
        {wordInput}
      </div>
    );
  }

  return (
    <ActiveInput.Provider value={active}>
      <div className="space-y-3" data-print-editor>
        {/* chọn mẫu in */}
        <div className="flex flex-wrap items-center gap-1.5">
          {templates.map((x) => (
            <button key={x.id} type="button" onClick={() => setSelId(x.id)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm", x.id === tpl.id ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-slate-300 text-slate-600 hover:border-blue-400")}>
              {x.isDefault && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}{x.name} <span className="text-[11px] font-normal text-slate-400">{x.kind === "docx" ? "Word" : x.paper}</span>
            </button>
          ))}
          <div className="relative">
            <button type="button" onClick={() => setAddOpen((v) => !v)} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50"><Plus className="h-4 w-4" /> Thêm mẫu in</button>
            {addOpen && (
              <div className="absolute left-0 z-30 mt-1 w-60 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <button type="button" onClick={() => pickWord("new")} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50">Tải lên mẫu Word (.docx)</button>
                {[["auto", "Thiết kế: tự động từ trường của mẫu"], ["copy", "Nhân bản mẫu in đang mở"], ["blank", "Thiết kế: mẫu trống"]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => addTemplate(k)} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50">{l}</button>
                ))}
              </div>
            )}
          </div>
          {uploadingNote}
          {wordInput}
        </div>

        {tpl.kind === "docx" ? (
          <>
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
              <Field label="Tên mẫu in" className="min-w-[200px] flex-1"><input className={cn(inputCls, "py-1.5")} value={tpl.name} maxLength={150} onChange={(e) => setTpl({ name: e.target.value })} /></Field>
              <div className="flex items-center gap-1 pb-1">
                {!tpl.isDefault ? <Button size="sm" variant="ghost" icon={Star} onClick={setDefault}>Đặt mặc định</Button> : <span className="px-2 text-xs text-amber-600">★ Mặc định</span>}
                <IconButton icon={Trash2} title="Xoá mẫu in" danger onClick={removeTemplate} />
              </div>
            </div>
            <DocxEditor tpl={tpl} setTpl={setTpl} type={type} fields={fields} flow={flow} data={data} sourceSelect={sourceSelect} uploading={uploading} onReplace={() => pickWord("replace")} />
          </>
        ) : (
        <>
        {/* cài đặt trang */}
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-3">
          <Field label="Tên mẫu in" className="min-w-[200px] flex-1"><input className={cn(inputCls, "py-1.5")} value={tpl.name} maxLength={150} onChange={(e) => setTpl({ name: e.target.value })} /></Field>
          <Field label="Khổ giấy">
            <div className="flex gap-1">{["A4", "A5"].map((p) => <Tg key={p} on={tpl.paper === p} title={`Khổ ${p}`} onClick={() => setTpl({ paper: p, fontSize: p === "A5" && tpl.fontSize >= 12 ? 10 : tpl.fontSize })}>{p}</Tg>)}</div>
          </Field>
          <Field label="Hướng">
            <div className="flex gap-1">{[["portrait", "Dọc"], ["landscape", "Ngang"]].map(([k, l]) => <Tg key={k} on={tpl.orientation === k} title={l} onClick={() => setTpl({ orientation: k })}>{l}</Tg>)}</div>
          </Field>
          <Field label="Lề (mm) trên · phải · dưới · trái">
            <div className="flex gap-1">{["top", "right", "bottom", "left"].map((k) => <Num key={k} value={tpl.margins?.[k]} onChange={(v) => setTpl({ margins: { ...tpl.margins, [k]: v ?? 0 } })} min={0} max={50} w="w-12" />)}</div>
          </Field>
          <Field label="Phông chữ">
            <select className={cn(inputCls, "py-1.5")} value={tpl.font} onChange={(e) => setTpl({ font: e.target.value })}>{PRINT_FONTS.map((f) => <option key={f}>{f}</option>)}</select>
          </Field>
          <Field label="Cỡ chữ"><Num value={tpl.fontSize} onChange={(fontSize) => setTpl({ fontSize: fontSize ?? 12 })} min={7} max={20} suffix="pt" w="w-14" /></Field>
          <div className="flex items-center gap-1 pb-1">
            {!tpl.isDefault ? <Button size="sm" variant="ghost" icon={Star} onClick={setDefault}>Đặt mặc định</Button> : <span className="px-2 text-xs text-amber-600">★ Mặc định</span>}
            <IconButton icon={Copy} title="Nhân bản mẫu in" onClick={() => addTemplate("copy")} />
            <IconButton icon={Trash2} title="Xoá mẫu in" danger onClick={removeTemplate} />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
          {/* KHỐI */}
          <div className="space-y-3">
            <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 backdrop-blur">
              <VarPicker vars={vars} />
              <span className="text-xs text-slate-500">Bấm vào ô chữ rồi chọn dữ liệu. <code>**đậm**</code> <code>*nghiêng*</code> <code>__gạch__</code> · <code>{T("so_tien|chu")}</code> = bằng chữ</span>
            </div>
            {tpl.blocks.map((b, i) => (
              <section key={b.id || i} className="rounded-xl border border-slate-200 bg-white p-3" data-block={b.type}>
                <div className="mb-2 flex items-center gap-1">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{i + 1}</span>
                  <p className="flex-1 text-sm font-semibold text-slate-700">{BLOCK_LABEL[b.type]}</p>
                  <Num value={b.mt} onChange={(mt) => setBlock(i, { mt })} min={0} max={50} title="Cách trên" suffix="mm" w="w-12" />
                  <IconButton icon={ArrowUp} title="Lên" disabled={i === 0} onClick={() => moveBlock(i, -1)} />
                  <IconButton icon={ArrowDown} title="Xuống" disabled={i === tpl.blocks.length - 1} onClick={() => moveBlock(i, 1)} />
                  <IconButton icon={Copy} title="Nhân đôi khối" onClick={() => { const bl = [...tpl.blocks]; bl.splice(i + 1, 0, { ...JSON.parse(JSON.stringify(b)), id: uid("b") }); setTpl({ blocks: bl }); }} />
                  <IconButton icon={Trash2} title="Xoá khối" danger onClick={() => setTpl({ blocks: tpl.blocks.filter((_, j) => j !== i) })} />
                </div>
                <BlockBody b={b} set={(patch) => setBlock(i, patch)} fields={fields} flow={flow} />
              </section>
            ))}
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white p-2">
              <span className="self-center px-1 text-xs text-slate-500">Thêm khối:</span>
              {BLOCK_TYPES.map((x) => (
                <button key={x.type} type="button" onClick={() => setTpl({ blocks: [...tpl.blocks, newBlock(x.type)].slice(0, 150) })}
                  className="rounded-full border border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-700">+ {x.label}</button>
              ))}
            </div>
          </div>

          {/* XEM TRƯỚC */}
          <div className="space-y-2 xl:sticky xl:top-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Xem trước {tpl.paper} {tpl.orientation === "landscape" ? "ngang" : "dọc"}</span>
              {sourceSelect}
              <Button size="sm" variant="secondary" icon={Printer} onClick={() => printDocument(html("print"))}>In thử</Button>
              <Button size="sm" variant="secondary" icon={FileDown} onClick={() => downloadWord(html("word"), tpl.name)}>Word</Button>
            </div>
            <PrintPreview tpl={tpl} request={data} markUnknown height="78vh" />
            <p className="text-[11px] text-slate-400">Chữ đỏ <span className="rounded bg-red-100 px-1 text-red-600">{T("…")}</span> = biến không có trong mẫu (tên trường đã đổi?). Vạch xám = hết 1 trang giấy.</p>
          </div>
        </div>
        </>
        )}
      </div>
    </ActiveInput.Provider>
  );
}
