// src/pages/CompareWeigh_SP.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FiDownload, FiLoader } from "react-icons/fi";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import axios from "axios";
import { BASE_URL_SERVER_THLA } from "~/config";

// formatter số
const fmt = (n) => Number(n || 0).toLocaleString("vi-VN");

// Chuyển 'YYYY-MM-DD' -> 'YYMMDD' (ví dụ: 2025-08-18 -> 250818)
const toYYMMDD = (isoDate) => {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return null;
  return `${y.slice(-2)}${m.padStart(2, "0")}${d.padStart(2, "0")}`;
};

// Danh sách ca và label hiển thị
const SHIFT_OPTIONS = [
  { code: "C1", label: "Ca Ngắn 1 (06–14h)" },
  { code: "C2", label: "Ca Ngắn 2 (14–22h)" },
  { code: "C3", label: "Ca Ngắn 3 (22–06h)" },
  { code: "D1", label: "Ca Dài 1 (06–18h)" },
  { code: "D2", label: "Ca Dài 2 (18–06h)" },
  { code: "HC", label: "Hành chính (07:30–16:30)" },
];

export default function CompareWeigh_SP() {
  const [ngayCa, setNgayCa] = useState("");   // yyyy-mm-dd
  const [shift, setShift] = useState("");     // C1/C2/C3/D1/D2/HC
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [diffOnly, setDiffOnly] = useState(false);
  const [diffThreshold, setDiffThreshold] = useState(30); // kg

  const fetchData = async () => {
    setLoading(true);
    try {
      // Gộp theo đúng format DB đang lưu: yymmdd + shift (ví dụ '250818C1')
      let pNgaycaParam = "null";
      if (ngayCa && shift) {
        const yymmdd = toYYMMDD(ngayCa);
        if (yymmdd) pNgaycaParam = `${yymmdd}${shift}`;
      }

      const res = await axios.get(`${BASE_URL_SERVER_THLA}/compare`, {
        params: { pNgayca: pNgaycaParam },
      });

      setData(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e) {
      console.error("API /compare lỗi:", e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [ngayCa, shift]);

  // Dữ liệu hiển thị (lọc chênh lệch nếu bật)
  const displayed = useMemo(() => {
    const arr = data.map((r) => ({
      ...r,
      diff: (Number(r.thucte) || 0) - (Number(r.kehoach) || 0),
    }));
    return diffOnly ? arr.filter((x) => Math.abs(x.diff) >= diffThreshold) : arr;
  }, [data, diffOnly, diffThreshold]);

  const exportExcel = () => {
    const shiftText =
      SHIFT_OPTIONS.find((s) => s.code === shift)?.code || (shift ? shift : "TẤT CẢ");
    const t = `📊 So sánh KH vs TT (kg) — Ngày: ${ngayCa || "TẤT CẢ"} — Ca: ${shiftText}`;
    const wsData = [];
    wsData.push([t]);                    // tiêu đề
    wsData.push([]);                     // dòng trống
    wsData.push([
      "Lệnh SX",
      "Mã mực",
      "Tên mực",
      "Kế hoạch (kg)",
      "Thực tế (kg)",
      "Chênh lệch (kg)",
      "Khách hàng",
      "PO",
      "Mã hàng",
      "Tổ in",
    ]);

    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

    // nhóm theo lệnh để dễ đọc
    const groups = {};
    displayed.forEach((r) => {
      if (!groups[r.lenhsx]) groups[r.lenhsx] = [];
      groups[r.lenhsx].push(r);
    });

    Object.entries(groups).forEach(([lenh, rows]) => {
      rows.forEach((r) => {
        wsData.push([
          lenh,
          r.inkcode,
          r.inkname,
          r.kehoach,
          r.thucte,
          (r.thucte - r.kehoach),
          r.khachhang || "",
          r.po || "",
          r.mahang || "",
          r.toin || "",
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 16 }, // Lệnh
      { wch: 14 }, // Mã mực
      { wch: 28 }, // Tên mực
      { wch: 14 }, // KH
      { wch: 14 }, // TT
      { wch: 16 }, // Diff
      { wch: 22 }, // Khách hàng
      { wch: 14 }, // PO
      { wch: 16 }, // Mã hàng
      { wch: 10 }, // Tổ in
    ];

    // style
    const range = XLSX.utils.decode_range(ws["!ref"]);
    let currentGroupColor = false;
    let lastLenh = "";

    for (let R = 0; R <= range.e.r; ++R) {
      const firstVal = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v;

      if (firstVal && R > 2 && firstVal !== lastLenh) {
        currentGroupColor = !currentGroupColor;
        lastLenh = firstVal;
      }

      for (let C = 0; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;

        if (R === 0) {
          ws[addr].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: "center", vertical: "center" },
          };
        } else if (R === 2) {
          ws[addr].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "003366" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin" }, bottom: { style: "thin" },
              left: { style: "thin" }, right: { style: "thin" },
            },
          };
        } else {
          const isNumberCol = C >= 3 && C <= 5;
          ws[addr].s = {
            fill: currentGroupColor ? { fgColor: { rgb: "F8FAFC" } } : undefined,
            alignment: {
              horizontal: isNumberCol ? "right" : C === 2 ? "left" : "center",
              vertical: "center",
            },
            border: {
              top: { style: "thin" }, bottom: { style: "thin" },
              left: { style: "thin" }, right: { style: "thin" },
            },
            numFmt: isNumberCol ? "#,##0.00" : undefined,
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "So sánh (kg)");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `So_sanh_KH_vs_TT_${(ngayCa || "ALL")}_${(shift || "ALL")}.xlsx`
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1300px] space-y-5">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          {/* Header + bộ lọc */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                📊 So sánh KH vs TT (đơn vị: kg)
              </h1>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <FiDownload className="text-base" />
                Xuất Excel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Ngày */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ngày</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={ngayCa}
                  onChange={(e) => setNgayCa(e.target.value)}
                />
                <p className="mt-1 text-[12px] text-slate-500">Bỏ trống để lấy tất cả</p>
              </div>

              {/* Ca */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ca</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                >
                  <option value="">-- Chọn ca --</option>
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s.code} value={s.code}>{s.label} ({s.code})</option>
                  ))}
                </select>
                <p className="mt-1 text-[12px] text-slate-500">
                  Để lọc đúng theo DB, cần chọn cả Ngày và Ca.
                </p>
              </div>

              {/* Lọc chênh lệch */}
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-indigo-600"
                    checked={diffOnly}
                    onChange={(e) => setDiffOnly(e.target.checked)}
                  />
                  <span>Chỉ hiển thị chênh lệch &gt;=</span>
                  <input
                    type="number"
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={diffThreshold}
                    min={0}
                    step={1}
                    onChange={(e) => setDiffThreshold(Number(e.target.value) || 0)}
                  />
                  <span>kg</span>
                </label>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-0 sm:p-5">
            <div className="relative h-[420px] w-full rounded-xl border border-slate-200 overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayed} margin={{ top: 20, right: 24, left: 12, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="inkcode" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="kehoach" name="Kế hoạch (kg)" fill="#6366F1" />
                  <Bar dataKey="thucte" name="Thực tế (kg)" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bảng chi tiết */}
          <div className="p-0 sm:p-5 pt-0">
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      {[
                        "Lệnh SX",
                        "Mã mực",
                        "Tên mực",
                        "Kế hoạch (kg)",
                        "Thực tế (kg)",
                        "Chênh lệch (kg)",
                        "Khách hàng",
                        "PO",
                        "Mã hàng",
                        "Tổ in",
                      ].map((h) => (
                        <th key={h} className="border-b border-slate-200 px-3 py-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.length === 0 && (
                      <tr>
                        <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}

                    {displayed.map((r, idx) => {
                      const diff = (Number(r.thucte) || 0) - (Number(r.kehoach) || 0);
                      const strong = Math.abs(diff) >= diffThreshold && diffThreshold > 0;
                      return (
                        <tr
                          key={`${r.lenhsx}-${r.inkcode}-${idx}`}
                          className={`transition-colors ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                          } hover:bg-slate-100`}
                        >
                          <td className="px-3 py-2">{r.lenhsx}</td>
                          <td className="px-3 py-2">{r.inkcode}</td>
                          <td className="px-3 py-2">{r.inkname}</td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(r.kehoach)}</td>
                          <td className="px-3 py-2 text-right font-medium">{fmt(r.thucte)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${strong ? "text-rose-600" : "text-slate-800"}`}>
                            {fmt(diff)}
                          </td>
                          <td className="px-3 py-2">{r.khachhang || "-"}</td>
                          <td className="px-3 py-2">{r.po || "-"}</td>
                          <td className="px-3 py-2">{r.mahang || "-"}</td>
                          <td className="px-3 py-2">{r.toin || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
