// src/pagesLunchOrder/AdminSummaryModern.jsx
import React, { useEffect, useMemo, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import Select from "react-select";
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { FaFileExcel, FaClock } from "react-icons/fa";

function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=CN..6=T7
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}
function getWeekDates(mondayStr) {
  const base = new Date(mondayStr + "T00:00:00");
  const arr = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    arr.push(d);
  }
  return arr;
}
const shortDay = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const toDDMM = (d) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

export default function AdminSummaryModern() {
  // data từ API
  const [rows, setRows] = useState([]);
  // filter
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(null);
  const [weekStartMonday, setWeekStartMonday] = useState("");

  const [loading, setLoading] = useState(false);

  // set tuần hiện tại khi vào
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setWeekStartMonday(getMonday(today));
  }, []);

  // load danh mục bộ phận
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

  // load dữ liệu
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
    } finally {
      setLoading(false);
    }
  }

  // nhóm theo user → pivot theo 7 ngày
  const grouped = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.userID)) {
        map.set(r.userID, { userID: r.userID, fullName: r.fullName, days: {} });
      }
      if (r.dayOfWeek) map.get(r.userID).days[r.dayOfWeek] = r.foodName;
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.fullName || "").localeCompare(b.fullName || "")
    );
  }, [rows]);

  // tổng từng món theo từng ngày
  const totalsByDay = useMemo(() => {
    const result = {};
    for (const r of rows) {
      if (!r.dayOfWeek || !r.foodName) continue;
      if (!result[r.dayOfWeek]) result[r.dayOfWeek] = {};
      result[r.dayOfWeek][r.foodName] = (result[r.dayOfWeek][r.foodName] || 0) + 1;
    }
    return result;
  }, [rows]);

  const weekDates = useMemo(
    () => (weekStartMonday ? getWeekDates(weekStartMonday) : []),
    [weekStartMonday]
  );

  const totalUsers = grouped.length;
  const totalMeals = rows.length;

  // xuất Excel (kèm dòng tổng)
  function exportExcel() {
  if (weekDates.length !== 7) return;

  // ====== 1) Chuẩn bị dữ liệu AOA ======
  const headers = [
    "#",
    "Họ tên",
    ...weekDates.map((d, i) => `${shortDay[i]} (${toDDMM(d)})`),
  ];

  const body = grouped.map((u, i) => [
    i + 1,
    u.fullName,
    u.days[1] || "",
    u.days[2] || "",
    u.days[3] || "",
    u.days[4] || "",
    u.days[5] || "",
    u.days[6] || "",
    u.days[7] || "",
  ]);

  // Dòng tổng từng món theo từng ngày
  const totalRow = [
    "",
    "Tổng từng món",
    ...Array.from({ length: 7 }).map((_, idx) => {
      const d = idx + 1;
      if (!totalsByDay[d]) return "";
      return Object.entries(totalsByDay[d])
        .map(([food, count]) => `${food}: ${count}`)
        .join(", ");
    }),
  ];

  const aoa = [headers, ...body, totalRow];

  // ====== 2) Tạo worksheet có style ======
const ws = XLSX.utils.aoa_to_sheet(aoa);
const range = XLSX.utils.decode_range(ws["!ref"]);

// ---- style cơ bản
const borderThin = {
  top: { style: "thin", color: { rgb: "C7D2FE" } },   // xanh nhạt
  left: { style: "thin", color: { rgb: "C7D2FE" } },
  bottom:{ style: "thin", color: { rgb: "C7D2FE" } },
  right: { style: "thin", color: { rgb: "C7D2FE" } },
};
const borderOuter = {
  top: { style: "medium", color: { rgb: "64748B" } },   // slate-500
  left:{ style: "medium", color: { rgb: "64748B" } },
  bottom:{ style: "medium", color: { rgb: "64748B" } },
  right:{ style: "medium", color: { rgb: "64748B" } },
};

const baseAlign = { alignment: { vertical: "center", horizontal: "left", wrapText: true } };
const headerBase = {
  font: { bold: true, color: { rgb: "0F172A" } },
  alignment: { vertical: "center", horizontal: "center", wrapText: true },
};

// ---- màu zebra theo CỘT (áp cho header + body)
const COL_COLOR_EVEN = "F1F5FF"; // xanh rất nhạt
const COL_COLOR_ODD  = "FFFFFF"; // trắng

function cellStyle(r, c, isHeader, isTotalRow) {
  // chọn màu nền theo CỘT
  const isEvenCol = (c % 2 === 0);
  const fillColor = isHeader
    ? (isEvenCol ? "E8F1FF" : "F4F8FF")  // header nhẹ hơn tí
    : (isEvenCol ? COL_COLOR_EVEN : COL_COLOR_ODD);

  const style = {
    ...(isHeader ? headerBase : baseAlign),
    fill: { fgColor: { rgb: fillColor } },
    border: { ...borderThin },
  };

  if (isTotalRow) {
    style.font = { ...(style.font || {}), bold: true, color: { rgb: "7C2D12" } };
    style.fill = { fgColor: { rgb: "FEF3C7" } }; // amber-100
  }
  return style;
}

// ---- áp style cho toàn sheet
const lastRow = range.e.r;
const lastCol = range.e.c;

// Header (row 0)
for (let c = range.s.c; c <= lastCol; c++) {
  const addr = XLSX.utils.encode_cell({ r: 0, c });
  if (!ws[addr]) ws[addr] = { v: "" };
  ws[addr].s = cellStyle(0, c, true, false);
}

// Body + dòng tổng
for (let r = 1; r <= lastRow; r++) {
  const isTotal = (r === lastRow); // dòng cuối là "Tổng từng món"
  for (let c = range.s.c; c <= lastCol; c++) {
    const addr = XLSX.utils.encode_cell({ r, c });
    if (!ws[addr]) ws[addr] = { v: "" };
    ws[addr].s = cellStyle(r, c, false, isTotal);
  }
}

// ---- viền bao ngoài (outline)
for (let c = range.s.c; c <= lastCol; c++) {
  // top
  const topAddr = XLSX.utils.encode_cell({ r: range.s.r, c });
  ws[topAddr].s = { ...ws[topAddr].s, border: { ...ws[topAddr].s.border, top: borderOuter.top } };
  // bottom
  const botAddr = XLSX.utils.encode_cell({ r: lastRow, c });
  ws[botAddr].s = { ...ws[botAddr].s, border: { ...ws[botAddr].s.border, bottom: borderOuter.bottom } };
}
for (let r = range.s.r; r <= lastRow; r++) {
  // left
  const leftAddr = XLSX.utils.encode_cell({ r, c: range.s.c });
  ws[leftAddr].s = { ...ws[leftAddr].s, border: { ...ws[leftAddr].s.border, left: borderOuter.left } };
  // right
  const rightAddr = XLSX.utils.encode_cell({ r, c: lastCol });
  ws[rightAddr].s = { ...ws[rightAddr].s, border: { ...ws[rightAddr].s.border, right: borderOuter.right } };
}

// Freeze header + độ rộng cột (giữ giống trước)
ws["!freeze"] = { xSplit: 0, ySplit: 1 };
ws["!cols"] = [
  { wch: 5 },   // #
  { wch: 28 },  // Họ tên
  { wch: 26 },  // T2
  { wch: 26 },  // T3
  { wch: 26 },  // T4
  { wch: 26 },  // T5
  { wch: 26 },  // T6
  { wch: 26 },  // T7
  { wch: 26 },  // CN
];


  // ====== 3) Ghi file ======
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BaoCaoTuan");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(new Blob([buf]), `Bao_cao_tuan_${toDDMM(weekDates[0])}.xlsx`);
}


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
            <div className="text-slate-500 text-sm">
              Lọc theo tuần & bộ phận • Xuất Excel
            </div>
          </div>
        </div>

        <button
          onClick={exportExcel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-[0.99]"
        >
          <FaFileExcel /> Xuất Excel
        </button>
      </div>

      {/* Toolbar lọc */}
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
              className="react-select-container"
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
              🍽️ <b>{totalMeals}</b> món
            </div>
          </div>
        </div>
      </div>

      {/* Bảng */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead>
            <tr className="bg-[#f1f7ff] text-slate-700">
              <th className="px-3 py-3 border-b border-slate-200 w-14 text-center">#</th>
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
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Đang tải…
                </td>
              </tr>
            )}

            {!loading && grouped.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {!loading &&
              grouped.map((u, idx) => (
                <tr key={u.userID} className="odd:bg-white even:bg-[#fbfdff]">
                  <td className="px-3 py-3 border-t border-slate-100 text-center">{idx + 1}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.fullName}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[1] || ""}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[2] || ""}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[3] || ""}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[4] || ""}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[5] || ""}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[6] || ""}</td>
                  <td className="px-3 py-3 border-t border-slate-100">{u.days[7] || ""}</td>
                </tr>
              ))}

            {/* Dòng tổng từng món theo từng ngày */}
            {!loading && grouped.length > 0 && (
              <tr className="bg-amber-50/70 font-medium">
                <td className="px-3 py-3 border-t border-slate-200"></td>
                <td className="px-3 py-3 border-t border-slate-200">Tổng từng món</td>
                {Array.from({ length: 7 }).map((_, idx) => {
                  const d = idx + 1;
                  const text = totalsByDay[d]
                    ? Object.entries(totalsByDay[d])
                        .map(([food, count]) => `${food}: ${count}`)
                        .join(", ")
                    : "";
                  return (
                    <td key={idx} className="px-3 py-3 border-t border-slate-200 text-[12.5px] text-slate-700">
                      {text}
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
