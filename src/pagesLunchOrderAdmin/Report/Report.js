import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import ExcelJS from 'exceljs';
import { FaFileExcel, FaClock } from "react-icons/fa";

/* ====== Date helpers (UTC to avoid off-by-one) ====== */
const toVNDateUTC = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { timeZone: "UTC" });

function parseYYYYMM(yyyyMM) {
  const [y, m] = (yyyyMM || "").split("-").map(Number);
  return { y, m }; // m: 1..12
}
function daysInMonthUTC(y, m) {
  // m: 1..12
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
function buildMonthDaysUTC(yyyyMM) {
  const { y, m } = parseYYYYMM(yyyyMM);
  const n = daysInMonthUTC(y, m);
  const out = [];
  for (let d = 1; d <= n; d++) {
    out.push(new Date(Date.UTC(y, m - 1, d)));
  }
  return out;
}

/* ====== Status map (VN) ====== */
const STATUS_VN = { re: "Ca ngày", ws: "Đi ca", ot: "Tăng ca" };
const statusToVN = (s) => STATUS_VN[(s || "").toLowerCase()] || "";

/* ====== Tuần helpers ====== */
function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=CN..6=T7
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
function getWeekDates(mondayStr) {
  const base = new Date(mondayStr + "T00:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}
const shortDay = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const toDDMM = (d) =>
  d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

/* ====== UI helpers ====== */
function hueFromString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % 360;
}
function parseFoodsText(text = "") {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.*)\sx(\d+)$/i);
      return m ? { name: m[1].trim(), qty: +m[2] } : { name: s, qty: 1 };
    })
    .filter((it) => it.qty > 0);
}
const FoodChipsCell = ({ text }) => {
  if (!text) return <span className="text-slate-400">—</span>;
  const items = parseFoodsText(text);
  return (
    <div className="flex flex-wrap gap-1.5 max-w-full">
      {items.map((it, i) => {
        const hue = hueFromString(it.name);
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[12.5px] leading-none shadow-sm"
            title={`${it.name} x${it.qty}`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: `hsl(${hue} 70% 50%)` }}
            />
            <span className="text-slate-700 truncate max-w-[10rem]">
              {it.name}
            </span>
            <span className="ml-1 rounded-md bg-slate-100 px-1 text-[11px] font-semibold text-slate-700">
              x{it.qty}
            </span>
          </span>
        );
      })}
    </div>
  );
};


/* ---------- NEW: Tag theo món (có Branch + Loại) ---------- */
function FoodItemTag({ item }) {
  const displayName =
    item.foodName + (item.branchName ? ` (${item.branchName})` : "");
  const hue = hueFromString(displayName + (item.statusType || ""));
  const typeVN = statusToVN(item.statusType);

  return (
    <span
      className={[
        "inline-flex max-w-full flex-col items-start gap-1",
        "rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm",
        "align-top" // giúp nhiều tag đứng cạnh nhau không lệch hàng
      ].join(" ")}
      title={`${displayName} x${item.qty}${typeVN ? ` — ${typeVN}` : ""}`}
    >
      {/* Tầng 1: dot + tên (truncate) */}
      <span className="flex w-full min-w-0 items-center gap-1">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: `hsl(${hue} 70% 50%)` }}
        />
        <span className="truncate text-[12.5px] leading-tight text-slate-700">
          {displayName}
        </span>
      </span>

      {/* Tầng 2: số lượng + loại (tự wrap nếu hẹp) */}
      <span className="flex w-full flex-wrap items-center gap-1">
        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
          x{item.qty ?? 0}
        </span>
        {typeVN ? (
          <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald-700">
            {typeVN}
          </span>
        ) : null}
      </span>
    </span>
  );
}

function DayCell({ items }) {
  if (!items?.length) return <span className="text-slate-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <FoodItemTag key={i} item={it} />
      ))}
    </div>
  );
}

export default function AdminSummaryModern() {
  /* ====== Common: departments ====== */
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [weekType, setWeekType] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const depRes = await http.get(
          `${BASE_URL}/api/lunch-order/admin/departments`
        );
        setDepartments(depRes.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ====== A) BẢNG CÔNG NỢ THEO THÁNG (TRÊN CÙNG) ====== */
  const [debtMonth, setDebtMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${d.getFullYear()}-${mm}`; // YYYY-MM
  });
  const baseMonthDays = useMemo(() => buildMonthDaysUTC(debtMonth), [debtMonth]);

  const [debtRowsRaw, setDebtRowsRaw] = useState([]); // [{ actualDate, lunchQty, otQty, wsQty }]
  const [debtLoading, setDebtLoading] = useState(false);
  const [unitPrice, setUnitPrice] = useState(27000);
  const [showDebt, setShowDebt] = useState(false);

  // Tải dữ liệu công nợ theo tháng
  useEffect(() => {
    (async () => {
      if (!debtMonth) return;
      setDebtLoading(true);
      try {
        const res = await http.get(
          `${BASE_URL}/api/lunch-order/admin/debt-daily`,
          {
            params: { month: debtMonth, departmentId },
          }
        );
        setDebtRowsRaw(res.data?.data || []);
      } finally {
        setDebtLoading(false);
      }
    })();
  }, [debtMonth, departmentId]);

  // Ghép đủ mọi ngày trong tháng + “vọt” tương lai có dữ liệu
  const debtDaysUnion = useMemo(() => {
    const set = new Set(baseMonthDays.map((d) => d.getTime()));
    for (const r of debtRowsRaw) {
      const d = new Date(r.actualDate);
      const utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      set.add(utc);
    }
    return Array.from(set)
      .sort((a, b) => a - b)
      .map((ms) => new Date(ms));
  }, [baseMonthDays, debtRowsRaw]);

  const debtRows = useMemo(() => {
    const map = new Map(); // key: UTC midnight ms
    for (const r of debtRowsRaw) {
      const d = new Date(r.actualDate);
      const key = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const cur = map.get(key) || { lunchQty: 0, otQty: 0, wsQty: 0 };
      map.set(key, {
        lunchQty: cur.lunchQty + (+r.lunchQty || 0),
        otQty: cur.otQty + (+r.otQty || 0),
        wsQty: cur.wsQty + (+r.wsQty || 0),
      });
    }
    return debtDaysUnion.map((d) => {
      const key = d.getTime();
      const v = map.get(key) || { lunchQty: 0, otQty: 0, wsQty: 0 };
      return {
        actualDate: d.toISOString(),
        lunchQty: v.lunchQty,
        otQty: v.otQty,
        wsQty: v.wsQty,
      };
    });
  }, [debtRowsRaw, debtDaysUnion]);

  function exportDebtExcelMonth() {
    const wb = XLSX.utils.book_new();

    const styleCenter = {
      alignment: { horizontal: "center", vertical: "center" },
    };
    const styleBoldCenter = { ...styleCenter, font: { bold: true, sz: 14 } };
    const styleHeader = {
      font: { bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
    const styleCell = {
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    };
    const styleNum = {
      ...styleCell,
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0",
    };

    const title = "BẢNG TỔNG KẾT CÔNG NỢ";
    const { y, m } = parseYYYYMM(debtMonth);
    const monthLabel = `Tháng ${String(m).padStart(2, "0")}/${y}`;

    const aoa = [];
    aoa.push(["", title, ""]);
    aoa.push(["", monthLabel, ""]);
    aoa.push([]);
    aoa.push(["1. Hàng Hóa"]);
    aoa.push([
      "STT",
      "NGÀY",
      "CƠM TRƯA",
      "CƠM TĂNG CA",
      "CƠM ĐI CA",
      "TỔNG CỘNG",
      "ĐƠN GIÁ",
      "THÀNH TIỀN",
      "GHI CHÚ",
    ]);

    let stt = 1,
      sumLunch = 0,
      sumOT = 0,
      sumWS = 0,
      sumTotal = 0,
      sumMoney = 0;

    for (const r of debtRows) {
      const dTxt = toVNDateUTC(r.actualDate);
      const lunch = +r.lunchQty || 0;
      const ot = +r.otQty || 0;
      const ws = +r.wsQty || 0;
      const tong = lunch + ot + ws;
      const money = tong * (unitPrice || 0);

      sumLunch += lunch;
      sumOT += ot;
      sumWS += ws;
      sumTotal += tong;
      sumMoney += money;

      aoa.push([stt++, dTxt, lunch, ot, ws, tong, unitPrice, money, ""]);
    }

    aoa.push([
      "",
      "TỔNG",
      sumLunch,
      sumOT,
      sumWS,
      sumTotal,
      unitPrice,
      sumMoney,
      "",
    ]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];
    ws["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 20 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let c = 0; c <= 7; c++) {
      const a0 = XLSX.utils.encode_cell({ r: 0, c });
      const a1 = XLSX.utils.encode_cell({ r: 1, c });
      ws[a0] = ws[a0] || { v: "" };
      ws[a0].s = styleBoldCenter;
      ws[a1] = ws[a1] || { v: "" };
      ws[a1].s = styleCenter;
    }
    for (let c = 0; c <= 7; c++) {
      const a = XLSX.utils.encode_cell({ r: 4, c });
      ws[a].s = styleHeader;
    }
    for (let r = 5; r <= range.e.r; r++) {
      for (let c = 0; c <= 7; c++) {
        const a = XLSX.utils.encode_cell({ r, c });
        ws[a] = ws[a] || { v: "" };
        if (c >= 2 && c <= 6) ws[a].s = styleNum;
        else ws[a].s = styleCell;
      }
    }

    const fileName = `Bang_CongNo_${String(m).padStart(2, "0")}-${y}.xlsx`;
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      `CongNo_${String(m).padStart(2, "0")}-${y}`
    );
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), fileName);
  }

  /* ====== B) BÁO CÁO TUẦN ====== */
  const [rows, setRows] = useState([]);      // bảng chuỗi ghép (cũ)
  const [totals, setTotals] = useState([]);  // (có thể không dùng nữa)
  const [details, setDetails] = useState([]); // chi tiết món/branch/loại

  const [weekStartMonday, setWeekStartMonday] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return getMonday(today);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setRows([]);
      setTotals([]);
      setDetails([]);
      try {
        const res = await http.get(`${BASE_URL}/api/lunch-order/admin/summary`, {
          params: {
            weekStartMonday,
            departmentId,
            statusType: weekType === "all" ? null : weekType,
          },
        });
        setRows(res.data?.data || []);
        setTotals(res.data?.totals || []);
        setDetails(res.data?.details || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [weekStartMonday, departmentId, weekType]);

  /* Map details → per user → per day */
  const detailsMap = useMemo(() => {
    const m = new Map();
    for (const d of details || []) {
      if (!m.has(d.userID)) {
        m.set(d.userID, { days: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] } });
      }
      m.get(d.userID).days[d.dayOfWeek].push({
        foodName: d.foodName,
        qty: d.qty || 0,
        statusType: (d.statusType || "").toLowerCase(),
        branchName: d.branchName || "",
      });
    }
    // sort để ổn định
    for (const v of m.values()) {
      for (const k of Object.keys(v.days)) {
        v.days[k].sort(
          (a, b) =>
            (a.foodName || "").localeCompare(b.foodName || "") ||
            (a.branchName || "").localeCompare(b.branchName || "") ||
            (a.statusType || "").localeCompare(b.statusType || "")
        );
      }
    }
    return m;
  }, [details]);

  /* Users (từ bảng chuỗi cũ) chỉ để lấy danh sách người + tổ chức department */
  const users = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.userID)) {
        map.set(r.userID, {
          userID: r.userID,
          fullName: r.fullName,
          departmentId: r.departmentId,
          departmentName: r.departmentName || "Chưa gán",
          days: {},
        });
      }
      if (r.dayOfWeek) map.get(r.userID).days[r.dayOfWeek] = r.foodsText || "";
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        (a.departmentName || "").localeCompare(b.departmentName || "") ||
        (a.fullName || "").localeCompare(b.fullName || "")
    );
  }, [rows]);

  /* Gom theo bộ phận (để render bảng & Excel) */
  const deptGroups = useMemo(() => {
    const m = new Map();

    for (const u of users) {
      // ❌ bỏ qua nếu chưa gán
      if (u.departmentName === "Chưa gán" || u.departmentName.trim() === "") continue;

      const key = u.departmentName;

      if (!m.has(key)) {
        m.set(key, { name: key, users: [] });
      }

      m.get(key).users.push(u);
    }

    return Array.from(m.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [users]);

  /* Tổng theo ngày toàn cục (tách theo món+branch+loại) */
  const totalsByDayAll = useMemo(() => {
    const agg = {}; // day -> key -> qty
    for (const d of details || []) {
      const day = d.dayOfWeek;
      const key = [
        d.foodName || "",
        d.branchName || "",
        (d.statusType || "").toLowerCase(),
      ].join("|");
      agg[day] ||= {};
      agg[day][key] = (agg[day][key] || 0) + (d.qty || 0);
    }
    const out = {};
    for (const [day, obj] of Object.entries(agg)) {
      out[day] = Object.entries(obj)
        .map(([k, qty]) => {
          const [foodName, branchName, statusType] = k.split("|");
          return { foodName, branchName, statusType, qty };
        })
        .sort(
          (a, b) =>
            b.qty - a.qty ||
            (a.foodName || "").localeCompare(b.foodName || "") ||
            (a.branchName || "").localeCompare(b.branchName || "") ||
            (a.statusType || "").localeCompare(b.statusType || "")
        );
    }
    return out;
  }, [details]);

  /* Tổng theo ngày cho từng bộ phận (tách theo món+branch+loại) */
  const groupTotalsByDay = useMemo(() => {
    const result = new Map(); // deptName -> day -> array items
    for (const grp of deptGroups) {
      // gom userIds thuộc group
      const userIds = new Set(grp.users.map((u) => u.userID));
      // lọc details theo userIds
      const agg = {};
      for (const d of details || []) {
        if (!userIds.has(d.userID)) continue;
        const day = d.dayOfWeek;
        const key = [
          d.foodName || "",
          d.branchName || "",
          (d.statusType || "").toLowerCase(),
        ].join("|");
        agg[day] ||= {};
        agg[day][key] = (agg[day][key] || 0) + (d.qty || 0);
      }
      const out = {};
      for (const day of [1, 2, 3, 4, 5, 6, 7]) {
        const o = agg[day] || {};
        out[day] = Object.entries(o)
          .map(([k, qty]) => {
            const [foodName, branchName, statusType] = k.split("|");
            return { foodName, branchName, statusType, qty };
          })
          .sort(
            (a, b) =>
              b.qty - a.qty ||
              (a.foodName || "").localeCompare(b.foodName || "") ||
              (a.branchName || "").localeCompare(b.branchName || "") ||
              (a.statusType || "").localeCompare(b.statusType || "")
          );
      }
      result.set(grp.name, out);
    }
    return result;
  }, [deptGroups, details]);

  const totalUsers = users.length;

  const weekDates = useMemo(
    () => (weekStartMonday ? getWeekDates(weekStartMonday) : []),
    [weekStartMonday]
  );

  /* ====== Excel tuần (Món | SL | Loại x 7 ngày) + gộp Bộ phận ====== */
  async function exportExcelWeeklyOneSheet({
  weekDates, deptGroups, shortDay, toDDMM, weekType,
  detailsMap, groupTotalsByDay, totalsByDayAll
}) {
  if (!weekDates?.length) return;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`Tuan_${toDDMM(weekDates[0])}`);

  // Freeze 2 hàng + 2 cột (header + Bộ phận/Họ tên)
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: 2 }];

  // Header
  const dayGroupTitles = weekDates.map((d, i) => `${shortDay[i]} ${toDDMM(d)}`);
  const headerRow0 = ["Bộ phận", "Họ tên", ...dayGroupTitles.flatMap(() => ["", "", ""])];
  const headerRow1 = ["", ""];
  for (let i = 0; i < 7; i++) headerRow1.push("Món", "Số lượng", "Loại");

  ws.addRow(headerRow0);
  ws.addRow(headerRow1);

  // Merge header
  ws.mergeCells(1,1,2,1); // Bộ phận
  ws.mergeCells(1,2,2,2); // Họ tên
  for (let i = 0; i < 7; i++) {
    const c0 = 3 + i * 3; // cột đầu của nhóm ngày
    ws.getRow(1).getCell(c0).value = dayGroupTitles[i];
    ws.mergeCells(1, c0, 1, c0 + 2);
  }

  // Độ rộng cột
  const cols = [{ width: 22 }, { width: 24 }];
  for (let i = 0; i < 7; i++) cols.push({ width: 26 }, { width: 10 }, { width: 12 });
  ws.columns = cols;

  // Style header
const thin = { top:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'}, bottom:{style:'thin'} };
const headTopFill = 'FFE9F2FF';
const headSubFill = 'FFF4F8FF';

  ws.getRow(1).height = 26;
  ws.getRow(2).height = 22;
  ws.getRow(1).eachCell((cell) => {
  cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
  cell.font = { bold:true };
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: headTopFill } }; // ARGB
  cell.border = thin;
});
ws.getRow(2).eachCell((cell) => {
  cell.alignment = { vertical:'middle', horizontal:'center' };
  cell.font = { bold:true };
  cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: headSubFill } }; // ARGB
  cell.border = thin;
});


  // Helpers
  const statusToVN = (s) => ({ re: "Ca ngày", ws: "Đi ca", ot: "Tăng ca" }[(s || "").toLowerCase()] || "—");
  const parseFallback = (text, typeLabel) => {
    if (!text) return [];
    return text.split(",").map(s => s.trim()).filter(Boolean).map(s => {
      const m = s.match(/^(.*)\sx(\d+)$/i);
      return m
        ? { foodName: m[1].trim(), qty: +m[2], statusType: "", branchName: "", _typeVN: typeLabel }
        : { foodName: s, qty: 1, statusType: "", branchName: "", _typeVN: typeLabel };
    });
  };

  function styleDataRow(row) {
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = thin;
    });
  }

  // Data start from row 3
  let rIdx = 3;
  const totalBlockRanges = [];

  // ====== Vẽ dữ liệu từng bộ phận ======
  for (const g of deptGroups) {
    const deptStart = rIdx;

    // USERS
    for (const u of g.users) {
      const dm = detailsMap?.get(u.userID);
      const perDay = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
      if (dm) {
        for (let d = 1; d <= 7; d++) perDay[d] = dm.days[d] || [];
      } else {
        const typeLabel = weekType === 'all' ? "—" : ({ re: "Ca ngày", ws: "Đi ca", ot: "Tăng ca" }[weekType] || "—");
        for (let d = 1; d <= 7; d++) perDay[d] = parseFallback(u.days[d] || "", typeLabel);
      }

      const maxRows = Math.max(1, ...[1, 2, 3, 4, 5, 6, 7].map(d => perDay[d].length || 0));
      const userStart = rIdx;

      for (let rr = 0; rr < maxRows; rr++) {
        const rowArr = new Array(2 + 7 * 3).fill("");
        if (rr === 0) { rowArr[0] = g.name; rowArr[1] = u.fullName; }
        for (let d = 0; d < 7; d++) {
          const items = perDay[d + 1];
          const base = 2 + d * 3;
          if (items.length > rr) {
            const it = items[rr];
            rowArr[base + 0] = it.foodName + (it.branchName ? ` (${it.branchName})` : "");
            rowArr[base + 1] = it.qty ?? "";
            rowArr[base + 2] = statusToVN(it.statusType) || it._typeVN || "—";
          }
        }
        const row = ws.addRow(rowArr);
        styleDataRow(row);
        rIdx++;
      }
      if (maxRows > 1) {
        ws.mergeCells(userStart, 2, rIdx - 1, 2); // merge cột "Họ tên"
      }
    }

    // TỔNG (bộ phận)
    const grpTotals = groupTotalsByDay.get(g.name) || {}; // day -> [{foodName,branchName,statusType,qty}]
    const perDayLists = [];
    let maxLenAcrossDays = 0;
    for (let d = 1; d <= 7; d++) {
      const list = (grpTotals[d] || []).slice();
      perDayLists[d] = list;
      if (list.length > maxLenAcrossDays) maxLenAcrossDays = list.length;
    }

    const totalStart = rIdx;
    for (let i = 0; i < Math.max(1, maxLenAcrossDays); i++) {
      const rowArr = new Array(2 + 7 * 3).fill("");
      if (i === 0) rowArr[1] = "Tổng";
      for (let d = 1; d <= 7; d++) {
        const it = (perDayLists[d] || [])[i];
        if (!it) continue;
        const base = 2 + (d - 1) * 3;
        rowArr[base + 0] = `${it.foodName}${it.branchName ? ` (${it.branchName})` : ""}`;
        rowArr[base + 1] = it.qty ?? "";
        rowArr[base + 2] = statusToVN(it.statusType);
      }
      const row = ws.addRow(rowArr);
      styleDataRow(row);
      rIdx++;
    }
    const totalEnd = rIdx - 1;

    // Merge “Bộ phận” phủ cả block phòng (users + tổng)
    ws.mergeCells(deptStart, 1, totalEnd, 1);
    // Merge “Họ tên” = “Tổng” cho block tổng của phòng
    ws.mergeCells(totalStart, 2, totalEnd, 2);

    totalBlockRanges.push([totalStart, totalEnd]);
  }

  // ====== TỔNG TOÀN BỘ ======
  const allPerDay = [];
  let allMax = 0;
  for (let d = 1; d <= 7; d++) {
    const list = (totalsByDayAll?.[d] || []).slice();
    allPerDay[d] = list;
    if (list.length > allMax) allMax = list.length;
  }
  const grandStart = rIdx;
  for (let i = 0; i < Math.max(1, allMax); i++) {
    const rowArr = new Array(2 + 7 * 3).fill("");
    if (i === 0) { rowArr[1] = "Tổng"; rowArr[0] = "Toàn bộ"; }
    for (let d = 1; d <= 7; d++) {
      const it = (allPerDay[d] || [])[i];
      if (!it) continue;
      const base = 2 + (d - 1) * 3;
      rowArr[base + 0] = `${it.foodName}${it.branchName ? ` (${it.branchName})` : ""}`;
      rowArr[base + 1] = it.qty ?? "";
      rowArr[base + 2] = statusToVN(it.statusType);
    }
    const row = ws.addRow(rowArr);
    styleDataRow(row);
    rIdx++;
  }
  const grandEnd = rIdx - 1;

  ws.mergeCells(grandStart, 2, grandEnd, 2);
  ws.mergeCells(grandStart, 1, grandEnd, 1);
  totalBlockRanges.push([grandStart, grandEnd]);

  // ====== Tô màu xen kẽ theo NHÓM THỨ (3 cột / ngày) ======
const groupFillA = 'FFEAF3FF'; // xanh nhạt (đậm hơn trước)
const groupFillB = 'FFFFF0E6'; // cam kem nhạt (đậm hơn trước)
const lastRow = ws.lastRow.number;

// helper: đảm bảo cell tồn tại và có value '' để fill chắc hiển thị
function ensureCell(r, c) {
  const row = ws.getRow(r);
  const cell = row.getCell(c);
  if (cell.value === undefined || cell.value === null) cell.value = '';
  return cell;
}

  for (let i = 0; i < 7; i++) {
    const startCol = 3 + i * 3;  // (Món)
    const endCol   = startCol + 2; // (Loại)
    const color = (i % 2 === 0) ? groupFillA : groupFillB;

    // Tô từ hàng 3 (dữ liệu) đến hết; không đè header đã có màu riêng
    for (let r = 3; r <= lastRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = ensureCell(r, c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      }
    }

    for (let r = 1; r <= lastRow; r++) {
    // trái nhóm
    {
      const cellL = ensureCell(r, startCol);
      cellL.border = {
        top: cellL.border?.top || { style: 'thin' },
        left: { style: 'medium' }, // đường chia nhóm rõ
        bottom: cellL.border?.bottom || { style: 'thin' },
        right: cellL.border?.right || { style: 'thin' },
      };
    }
    // phải nhóm
    {
      const cellR = ensureCell(r, endCol);
      cellR.border = {
        top: cellR.border?.top || { style: 'thin' },
        left: cellR.border?.left || { style: 'thin' },
        bottom: cellR.border?.bottom || { style: 'thin' },
        right: { style: 'medium' }, // đường chia nhóm rõ
      };
    }
  }
  }
  

  // ====== Style block TỔNG (đậm + nền vàng nhạt) ======
  const rowBoldFill = 'FFFFF4E5';
  for (const [rs, re] of totalBlockRanges) {
    for (let r = rs; r <= re; r++) {
      ws.getRow(r).eachCell((cell) => {
        cell.font = { ...(cell.font || {}), bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBoldFill } };
        cell.border = thin;
      });
    }
  }

  // Bảo đảm border + alignment cho toàn sheet
  const lastCol = 2 + 7 * 3;
  for (let r = 3; r <= lastRow; r++) {
    for (let c = 1; c <= lastCol; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.border = cell.border || thin;
      if (r <= 2) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      } else {
        cell.alignment = cell.alignment || { vertical: 'top', wrapText: true };
      }
    }
  }

  // Xuất file
  const suffix = weekType === 'all' ? 'ALL' : weekType.toUpperCase();
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf]), `BaoCaoTuan_${suffix}_${toDDMM(weekDates[0])}.xlsx`);
}


  /* ====== Render ====== */
  const monthVNLabel = useMemo(() => {
    const { y, m } = parseYYYYMM(debtMonth);
    return `Tháng ${String(m).padStart(2, "0")}/${y}`;
  }, [debtMonth]);

  // Đếm tổng suất active (từ details để sát thực tế)
  const totalMealsQty = useMemo(() => {
    let sum = 0;
    for (const d of details || []) sum += d.qty || 0;
    return sum;
  }, [details]);

  return (
    <div className="min-h-screen bg-[#f6fbff] p-5">
      {/* ====== BẢNG CÔNG NỢ THEO THÁNG (TRÊN CÙNG) ====== */}
      <div className="rounded-2xl border border-slate-200 shadow-sm bg-white p-4 mb-5">
        <div className="flex items-end flex-wrap gap-3">
          <div>
            <div className="text-xs text-slate-500 mb-1">Chọn tháng</div>
            <div className="flex items-center gap-2">
              <MonthPickerVN
                value={debtMonth}
                onChange={(ym) => setDebtMonth(ym)}
                minYear={2022}
                maxYear={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          <div className="w-64">
            <div className="text-xs text-slate-500 mb-1">Bộ phận</div>
            <Select
              classNamePrefix="react-select"
              options={departments.map((d) => ({
                value: d.departmentId,
                label: d.departmentName,
              }))}
              onChange={(opt) => setDepartmentId(opt?.value ?? null)}
              placeholder="-- Tất cả --"
              isClearable
            />
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-1">Đơn giá</div>
            <input
              type="number"
              min={0}
              value={unitPrice}
              onChange={(e) =>
                setUnitPrice(parseInt(e.target.value || "0", 10))
              }
              className="px-3 py-2 rounded-xl border border-slate-200 bg-[#f9fcff] outline-none w-40 text-right"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowDebt((s) => !s)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              {showDebt ? "Ẩn bảng công nợ" : "Hiện bảng công nợ"}
            </button>
            <button
              onClick={exportDebtExcelMonth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
              disabled={debtLoading || !debtRows.length}
              title={
                !debtRows.length
                  ? "Không có dữ liệu"
                  : "Xuất Excel công nợ (tháng)"
              }
            >
              <FaFileExcel /> Xuất Excel công nợ
            </button>
          </div>
        </div>

        {showDebt && (
          <div className="mt-4 overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[820px] w-full border-collapse">
              <thead className="bg-[#f1f7ff] text-slate-700">
                <tr>
                  <th className="px-3 py-2 border-b border-slate-200 w-14">
                    STT
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">NGÀY</th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    CƠM TRƯA
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    CƠM TĂNG CA
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    CƠM ĐI CA
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    TỔNG CỘNG
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    ĐƠN GIÁ
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    THÀNH TIỀN
                  </th>
                  <th className="px-3 py-2 border-b border-slate-200">
                    GHI CHÚ
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {debtLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      Đang tải…
                    </td>
                  </tr>
                )}

                {!debtLoading &&
                  debtRows.map((r, i) => {
                    const lunch = +r.lunchQty || 0;
                    const ot = +r.otQty || 0;
                    const ws = +r.wsQty || 0;
                    const tong = lunch + ot + ws;
                    const money = tong * (unitPrice || 0);
                    return (
                      <tr
                        key={i}
                        className="odd:bg-white even:bg-[#fbfdff]"
                      >
                        <td className="px-3 py-2 border-t border-slate-100 text-center">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100">
                          {toVNDateUTC(r.actualDate)}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 text-right">
                          {lunch}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 text-right">
                          {ot}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 text-right">
                          {ws}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 text-right">
                          {tong}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 text-right">
                          {unitPrice.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100 text-right">
                          {money.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-2 border-t border-slate-100" />
                      </tr>
                    );
                  })}

                {!debtLoading &&
                  !!debtRows.length &&
                  (() => {
                    const sumL = debtRows.reduce(
                      (s, r) => s + (+r.lunchQty || 0),
                      0
                    );
                    const sumO = debtRows.reduce(
                      (s, r) => s + (+r.otQty || 0),
                      0
                    );
                    const sumW = debtRows.reduce(
                      (s, r) => s + (+r.wsQty || 0),
                      0
                    );
                    const sumT = sumL + sumO + sumW;
                    const sumM = sumT * (unitPrice || 0);
                    return (
                      <tr className="bg-amber-50/60 font-medium">
                        <td className="px-3 py-2 border-t border-amber-200"></td>
                        <td className="px-3 py-2 border-t border-amber-200">
                          TỔNG
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200 text-right">
                          {sumL}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200 text-right">
                          {sumO}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200 text-right">
                          {sumW}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200 text-right">
                          {sumT}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200 text-right">
                          {unitPrice.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200 text-right">
                          {sumM.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-3 py-2 border-t border-amber-200"></td>
                      </tr>
                    );
                  })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== BÁO CÁO TUẦN (bên dưới) ====== */}
      <div className="rounded-2xl border border-slate-200 shadow-sm bg-[#ecf8ff] px-5 py-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200 grid place-items-center text-emerald-600">
            <FaClock />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">
              Báo cáo đặt cơm theo tuần
            </div>
            <div className="flex items-center gap-2">
              {[
                { v: "all", label: "Tất cả" },
                { v: "re", label: "Ca ngày" },
                { v: "ws", label: "Đi ca" },
                { v: "ot", label: "Tăng ca" },
              ].map((op) => (
                <button
                  key={op.v}
                  onClick={() => setWeekType(op.v)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    weekType === op.v
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <div className="text-slate-500 text-sm">
              Lọc theo tuần & bộ phận • Xuất Excel
            </div>
          </div>
        </div>
        <button
          onClick={() =>
    exportExcelWeeklyOneSheet({
      weekDates, deptGroups, shortDay, toDDMM, weekType,
      detailsMap, groupTotalsByDay, totalsByDayAll
    })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700"
        >
          <FaFileExcel /> Xuất Excel (tuần)
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <div className="col-span-2">
            <div className="text-xs text-slate-500 mb-1">Chọn tuần</div>
            <input
              type="date"
              value={weekStartMonday}
              onChange={(e) => setWeekStartMonday(getMonday(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-[#f9fcff] outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <div className="col-span-2">
            <div className="text-xs text-slate-500 mb-1">Bộ phận</div>
            <Select
              classNamePrefix="react-select"
              options={departments.map((d) => ({
                value: d.departmentId,
                label: d.departmentName,
              }))}
              onChange={(opt) => setDepartmentId(opt?.value ?? null)}
              placeholder="-- Tất cả --"
              isClearable
            />
          </div>
          <div className="col-span-2 flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700">
              👥 <b>{totalUsers}</b> người
            </div>
            <div className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700">
              🍚 <b>{totalMealsQty}</b> suất (active)
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto">
        <table className="min-w-[1100px] w-full border-collapse">
          <thead>
            <tr className="bg-[#f1f7ff] text-slate-700">
              <th className="px-3 py-3 border-b border-slate-200 w-14 text-center">
                #
              </th>
              <th className="px-3 py-3 border-b border-slate-200 text-left w-48">
                Bộ phận
              </th>
              <th className="px-3 py-3 border-b border-slate-200 text-left w-64">
                Họ tên
              </th>
              {weekDates.length === 7 &&
                weekDates.map((d, i) => (
                  <th
                    key={i}
                    className="px-3 py-3 border-b border-slate-200 text-left"
                  >
                    <div className="text-[13px] font-semibold">
                      {shortDay[i]}
                    </div>
                    <div className="text-xs text-slate-500">{toDDMM(d)}</div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && deptGroups.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {!loading &&
              deptGroups.map((grp, gi) => (
                <React.Fragment key={grp.name + gi}>
                  <tr className="bg-slate-50/80">
                    <td
                      colSpan={10}
                      className="px-3 py-2 border-t border-slate-200 text-slate-700 font-semibold"
                    >
                      {grp.name}{" "}
                      <span className="text-slate-500 font-normal">
                        ({grp.users.length} người)
                      </span>
                    </td>
                  </tr>

                  {grp.users.map((u, idx) => {
                    const dm = detailsMap.get(u.userID);
                    return (
                      <tr
                        key={u.userID}
                        className="odd:bg-white even:bg-[#fbfdff] align-top"
                      >
                        <td className="px-3 py-3 border-t border-slate-100 text-center">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-3 border-t border-slate-100">
                          {grp.name}
                        </td>
                        <td className="px-3 py-3 border-t border-slate-100">
                          {u.fullName}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                          <td
                            key={d}
                            className="px-3 py-3 border-t border-slate-100 align-top"
                          >
                            <DayCell items={dm?.days[d]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Tổng từng món (bộ phận) — tách theo branch + loại */}
                  <tr className="bg-emerald-50/60">
                    <td className="px-3 py-3 border-t border-emerald-100"></td>
                    <td className="px-3 py-3 border-t border-emerald-100 font-semibold text-emerald-800">
                      Tổng từng món (bộ phận)
                    </td>
                    <td className="px-3 py-3 border-t border-emerald-100"></td>
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                      const items = (groupTotalsByDay.get(grp.name) || {})[d] || [];
                      return (
                        <td
                          key={d}
                          className="px-3 py-3 border-t border-emerald-100 align-top"
                        >
                          <div className="flex flex-col gap-1">
                            {items.map((it, i) => (
                              <FoodItemTag key={i} item={it} />
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}

            {/* Tổng toàn bộ — tách theo branch + loại */}
            {!loading && deptGroups.length > 0 && (
              <tr className="bg-amber-50/70 font-medium">
                <td className="px-3 py-3 border-t border-amber-200"></td>
                <td className="px-3 py-3 border-t border-amber-200">
                  Tổng từng món (toàn bộ)
                </td>
                <td className="px-3 py-3 border-t border-amber-200"></td>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const items = totalsByDayAll[d] || [];
                  return (
                    <td
                      key={d}
                      className="px-3 py-3 border-t border-amber-200 align-top"
                    >
                      <div className="flex flex-col gap-1">
                        {items.map((it, i) => (
                          <FoodItemTag key={i} item={it} />
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== MonthPickerVN ===== */
const pad2 = (n) => String(n).padStart(2, "0");
function MonthPickerVN({
  value,
  onChange,
  minYear = 2022,
  maxYear = new Date().getFullYear() + 1,
}) {
  const [y, m] = (value || "").split("-").map(Number);
  const months = [
    { v: 1, label: "Tháng 01" },
    { v: 2, label: "Tháng 02" },
    { v: 3, label: "Tháng 03" },
    { v: 4, label: "Tháng 04" },
    { v: 5, label: "Tháng 05" },
    { v: 6, label: "Tháng 06" },
    { v: 7, label: "Tháng 07" },
    { v: 8, label: "Tháng 08" },
    { v: 9, label: "Tháng 09" },
    { v: 10, label: "Tháng 10" },
    { v: 11, label: "Tháng 11" },
    { v: 12, label: "Tháng 12" },
  ];
  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i
  );

  const handleMonth = (mm) => onChange?.(`${y}-${pad2(Number(mm))}`);
  const handleYear = (yy) => onChange?.(`${Number(yy)}-${pad2(m || 1)}`);

  return (
    <div className="flex items-center gap-2">
      <select
        value={m || 1}
        onChange={(e) => handleMonth(e.target.value)}
        className="px-3 py-2 rounded-xl border border-slate-200 bg-[#f9fcff] outline-none focus:ring-2 focus:ring-emerald-300"
      >
        {months.map((opt) => (
          <option key={opt.v} value={opt.v}>
            {opt.label}
          </option>
        ))}
      </select>

      <select
        value={y || new Date().getFullYear()}
        onChange={(e) => handleYear(e.target.value)}
        className="px-3 py-2 rounded-xl border border-slate-200 bg-[#f9fcff] outline-none focus:ring-2 focus:ring-emerald-300"
      >
        {years.map((yy) => (
          <option key={yy} value={yy}>
            {`Năm ${yy}`}
          </option>
        ))}
      </select>
    </div>
  );
}
