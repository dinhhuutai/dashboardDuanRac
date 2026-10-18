// Xem trước Excel (.xlsx/.xlsm) GIỐNG EXCEL — đọc bằng ExcelJS (tải lười, chỉ khi mở tệp):
// độ rộng cột, chiều cao dòng, dòng/cột ẩn, ô gộp, phông chữ (đậm / nghiêng / gạch chân / gạch ngang / cỡ / màu / tên phông),
// màu nền (kể cả màu theme + tint, màu "indexed" của tệp cũ), viền (mỏng / dày / nét đứt / chấm / đôi + màu),
// căn lề ngang / dọc, xuống dòng, thụt lề, chữ xoay dọc, định dạng số / tiền / % / ngày (SSF của SheetJS),
// chữ nhiều định dạng trong 1 ô, liên kết, ảnh chèn, đường lưới (tắt nếu tệp tắt), màu tab, mức phóng to của trang tính.
// Chưa có: biểu đồ, hình vẽ (shape), định dạng có điều kiện → thông báo dưới trang tính.
// .xls / .csv (ExcelJS không đọc được) → Attachments.js dùng bảng đơn giản của SheetJS.
import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "~/pagesForm/shared/ui";

const LIMIT_ROWS = 1000;
const LIMIT_COLS = 80;
const HEAD_W = 44; // cột số dòng
const HEAD_H = 22; // dòng chữ cột A B C
const EMU_PX = 9525;
const colPx = (w) => Math.max(0, Math.round(w * 7 + 5)); // độ rộng Excel (số ký tự Calibri 11) → px
const rowPx = (pt) => Math.round((pt * 4) / 3);

/* ------------------------------ Màu ------------------------------ */
// Màu "indexed" (tệp Excel đời cũ / màu chuẩn): 0–63, 64 = chữ hệ thống, 65 = nền hệ thống
const INDEXED = [
  "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00", "FF00FF", "00FFFF", "000000", "FFFFFF", "FF0000", "00FF00", "0000FF", "FFFF00",
  "FF00FF", "00FFFF", "800000", "008000", "000080", "808000", "800080", "008080", "C0C0C0", "808080", "9999FF", "993366", "FFFFCC", "CCFFFF",
  "660066", "FF8080", "0066CC", "CCCCFF", "000080", "FF00FF", "FFFF00", "00FFFF", "800080", "800000", "008080", "0000FF", "00CCFF", "CCFFFF",
  "CCFFCC", "FFFF99", "99CCFF", "FF99CC", "CC99FF", "FFCC99", "3366FF", "33CCCC", "99CC00", "FFCC00", "FF9900", "FF6600", "666699", "969696",
  "003366", "339966", "003300", "333300", "993300", "993366", "333399", "333333", "000000", "FFFFFF",
];
// theme mặc định của Office (khi tệp không có theme)
const OFFICE_THEME = ["000000", "FFFFFF", "44546A", "E7E6E6", "4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47", "0563C1", "954F72"];
// chỉ số màu theme trong ô → vị trí trong clrScheme (dk1 lt1 dk2 lt2 accent1..6 hlink folHlink): Excel đảo 0↔1, 2↔3
const THEME_ORDER = [1, 0, 3, 2, 4, 5, 6, 7, 8, 9, 10, 11];

function readTheme(wb) {
  try {
    const xml = wb._themes?.theme1;
    if (!xml) return OFFICE_THEME;
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const scheme = doc.getElementsByTagName("a:clrScheme")[0];
    if (!scheme) return OFFICE_THEME;
    const out = [...scheme.children].map((el) => {
      const c = el.firstElementChild;
      return (c?.getAttribute("val") && c.tagName === "a:srgbClr" ? c.getAttribute("val") : c?.getAttribute("lastClr")) || null;
    });
    return OFFICE_THEME.map((d, i) => out[i] || d);
  } catch {
    return OFFICE_THEME;
  }
}

function hexToHsl(hex) {
  const n = parseInt(hex, 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToHex([h, s, l]) {
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
  }
  return [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}
/** tint của Excel: < 0 tối đi, > 0 sáng lên (theo độ sáng HSL) */
function applyTint(hex, tint) {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex([h, s, tint < 0 ? l * (1 + tint) : l * (1 - tint) + tint]);
}

function colorFn(theme) {
  return (c) => {
    if (!c) return null;
    let hex = null;
    if (typeof c.argb === "string") hex = c.argb.length === 8 ? c.argb.slice(2) : c.argb.length === 6 ? c.argb : null;
    else if (c.theme !== undefined) hex = theme[THEME_ORDER[c.theme]] || null;
    else if (c.indexed !== undefined) hex = INDEXED[c.indexed] || null;
    if (!hex) return null;
    if (c.tint) hex = applyTint(hex, c.tint);
    return `#${hex}`;
  };
}

/* ------------------------------ Định dạng số ------------------------------ */
// trình duyệt dùng dấu thập phân "," (vi-VN) → đổi 1,500,000.5 thành 1.500.000,5 như Excel trên máy tiếng Việt
const COMMA_DECIMAL = (1.5).toLocaleString().includes(",");
const DATE_FIX = { "mm-dd-yy": "dd/mm/yyyy", "m/d/yy": "dd/mm/yyyy", "m/d/yy h:mm": "dd/mm/yyyy h:mm", "d-mmm-yy": "dd-mmm-yy" };
const isDateFmt = (f) => /[dmyhs]/i.test(String(f || "").replace(/"[^"]*"/g, "").replace(/\[[^\]]*\]/g, "").replace(/\\./g, "").replace(/General/gi, ""));
const swapSep = (s) => (COMMA_DECIMAL ? s.replace(/\d[\d.,]*\d|\d/g, (m) => m.replace(/[.,]/g, (ch) => (ch === "." ? "," : "."))) : s);
const serialOf = (d) => d.getTime() / 86400000 + 25569; // ExcelJS trả ngày theo UTC

function formatValue(v, numFmt, SSF) {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    let fmt = DATE_FIX[numFmt] || numFmt;
    if (!fmt || fmt === "General" || !isDateFmt(fmt)) fmt = v.getUTCHours() || v.getUTCMinutes() ? "dd/mm/yyyy hh:mm" : "dd/mm/yyyy";
    try { return SSF ? SSF.format(fmt, serialOf(v)) : v.toISOString().slice(0, 10); } catch { return v.toISOString().slice(0, 10); }
  }
  if (typeof v === "number") {
    const fmt = DATE_FIX[numFmt] || numFmt || "General";
    try {
      const s = SSF ? SSF.format(fmt, v) : String(v);
      return isDateFmt(fmt) ? s : swapSep(s);
    } catch { return swapSep(String(v)); }
  }
  return String(v);
}

/** Giá trị ô ExcelJS → { text | runs (chữ nhiều định dạng), link, kind (number|bool|text) } */
function cellContent(cell, SSF) {
  let v = cell.value;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    if (v.richText) return { runs: v.richText, kind: "text" };
    if (v.hyperlink) return { text: typeof v.text === "object" ? (v.text.richText || []).map((x) => x.text).join("") : String(v.text ?? v.hyperlink), link: v.hyperlink, kind: "text" };
    if ("result" in v || "formula" in v || "sharedFormula" in v) v = v.result;
    if (v && typeof v === "object" && v.error) return { text: v.error, kind: "bool" };
    if (v && typeof v === "object" && !(v instanceof Date)) v = v.richText ? v.richText.map((x) => x.text).join("") : "";
  }
  if (v === null || v === undefined || v === "") return null;
  return { text: formatValue(v, cell.numFmt, SSF), kind: typeof v === "number" || v instanceof Date ? "number" : typeof v === "boolean" ? "bool" : "text" };
}

/* ------------------------------ Kiểu ô ------------------------------ */
function fontCss(font, color) {
  const css = {};
  if (!font) return css;
  if (font.bold) css.fontWeight = 700;
  if (font.italic) css.fontStyle = "italic";
  const deco = [];
  if (font.underline && font.underline !== "none") deco.push("underline");
  if (font.strike) deco.push("line-through");
  if (deco.length) css.textDecoration = deco.join(" ");
  if (font.underline === "double" || font.underline === "doubleAccounting") css.textDecorationStyle = "double";
  if (font.size) css.fontSize = `${(font.size * 4) / 3}px`;
  if (font.name) css.fontFamily = `"${font.name}", Calibri, Carlito, Arial, sans-serif`;
  const c = color(font.color);
  if (c) css.color = c;
  if (font.vertAlign === "superscript") css.verticalAlign = "super";
  if (font.vertAlign === "subscript") css.verticalAlign = "sub";
  return css;
}

const BORDER = {
  thin: [1, "solid"], hair: [1, "solid"], medium: [2, "solid"], thick: [3, "solid"], dotted: [1, "dotted"], dashed: [1, "dashed"],
  mediumDashed: [2, "dashed"], dashDot: [1, "dashed"], mediumDashDot: [2, "dashed"], dashDotDot: [1, "dotted"], mediumDashDotDot: [2, "dotted"],
  slantDashDot: [2, "dashed"], double: [3, "double"],
};
function borderCss(b, color) {
  if (!b?.style || !BORDER[b.style]) return null;
  const [w, s] = BORDER[b.style];
  return `${w}px ${s} ${color(b.color) || "#000"}`;
}

function fillColor(fill, color) {
  if (!fill) return null;
  if (fill.type === "pattern") {
    if (!fill.pattern || fill.pattern === "none") return null;
    return color(fill.fgColor) || (fill.pattern === "solid" ? null : color(fill.bgColor));
  }
  if (fill.type === "gradient") return color(fill.stops?.[0]?.color);
  return null;
}

const colName = (n) => {
  let s = "";
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s;
  return s;
};

/* ------------------------------ Đọc tệp ------------------------------ */
/** ArrayBuffer .xlsx → mô hình hiển thị (chỉ dữ liệu thuần, không giữ đối tượng ExcelJS) */
export async function parseWorkbook(buf) {
  const [{ default: ExcelJS }, XLSX] = await Promise.all([import("exceljs"), import("xlsx").catch(() => null)]);
  const SSF = XLSX?.SSF || XLSX?.default?.SSF || null;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const color = colorFn(readTheme(wb));
  const sheets = [];
  wb.eachSheet((ws) => {
    if (ws.state && ws.state !== "visible") return;
    sheets.push(parseSheet(ws, wb, color, SSF));
  });
  return { sheets };
}

function parseSheet(ws, wb, color, SSF) {
  const view = ws.views?.[0] || {};
  const props = ws.properties || {};
  const defW = props.defaultColWidth || 8.43;
  const defH = props.defaultRowHeight || 15;
  const allRows = ws.rowCount || 0, allCols = ws.columnCount || 0;
  const nRows = Math.min(allRows, LIMIT_ROWS), nCols = Math.min(allCols, LIMIT_COLS);

  // ô gộp
  const merges = Object.values(ws._merges || {}).map((m) => m.model || m).filter((m) => m && m.top);
  const coveredBy = new Map(); // "r:c" → ô chính
  const mergeAt = new Map();   // "r:c" ô chính → vùng gộp
  for (const m of merges) {
    mergeAt.set(`${m.top}:${m.left}`, m);
    for (let r = m.top; r <= m.bottom; r++) for (let c = m.left; c <= m.right; c++) if (r !== m.top || c !== m.left) coveredBy.set(`${r}:${c}`, `${m.top}:${m.left}`);
  }

  // đọc ô + tìm vùng có dữ liệu / định dạng (bỏ dòng, cột trống ở cuối)
  const raw = new Map();
  let lastRow = 0, lastCol = 0;
  for (let r = 1; r <= nRows; r++) {
    const row = ws.getRow(r);
    if (!row.cellCount) continue;
    for (let c = 1; c <= Math.min(row.cellCount, nCols); c++) {
      const cell = row.getCell(c);
      const content = cellContent(cell, SSF);
      if (content?.runs) content.runs = content.runs.map((x) => ({ text: x.text, css: fontCss(x.font, color) }));
      const st = cell.style || {};
      const fill = fillColor(st.fill, color);
      const hasBorder = !!(st.border && ["top", "left", "bottom", "right"].some((k) => st.border[k]?.style));
      if (!content && !fill && !hasBorder) continue;
      raw.set(`${r}:${c}`, { content, st, fill });
      lastRow = Math.max(lastRow, r);
      lastCol = Math.max(lastCol, c);
    }
  }
  for (const m of merges) { if (m.top <= nRows && m.left <= nCols && mergeAt.has(`${m.top}:${m.left}`) && raw.has(`${m.top}:${m.left}`)) { lastRow = Math.max(lastRow, Math.min(m.bottom, nRows)); lastCol = Math.max(lastCol, Math.min(m.right, nCols)); } }

  // ảnh chèn (vị trí theo ô neo + độ lệch EMU)
  const imgs = [];
  try {
    for (const im of ws.getImages?.() || []) {
      const media = wb.getImage(Number(im.imageId));
      const tl = im.range?.tl;
      if (!media?.buffer || !tl) continue;
      imgs.push({ media, tl, br: im.range.br, ext: im.range.ext });
      lastRow = Math.max(lastRow, Math.min(nRows, (tl.nativeRow ?? 0) + 1));
      lastCol = Math.max(lastCol, Math.min(nCols, (tl.nativeCol ?? 0) + 1));
    }
  } catch { /* tệp có ảnh lỗi → bỏ ảnh */ }

  const cols = [];
  for (let c = 1; c <= lastCol; c++) {
    const col = ws.getColumn(c);
    cols.push({ c, width: col.hidden ? 0 : colPx(col.width || defW), hidden: !!col.hidden });
  }
  const rows = [];
  for (let r = 1; r <= lastRow; r++) {
    const row = ws.getRow(r);
    rows.push({ r, height: row.hidden ? 0 : rowPx(row.height || defH), fixed: !!row.height, hidden: !!row.hidden });
  }
  const colW = new Map(cols.map((x) => [x.c, x.width]));
  const rowH = new Map(rows.map((x) => [x.r, x.height]));

  // viền: mỗi ô vẽ viền PHẢI + DƯỚI (lấy của chính ô hoặc viền trái/trên của ô kề) → không bị vẽ 2 lần
  const st = (r, c) => raw.get(`${r}:${c}`)?.st || {};
  const fillAt = (r, c) => raw.get(`${r}:${c}`)?.fill || null;
  const showGrid = view.showGridLines !== false;
  const GRID = "1px solid #d4d4d8";
  const edge = (own, other, filled) => own || other || (filled || !showGrid ? "1px solid transparent" : GRID);

  const cells = new Map();
  for (const { r } of rows) {
    for (const { c } of cols) {
      const key = `${r}:${c}`;
      if (coveredBy.has(key)) continue;
      const m = mergeAt.get(key);
      const bottom = m ? Math.min(m.bottom, lastRow) : r, right = m ? Math.min(m.right, lastCol) : c;
      const cur = raw.get(key);
      const s = cur?.st || {};
      const filled = !!cur?.fill;
      const rightB = edge(borderCss(st(r, right).border?.right, color), borderCss(st(r, right + 1).border?.left, color), filled || !!fillAt(r, right + 1));
      const bottomB = edge(borderCss(st(bottom, c).border?.bottom, color), borderCss(st(bottom + 1, c).border?.top, color), filled || !!fillAt(bottom + 1, c));
      const al = s.alignment || {};
      const content = cur?.content || null;
      const kind = content?.kind;
      const h = al.horizontal && al.horizontal !== "general" ? al.horizontal : kind === "number" ? "right" : kind === "bool" ? "center" : "left";
      let span = { rowSpan: 1, colSpan: 1, width: colW.get(c), height: rowH.get(r) };
      if (m) {
        let w = 0, hh = 0;
        for (let x = c; x <= right; x++) w += colW.get(x) || 0;
        for (let y = r; y <= bottom; y++) hh += rowH.get(y) || 0;
        span = { rowSpan: bottom - r + 1, colSpan: right - c + 1, width: w, height: hh };
      }
      // chữ không xuống dòng được tràn sang ô trống bên phải (như Excel)
      let overflow = false;
      if (content && !al.wrapText && h === "left" && !m) overflow = !raw.get(`${r}:${c + 1}`)?.content && !coveredBy.has(`${r}:${c + 1}`);
      cells.set(key, {
        ...span,
        content,
        css: {
          background: cur?.fill || undefined,
          borderRight: rightB,
          borderBottom: bottomB,
          borderTop: r === 1 ? edge(borderCss(s.border?.top, color), null, filled) : undefined,
          borderLeft: c === 1 ? edge(borderCss(s.border?.left, color), null, filled) : undefined,
          ...fontCss(s.font, color),
        },
        align: {
          h: h === "centerContinuous" || h === "distributed" ? "center" : h === "fill" ? "left" : h,
          v: al.vertical === "top" ? "flex-start" : al.vertical === "middle" || al.vertical === "center" ? "center" : al.vertical === "justify" || al.vertical === "distributed" ? "center" : "flex-end",
          wrap: !!al.wrapText || h === "justify",
          indent: al.indent ? al.indent * 9 : 0,
          rotate: al.textRotation === "vertical" ? "vertical" : al.textRotation === 90 ? "up" : al.textRotation === -90 || al.textRotation === 180 ? "down" : null,
        },
        overflow,
      });
    }
  }

  // toạ độ ảnh (px, gốc = ô A1)
  const colLeft = [0];
  for (let c = 1; c <= Math.max(lastCol, nCols) + 1; c++) colLeft[c] = colLeft[c - 1] + (colW.has(c) ? colW.get(c) : colPx(defW));
  const rowTop = [0];
  for (let r = 1; r <= Math.max(lastRow, nRows) + 1; r++) rowTop[r] = rowTop[r - 1] + (rowH.has(r) ? rowH.get(r) : rowPx(defH));
  const at = (a) => ({ x: (colLeft[a.nativeCol ?? 0] || 0) + (a.nativeColOff || 0) / EMU_PX, y: (rowTop[a.nativeRow ?? 0] || 0) + (a.nativeRowOff || 0) / EMU_PX });
  const images = imgs.map(({ media, tl, br, ext }) => {
    const p = at(tl);
    let w = ext?.width, h = ext?.height;
    if (br && br.nativeCol !== undefined) { const q = at(br); w = q.x - p.x; h = q.y - p.y; }
    const blob = new Blob([media.buffer], { type: `image/${media.extension === "jpg" ? "jpeg" : media.extension || "png"}` });
    return { url: URL.createObjectURL(blob), left: p.x, top: p.y, width: Math.max(4, w || 100), height: Math.max(4, h || 100) };
  }).filter((x) => x.top < (rowTop[lastRow] || 0) + 400);

  return {
    name: ws.name,
    tabColor: color(props.tabColor),
    showGrid,
    zoom: view.zoomScale && view.zoomScale !== 100 ? view.zoomScale / 100 : 1,
    cols: cols.filter((x) => !x.hidden),
    rows: rows.filter((x) => !x.hidden),
    hiddenCols: new Set(cols.filter((x) => x.hidden).map((x) => x.c)),
    hiddenRows: new Set(rows.filter((x) => x.hidden).map((x) => x.r)),
    cells,
    images,
    width: cols.reduce((a, x) => a + x.width, 0),
    cut: allRows > LIMIT_ROWS || allCols > LIMIT_COLS,
    empty: !lastRow || !lastCol,
    hasConditional: !!(ws.conditionalFormattings?.length),
  };
}

/** Giải phóng URL ảnh khi đóng xem trước */
export function releaseWorkbook(book) {
  for (const s of book?.sheets || []) for (const im of s.images || []) URL.revokeObjectURL(im.url);
}

/* ------------------------------ Hiển thị ------------------------------ */
function CellText({ content }) {
  if (content.runs) {
    return content.runs.map((x, i) => <span key={i} style={x.css}>{x.text}</span>);
  }
  if (content.link) return <a href={content.link} target="_blank" rel="noreferrer" className="text-blue-700 underline">{content.text}</a>;
  return content.text;
}

function Sheet({ sheet, zoom }) {
  const totalW = HEAD_W + sheet.width;
  return (
    <div className="relative inline-block min-w-full bg-white" style={{ zoom }}>
      <table className="select-text" style={{ borderCollapse: "separate", borderSpacing: 0, tableLayout: "fixed", width: totalW, fontFamily: 'Calibri, Carlito, Arial, sans-serif', fontSize: "14.67px", color: "#000" }}>
        <colgroup>
          <col style={{ width: HEAD_W }} />
          {sheet.cols.map((c) => <col key={c.c} style={{ width: c.width }} />)}
        </colgroup>
        <thead>
          <tr style={{ height: HEAD_H }}>
            <th className="sticky left-0 top-0 z-30 border-b border-r border-slate-300 bg-slate-100" />
            {sheet.cols.map((c) => (
              <th key={c.c} className="sticky top-0 z-20 overflow-hidden border-b border-r border-slate-300 bg-slate-100 text-center text-[11px] font-normal text-slate-500" style={{ fontFamily: "system-ui, sans-serif" }}>
                {colName(c.c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row) => (
            <tr key={row.r} style={{ height: row.height }}>
              <th className="sticky left-0 z-10 border-b border-r border-slate-300 bg-slate-100 text-center text-[11px] font-normal text-slate-500" style={{ fontFamily: "system-ui, sans-serif" }}>{row.r}</th>
              {sheet.cols.map((col) => {
                const cell = sheet.cells.get(`${row.r}:${col.c}`);
                if (!cell) return null; // ô nằm trong vùng gộp
                const rowSpan = Math.max(1, [...Array(cell.rowSpan)].filter((_, i) => !sheet.hiddenRows.has(row.r + i)).length);
                const colSpan = Math.max(1, [...Array(cell.colSpan)].filter((_, i) => !sheet.hiddenCols.has(col.c + i)).length);
                const a = cell.align;
                const fixedH = row.fixed || cell.rowSpan > 1;
                const inner = {
                  display: "flex", flexDirection: "column", justifyContent: a.v, textAlign: a.h,
                  height: fixedH ? Math.max(0, cell.height - 1) : undefined, minHeight: fixedH ? undefined : Math.max(0, cell.height - 1),
                  padding: `0 2px 0 ${2 + a.indent}px`, whiteSpace: a.wrap ? "pre-wrap" : "pre", overflowWrap: a.wrap ? "anywhere" : undefined,
                  overflow: cell.overflow ? "visible" : "hidden", lineHeight: 1.2,
                };
                if (a.rotate) { inner.writingMode = "vertical-rl"; inner.alignItems = "center"; if (a.rotate === "up") inner.transform = "rotate(180deg)"; }
                return (
                  <td key={col.c} rowSpan={rowSpan > 1 ? rowSpan : undefined} colSpan={colSpan > 1 ? colSpan : undefined}
                    style={{ ...cell.css, padding: 0, verticalAlign: "top", boxSizing: "border-box", overflow: cell.overflow ? "visible" : "hidden", position: cell.overflow ? "relative" : undefined }}>
                    <div style={inner}>{cell.content ? <span><CellText content={cell.content} /></span> : null}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {sheet.images.map((im, i) => (
        <img key={i} src={im.url} alt="" draggable={false} className="pointer-events-none absolute"
          style={{ left: HEAD_W + im.left, top: HEAD_H + im.top, width: im.width, height: im.height }} />
      ))}
    </div>
  );
}

export default function ExcelView({ book }) {
  const [tab, setTab] = useState(0);
  const sheet = book.sheets[tab] || book.sheets[0];
  const [zoom, setZoom] = useState(() => sheet?.zoom || 1);
  const scroller = useRef(null);
  useEffect(() => { setZoom(sheet?.zoom || 1); if (scroller.current) scroller.current.scrollTo(0, 0); }, [sheet]);
  const pct = Math.round(zoom * 100);
  const notes = useMemo(() => [
    sheet?.cut && `Chỉ hiện ${LIMIT_ROWS} dòng × ${LIMIT_COLS} cột đầu`,
    sheet?.hasConditional && "Định dạng có điều kiện không hiện",
  ].filter(Boolean), [sheet]);

  if (!sheet) return <p className="p-6 text-center text-sm text-slate-400">Tệp không có trang tính nào đang hiện</p>;
  return (
    <div className="flex h-full flex-col bg-white" data-excel-view>
      <div ref={scroller} className="min-h-0 flex-1 overflow-auto bg-white">
        {sheet.empty ? <p className="p-6 text-center text-sm text-slate-400">Trang tính trống</p> : <Sheet sheet={sheet} zoom={zoom} />}
      </div>
      {/* thanh dưới như Excel: tab trang tính (có màu tab) + phóng to/thu nhỏ */}
      <div className="flex shrink-0 items-center gap-2 border-t border-slate-300 bg-slate-100 px-2 py-1">
        <div className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto">
          {book.sheets.map((s, i) => (
            <button key={`${s.name}${i}`} type="button" onClick={() => setTab(i)}
              className={cn("shrink-0 rounded-b-md border-b-[3px] px-3 py-1 text-xs", i === tab ? "bg-white font-semibold text-emerald-700 shadow-sm" : "text-slate-600 hover:bg-white/60")}
              style={{ borderBottomColor: s.tabColor || (i === tab ? "#047857" : "transparent") }}>
              {s.name}
            </button>
          ))}
        </div>
        {notes.length > 0 && <span className="hidden text-[11px] text-amber-700 sm:inline">{notes.join(" · ")} — tải về để xem đủ</span>}
        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
          <button type="button" className="rounded p-1 hover:bg-white" onClick={() => setZoom((z) => Math.max(0.3, Math.round((z - 0.1) * 10) / 10))} title="Thu nhỏ"><Minus className="h-3.5 w-3.5" /></button>
          <button type="button" className="w-11 rounded py-0.5 text-center hover:bg-white" onClick={() => setZoom(1)} title="Về 100%">{pct}%</button>
          <button type="button" className="rounded p-1 hover:bg-white" onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 10) / 10))} title="Phóng to"><Plus className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
