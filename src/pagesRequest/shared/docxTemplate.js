// MẪU IN BẰNG TỆP WORD (.docx) — như "In đề xuất" của Base: admin tải lên tệp Word có biến ${…}, hệ thống điền
// dữ liệu đề xuất NGAY TRÊN TRÌNH DUYỆT (jszip + DOMParser) → tải về .docx thật / xem trước / in (docx-preview).
//
// Biến: giống mẫu thiết kế trên web (print.js: ${nguoi_de_xuat}, ${<trường>}, ${duyet_<bước>_nguoi}, ${so_tien|chu}…)
//   + tên kiểu Base: ${name} ${creator_name} ${created_at_datetime} ${status} ${approval_final_name} ${block_approvals_<bước>_name|datetime}…
//   + cột của bảng chi tiết: ${<bảng>.stt} ${<bảng>.<cột>} — hoặc kiểu Base ${column.<bảng>.<số thứ tự cột>};
//     <bảng>/<cột> = tên viết liền không dấu (noi_dung_de_nghi) hoặc chữ cái đầu (nddn). Dòng bảng Word chứa biến cột
//     được NHÂN LÊN theo số dòng của bảng chi tiết.
//   Biến không tự khớp → admin chọn tay (tpl.map: tên biến trong tệp → biến hệ thống / "col:<bảng>:<cột|#>").
// Word hay tách 1 biến thành nhiều đoạn chữ (vd. "${ten" + "_truong}") — fillDocx ghép theo từng đoạn văn rồi mới thay.
import JSZip from "jszip";
import { cellText } from "./fieldTypes";
import { fileHref } from "./files";
import { T, applyFilter, fieldTokens, printDocument, printValues, printVariables, slugify, stepTokens } from "./print";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const PART_RE = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;
const TOKEN_RE = /\$\{([^{}]{1,160})\}/g;
const acronym = (label) => slugify(label).split("_").filter(Boolean).map((w) => w[0]).join("");

/** "${ Tên biến | chu }" → { name: "ten_bien" (chữ thường, bỏ khoảng trắng), filter } */
export function parseToken(raw) {
  const [a, b] = String(raw).split("|");
  return { name: a.replace(/\s+/g, "").toLowerCase(), filter: (b || "").trim().toLowerCase() || null };
}

// tên biến kiểu Base → biến hệ thống
const BASE_ALIAS = {
  name: "tieu_de", title: "tieu_de", id: "ma_de_xuat", code: "ma_de_xuat", status: "trang_thai", priority: "muc_do", deadline: "han_xu_ly",
  creator_name: "nguoi_de_xuat", creator: "nguoi_de_xuat", created_at_datetime: "ngay_tao", created_at: "ngay_tao_ngay", created_date: "ngay_tao_ngay",
  department: "phong_ban", creator_department: "phong_ban", approval_final_name: "nguoi_duyet_cuoi", approval_final_datetime: "thoi_gian_duyet_cuoi",
  finished_at: "ngay_hoan_tat", print_date: "ngay_in",
};
const STEP_PART = { name: "nguoi", nguoi: "nguoi", datetime: "thoi_gian", date: "thoi_gian", thoi_gian: "thoi_gian", status: "trang_thai", trang_thai: "trang_thai", note: "y_kien", comment: "y_kien", y_kien: "y_kien" };

/** Cột của 1 bảng → tên biến cột (slug nhãn, trùng → _2) */
function columnTokens(f) {
  const used = new Set(["stt", "tt"]);
  return (f.columns || []).map((c) => {
    let s = slugify(c.label), k = s, i = 2;
    while (used.has(k)) k = `${s}_${i++}`;
    used.add(k);
    return { key: c.key, token: k, acr: acronym(c.label), label: c.label };
  });
}

/** Ngữ cảnh khớp tên biến: biến hệ thống + trường (cả chữ cái đầu) + bước duyệt + bảng/cột */
function matchContext(fields, stepNames, varNames) {
  const ft = fieldTokens(fields);
  const tables = ft.filter((x) => x.field.type === "table").map((x) => ({ key: x.field.key, token: x.token, acr: acronym(x.field.label), label: x.field.label, cols: columnTokens(x.field) }));
  const byAcr = new Map();
  for (const x of ft) if (x.field.type !== "table") { const a = acronym(x.field.label); if (a.length >= 2 && !byAcr.has(a)) byAcr.set(a, x.token); }
  const steps = stepTokens(stepNames).map((s) => ({ ...s, slug: s.token.replace(/^duyet_/, ""), acr: acronym(s.name) }));
  return { vars: new Set(varNames), byAcr, tables, steps };
}

const findTable = (ref, ctx) => ctx.tables.find((t) => t.token === ref || t.acr === ref || slugify(t.label) === ref);
function findCol(t, ref) {
  if (ref === "stt" || ref === "tt" || ref === "#") return "#";
  if (/^\d+$/.test(ref)) return t.cols[Number(ref) - 1]?.key || null; // kiểu Base: số thứ tự cột (1 = cột đầu)
  return (t.cols.find((c) => c.token === ref) || t.cols.find((c) => c.acr === ref))?.key || null;
}

/** Tên biến trong tệp → đích: tên biến hệ thống | "col:<bảng>:<cột|#>" | null */
function autoTarget(name, ctx) {
  if (ctx.vars.has(name)) return name;
  if (BASE_ALIAS[name] && ctx.vars.has(BASE_ALIAS[name])) return BASE_ALIAS[name];
  if (ctx.byAcr.has(name)) return ctx.byAcr.get(name);
  let m = /^(?:block_approvals?|duyet)_(.+)_(name|nguoi|datetime|date|thoi_gian|status|trang_thai|note|comment|y_kien)$/.exec(name);
  if (m) {
    const s = ctx.steps.find((x) => x.slug === m[1] || x.acr === m[1]) || (/^\d+$/.test(m[1]) ? ctx.steps[Number(m[1]) - 1] : null);
    if (s) return `${s.token}_${STEP_PART[m[2]]}`;
  }
  m = /^(?:column\.)?([a-z0-9_]+)\.([a-z0-9_#]+)$/.exec(name);
  if (m) {
    const t = findTable(m[1], ctx);
    const c = t && findCol(t, m[2]);
    if (c) return `col:${t.key}:${c}`;
  }
  return null;
}

/* ------------------------------ đọc / ghi XML của tệp Word ------------------------------ */
async function openDocx(buf) {
  const zip = await JSZip.loadAsync(buf);
  const parts = Object.keys(zip.files).filter((n) => PART_RE.test(n));
  if (!parts.includes("word/document.xml")) throw new Error("Không phải tệp Word .docx hợp lệ");
  return { zip, parts };
}
const parse = (xml) => {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Tệp Word bị lỗi cấu trúc");
  return doc;
};
const textsOf = (el) => [...el.getElementsByTagNameNS(W, "t")];
const paragraphsOf = (el) => [...el.getElementsByTagNameNS(W, "p")];

/** Mọi biến ${…} trong tệp (đã ghép các đoạn chữ bị Word tách) */
export async function scanDocx(buf) {
  const { zip, parts } = await openDocx(buf);
  const out = new Map();
  for (const p of parts) {
    const doc = parse(await zip.file(p).async("string"));
    for (const para of paragraphsOf(doc)) {
      const full = textsOf(para).map((t) => t.textContent).join("");
      for (const m of full.matchAll(TOKEN_RE)) {
        const { name } = parseToken(m[1]);
        if (name && !out.has(name)) out.set(name, { name, raw: m[0] });
      }
    }
  }
  return [...out.values()];
}

/** Khổ giấy của tệp (mm) — đọc w:pgSz của mục cuối */
export async function pageSizeOf(buf) {
  const { zip } = await openDocx(buf);
  const doc = parse(await zip.file("word/document.xml").async("string"));
  const sz = [...doc.getElementsByTagNameNS(W, "pgSz")].pop();
  const tw = (a) => Number(sz?.getAttributeNS(W, a) || sz?.getAttribute(`w:${a}`)) || 0;
  const w = Math.round(tw("w") / 56.6929) || 210, h = Math.round(tw("h") / 56.6929) || 297;
  const near = (x, y) => Math.abs(x - y) <= 2;
  const name = (near(w, 210) && near(h, 297)) || (near(w, 297) && near(h, 210)) ? "A4" : (near(w, 148) && near(h, 210)) || (near(w, 210) && near(h, 148)) ? "A5" : `${w}×${h} mm`;
  return { w, h, name, landscape: w > h };
}

function setText(t, v) {
  t.textContent = v;
  t.setAttributeNS(XML_NS, "xml:space", "preserve");
}

/** Thay mọi ${…} trong 1 đoạn văn (biến có thể nằm vắt qua nhiều đoạn chữ) */
function replaceInParagraph(para, valueOf) {
  const ts = textsOf(para);
  if (!ts.length) return;
  const texts = ts.map((t) => t.textContent);
  const full = texts.join("");
  if (!full.includes("${")) return;
  const starts = [];
  let pos = 0;
  for (const s of texts) { starts.push(pos); pos += s.length; }
  const at = (p) => { let i = 0; while (i + 1 < starts.length && starts[i + 1] <= p) i++; return i; };
  const matches = [...full.matchAll(TOKEN_RE)];
  for (let k = matches.length - 1; k >= 0; k--) { // từ cuối lên → vị trí các biến phía trước không đổi
    const m = matches[k];
    const s = m.index, e = s + m[0].length;
    const value = valueOf(m[1]);
    const i = at(s), j = at(e - 1);
    const before = ts[i].textContent.slice(0, s - starts[i]);
    const after = ts[j].textContent.slice(e - starts[j]);
    if (i === j) setText(ts[i], before + value + after);
    else {
      setText(ts[i], before + value);
      for (let x = i + 1; x < j; x++) setText(ts[x], "");
      setText(ts[j], after);
    }
  }
  // giá trị nhiều dòng (đoạn văn, lý do…) → ngắt dòng của Word
  for (const t of textsOf(para)) {
    if (!t.textContent.includes("\n")) continue;
    const lines = t.textContent.split("\n");
    setText(t, lines[0]);
    let ref = t;
    for (const line of lines.slice(1)) {
      const br = t.ownerDocument.createElementNS(W, "w:br");
      const nt = t.ownerDocument.createElementNS(W, "w:t");
      setText(nt, line);
      ref.parentNode.insertBefore(br, ref.nextSibling);
      br.parentNode.insertBefore(nt, br.nextSibling);
      ref = nt;
    }
  }
}

/**
 * Điền dữ liệu 1 đề xuất vào tệp Word mẫu → Blob .docx.
 * @param buf  ArrayBuffer tệp mẫu
 * @param tpl  { map }  — biến chọn tay
 * @param r    chi tiết đề xuất (như GET /requests/:id)
 */
export async function fillDocx(buf, tpl, r, userName) {
  const vals = printValues(r, userName);
  const steps = [...new Map((r.approvers || []).map((a) => [a.stepNo, a.stepName])).values()];
  const ctx = matchContext(r.fields, steps, [...vals.keys()]);
  const map = tpl?.map || {};
  const target = (name) => map[name] || autoTarget(name, ctx);
  const valueOf = (raw, row) => {
    const { name, filter } = parseToken(raw);
    const tg = target(name);
    if (!tg) return "";
    if (tg.startsWith("col:")) {
      const [, tKey, cKey] = tg.split(":");
      if (!row || row.table !== tKey) return "";
      if (cKey === "#") return row.data ? String(row.index + 1) : "";
      const f = (r.fields || []).find((x) => x.key === tKey);
      const c = f?.columns?.find((x) => x.key === cKey);
      return row.data && c ? cellText(f.columns, c, row.data[c.key]) : "";
    }
    const v = vals.get(tg);
    return v ? applyFilter(v, filter) : "";
  };
  const { zip, parts } = await openDocx(buf);
  for (const p of parts) {
    const doc = parse(await zip.file(p).async("string"));
    // 1) dòng bảng có biến cột → nhân theo số dòng của bảng chi tiết
    for (const tr of [...doc.getElementsByTagNameNS(W, "tr")]) {
      if (!tr.parentNode) continue;
      const text = textsOf(tr).map((t) => t.textContent).join("");
      const tKey = [...text.matchAll(TOKEN_RE)].map((m) => target(parseToken(m[1]).name)).find((tg) => tg?.startsWith("col:"))?.split(":")[1];
      if (!tKey) continue;
      const rows = Array.isArray(r.values?.[tKey]) ? r.values[tKey] : [];
      const list = rows.length ? rows : [null];
      list.forEach((data, index) => {
        const clone = tr.cloneNode(true);
        for (const para of paragraphsOf(clone)) replaceInParagraph(para, (raw) => valueOf(raw, { table: tKey, data, index }));
        tr.parentNode.insertBefore(clone, tr);
      });
      tr.parentNode.removeChild(tr);
    }
    // 2) các biến còn lại
    for (const para of paragraphsOf(doc)) replaceInParagraph(para, (raw) => valueOf(raw, null));
    zip.file(p, new XMLSerializer().serializeToString(doc));
  }
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/** Biến trong tệp → { name, target, auto } để admin xem / chọn tay */
export function mappingRows(tokens, tpl, fields, flow) {
  const vars = printVariables(fields, flow).map((v) => v.token.split("|")[0]);
  const ctx = matchContext(fields, (flow || []).map((s) => s.name), vars);
  return tokens.map((t) => {
    const auto = autoTarget(t.name, ctx);
    return { ...t, auto, target: tpl.map?.[t.name] || auto };
  });
}

/** Lựa chọn đích khi chọn tay: biến hệ thống + từng cột của bảng */
export function targetOptions(fields, flow) {
  const out = printVariables(fields, flow).filter((v) => !v.token.includes("|")).map((v) => ({ value: v.token, label: v.label, group: v.group }));
  for (const x of fieldTokens(fields).filter((y) => y.field.type === "table")) {
    out.push({ value: `col:${x.field.key}:#`, label: `${x.field.label} — số thứ tự dòng`, group: "Cột của bảng (dòng lặp)" });
    for (const c of x.field.columns || []) out.push({ value: `col:${x.field.key}:${c.key}`, label: `${x.field.label} — ${c.label}`, group: "Cột của bảng (dòng lặp)" });
  }
  return out;
}

/** Biến gợi ý để soạn tệp Word (kèm biến cột bảng) */
export function docxVariables(fields, flow) {
  const out = printVariables(fields, flow);
  for (const x of fieldTokens(fields).filter((y) => y.field.type === "table")) {
    out.push({ token: `${x.token}.stt`, label: `${x.field.label} — số thứ tự (đặt trong 1 dòng bảng Word)`, group: "Cột của bảng (dòng lặp)" });
    for (const c of columnTokens(x.field)) out.push({ token: `${x.token}.${c.token}`, label: `${x.field.label} — ${c.label}`, group: "Cột của bảng (dòng lặp)" });
  }
  return out;
}

/* ------------------------------ tệp Word gợi ý (để admin sửa tiếp bằng Word) ------------------------------ */
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const run = (text, bold) => `<w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r>`;
const wp = (runs, align) => `<w:p>${align ? `<w:pPr><w:jc w:val="${align}"/></w:pPr>` : ""}${runs}</w:p>`;
const cellXml = (text, bold) => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>${wp(run(text, bold))}</w:tc>`;

/** Tạo tệp .docx gợi ý từ trường + quy trình của mẫu: đầu phiếu, thông tin, bảng chi tiết (dòng lặp), chỗ ký */
export async function sampleDocx(type) {
  const fields = type.fields || [];
  const ft = fieldTokens(fields);
  const steps = stepTokens((type.flow || []).map((s) => s.name));
  const border = '<w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders>';
  let body = wp(run(String(type.name || "PHIẾU ĐỀ XUẤT").toUpperCase(), true), "center");
  body += wp(run(`Số: ${T("ma_de_xuat")}    Ngày: ${T("ngay_tao_ngay")}`), "center");
  body += wp(run("Người đề nghị: ", true) + run(`${T("nguoi_de_xuat")} — ${T("phong_ban")}`));
  body += wp(run("Tiêu đề: ", true) + run(T("tieu_de")));
  for (const { token, field } of ft) {
    if (field.type === "files") continue;
    if (field.type === "table") {
      const cols = columnTokens(field);
      body += wp(run(`${field.label}:`, true));
      body += `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${border}</w:tblPr>`
        + `<w:tr>${cellXml("TT", true)}${cols.map((c) => cellXml(c.label, true)).join("")}</w:tr>`
        + `<w:tr>${cellXml(T(`${token}.stt`))}${cols.map((c) => cellXml(T(`${token}.${c.token}`))).join("")}</w:tr></w:tbl>`;
      continue;
    }
    body += wp(run(`${field.label}: `, true) + run(T(token)));
    if (field.type === "currency" && (field.sumOf || /tổng/i.test(field.label))) body += wp(run("Bằng chữ: ", true) + run(T(`${token}|chu`)));
  }
  const signers = [["Người đề nghị", T("nguoi_de_xuat")], ...steps.map((s) => [s.name, T(`${s.token}_nguoi`)])].slice(0, 5);
  body += wp(run(`Long An, ${T("ngay_tao_chu")}`), "right");
  body += `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr><w:tr>${signers.map(([t]) => `<w:tc>${wp(run(t, true), "center")}</w:tc>`).join("")}</w:tr>`
    + `<w:tr><w:trPr><w:trHeight w:val="1200"/></w:trPr>${signers.map(() => `<w:tc>${wp("")}</w:tc>`).join("")}</w:tr>`
    + `<w:tr>${signers.map(([, n]) => `<w:tc>${wp(run(n, true), "center")}</w:tc>`).join("")}</w:tr></w:tbl>`;
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body>${body}`
    + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
  const zip = new JSZip();
  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file("_rels/.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/document.xml", doc);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

/* ------------------------------ tệp mẫu: tải 1 lần, nhớ trong phiên ------------------------------ */
const bufCache = new Map(); // mã tệp → Promise<ArrayBuffer>
/** Tệp vừa tải lên (chưa lưu mẫu, chưa có đường dẫn) → nhớ nội dung để xem trước ngay */
export function rememberDocx(key, buf) { bufCache.set(key, Promise.resolve(buf)); }
export function loadDocx(file) {
  if (bufCache.has(file.key)) return bufCache.get(file.key);
  if (!file.url) return Promise.reject(new Error("Không mở được tệp Word mẫu — tải lại tệp"));
  const p = fetch(fileHref(file.url)).then((r) => {
    if (!r.ok) throw new Error(r.status === 403 ? "Đường dẫn tệp mẫu đã hết hạn — tải lại trang" : "Không tải được tệp Word mẫu từ máy chủ tệp");
    return r.arrayBuffer();
  });
  p.catch(() => bufCache.delete(file.key));
  bufCache.set(file.key, p);
  return p;
}

/* ------------------------------ xem trước / in / tải ------------------------------ */
const DOCX_OPTS = { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true, experimental: true };

/** Dựng tệp Word vào 1 phần tử (xem trước) — docx-preview tải lười */
export async function renderDocx(blob, container) {
  const { renderAsync } = await import("docx-preview");
  container.innerHTML = "";
  await renderAsync(blob, container, null, DOCX_OPTS);
}

/** In / lưu PDF: dựng tệp Word ở chỗ khuất rồi in đúng khổ giấy của tệp */
export async function printDocx(blob, size, title) {
  const { renderAsync } = await import("docx-preview");
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;width:1200px";
  const styles = document.createElement("div");
  const body = document.createElement("div");
  host.append(styles, body);
  document.body.appendChild(host);
  try {
    await renderAsync(blob, body, styles, DOCX_OPTS);
    const esc = (s) => String(s || "").replace(/[<&]/g, (c) => (c === "<" ? "&lt;" : "&amp;"));
    printDocument(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>${styles.innerHTML}
<style>@page{size:${size.w}mm ${size.h}mm;margin:0}html,body{margin:0;padding:0;background:#fff}
.docx-wrapper{background:none!important;padding:0!important;display:block!important}
.docx-wrapper>section.docx{box-shadow:none!important;margin:0!important;break-after:page;page-break-after:always}
.docx-wrapper>section.docx:last-child{break-after:auto;page-break-after:auto}</style></head><body>${body.innerHTML}</body></html>`);
  } finally {
    host.remove();
  }
}

export function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = String(name || "de-xuat").replace(/[\\/:*?"<>|]+/g, "_").slice(0, 120);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
