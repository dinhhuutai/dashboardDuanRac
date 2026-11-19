// Excel cho trường BẢNG của đề xuất (vd. "Đính kèm nội dung chi tiết mua") — làm trên trình duyệt, không qua máy chủ.
//   downloadTemplate(field)          tải tệp mẫu .xlsx: dòng tiêu đề = các cột cần điền (+ trang "Hướng dẫn")
//   importTableFile(field, file)     đọc tệp Excel → các dòng của bảng (khớp cột THEO TÊN, bỏ dấu / hoa thường)
//   exportTable(field, rows, name)   xuất bảng đã có (kể cả cột tự tính + dòng tổng) ra .xlsx
// Thư viện xlsx-js-style (~400 KB) chỉ tải khi bấm.
import { columnSum, computeRow, isMoneyCol, isNumericCol, rowHasData } from "./fieldTypes";

const load = () => import("xlsx-js-style");
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
const pad = (n) => String(n).padStart(2, "0");
const safeName = (s) => String(s || "bang").replace(/[\\/:*?"<>|\r\n]+/g, " ").trim().slice(0, 80) || "bang";

const TYPE_HINT = {
  text: "Chữ",
  number: "Số (vd 2 hoặc 1,5)",
  currency: "Số tiền, không ghi chữ đ (vd 1500000 hoặc 1.500.000)",
  date: "Ngày (dd/mm/yyyy)",
  formula: "Tự tính — không cần điền",
};

/**
 * "1.500.000" "1,500,000" "2.938" (= 2938) "1,5" "8.5" " 315.000 đ" → số. Không phải số → null.
 * 1 dấu phân cách + đúng 3 chữ số sau = phân cách nghìn (cách viết VN); có cả "." và "," → dấu đứng sau là thập phân.
 */
export function parseNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v ?? "").replace(/\s/g, "").replace(/(vnđ|vnd|đồng|đ)$/i, "");
  if (!s) return null;
  let neg = false;
  if (s.startsWith("-")) { neg = true; s = s.slice(1); }
  if (!/^\d[\d.,]*$/.test(s) || /[.,]$/.test(s)) return null;
  const dots = (s.match(/\./g) || []).length, commas = (s.match(/,/g) || []).length;
  let n;
  if (dots && commas) {
    const dec = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    const [intPart, frac, extra] = s.split(dec);
    if (extra !== undefined) return null;
    n = Number(`${intPart.split(dec === "." ? "," : ".").join("")}.${frac}`);
  } else if (!dots && !commas) n = Number(s);
  else {
    const parts = s.split(dots ? "." : ",");
    if (parts.length > 2) n = parts.slice(1).every((g) => g.length === 3) ? Number(parts.join("")) : NaN;
    else if (parts[1].length === 3 && parts[0] !== "0") n = Number(parts.join(""));
    else n = Number(`${parts[0]}.${parts[1]}`);
  }
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

/** Ô ngày Excel (Date / "dd/mm/yyyy" / "yyyy-mm-dd") → "YYYY-MM-DD"; không đọc được → null */
function parseDate(v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const s = String(v ?? "").trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

const inputCols = (field) => (field.columns || []).filter((c) => c.type !== "formula");

function headerStyle() {
  return { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2563EB" } }, alignment: { vertical: "center", wrapText: true }, border: { bottom: { style: "thin", color: { rgb: "94A3B8" } } } };
}
const colWidth = (c) => ({ wch: c.type === "text" ? 34 : c.type === "date" ? 14 : 18 });

/** Tải tệp mẫu .xlsx cho trường bảng */
export async function downloadTemplate(field) {
  const XLSX = await load();
  const cols = inputCols(field);
  const ws = XLSX.utils.aoa_to_sheet([cols.map((c) => c.label)]);
  cols.forEach((c, i) => { const k = XLSX.utils.encode_cell({ r: 0, c: i }); if (ws[k]) ws[k].s = headerStyle(); });
  ws["!cols"] = cols.map(colWidth);
  ws["!rows"] = [{ hpt: 24 }];

  const guide = [
    [`Mẫu nhập "${field.label}"`],
    [],
    ["Cách dùng: điền mỗi dòng 1 mục ở trang \"Nhập liệu\" (giữ nguyên dòng tiêu đề), lưu tệp, rồi bấm \"Nhập từ Excel\" ở form đề xuất."],
    [`Tối đa ${field.maxRows || 50} dòng. Dòng trống và dòng "Tổng cộng" được bỏ qua.`],
    [],
    ["Cột", "Cách điền"],
    ...(field.columns || []).map((c) => [c.label, TYPE_HINT[c.type] || TYPE_HINT.text]),
  ];
  const wg = XLSX.utils.aoa_to_sheet(guide);
  wg.A1.s = { font: { bold: true, sz: 13 } };
  ["A6", "B6"].forEach((k) => { if (wg[k]) wg[k].s = headerStyle(); });
  wg["!cols"] = [{ wch: 34 }, { wch: 60 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Nhập liệu");
  XLSX.utils.book_append_sheet(wb, wg, "Hướng dẫn");
  XLSX.writeFile(wb, `Mau - ${safeName(field.label)}.xlsx`);
}

/**
 * Đọc tệp Excel → dòng của bảng. Tìm dòng tiêu đề (10 dòng đầu, trang đầu tiên có tiêu đề khớp), khớp cột theo tên.
 * @returns { rows, matched: [nhãn cột khớp], missing: [nhãn cột không có trong tệp], bad: [ghi chú ô không đọc được], cut }
 */
export async function importTableFile(field, file) {
  const XLSX = await load();
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const cols = inputCols(field);
  const want = new Map(cols.map((c) => [norm(c.label), c]));
  let found = null;
  for (const name of wb.SheetNames) {
    const all = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "", raw: true, blankrows: false });
    for (let h = 0; h < Math.min(10, all.length); h++) {
      const map = all[h].map((x) => want.get(norm(x)) || null);
      const hits = map.filter(Boolean).length;
      if (hits && (!found || hits > found.hits)) found = { all, h, map, hits };
    }
    if (found?.hits === cols.length) break;
  }
  if (!found) {
    const e = new Error(`Không thấy dòng tiêu đề có tên cột của bảng (${cols.map((c) => c.label).join(", ")}) — hãy dùng "Tải file mẫu"`);
    e.user = true;
    throw e;
  }
  const matchedKeys = new Set(found.map.filter(Boolean).map((c) => c.key));
  const max = field.maxRows || 50;
  const rows = [];
  const bad = [];
  let cut = 0;
  for (let i = found.h + 1; i < found.all.length; i++) {
    const line = found.all[i];
    if (line.some((x) => norm(x) === "tongcong")) continue; // dòng tổng
    const r = {};
    found.map.forEach((c, j) => {
      if (!c) return;
      const raw = line[j];
      if (raw === "" || raw === null || raw === undefined) return;
      if (c.type === "number" || c.type === "currency") {
        const n = parseNumber(raw);
        if (n === null) { bad.push(`Dòng ${i + 1}, cột "${c.label}": "${String(raw).slice(0, 30)}" không phải số`); return; }
        r[c.key] = c.type === "currency" ? Math.round(n) : n;
      } else if (c.type === "date") {
        const d = parseDate(raw);
        if (!d) { bad.push(`Dòng ${i + 1}, cột "${c.label}": "${String(raw).slice(0, 30)}" không phải ngày`); return; }
        r[c.key] = d;
      } else {
        r[c.key] = (raw instanceof Date ? parseDate(raw) : String(raw)).trim().slice(0, 1000);
      }
    });
    if (!rowHasData(field.columns, r)) continue;
    if (rows.length >= max) { cut += 1; continue; }
    rows.push(computeRow(field.columns, r));
  }
  return {
    rows,
    matched: cols.filter((c) => matchedKeys.has(c.key)).map((c) => c.label),
    missing: cols.filter((c) => !matchedKeys.has(c.key)).map((c) => c.label),
    bad,
    cut,
  };
}

/** Xuất bảng đã có ra .xlsx (cột tự tính tính lại, dòng tổng cho cột bật "Tính tổng") */
export async function exportTable(field, rows, fileName) {
  const XLSX = await load();
  const cols = field.columns || [];
  const list = (Array.isArray(rows) ? rows : []).map((r) => computeRow(cols, r || {}));
  const cell = (c, v) => {
    if (v === undefined || v === null || v === "") return "";
    if (isNumericCol(c)) { const n = parseNumber(v); return n === null ? String(v) : n; }
    if (c.type === "date") { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v)); return m ? `${m[3]}/${m[2]}/${m[1]}` : String(v); }
    return String(v);
  };
  const aoa = [["STT", ...cols.map((c) => c.label)], ...list.map((r, i) => [i + 1, ...cols.map((c) => cell(c, r[c.key]))])];
  const sums = cols.map((c) => (c.sum && isNumericCol(c) ? columnSum(cols, list, c.key) : null));
  const hasTotal = sums.some((s) => s !== null);
  if (hasTotal) aoa.push(["", ...cols.map((c, i) => (sums[i] !== null ? sums[i] : i === 0 ? "Tổng cộng" : ""))]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  for (let c = 0; c <= cols.length; c++) { const k = XLSX.utils.encode_cell({ r: 0, c }); if (ws[k]) ws[k].s = headerStyle(); }
  // định dạng số: tiền không lẻ, số tối đa 4 chữ số thập phân; dòng tổng in đậm
  for (let r = 1; r < aoa.length; r++) {
    cols.forEach((c, i) => {
      const k = XLSX.utils.encode_cell({ r, c: i + 1 });
      if (!ws[k]) return;
      const style = {};
      if (typeof ws[k].v === "number") { ws[k].z = isMoneyCol(cols, c) ? "#,##0" : "#,##0.####"; style.numFmt = ws[k].z; }
      else style.alignment = { wrapText: true, vertical: "top" };
      if (hasTotal && r === aoa.length - 1) style.font = { bold: true };
      ws[k].s = style;
    });
  }
  ws["!cols"] = [{ wch: 6 }, ...cols.map(colWidth)];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chi tiết");
  XLSX.writeFile(wb, `${safeName(fileName || field.label)}.xlsx`);
}
