import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { FiLoader, FiChevronDown, FiChevronRight, FiDownload } from "react-icons/fi";
import { BASE_URL_SERVER_THLA } from "~/config";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import http from '~/api/http';

function ProductionOrder() {
  const today = new Date().toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const fetchData = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/by-hskt`, {
        params: { from: fromDate, to: toDate },
      });

      const grouped = {};
      for (const row of res.data) {
        if (!grouped[row.hsktId]) grouped[row.hsktId] = [];
        grouped[row.hsktId].push(row);
      }
      setData(grouped);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const toggleExpand = (hsktId) => {
    setExpanded((prev) => ({ ...prev, [hsktId]: !prev[hsktId] }));
  };

  // ========= Export Excel (giữ logic, chỉ chỉnh nhẹ style file) =========
  const exportExcel = () => {
    const title = `📦 Theo dõi cân mực theo Lệnh sản xuất từ ${fromDate} đến ${toDate}`;
    const wsData = [];

    // Tiêu đề
    wsData.push([title]);
    wsData.push([]);
    wsData.push(["HSKT", "Mã mực", "Tên mực", "Mực cấp (kg)", "Mực hoàn (kg)", "Mực sử dụng (kg)"]);

    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    let currentRow = 3;
    let groupColors = {};

    Object.entries(data).forEach(([hsktId, items], groupIndex) => {
      const startRow = currentRow;
      const tongCap = items.reduce((sum, i) => sum + i.cap, 0);
      const tongHoan = items.reduce((sum, i) => sum + i.hoan, 0);
      const tongSuDung = items.reduce((sum, i) => sum + i.su_dung, 0);

      const groupColor = groupIndex % 2 === 0 ? "FFFFFF" : "F9F9F9";
      groupColors[hsktId] = groupColor;

      items.forEach((row) => {
  wsData.push([
    hsktId,
    row.inkCode,
    row.inkName,
    round1(row.cap).toFixed(2),      // đổi sang kg
    round1(row.hoan).toFixed(2),     // đổi sang kg
    round1(row.su_dung).toFixed(2),  // đổi sang kg
  ]);
  currentRow++;
});

      if (items.length > 1) {
        merges.push({ s: { r: startRow, c: 0 }, e: { r: currentRow - 1, c: 0 } });
      }

      wsData.push([
  "Tổng",
  `(${items.length} mã mực)`,
  "",
  round1(tongCap).toFixed(2),        // đổi sang kg
  round1(tongHoan).toFixed(2),
  round1(tongSuDung).toFixed(2),
]);

currentRow++;
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!merges"] = merges;
    ws["!cols"] = [
      { wch: 16 }, { wch: 20 }, { wch: 34 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
    ];

    const range = XLSX.utils.decode_range(ws["!ref"]);

    for (let R = 0; R <= range.e.r; ++R) {
      const firstCellValue = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v;

      for (let C = 0; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;

        if (R === 0) {
          ws[cellRef].s = {
            font: { bold: true, sz: 16, color: { rgb: "0F172A" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
          };
        } else if (R === 2) {
          ws[cellRef].s = {
            font: { bold: true, color: { rgb: "1F2937" } },
            fill: { fgColor: { rgb: "E5E7EB" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "CBD5E1" } },
              bottom: { style: "thin", color: { rgb: "CBD5E1" } },
              left: { style: "thin", color: { rgb: "CBD5E1" } },
              right: { style: "thin", color: { rgb: "CBD5E1" } },
            },
          };
        } else {
          const isNumberCol = C >= 3;
          const isTotalRow = firstCellValue === "Tổng";

          let bgColor;
          if (firstCellValue && firstCellValue !== "Tổng" && groupColors[firstCellValue]) {
            bgColor = groupColors[firstCellValue];
          } else if (isTotalRow) {
            const prevHskt = ws[XLSX.utils.encode_cell({ r: R - 1, c: 0 })]?.v;
            bgColor = groupColors[prevHskt] || "FFFFFF";
          }

          ws[cellRef].s = {
            font: { bold: isTotalRow },
            fill: bgColor ? { fgColor: { rgb: bgColor } } : undefined,
            alignment: { horizontal: isNumberCol ? "right" : "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "E5E7EB" } },
              bottom: { style: "thin", color: { rgb: "E5E7EB" } },
              left: { style: "thin", color: { rgb: "E5E7EB" } },
              right: { style: "thin", color: { rgb: "E5E7EB" } },
            },
            numFmt: isNumberCol ? "#,##0.0" : undefined,
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Theo dõi cân mực");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([excelBuffer], { type: "application/octet-stream" }),
      `Theo_doi_can_muc_${fromDate}_den_${toDate}.xlsx`
    );
  };

  
  function round1(num) {
  return Math.round((num / 1000) * 10) / 10;
}

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-5">

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                📦 Theo dõi cân mực theo Lệnh sản xuất
              </h1>

              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm
                           hover:bg-indigo-700 active:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
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
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
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
            ) : Object.keys(data).length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <FiLoader className="animate-spin text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Không có dữ liệu</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                        <th className="border-b border-slate-200 px-2 py-2 w-10 text-center"></th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">HSKT</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">Mã mực</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left">Tên mực</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-right">Mực cấp (kg)</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-right">Mực hoàn (kg)</th>
                        <th className="border-b border-slate-200 px-3 py-2 text-right">Mực sử dụng (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data).map(([hsktId, items], idxGroup) => {
                        const tongCap = items.reduce((sum, i) => sum + i.cap, 0);
                        const tongHoan = items.reduce((sum, i) => sum + i.hoan, 0);
                        const tongSuDung = items.reduce((sum, i) => sum + i.su_dung, 0);
                        const isOpen = expanded[hsktId];

                        return (
                          <Fragment key={hsktId}>
                            {/* Group row */}
                            <tr
                              className={`cursor-pointer transition-colors ${
                                idxGroup % 2 === 0 ? "bg-indigo-50/40" : "bg-slate-50/40"
                              } hover:bg-indigo-50`}
                              onClick={() => toggleExpand(hsktId)}
                            >
                              <td className="px-2 py-2 text-center align-middle">
                                {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                              </td>
                              <td className="relative px-3 py-2 font-semibold text-slate-800">
                                {/* accent bar */}
                                <span
                                  className="absolute left-0 top-0 h-full w-[3px] bg-indigo-500 rounded-r"
                                  aria-hidden
                                />
                                <span className="pl-2">{hsktId}</span>
                              </td>
                              <td className="px-3 py-2 italic text-slate-400">
                                ({items.length} mã mực)
                              </td>
                              <td className="px-3 py-2" />
                              <td className="px-3 py-2 text-right font-medium">{round1(tongCap).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-medium">{round1(tongHoan).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-semibold text-slate-900">
                                {round1(tongSuDung).toFixed(2)}
                              </td>
                            </tr>

                            {/* Detail rows */}
                            {isOpen &&
                              items.map((row, i) => (
                                <tr
                                  key={i}
                                  className={`transition-colors ${
                                    i % 2 === 0 ? "bg-white" : "bg-slate-50"
                                  } hover:bg-slate-100`}
                                >
                                  <td className="px-2 py-2" />
                                  <td className="px-3 py-2" />
                                  <td className="px-3 py-2 text-slate-700">{row.inkCode}</td>
                                  <td className="px-3 py-2 text-slate-700">{row.inkName}</td>
                                  <td className="px-3 py-2 text-right">{round1(row.cap).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right">{round1(row.hoan).toFixed(2)}</td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    {round1(row.su_dung).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProductionOrder;
