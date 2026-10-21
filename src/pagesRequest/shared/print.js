// MẪU IN đề xuất (module 18) — giống "In đề xuất" của request.base.vn. 2 loại mẫu in:
//   • thiết kế ngay trên web (file này)   • tải lên tệp Word .docx có biến ${...} (docxTemplate.js — dùng chung printValues)
// Mẫu = khổ giấy (A4/A5, dọc/ngang, lề, phông) + danh sách KHỐI; chữ trong khối có biến ${...} lấy từ dữ liệu đề xuất.
//   renderPrintHtml(tpl, request, { mode })  → HTML trang in đầy đủ: mode "screen" (xem trước, có vạch chia trang),
//                                              "print" (in / lưu PDF bằng hộp in của trình duyệt), "word" (.doc mở bằng Word)
//   printVariables(fields, flow)             → danh sách biến chèn được (trang thiết kế)
//   defaultTemplate(type) · sampleRequest(type) · printDocument(html) · downloadWord(html, name)
// AN TOÀN: mẫu do admin soạn nhưng KHÔNG chèn HTML thô — mọi chữ được escape, màu/số/căn lề kiểm theo danh sách cho phép.
// Đánh dấu chữ đơn giản: **đậm**  *nghiêng*  __gạch chân__  (xuống dòng giữ nguyên).
// Lưu ở backend: rq_Types.options.printTemplates (definition.js normalizePrintTemplates — chỉ kiểm khung + kích thước).
import { cellText, columnSum, computeRow, displayValue, isNumericCol, moneyToWords, uid, withComputed } from "./fieldTypes";
import { APPROVER_STATUS, STATUS, fmtDateTime, fmtYmd } from "./format";

export const PAPER = { A4: [210, 297], A5: [148, 210] };
export const PRINT_FONTS = ["Times New Roman", "Arial", "Calibri", "Tahoma"];
export const BLOCK_TYPES = [
  { type: "heading", label: "Tiêu đề" },
  { type: "text", label: "Đoạn văn" },
  { type: "grid", label: "Bảng tự do (gộp ô, kẻ khung)" },
  { type: "fields", label: "Danh sách trường thông tin" },
  { type: "items", label: "Bảng chi tiết (từ trường bảng)" },
  { type: "signatures", label: "Khối ký duyệt" },
  { type: "spacer", label: "Khoảng trống" },
  { type: "divider", label: "Đường kẻ ngang" },
  { type: "pagebreak", label: "Ngắt trang" },
];
export const BLOCK_LABEL = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b.label]));

/* ------------------------------ tiện ích ------------------------------ */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const n = (v, min, max, d) => { const x = Number(v); return Number.isFinite(x) ? Math.min(max, Math.max(min, x)) : d; };
const color = (c) => (/^#[0-9a-fA-F]{3,8}$/.test(c || "") ? c : null);
const align = (a) => (["left", "center", "right", "justify"].includes(a) ? a : "left");
const valign = (a) => (["top", "middle", "bottom"].includes(a) ? a : "top");
const pad2 = (x) => String(x).padStart(2, "0");

/** "Mục đích mua" → "muc_dich_mua" (như biến của Base) */
export const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "truong";

const BUILTIN = [
  ["ma_de_xuat", "Mã đề xuất", "Thông tin chung"], ["tieu_de", "Tiêu đề", "Thông tin chung"], ["mau_de_xuat", "Tên mẫu đề xuất", "Thông tin chung"],
  ["trang_thai", "Trạng thái", "Thông tin chung"], ["muc_do", "Mức độ (Gấp / Bình thường)", "Thông tin chung"], ["han_xu_ly", "Hạn xử lý", "Thông tin chung"],
  ["ngay_tao", "Ngày giờ gửi", "Thông tin chung"], ["ngay_tao_ngay", "Ngày gửi (dd/mm/yyyy)", "Thông tin chung"],
  ["ngay_tao_chu", "Ngày gửi bằng chữ (ngày … tháng … năm …)", "Thông tin chung"], ["ngay_hoan_tat", "Ngày duyệt xong / kết thúc", "Thông tin chung"],
  ["ngay_in", "Ngày in", "Thông tin chung"],
  ["nguoi_de_xuat", "Người đề xuất", "Người đề xuất"], ["msnv", "MSNV", "Người đề xuất"], ["phong_ban", "Phòng ban", "Người đề xuất"],
  ["to", "Tổ", "Người đề xuất"], ["chuc_danh", "Chức danh", "Người đề xuất"],
  ["nguoi_duyet_cuoi", "Người duyệt cuối cùng", "Duyệt"], ["thoi_gian_duyet_cuoi", "Thời gian duyệt cuối cùng", "Duyệt"],
];
const BUILTIN_SET = new Set(BUILTIN.map((b) => b[0]));
const STEP_PARTS = [["nguoi", "người duyệt"], ["thoi_gian", "thời gian duyệt"], ["trang_thai", "trạng thái"], ["y_kien", "ý kiến / ghi chú"]];

/** Trường → tên biến (slug theo nhãn; trùng tên có sẵn → "truong_…"; trùng nhau → "_2") */
export function fieldTokens(fields) {
  const used = new Set(BUILTIN_SET);
  const out = [];
  for (const f of fields || []) {
    if (f.type === "section") continue;
    let s = slugify(f.label);
    if (BUILTIN_SET.has(s)) s = `truong_${s}`;
    let k = s, i = 2;
    while (used.has(k)) k = `${s}_${i++}`;
    used.add(k);
    out.push({ token: k, field: f });
  }
  return out;
}

/** Bước duyệt → tên biến "duyet_<tên bước>" (+ "buoc_<số>") */
export function stepTokens(names) {
  const used = new Set();
  return (names || []).map((name, i) => {
    let s = `duyet_${slugify(name)}`, k = s, j = 2;
    while (used.has(k)) k = `${s}_${j++}`;
    used.add(k);
    return { token: k, name, no: i + 1 };
  });
}

/** Biến chèn được (trang thiết kế): [{ token, label, group }] */
export function printVariables(fields, flow) {
  const out = BUILTIN.map(([token, label, group]) => ({ token, label, group }));
  for (const { token, field } of fieldTokens(fields)) {
    out.push({ token, label: field.label + (field.type === "table" ? " (cả bảng)" : ""), group: "Trường của mẫu" });
    if (field.type === "currency" || field.type === "number") out.push({ token: `${token}|chu`, label: `${field.label} — bằng chữ`, group: "Trường của mẫu" });
  }
  for (const s of stepTokens((flow || []).map((x) => x.name))) {
    for (const [p, l] of STEP_PARTS) out.push({ token: `${s.token}_${p}`, label: `${s.name} — ${l}`, group: "Duyệt" });
  }
  return out;
}

/* ------------------------------ dữ liệu 1 đề xuất → giá trị biến ------------------------------ */
function dateWords(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
  return m ? `ngày ${m[3]} tháng ${m[2]} năm ${m[1]}` : "";
}
const nowLocal = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`; };

/** { name → { text, raw, html? } } — html: bảng (đã escape từng ô) khi biến là cả 1 trường bảng */
function buildVars(r, userName) {
  const v = new Map();
  const put = (k, text, raw) => v.set(k, { text: text ?? "", raw });
  put("ma_de_xuat", r.requestId ? String(r.requestId) : "");
  put("tieu_de", r.title);
  put("mau_de_xuat", r.typeName);
  put("trang_thai", STATUS[r.status]?.label || "");
  put("muc_do", r.priority === "high" ? "Gấp" : "Bình thường");
  put("han_xu_ly", fmtYmd(r.deadline));
  put("ngay_tao", fmtDateTime(r.createdAt));
  put("ngay_tao_ngay", fmtYmd((r.createdAt || "").slice(0, 10)));
  put("ngay_tao_chu", dateWords(r.createdAt));
  put("ngay_hoan_tat", r.finishedAt ? fmtDateTime(r.finishedAt) : "");
  put("ngay_in", fmtDateTime(nowLocal()));
  put("nguoi_de_xuat", r.requesterName);
  put("msnv", r.msnv);
  put("phong_ban", r.departmentName);
  put("to", r.teamName);
  put("chuc_danh", r.jobTitleName);

  for (const { token, field: f } of fieldTokens(r.fields)) {
    const raw = r.values?.[f.key];
    if (f.type === "table") v.set(token, { text: "", raw, html: itemsTable(f, { showTotal: true }, raw) });
    else if (f.type === "files") put(token, (r.files || []).filter((x) => x.fieldKey === f.key).map((x) => x.name).join(", "));
    else put(token, displayValue(f, raw, userName), raw);
  }

  // duyệt: nhóm theo tên bước (bản chụp quy trình lúc gửi) + theo số bước
  const steps = [];
  for (const a of r.approvers || []) {
    let s = steps.find((x) => x.no === a.stepNo);
    if (!s) steps.push((s = { no: a.stepNo, name: a.stepName, rows: [] }));
    s.rows.push(a);
  }
  const stepVals = (s) => {
    const acted = s.rows.filter((a) => ["approved", "rejected", "returned"].includes(a.status));
    const shown = acted.length ? acted : s.rows.filter((a) => a.status !== "skipped");
    const last = [...acted].sort((a, b) => String(a.actedAt).localeCompare(String(b.actedAt))).pop();
    return {
      nguoi: shown.map((a) => a.fullName || userName(a.userId)).join(", "),
      thoi_gian: last?.actedAt ? fmtDateTime(last.actedAt) : "",
      trang_thai: acted.length ? APPROVER_STATUS[last.status]?.label || "" : s.rows.some((a) => a.status === "pending") ? "Đang chờ duyệt" : "Chưa tới lượt",
      y_kien: acted.map((a) => a.note).filter(Boolean).join("; "),
    };
  };
  const byName = new Map(stepTokens(steps.map((s) => s.name)).map((t, i) => [t.token, steps[i]]));
  for (const [token, s] of byName) for (const [p, val] of Object.entries(stepVals(s))) put(`${token}_${p}`, val);
  for (const s of steps) {
    put(`buoc_${s.no}_ten`, s.name);
    for (const [p, val] of Object.entries(stepVals(s))) put(`buoc_${s.no}_${p}`, val);
  }
  const lastOk = (r.approvers || []).filter((a) => a.status === "approved").sort((a, b) => String(a.actedAt).localeCompare(String(b.actedAt))).pop();
  put("nguoi_duyet_cuoi", lastOk ? lastOk.fullName || userName(lastOk.userId) : "");
  put("thoi_gian_duyet_cuoi", lastOk?.actedAt ? fmtDateTime(lastOk.actedAt) : "");
  return v;
}

/** Giá trị mọi biến của 1 đề xuất: Map tên → { text, raw } (dùng chung cho mẫu thiết kế trên web và mẫu Word) */
export const printValues = (r, userName) => buildVars(r, userName || ((id) => `#${id}`));

/** Bộ lọc sau dấu |: chu (số tiền bằng chữ) · so (số không đơn vị) · hoa (VIẾT HOA) · thuong (viết thường) */
export function applyFilter(val, filter) {
  if (!filter) return val.text;
  const num = typeof val.raw === "number" ? val.raw : Number(String(val.raw ?? "").replace(/[^\d.-]/g, ""));
  if (filter === "chu") return Number.isFinite(num) && String(val.raw ?? "") !== "" ? moneyToWords(num) : "";
  if (filter === "so") return Number.isFinite(num) && String(val.raw ?? "") !== "" ? num.toLocaleString("vi-VN", { maximumFractionDigits: 4 }) : val.text;
  if (filter === "hoa") return val.text.toUpperCase();
  if (filter === "thuong") return val.text.toLowerCase();
  return val.text;
}

/** Chữ có biến + đánh dấu → HTML an toàn. markUnknown: biến không có → hiện đỏ (xem trước khi thiết kế) */
function rich(str, vars, ctx) {
  const parts = [];
  const marked = String(str ?? "").replace(/\$\{\s*([a-zA-Z0-9_]+)\s*(?:\|\s*([a-z]+)\s*)?\}/g, (m, name, filter) => {
    parts.push({ name, filter, src: m });
    return `${parts.length - 1}`; // dấu giữ chỗ (ký tự vùng riêng — không bị escape / đánh dấu chữ)
  });
  let html = esc(marked)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/__(.+?)__/g, "<u>$1</u>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<i>$2</i>")
    .replace(/\n/g, "<br>");
  html = html.replace(/(\d+)/g, (_, i) => {
    const p = parts[Number(i)];
    const val = vars.get(p.name);
    if (!val) return ctx.markUnknown ? `<span style="color:#dc2626;background:#fee2e2">${esc(p.src)}</span>` : "";
    if (val.html && !p.filter) return val.html;
    return esc(applyFilter(val, p.filter)).replace(/\n/g, "<br>");
  });
  return html;
}

/* ------------------------------ khối → HTML ------------------------------ */
/** Bảng chi tiết: f = trường bảng, b = cấu hình in (cột, dòng tổng, số dòng tối thiểu), rows = giá trị */
function itemsTable(f, b, rows) {
  if (!f || f.type !== "table") return "";
  const cols = f.columns || [];
  const list = Array.isArray(rows) ? rows : [];
  const spec = Array.isArray(b.columns) && b.columns.length ? b.columns : [{ src: "#", label: "TT" }, ...cols.map((c) => ({ src: c.key, label: c.label }))];
  const use = spec.filter((s) => s.src === "#" || cols.some((c) => c.key === s.src));
  const widths = use.map((s) => n(s.w, 0, 100, 0));
  const total = widths.reduce((a, x) => a + x, 0);
  const fs = b.fontSize ? `font-size:${n(b.fontSize, 6, 20, 11)}pt;` : "";
  let h = `<table class="t b-all" style="${fs}"><colgroup>${use.map((s, i) => `<col${total ? ` style="width:${(widths[i] / total) * 100}%"` : ""}>`).join("")}</colgroup>`;
  h += `<thead><tr>${use.map((s) => `<th style="text-align:center">${esc(s.label ?? "")}</th>`).join("")}</tr></thead><tbody>`;
  const minRows = n(b.minRows, 0, 50, 0);
  const all = [...list, ...Array.from({ length: Math.max(0, minRows - list.length) }, () => null)];
  all.forEach((row, i) => {
    h += `<tr>${use.map((s) => {
      if (s.src === "#") return `<td style="text-align:center">${row ? i + 1 : "&nbsp;"}</td>`;
      const c = cols.find((x) => x.key === s.src);
      const val = row ? cellText(cols, c, row[c.key]) : "";
      return `<td style="text-align:${s.align ? align(s.align) : isNumericCol(c) ? "right" : "left"}">${esc(val).replace(/\n/g, "<br>") || "&nbsp;"}</td>`;
    }).join("")}</tr>`;
  });
  h += "</tbody>";
  const sums = use.map((s) => { const c = cols.find((x) => x.key === s.src); return c && isNumericCol(c) && c.sum ? cellText(cols, c, columnSum(cols, list, c.key)) || "0" : null; });
  if (b.showTotal !== false && sums.some((x) => x !== null)) {
    const first = sums.findIndex((x) => x !== null);
    h += `<tfoot><tr>${first > 0 ? `<td colspan="${first}" style="text-align:center"><b>${esc(b.totalLabel || "Tổng cộng")}</b></td>` : ""}${use.slice(Math.max(first, 0)).map((s, j) => {
      const v = sums[first + j];
      return `<td style="text-align:right"><b>${v === null ? "" : esc(v)}</b></td>`;
    }).join("")}</tr></tfoot>`;
  }
  return `${h}</table>`;
}

function gridHtml(b, vars, ctx) {
  const cols = (Array.isArray(b.cols) && b.cols.length ? b.cols : [1]).map((w) => n(w, 1, 100, 10));
  const sum = cols.reduce((a, x) => a + x, 0);
  const rows = Array.isArray(b.rows) ? b.rows : [];
  const covered = new Set();
  const border = ["all", "outer", "none", "inner"].includes(b.border) ? b.border : "all";
  const fs = b.fontSize ? `font-size:${n(b.fontSize, 6, 28, 12)}pt;` : "";
  let h = `<table class="t b-${border}" style="${fs}"><colgroup>${cols.map((w) => `<col style="width:${(w / sum) * 100}%">`).join("")}</colgroup>`;
  rows.forEach((row, r) => {
    const height = row?.h ? `height:${n(row.h, 3, 200, 8)}mm` : "";
    h += `<tr style="${height}">`;
    cols.forEach((_, c) => {
      if (covered.has(`${r}:${c}`)) return;
      const cell = row?.cells?.[c] || {};
      const cs = Math.min(n(cell.cs, 1, cols.length - c, 1), cols.length - c);
      const rs = Math.min(n(cell.rs, 1, rows.length - r, 1), rows.length - r);
      for (let y = r; y < r + rs; y++) for (let x = c; x < c + cs; x++) if (y !== r || x !== c) covered.add(`${y}:${x}`);
      const st = [
        `text-align:${align(cell.a)}`, `vertical-align:${valign(cell.v)}`,
        cell.b ? "font-weight:bold" : "", cell.i ? "font-style:italic" : "", cell.u ? "text-decoration:underline" : "",
        cell.s ? `font-size:${n(cell.s, 6, 40, 12)}pt` : "", color(cell.bg) ? `background:${color(cell.bg)}` : "", color(cell.c) ? `color:${color(cell.c)}` : "",
        cell.up ? "text-transform:uppercase" : "",
      ].filter(Boolean).join(";");
      h += `<td${cs > 1 ? ` colspan="${cs}"` : ""}${rs > 1 ? ` rowspan="${rs}"` : ""} style="${st}">${rich(cell.t, vars, ctx) || "&nbsp;"}</td>`;
    });
    h += "</tr>";
  });
  return `${h}</table>`;
}

function blockHtml(b, vars, ctx, r) {
  const mt = b.mt ? `margin-top:${n(b.mt, 0, 50, 0)}mm;` : "";
  switch (b.type) {
    case "heading":
    case "text": {
      const st = `${mt}text-align:${align(b.align || (b.type === "heading" ? "center" : "left"))};font-size:${n(b.size, 6, 40, b.type === "heading" ? 16 : ctx.fontSize)}pt;`
        + `${b.bold ?? b.type === "heading" ? "font-weight:bold;" : ""}${b.italic ? "font-style:italic;" : ""}${b.upper ? "text-transform:uppercase;" : ""}`
        + `${color(b.color) ? `color:${color(b.color)};` : ""}`;
      return `<div class="blk" style="${st}">${rich(b.text, vars, ctx) || "&nbsp;"}</div>`;
    }
    case "grid":
      return `<div class="blk" style="${mt}">${gridHtml(b, vars, ctx)}</div>`;
    case "fields": {
      const toks = fieldTokens(r.fields).filter((x) => !["files"].includes(x.field.type));
      const pick = Array.isArray(b.keys) && b.keys.length ? b.keys.map((k) => toks.find((x) => x.field.key === k)).filter(Boolean) : toks;
      const two = b.columns === 2;
      const lw = n(b.labelWidth, 10, 60, 30);
      const cls = b.border ? "t b-all" : "t";
      const cells = [];
      for (const { token, field } of pick) {
        if (field.type === "table") { cells.push({ full: true, html: `<div style="margin:2pt 0"><b>${esc(field.label)}</b></div>${vars.get(token)?.html || ""}` }); continue; }
        const text = esc(vars.get(token)?.text || "").replace(/\n/g, "<br>");
        cells.push({ label: esc(field.label), html: field.type === "currency" ? `<b>${text}</b>` : text });
      }
      let h = `<table class="${cls}">`;
      if (two) h += `<colgroup><col style="width:${lw / 2}%"><col style="width:${50 - lw / 2}%"><col style="width:${lw / 2}%"><col style="width:${50 - lw / 2}%"></colgroup>`;
      else h += `<colgroup><col style="width:${lw}%"><col style="width:${100 - lw}%"></colgroup>`;
      for (let i = 0; i < cells.length;) {
        const a = cells[i];
        if (a.full) { h += `<tr><td colspan="${two ? 4 : 2}">${a.html}</td></tr>`; i++; continue; }
        if (two && cells[i + 1] && !cells[i + 1].full) {
          const c = cells[i + 1];
          h += `<tr><td>${a.label}:</td><td>${a.html || "&nbsp;"}</td><td>${c.label}:</td><td>${c.html || "&nbsp;"}</td></tr>`;
          i += 2;
        } else {
          h += `<tr><td>${a.label}:</td><td${two ? ' colspan="3"' : ""}>${a.html || "&nbsp;"}</td></tr>`;
          i++;
        }
      }
      return `<div class="blk" style="${mt}">${h}</table></div>`;
    }
    case "items": {
      const f = (r.fields || []).find((x) => x.key === b.field && x.type === "table");
      if (!f) return ctx.markUnknown ? `<div class="blk" style="color:#dc2626">[Bảng chi tiết: chưa chọn trường bảng]</div>` : "";
      return `<div class="blk" style="${mt}">${b.title ? `<div style="margin-bottom:2pt"><b>${rich(b.title, vars, ctx)}</b></div>` : ""}${itemsTable(f, b, r.values?.[f.key])}</div>`;
    }
    case "signatures": {
      const cols = (Array.isArray(b.cols) ? b.cols : []).slice(0, 8);
      if (!cols.length) return "";
      const hgt = n(b.height, 5, 80, 22);
      let h = b.dateLine ? `<div style="text-align:right;font-style:italic;margin-bottom:2pt">${rich(b.dateLine, vars, ctx)}</div>` : "";
      h += `<table class="t sig"><tr>${cols.map((c) => `<td style="width:${100 / cols.length}%;text-align:center;vertical-align:top">`
        + `<b>${rich(c.title, vars, ctx)}</b>${c.sub ? `<div style="font-style:italic;font-size:90%">${rich(c.sub, vars, ctx)}</div>` : ""}`
        + `<div style="height:${hgt}mm"></div><b>${rich(c.name, vars, ctx)}</b>${c.note ? `<div style="font-size:90%">${rich(c.note, vars, ctx)}</div>` : ""}</td>`).join("")}</tr></table>`;
      return `<div class="blk keep" style="${mt}">${h}</div>`;
    }
    case "spacer": return `<div style="height:${n(b.height, 1, 200, 5)}mm"></div>`;
    case "divider": return `<hr style="${mt}border:0;border-top:${n(b.weight, 0.5, 3, 0.75)}pt ${b.dashed ? "dashed" : "solid"} #000;margin:3pt 0">`;
    case "pagebreak": return ctx.mode === "screen"
      ? `<div style="border-top:1px dashed #94a3b8;margin:4mm 0;text-align:center;color:#94a3b8;font:9pt Arial">— ngắt trang —</div>`
      : `<div style="page-break-after:always;break-after:page"></div>`;
    default: return "";
  }
}

/**
 * Trang in đầy đủ (HTML) của 1 đề xuất.
 * @param tpl  mẫu in { paper, orientation, margins, font, fontSize, blocks }
 * @param r    chi tiết đề xuất (như GET /requests/:id): fields, values, approvers, files, requesterName…
 * @param opt  { mode: "screen" | "print" | "word", zoom, markUnknown, userName }
 */
export function renderPrintHtml(tpl, r, opt = {}) {
  const mode = opt.mode || "print";
  const [pw, ph] = PAPER[tpl.paper] || PAPER.A4;
  const [W, H] = tpl.orientation === "landscape" ? [ph, pw] : [pw, ph];
  const m = tpl.margins || {};
  const mg = [n(m.top, 0, 50, 15), n(m.right, 0, 50, 12), n(m.bottom, 0, 50, 15), n(m.left, 0, 50, 15)];
  const font = PRINT_FONTS.includes(tpl.font) ? tpl.font : "Times New Roman";
  const fontSize = n(tpl.fontSize, 7, 20, 12);
  const ctx = { mode, fontSize, markUnknown: !!opt.markUnknown };
  const vars = buildVars(r, opt.userName || ((id) => `#${id}`));
  const body = (tpl.blocks || []).map((b) => blockHtml(b, vars, ctx, r)).join("\n");
  const title = esc(`${r.typeName || "Đề xuất"}${r.requestId ? ` #${r.requestId}` : ""}`);
  const base = `body{font-family:"${font}",serif;font-size:${fontSize}pt;color:#000;line-height:1.3}
table.t{border-collapse:collapse;width:100%;table-layout:fixed}
table.t td,table.t th{padding:1.5pt 4pt;vertical-align:top;word-wrap:break-word}
.b-all td,.b-all th{border:0.75pt solid #000}
table.b-outer{border:0.75pt solid #000}
table.b-inner{border-style:hidden}.b-inner td{border:0.75pt solid #000}
table.sig td{border:0}
.blk{margin:0 0 4pt}
tr,.keep{page-break-inside:avoid;break-inside:avoid}
thead{display:table-header-group}`;
  if (mode === "word") {
    // Word mở được tệp HTML (.doc): khổ giấy + lề theo cú pháp mso
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${title}</title>
<style>@page WordSection1{size:${W / 10}cm ${H / 10}cm;margin:${mg.map((x) => `${x}mm`).join(" ")};mso-page-orientation:${tpl.orientation === "landscape" ? "landscape" : "portrait"}}
div.WordSection1{page:WordSection1}${base}</style></head><body><div class="WordSection1">${body}</div></body></html>`;
  }
  if (mode === "screen") {
    // xem trước: tờ giấy đúng khổ (mm), vạch xám mỗi khi hết 1 trang
    const zoom = n(opt.zoom, 0.2, 3, 1);
    return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${base}
html{background:#e2e8f0}body{margin:0;padding:12px 0}
.sheet{box-sizing:border-box;width:${W}mm;min-height:${H}mm;margin:0 auto;padding:${mg.map((x) => `${x}mm`).join(" ")};background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);zoom:${zoom};
background-image:repeating-linear-gradient(to bottom,transparent 0,transparent calc(${H}mm - 1px),#94a3b8 calc(${H}mm - 1px),#94a3b8 ${H}mm)}
</style></head><body><div class="sheet">${body}</div></body></html>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>@page{size:${tpl.paper || "A4"} ${tpl.orientation === "landscape" ? "landscape" : "portrait"};margin:${mg.map((x) => `${x}mm`).join(" ")}}
html,body{margin:0;padding:0}${base}</style></head><body>${body}</body></html>`;
}

/** In (hoặc "Lưu dưới dạng PDF" trong hộp in) bằng iframe ẩn — không mở tab mới */
export function printDocument(html) {
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(f);
  const doc = f.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    try { f.contentWindow.focus(); f.contentWindow.print(); } catch { /* bỏ qua */ }
    window.focus(); // trả con trỏ về trang — nếu không, phím Esc rơi vào khung in ẩn, hộp "In đề xuất" không đóng được
    setTimeout(() => f.remove(), 60000); // giữ đủ lâu cho hộp in (Safari in bất đồng bộ)
  };
  if (doc.readyState === "complete") setTimeout(go, 50);
  else f.onload = go;
}

/** Tải tệp .doc (HTML Word) — mở bằng Microsoft Word, sửa tiếp được */
export function downloadWord(html, name) {
  const blob = new Blob(["﻿", html], { type: "application/msword" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${String(name || "de-xuat").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 100)}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

/* ------------------------------ mẫu dựng sẵn + dữ liệu mẫu ------------------------------ */
const cell = (t, extra) => ({ t, ...extra });
/** T("nguoi_de_xuat") → "${nguoi_de_xuat}" (viết thẳng chuỗi "${…}" thì ESLint báo no-template-curly-in-string) */
export const T = (name) => `$${"{"}${name}}`;
export const newBlock = (type) => {
  switch (type) {
    case "heading": return { id: uid("b"), type, text: "TIÊU ĐỀ", align: "center", size: 16, bold: true };
    case "text": return { id: uid("b"), type, text: "", align: "left" };
    case "grid": return { id: uid("b"), type, border: "all", cols: [1, 1], rows: [{ cells: [cell(""), cell("")] }, { cells: [cell(""), cell("")] }] };
    case "fields": return { id: uid("b"), type, keys: [], columns: 1, labelWidth: 30 };
    case "items": return { id: uid("b"), type, field: null, columns: [], showTotal: true, totalLabel: "Tổng cộng", minRows: 0 };
    case "signatures": return { id: uid("b"), type, dateLine: "", height: 22, cols: [{ title: "Người đề nghị", sub: "(Ký, ghi rõ họ tên)", name: T("nguoi_de_xuat") }] };
    case "spacer": return { id: uid("b"), type, height: 5 };
    default: return { id: uid("b"), type };
  }
};

/** Cột in của bảng chi tiết = TT + mọi cột của trường bảng */
export const itemColumnsOf = (f) => [{ src: "#", label: "TT", w: 6, align: "center" }, ...(f?.columns || []).map((c) => ({ src: c.key, label: c.label, w: c.type === "text" ? 30 : 14 }))];

/** Mẫu in tự dựng từ trường + quy trình của mẫu đề xuất (giống bố cục phiếu DAMY): đầu phiếu, khối duyệt, nội dung, bảng chi tiết, ký tên */
export function defaultTemplate(type) {
  const fields = type.fields || [];
  const steps = stepTokens((type.flow || []).map((s) => s.name));
  const tables = fields.filter((f) => f.type === "table");
  const sumF = fields.find((f) => f.sumOf);
  const wordsF = fields.find((f) => f.wordsOf);
  const ftoks = fieldTokens(fields);
  const tokOf = (f) => ftoks.find((x) => x.field.key === f.key)?.token;
  const other = fields.filter((f) => !["section", "files", "table"].includes(f.type) && f !== sumF && f !== wordsF).map((f) => f.key);
  const blocks = [
    {
      id: uid("b"), type: "grid", border: "all", cols: [24, 52, 24],
      rows: [
        { h: 16, cells: [cell("THUẬN HƯNG LONG AN", { b: true, a: "center", v: "middle", s: 14 }), cell(String(type.name || "PHIẾU ĐỀ XUẤT").toUpperCase(), { b: true, a: "center", v: "middle", s: 18 }), cell(`Số: ${T("ma_de_xuat")}\nNgày: ${T("ngay_tao_ngay")}`, { v: "middle", s: 10 })] },
      ],
    },
  ];
  if (steps.length) {
    // hàng ký duyệt như phiếu DAMY: bước cuối bên trái … người đề nghị bên phải
    const sc = [...steps.slice().reverse().map((s) => cell(`**${s.name}**\n${T(`${s.token}_nguoi`)}\n${T(`${s.token}_thoi_gian`)}\n${T(`${s.token}_trang_thai`)}`, { a: "center", s: 10 })),
      cell(`**Người đề nghị**\n${T("nguoi_de_xuat")}\n${T("ngay_tao")}`, { a: "center", s: 10 })];
    blocks.push({ id: uid("b"), type: "grid", border: "all", cols: sc.map(() => 1), rows: [{ cells: sc }] });
  }
  blocks.push({
    id: uid("b"), type: "grid", border: "all", cols: [22, 78],
    rows: [{ cells: [cell("Tiêu đề:", { b: true }), cell(T("tieu_de"))] }, { cells: [cell("Người đề nghị:", { b: true }), cell(`${T("nguoi_de_xuat")} — ${T("phong_ban")}`)] }],
  });
  if (other.length) blocks.push({ id: uid("b"), type: "fields", keys: other, columns: 1, labelWidth: 30, border: true });
  for (const t of tables) blocks.push({ id: uid("b"), type: "items", field: t.key, title: `${t.label}:`, columns: itemColumnsOf(t), showTotal: true, totalLabel: "Tổng cộng", minRows: 0 });
  if (sumF) blocks.push({ id: uid("b"), type: "text", text: `**${sumF.label}:** ${T(tokOf(sumF))} — *Bằng chữ: ${T(`${tokOf(sumF)}|chu`)}*` });
  blocks.push({
    id: uid("b"), type: "signatures", dateLine: `Long An, ${T("ngay_tao_chu")}`, height: 22,
    cols: [{ title: "Người đề nghị", sub: "(Ký, ghi rõ họ tên)", name: T("nguoi_de_xuat") }, ...steps.map((s) => ({ title: s.name, sub: "(Ký, ghi rõ họ tên)", name: T(`${s.token}_nguoi`) }))].slice(0, 5),
  });
  return { id: uid("p"), name: `Mẫu in ${type.name || ""}`.trim(), paper: "A4", orientation: "portrait", margins: { top: 15, right: 12, bottom: 15, left: 15 }, font: "Times New Roman", fontSize: 12, isDefault: true, blocks };
}

/** Dữ liệu mẫu để xem trước khi chưa chọn đề xuất thật */
export function sampleRequest(type, me) {
  const fields = type.fields || [];
  const values = {};
  for (const f of fields) {
    if (f.sumOf || f.wordsOf) continue;
    switch (f.type) {
      case "text": values[f.key] = `(${f.label})`; break;
      case "textarea": values[f.key] = `Nội dung mẫu cho "${f.label}"`; break;
      case "number": values[f.key] = 10; break;
      case "currency": values[f.key] = 1500000; break;
      case "date": values[f.key] = new Date().toISOString().slice(0, 10); break;
      case "daterange": values[f.key] = { from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) }; break;
      case "select": if (f.options?.[0]) values[f.key] = f.options[0].id; break;
      case "multiselect": values[f.key] = (f.options || []).slice(0, 2).map((o) => o.id); break;
      case "checkbox": values[f.key] = true; break;
      case "user": if (me?.userId) values[f.key] = f.multiple ? [me.userId] : me.userId; break;
      case "table": {
        const cols = f.columns || [];
        values[f.key] = [1, 2].map((i) => computeRow(cols, Object.fromEntries(cols.filter((c) => c.type !== "formula").map((c) => [c.key,
          c.type === "number" ? i * 2 : c.type === "currency" ? i * 250000 : c.type === "date" ? new Date().toISOString().slice(0, 10) : `${c.label} ${i}`]))));
        break;
      }
      default: break;
    }
  }
  const now = nowLocal();
  const approvers = (type.flow || []).map((s, i) => ({ id: i + 1, stepNo: i + 1, stepName: s.name, userId: 0, fullName: `Người duyệt ${s.name}`, status: i === 0 ? "approved" : i === 1 ? "pending" : "waiting", note: i === 0 ? "Đồng ý" : null, actedAt: i === 0 ? now : null }));
  return {
    requestId: 123, typeName: type.name, title: `${type.name} - ${me?.fullName || "Nguyễn Văn A"}`, requesterName: me?.fullName || "Nguyễn Văn A", msnv: me?.msnv || "NV001",
    departmentName: me?.departmentName || "Phòng Tổng Hợp", teamName: me?.teamName || "", jobTitleName: me?.jobTitleName || "Nhân viên",
    status: "pending", priority: "normal", deadline: null, createdAt: now, finishedAt: null,
    fields, values: withComputed(fields, values), approvers, files: [],
  };
}
