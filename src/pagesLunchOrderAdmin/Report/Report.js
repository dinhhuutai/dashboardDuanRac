// src/pagesLunchOrder/AdminSummaryModern.jsx
import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import Select from "react-select";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { FaFileExcel, FaClock } from "react-icons/fa";

/* ====== Date helpers ====== */
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
  return h % 360; // 0..359
}
function parseFoodsText(text = "") {
  // "Cá dứa chiên x13, Chay x5" -> [{name, qty}, ...]
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(.*)\sx(\d+)$/i);
      return m ? { name: m[1].trim(), qty: +m[2] } : { name: s, qty: 1 };
    });
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
            <span className="text-slate-700 truncate max-w-[10rem]">{it.name}</span>
            <span className="ml-1 rounded-md bg-slate-100 px-1 text-[11px] font-semibold text-slate-700">
              x{it.qty}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/* ====== Page ====== */
export default function AdminSummaryModern() {
  // API data
  const [rows, setRows] = useState([]);     // user × day (ô text đã gộp: "Món xSL, ...")
  const [totals, setTotals] = useState([]); // [{dayOfWeek, foodName, totalQty}]
  // filters
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [weekStartMonday, setWeekStartMonday] = useState("");
  const [loading, setLoading] = useState(false);

  // default week
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setWeekStartMonday(getMonday(today));
  }, []);

  // departments
  useEffect(() => {
    (async () => {
      try {
        const depRes = await http.get(`${BASE_URL}/api/lunch-order/admin/departments`);
        setDepartments(depRes.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  // load data
  useEffect(() => {
    if (!weekStartMonday) return;
    load();
  }, [weekStartMonday, departmentId]);

  async function load() {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/lunch-order/admin/summary`, {
        params: { weekStartMonday, departmentId },
      });
      setRows(res.data?.data || []);
      setTotals(res.data?.totals || []);
    } finally {
      setLoading(false);
    }
  }

  /* ====== Transform: users & departments ====== */

  // users: gom theo user, mỗi ô ngày là chuỗi "Món xSL, ..."
  const users = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.userID)) {
        map.set(r.userID, {
          userID: r.userID,
          fullName: r.fullName,
          departmentId: r.departmentId,
          departmentName: r.departmentName || "Chưa gán",
          days: {}, // 1..7 -> "Food xN, Food2 xM"
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

  // group by department + compute per-dept totalsByDay
  const deptGroups = useMemo(() => {
    const m = new Map(); // dept -> { name, users:[], totalsByDay:{ d:{food:qty} } }
    const add = (agg, d, text) => {
      if (!text) return;
      agg[d] ||= {};
      for (const { name, qty } of parseFoodsText(text)) {
        agg[d][name] = (agg[d][name] || 0) + qty;
      }
    };
    for (const u of users) {
      const key = u.departmentName || "Chưa gán";
      if (!m.has(key)) m.set(key, { name: key, users: [], totalsByDay: {} });
      m.get(key).users.push(u);
      for (let d = 1; d <= 7; d++) add(m.get(key).totalsByDay, d, u.days[d] || "");
    }
    return Array.from(m.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [users]);

  // totalsByDay (toàn bộ) – ưu tiên từ API
  const totalsByDay = useMemo(() => {
    if (totals?.length) {
      const out = {};
      for (const t of totals) {
        out[t.dayOfWeek] ||= {};
        out[t.dayOfWeek][t.foodName] = (out[t.dayOfWeek][t.foodName] || 0) + (t.totalQty || 0);
      }
      return out;
    }
    // fallback từ deptGroups
    const agg = {};
    for (const g of deptGroups) {
      for (const [d, foods] of Object.entries(g.totalsByDay)) {
        agg[d] ||= {};
        for (const [food, qty] of Object.entries(foods)) {
          agg[d][food] = (agg[d][food] || 0) + qty;
        }
      }
    }
    return agg;
  }, [totals, deptGroups]);

  // totals badges
  const totalUsers = users.length;
  const totalMealsQty = useMemo(() => {
    let sum = 0;
    for (const g of deptGroups) {
      for (const foods of Object.values(g.totalsByDay)) {
        for (const qty of Object.values(foods)) sum += qty;
      }
    }
    return sum;
  }, [deptGroups]);

  const weekDates = useMemo(
    () => (weekStartMonday ? getWeekDates(weekStartMonday) : []),
    [weekStartMonday]
  );

  /* ====== Export Excel (nhận tham số & được wrap khi gọi) ====== */
  function exportExcel({ weekDates, deptGroups, totalsByDay, shortDay, toDDMM }) {
    if (!Array.isArray(weekDates) || !weekDates.length) return;

    const wb = XLSX.utils.book_new();

    // ---- Styles ----
    const BORDER_THIN = { style: "thin", color: { rgb: "E2E8F0" } };
    const BORDER_MED  = { style: "medium", color: { rgb: "94A3B8" } };

    const styleTitle = {
      font: { bold: true, sz: 14, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center" }
    };
    const styleHeader = {
      font: { bold: true, color: { rgb: "0F172A" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      fill: { fgColor: { rgb: "E9F2FF" } },
      border: { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN }
    };
    const styleTextLeft = {
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN }
    };
    const styleNumber = {
      alignment: { horizontal: "right", vertical: "center" },
      border: { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN },
      numFmt: "#,##0"
    };
    const styleZebra = (even) => ({ fill: { fgColor: { rgb: even ? "F8FAFC" : "FFFFFF" } } });
    const styleTotalCell = {
      font: { bold: true, color: { rgb: "7C2D12" } },
      fill: { fgColor: { rgb: "FEF3C7" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: { top: BORDER_THIN, left: BORDER_THIN, right: BORDER_THIN, bottom: BORDER_THIN },
      numFmt: "#,##0"
    };
    const styleTotalLeft = { ...styleTotalCell, alignment: { horizontal: "left", vertical: "center" } };

    const setCellStyle = (ws, r, c, style) => {
      const addr = XLSX.utils.encode_cell({ r, c });
      ws[addr] = ws[addr] || { v: "" };
      ws[addr].s = { ...(ws[addr].s || {}), ...style };
    };

    for (let day = 1; day <= 7; day++) {
      // 1) Tập món ăn của ngày (union toàn bộ phòng ban, sort theo qty giảm)
      const foodsMap = new Map();
      (deptGroups || []).forEach((g) => {
        const m = (g.totalsByDay && g.totalsByDay[day]) || {};
        Object.entries(m).forEach(([food, qty]) => {
          foodsMap.set(food, (foodsMap.get(food) || 0) + (qty || 0));
        });
      });
      const foods = Array.from(foodsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([f]) => f);

      // 2) AOA
      const title = `Phòng ban × Món ăn — ${shortDay[day - 1]} – ${toDDMM(weekDates[day - 1])}`;
      const header1 = [title, ...Array(foods.length + 1).fill("")];
      const header2 = ["Phòng ban", ...foods, "Tổng"];

      const body = (deptGroups || []).map((g) => {
        let sum = 0;
        const row = [g.name];
        foods.forEach((f) => {
          const v = (g.totalsByDay && g.totalsByDay[day] && g.totalsByDay[day][f]) || 0;
          row.push(v);
          sum += v;
        });
        row.push(sum);
        return row;
      });

      let grand = 0;
      const totalRow = ["Tổng"];
      foods.forEach((f) => {
        const q = (totalsByDay && totalsByDay[day] && totalsByDay[day][f]) || 0;
        totalRow.push(q);
        grand += q;
      });
      totalRow.push(grand);

      const aoa = [header1, header2, ...body, totalRow];
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // 3) Merge / Freeze / Filter / Col widths
      const lastCol = header2.length - 1;
      ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];
      ws["!freeze"] = { xSplit: 1, ySplit: 2 };
      ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } }) };
      ws["!cols"] = [{ wch: 28 }, ...foods.map(() => ({ wch: 12 })), { wch: 10 }];
      ws["!rows"] = [{ hpt: 28 }, { hpt: 22 }];

      // 4) Styles
      const ref = ws["!ref"] || XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: lastCol } });
      const range = XLSX.utils.decode_range(ref);

      // Title
      for (let c = 0; c <= lastCol; c++) setCellStyle(ws, 0, c, styleTitle);
      // Header
      for (let c = 0; c <= lastCol; c++) setCellStyle(ws, 1, c, styleHeader);
      // Body
      for (let r = 2; r < range.e.r; r++) {
        const even = (r % 2) === 0;
        setCellStyle(ws, r, 0, { ...styleTextLeft, ...styleZebra(even) });
        for (let c = 1; c < lastCol; c++) setCellStyle(ws, r, c, { ...styleNumber, ...styleZebra(even) });
        setCellStyle(ws, r, lastCol, { ...styleNumber, ...styleZebra(even) });
      }
      // Total row
      const totalRowIndex = range.e.r;
      setCellStyle(ws, totalRowIndex, 0, styleTotalLeft);
      for (let c = 1; c <= lastCol; c++) setCellStyle(ws, totalRowIndex, c, styleTotalCell);

      // Outline
      for (let c = 0; c <= lastCol; c++) {
        setCellStyle(ws, 1, c, {
          border: { ...(ws[XLSX.utils.encode_cell({ r: 1, c })]?.s?.border || {}), top: BORDER_MED }
        });
        setCellStyle(ws, totalRowIndex, c, {
          border: { ...(ws[XLSX.utils.encode_cell({ r: totalRowIndex, c })]?.s?.border || {}), bottom: BORDER_MED }
        });
      }
      for (let r = 1; r <= totalRowIndex; r++) {
        setCellStyle(ws, r, 0, {
          border: { ...(ws[XLSX.utils.encode_cell({ r, c: 0 })]?.s?.border || {}), left:  BORDER_MED }
        });
        setCellStyle(ws, r, lastCol, {
          border: { ...(ws[XLSX.utils.encode_cell({ r, c: lastCol })]?.s?.border || {}), right: BORDER_MED }
        });
      }

      XLSX.utils.book_append_sheet(wb, ws, shortDay[day - 1]);
    }

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileName = `Phongban_Monan_${toDDMM(weekDates[0])}.xlsx`;
    saveAs(new Blob([buf]), fileName);
  }

  /* ====== Render ====== */
  return (
    <div className="min-h-screen bg-[#f6fbff] p-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 shadow-sm bg-[#ecf8ff] px-5 py-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200 grid place-items-center text-emerald-600">
            <FaClock />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800">Báo cáo đặt cơm theo tuần</div>
            <div className="text-slate-500 text-sm">Lọc theo tuần & bộ phận • Xuất Excel</div>
          </div>
        </div>

        {/* GỌI HÀM BẰNG CÁCH WRAP THAM SỐ */}
        <button
          onClick={() =>
            exportExcel({ weekDates, deptGroups, totalsByDay, shortDay, toDDMM })
          }
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-[0.99]"
        >
          <FaFileExcel /> Xuất Excel
        </button>
      </div>

      {/* Toolbar */}
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
              options={departments.map((d) => ({ value: d.departmentId, label: d.departmentName }))}
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

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto">
        <table className="min-w-[1100px] w-full border-collapse">
          <thead>
            <tr className="bg-[#f1f7ff] text-slate-700">
              <th className="px-3 py-3 border-b border-slate-200 w-14 text-center">#</th>
              <th className="px-3 py-3 border-b border-slate-200 text-left w-48">Bộ phận</th>
              <th className="px-3 py-3 border-b border-slate-200 text-left w-64">Họ tên</th>
              {weekDates.length === 7 &&
                weekDates.map((d, i) => (
                  <th key={i} className="px-3 py-3 border-b border-slate-200 text-left">
                    <div className="text-[13px] font-semibold">{shortDay[i]}</div>
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

            {!loading && !deptGroups.length && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {!loading &&
              deptGroups.map((grp, gi) => (
                <React.Fragment key={grp.name + gi}>
                  {/* group header */}
                  <tr className="bg-slate-50/80">
                    <td colSpan={10} className="px-3 py-2 border-t border-slate-200 text-slate-700 font-semibold">
                      {grp.name}{" "}
                      <span className="text-slate-500 font-normal">({grp.users.length} người)</span>
                    </td>
                  </tr>

                  {/* users */}
                  {grp.users.map((u, idx) => (
                    <tr key={u.userID} className="odd:bg-white even:bg-[#fbfdff] align-top">
                      <td className="px-3 py-3 border-t border-slate-100 text-center">{idx + 1}</td>
                      <td className="px-3 py-3 border-t border-slate-100">{grp.name}</td>
                      <td className="px-3 py-3 border-t border-slate-100">{u.fullName}</td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[1]} /></td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[2]} /></td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[3]} /></td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[4]} /></td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[5]} /></td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[6]} /></td>
                      <td className="px-3 py-3 border-t border-slate-100 align-top"><FoodChipsCell text={u.days[7]} /></td>
                    </tr>
                  ))}

                  {/* dept totals row */}
                  <tr className="bg-emerald-50/60">
                    <td className="px-3 py-3 border-t border-emerald-100"></td>
                    <td className="px-3 py-3 border-t border-emerald-100 font-semibold text-emerald-800">
                      Tổng từng món (bộ phận)
                    </td>
                    <td className="px-3 py-3 border-t border-emerald-100"></td>
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                      const foods = grp.totalsByDay[d] || {};
                      const text = Object.entries(foods)
                        .sort((a, b) => b[1] - a[1])
                        .map(([f, q]) => `${f} x${q}`)
                        .join(", ");
                      return (
                        <td key={d} className="px-3 py-3 border-t border-emerald-100 align-top">
                          <FoodChipsCell text={text} />
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              ))}

            {/* grand totals */}
            {!loading && deptGroups.length > 0 && (
              <tr className="bg-amber-50/70 font-medium">
                <td className="px-3 py-3 border-t border-amber-200"></td>
                <td className="px-3 py-3 border-t border-amber-200">Tổng từng món (toàn bộ)</td>
                <td className="px-3 py-3 border-t border-amber-200"></td>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const o = totalsByDay[d] || {};
                  const txt = Object.entries(o)
                    .sort((a, b) => b[1] - a[1])
                    .map(([food, qty]) => `${food} x${qty}`)
                    .join(", ");
                  return (
                    <td key={d} className="px-3 py-3 border-t border-amber-200 align-top">
                      <FoodChipsCell text={txt} />
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
