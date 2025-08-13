import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { FiLoader, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { BASE_URL_SERVER_THLA } from "~/config";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

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

  const exportExcel = () => {
  const title = `📦 Theo dõi cân mực theo Lệnh sản xuất từ ${fromDate} đến ${toDate}`;
  const wsData = [];

  // Tiêu đề
  wsData.push([title]);
  wsData.push([]);
  wsData.push(["HSKT", "Mã mực", "Tên mực", "Mực cấp (g)", "Mực hoàn (g)", "Mực sử dụng (g)"]);

  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
  let currentRow = 3;
  let groupColors = {}; // Lưu màu theo nhóm

  Object.entries(data).forEach(([hsktId, items], groupIndex) => {
    const startRow = currentRow;
    const tongCap = items.reduce((sum, i) => sum + i.cap, 0);
    const tongHoan = items.reduce((sum, i) => sum + i.hoan, 0);
    const tongSuDung = items.reduce((sum, i) => sum + i.su_dung, 0);

    // Chọn màu xen kẽ cho nhóm
    const groupColor = groupIndex % 2 === 0 ? "FFFFFF" : "F9F9F9";
    groupColors[hsktId] = groupColor;

    // Dòng chi tiết
    items.forEach((row) => {
      wsData.push([
        hsktId,
        row.inkCode,
        row.inkName,
        row.cap,
        row.hoan,
        row.su_dung,
      ]);
      currentRow++;
    });

    // Merge cột HSKT
    if (items.length > 1) {
      merges.push({
        s: { r: startRow, c: 0 },
        e: { r: currentRow - 1, c: 0 }
      });
    }

    // Dòng tổng
    wsData.push([
      "Tổng",
      `(${items.length} mã mực)`,
      "",
      tongCap,
      tongHoan,
      tongSuDung,
    ]);
    currentRow++;
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = 0; R <= range.e.r; ++R) {
    const firstCellValue = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v;

    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      if (R === 0) {
        // Tiêu đề chính
        ws[cellRef].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      } else if (R === 2) {
        // Header
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "DDDDDD" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      } else {
        const isNumberCol = C >= 3;
        const isTotalRow = firstCellValue === "Tổng";

        // Lấy màu của nhóm
        let bgColor;
        if (firstCellValue && firstCellValue !== "Tổng" && groupColors[firstCellValue]) {
          bgColor = groupColors[firstCellValue];
        } else if (isTotalRow) {
          // Dòng tổng ăn màu của nhóm trước đó
          const prevHskt = ws[XLSX.utils.encode_cell({ r: R - 1, c: 0 })]?.v;
          bgColor = groupColors[prevHskt] || "FFFFFF";
        }

        ws[cellRef].s = {
          font: { bold: isTotalRow },
          fill: bgColor ? { fgColor: { rgb: bgColor } } : undefined,
          alignment: { horizontal: isNumberCol ? "right" : "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          numFmt: isNumberCol ? "#,##0.0" : undefined,
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Theo dõi cân mực");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }),
    `Theo_doi_can_muc_${fromDate}_den_${toDate}.xlsx`
  );
};





  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h1 className="text-xl font-bold mb-4">📦 Theo dõi cân mực theo Lệnh sản xuất</h1>

        <div className="flex items-center gap-4 mb-4">
          <div>
            <label className="block text-sm">Từ ngày</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm">Đến ngày</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border p-2 rounded" />
          </div>
          <button
            onClick={exportExcel}
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Xuất Excel
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <FiLoader className="animate-spin text-xl" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : Object.keys(data).length === 0 ? (
          <p className="text-center text-gray-500">Không có dữ liệu</p>
        ) : (
          <table className="table-auto w-full border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-6"></th>
                <th className="border p-2">HSKT</th>
                <th className="border p-2">Mã mực</th>
                <th className="border p-2">Tên mực</th>
                <th className="border p-2 text-right">Mực cấp (g)</th>
                <th className="border p-2 text-right">Mực hoàn (g)</th>
                <th className="border p-2 text-right">Mực sử dụng (g)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([hsktId, items]) => {
                const tongCap = items.reduce((sum, i) => sum + i.cap, 0);
                const tongHoan = items.reduce((sum, i) => sum + i.hoan, 0);
                const tongSuDung = items.reduce((sum, i) => sum + i.su_dung, 0);
                const isOpen = expanded[hsktId];

                return (
                  <Fragment key={hsktId}>
                    <tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => toggleExpand(hsktId)}>
                      <td className="border p-2 text-center">
                        {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                      </td>
                      <td className="border p-2 font-semibold">{hsktId}</td>
                      <td className="border p-2 italic text-gray-400">({items.length} mã mực)</td>
                      <td className="border p-2"></td>
                      <td className="border p-2 text-right">{tongCap.toFixed(1)}</td>
                      <td className="border p-2 text-right">{tongHoan.toFixed(1)}</td>
                      <td className="border p-2 text-right">{tongSuDung.toFixed(1)}</td>
                    </tr>

                    {isOpen &&
                      items.map((row, idx) => (
                        <tr key={idx} className="bg-white">
                          <td></td>
                          <td></td>
                          <td className="border p-2">{row.inkCode}</td>
                          <td className="border p-2">{row.inkName}</td>
                          <td className="border p-2 text-right">{row.cap.toFixed(1)}</td>
                          <td className="border p-2 text-right">{row.hoan.toFixed(1)}</td>
                          <td className="border p-2 text-right">{row.su_dung.toFixed(1)}</td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProductionOrder;
