// Xuất kết quả biểu mẫu ra Excel theo mẫu phiếu tổng hợp của công ty.
// Tạo file ngay trên trình duyệt (xlsx-js-style) — không tốn tài nguyên server.
import * as XLSX from "xlsx-js-style";
import { fmtDateTime, todayText } from "./format";

const COMPANY = "CÔNG TY TNHH THUẬN HƯNG LONG AN";
const NAVY = "1F4E79";
const HEADER_BLUE = "4472C4";
const LIGHT = "DDEBF7";
const STRIPE = "F2F7FC";

const border = { top: { style: "thin", color: { rgb: "A6A6A6" } }, bottom: { style: "thin", color: { rgb: "A6A6A6" } },
  left: { style: "thin", color: { rgb: "A6A6A6" } }, right: { style: "thin", color: { rgb: "A6A6A6" } } };
const font = (extra = {}) => ({ name: "Times New Roman", sz: 11, ...extra });

const NUMERIC = ["number", "currency", "linear_scale", "rating"];

function colWidth(q) {
  if (q.type === "long_text") return 45;
  if (q.type === "multiple_choice") return 28;
  if (NUMERIC.includes(q.type)) return 16;
  return 22;
}

/** 1 sheet theo mẫu. rows: phiếu đã lọc */
function buildSheet({ form, questions, rows, departmentLabel }) {
  const fixed = [
    { label: "STT", width: 6 },
    { label: "Phòng ban", width: 20 },
    { label: "Họ và tên nhân viên", width: 24 },
    { label: "MSNV", width: 11 },
    { label: "Chức danh / Vị trí", width: 20 },
  ];
  const cols = [
    ...fixed,
    ...questions.map((q) => ({ label: q.unit ? `${q.label} (${q.unit})` : q.label, width: colWidth(q), q })),
    { label: "Thời gian nộp", width: 17 },
  ];
  const n = cols.length;
  const blank = () => Array(n).fill("");

  const aoa = [];
  aoa.push([COMPANY, ...Array(n - 1).fill("")]);
  aoa.push([String(form.title || "").toUpperCase(), ...Array(n - 1).fill("")]);
  aoa.push(blank());
  aoa.push([form.description || "", ...Array(n - 1).fill("")]);
  const info = blank();
  const third = Math.max(1, Math.floor(n / 3));
  info[0] = `Phòng ban thực hiện: ${departmentLabel}`;
  info[third] = "Trưởng phòng:";
  info[third * 2] = `Ngày tổng hợp: ${todayText()}`;
  aoa.push(info);
  aoa.push(blank());
  const HEADER_ROW = aoa.length;
  aoa.push(cols.map((c) => c.label));

  rows.forEach((r, i) => {
    aoa.push([
      i + 1,
      r.departmentName || "",
      r.fullName || "",
      r.msnv || "",
      r.jobTitleName || "",
      ...questions.map((q) => {
        const a = r.answers?.[q.questionId];
        if (!a) return "";
        if (NUMERIC.includes(q.type) && a.number !== null && a.number !== undefined) return Number(a.number);
        return a.display || "";
      }),
      fmtDateTime(r.updatedAt || r.submittedAt),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const ref = (r, c) => XLSX.utils.encode_cell({ r, c });
  const style = (r, c, s) => {
    const k = ref(r, c);
    if (!ws[k]) ws[k] = { t: "s", v: "" };
    ws[k].s = s;
  };

  // Tiêu đề
  for (let c = 0; c < n; c++) {
    style(0, c, { font: font({ sz: 14, bold: true, color: { rgb: "FFFFFF" } }), fill: { fgColor: { rgb: NAVY } }, alignment: { horizontal: "center", vertical: "center" } });
    style(1, c, { font: font({ sz: 12, bold: true }), fill: { fgColor: { rgb: LIGHT } }, alignment: { horizontal: "center", vertical: "center" },
      border: { top: { style: "medium", color: { rgb: "2E8B57" } }, bottom: { style: "medium", color: { rgb: "2E8B57" } } } });
    style(3, c, { font: font({ italic: true, sz: 10 }), alignment: { wrapText: false } });
    style(4, c, { font: font({ bold: true, sz: 10 }) });
    style(HEADER_ROW, c, { font: font({ bold: true, color: { rgb: "FFFFFF" } }), fill: { fgColor: { rgb: HEADER_BLUE } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true }, border });
  }
  // Dữ liệu
  rows.forEach((_, i) => {
    const r = HEADER_ROW + 1 + i;
    const fill = i % 2 === 0 ? { fgColor: { rgb: LIGHT } } : { fgColor: { rgb: STRIPE } };
    cols.forEach((col, c) => {
      const numeric = col.q && NUMERIC.includes(col.q.type);
      style(r, c, {
        font: font(),
        fill,
        border,
        alignment: { vertical: "top", wrapText: true, horizontal: c === 0 ? "center" : numeric ? "right" : "left" },
        ...(numeric && col.q.type !== "rating" && col.q.type !== "linear_scale" ? { numFmt: "#,##0" } : {}),
      });
    });
  });

  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: n - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: n - 1 } },
  ];
  ws["!cols"] = cols.map((c) => ({ wch: c.width }));
  ws["!rows"] = [{ hpt: 24 }, { hpt: 22 }, { hpt: 6 }, {}, {}, { hpt: 6 }, { hpt: 36 }];
  return ws;
}

const safeSheetName = (s, used) => {
  let name = String(s || "Khác").replace(/[\\/?*[\]:]/g, " ").slice(0, 28).trim() || "Khác";
  let i = 2;
  const base = name;
  while (used.has(name)) name = `${base.slice(0, 25)} ${i++}`;
  used.add(name);
  return name;
};

/**
 * @param data  kết quả của fmApi.responses(id, { all: 1 })
 * @param opts  { perDepartment: bool, departmentLabel: string }
 */
export function exportResponsesToExcel(data, { perDepartment = false, departmentLabel = "Tất cả phòng ban" } = {}) {
  const { form, questions, rows } = data;
  const wb = XLSX.utils.book_new();
  const used = new Set();
  XLSX.utils.book_append_sheet(wb, buildSheet({ form, questions, rows, departmentLabel }), safeSheetName("Tổng hợp", used));

  if (perDepartment) {
    const groups = new Map();
    for (const r of rows) {
      const k = r.departmentName || "(Chưa có phòng ban)";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(r);
    }
    for (const [dept, list] of groups) {
      XLSX.utils.book_append_sheet(wb, buildSheet({ form, questions, rows: list, departmentLabel: dept }), safeSheetName(dept, used));
    }
  }

  const fileTitle = String(form.title || "bieu-mau").replace(/[\\/:*?"<>|]/g, " ").slice(0, 80).trim();
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `${fileTitle} - ${stamp}.xlsx`);
}

/** Xuất danh sách chưa nộp */
export function exportMissingToExcel(form, rows) {
  const aoa = [
    [`DANH SÁCH CHƯA NỘP — ${String(form.title || "").toUpperCase()}`],
    [`Ngày: ${todayText()}`],
    [],
    ["STT", "Phòng ban", "Họ và tên", "MSNV", "Chức danh"],
    ...rows.map((r, i) => [i + 1, r.departmentName || "(Chưa có phòng ban)", r.fullName || "", r.msnv || "", r.jobTitleName || ""]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 6 }, { wch: 24 }, { wch: 28 }, { wch: 12 }, { wch: 22 }];
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  for (let c = 0; c < 5; c++) {
    const k = XLSX.utils.encode_cell({ r: 3, c });
    ws[k].s = { font: font({ bold: true, color: { rgb: "FFFFFF" } }), fill: { fgColor: { rgb: HEADER_BLUE } }, border, alignment: { horizontal: "center" } };
  }
  if (ws.A1) ws.A1.s = { font: font({ bold: true, sz: 12 }) };
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Chưa nộp");
  XLSX.writeFile(wb, `Chua nop - ${String(form.title || "").replace(/[\\/:*?"<>|]/g, " ").slice(0, 60)}.xlsx`);
}
