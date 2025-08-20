import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiLoader, FiDownload } from "react-icons/fi";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import { BASE_URL_SERVER_THLA } from "~/config";
import http from '~/api/http';

function InkTransferCart() {
  const today = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState([]);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!from || !to) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-transfer/by-vehicle`, {
        params: { from, to },
      });
      setData(res.data || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [from, to]);

  
  function round1(num) {
  return Math.round((num / 1000) * 10) / 10;
}

  const fmt = (v) => round1(Number(v ?? 0)).toFixed(2);
  const sumBy = (key) => data.reduce((s, r) => s + Number(r?.[key] ?? 0), 0);

  const totalNhanKho = sumBy("muc_nhan_tu_kho");
  const totalTraKho = sumBy("muc_tra_ve_kho");
  const totalCap = sumBy("muc_cap_cho_chuyen");
  const totalHoan = sumBy("muc_chuyen_hoan_ve");
  const totalNhanBG = sumBy("nhan_ban_giao_ca");
  const totalChuyenXe = sumBy("muc_chuyen_ca_sau");
  const totalSuDung = sumBy("su_dung");
  const totalHaoHut = sumBy("hao_hut");

  // ================== Export Excel (đẹp + đồng bộ style) ==================
  const exportExcel = () => {
    const title = `📦 Thống kê mực theo xe từ ${from} đến ${to}`;
    const wsData = [];

    // Tiêu đề
    wsData.push([title]);
    wsData.push([]);
    wsData.push([
      "Xe (Cân)",
      "Mực nhận từ kho",
      "Trả về kho",
      "Mực cấp",
      "Mực hoàn về",
      "Nhận bàn giao ca",
      "Chuyển xe",
      "Mực sử dụng",
      "Hao hụt",
    ]);

    // Dòng dữ liệu
    // Hàm đổi gram -> kg (2 số thập phân)
const toKg = (v) => v != null ? (v / 1000).toFixed(2) : "0.00";

data.forEach((row) => {
  wsData.push([
    row.scaleName || row.scaleCode,
    toKg(row.muc_nhan_tu_kho),
    toKg(row.muc_tra_ve_kho),
    toKg(row.muc_cap_cho_chuyen),
    toKg(row.muc_chuyen_hoan_ve),
    toKg(row.nhan_ban_giao_ca),
    toKg(row.muc_chuyen_ca_sau),
    toKg(row.su_dung),
    toKg(row.hao_hut),
  ]);
});


    // Dòng tổng
    wsData.push([
  "Tổng cộng",
  toKg(totalNhanKho),
  toKg(totalTraKho),
  toKg(totalCap),
  toKg(totalHoan),
  toKg(totalNhanBG),
  toKg(totalChuyenXe),
  toKg(totalSuDung),
  toKg(totalHaoHut),
]);


    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];
    ws["!cols"] = [
      { wch: 22 }, // xe
      { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
      { wch: 18 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = 0; R <= range.e.r; ++R) {
      const isTitle = R === 0;
      const isHeader = R === 2;
      const isTotal = R === range.e.r;

      for (let C = 0; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        const isNumberCol = C >= 1;

        if (isTitle) {
          ws[cellRef].s = {
            font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
          };
        } else if (isHeader) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "003366" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CBD5E1" } },
              bottom: { style: "thin", color: { rgb: "CBD5E1" } },
              left: { style: "thin", color: { rgb: "CBD5E1" } },
              right: { style: "thin", color: { rgb: "CBD5E1" } },
            },
          };
        } else if (isTotal) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: "111827" } },
            fill: { fgColor: { rgb: "FFF2CC" } },
            alignment: { horizontal: isNumberCol ? "right" : "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } },
            },
            numFmt: isNumberCol ? "#,##0.00" : undefined,
          };
        } else {
          const zebra = R % 2 === 1 ? "FFFFFF" : "F9FAFB";
          ws[cellRef].s = {
            font: { color: { rgb: "1F2937" } },
            fill: { fgColor: { rgb: zebra } },
            alignment: { horizontal: isNumberCol ? "right" : "left", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "F1F5F9" } },
              bottom: { style: "thin", color: { rgb: "F1F5F9" } },
              left: { style: "thin", color: { rgb: "F1F5F9" } },
              right: { style: "thin", color: { rgb: "F1F5F9" } },
            },
            numFmt: isNumberCol ? "#,##0.0" : undefined,
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Thống kê mực theo xe");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `Thong_ke_muc_theo_xe_${from}_den_${to}.xlsx`
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-5">
        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-800">
                📦 Thống kê mực theo xe
              </h2>

              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm
                           hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500/40"
              >
                <FiDownload className="text-base" />
                Xuất Excel
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-600">
                <FiLoader className="animate-spin text-xl" />
                <span className="text-sm">Đang tải dữ liệu...</span>
              </div>
            ) : (
              <>
                {/* Stat mini */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="rounded-xl border border-slate-200/70 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Mực sử dụng</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {fmt(totalSuDung)} kg
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Hao hụt</div>
                    <div
                      className={`text-lg font-semibold ${
                        totalHaoHut > 0 ? "text-rose-600" : totalHaoHut < 0 ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {fmt(totalHaoHut)} kg
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Mực nhận từ kho</div>
                    <div className="text-lg font-semibold text-slate-900">{fmt(totalNhanKho)} kg</div>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 p-3">
                    <div className="text-[11px] uppercase text-slate-500">Mực trả về kho</div>
                    <div className="text-lg font-semibold text-slate-900">{fmt(totalTraKho)} kg</div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1000px] w-full text-sm">
                      <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                          <th className="border-b border-slate-200 px-3 py-2 text-left">Xe (Cân)</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Mực nhận từ kho</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Trả về kho</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Mực cấp</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Mực hoàn về</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Nhận bàn giao ca</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Chuyển xe</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Mực sử dụng</th>
                          <th className="border-b border-slate-200 px-3 py-2 text-right">Hao hụt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="px-3 py-10 text-center text-slate-500">
                              Không có dữ liệu
                            </td>
                          </tr>
                        ) : (
                          <>
                            {data.map((row, idx) => {
                              const hao = Number(row.hao_hut ?? 0);
                              return (
                                <tr
                                  key={idx}
                                  className={`transition-colors ${
                                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                                  } hover:bg-slate-100`}
                                >
                                  <td className="px-3 py-2 text-slate-800">
                                    <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium">
                                      {row.scaleName || row.scaleCode}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right">{fmt(row.muc_nhan_tu_kho)}</td>
                                  <td className="px-3 py-2 text-right">{fmt(row.muc_tra_ve_kho)}</td>
                                  <td className="px-3 py-2 text-right">{fmt(row.muc_cap_cho_chuyen)}</td>
                                  <td className="px-3 py-2 text-right">{fmt(row.muc_chuyen_hoan_ve)}</td>
                                  <td className="px-3 py-2 text-right">{fmt(row.nhan_ban_giao_ca)}</td>
                                  <td className="px-3 py-2 text-right">{fmt(row.muc_chuyen_ca_sau)}</td>
                                  <td className="px-3 py-2 text-right font-medium">{fmt(row.su_dung)}</td>
                                  <td
                                    className={`px-3 py-2 text-right font-semibold ${
                                      hao > 0 ? "text-rose-600" : hao < 0 ? "text-emerald-600" : "text-slate-900"
                                    }`}
                                  >
                                    {fmt(hao)}
                                  </td>
                                </tr>
                              );
                            })}

                            {/* Tổng cuối bảng */}
                            <tr className="bg-amber-50/80">
                              <td className="px-3 py-2 font-semibold">Tổng cộng</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalNhanKho)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalTraKho)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalCap)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalHoan)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalNhanBG)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalChuyenXe)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{fmt(totalSuDung)}</td>
                              <td
                                className={`px-3 py-2 text-right font-bold ${
                                  totalHaoHut > 0
                                    ? "text-rose-700"
                                    : totalHaoHut < 0
                                    ? "text-emerald-700"
                                    : "text-slate-900"
                                }`}
                              >
                                {fmt(totalHaoHut)}
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow">
              <FiLoader className="animate-spin text-indigo-600 text-xl" />
              <span className="text-slate-700 text-sm font-medium">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InkTransferCart;
