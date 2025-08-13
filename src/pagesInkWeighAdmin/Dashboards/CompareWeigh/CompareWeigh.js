import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BASE_URL_SERVER_THLA } from '~/config';
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

function CompareWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDiff, setFilterDiff] = useState(false); // ✅ Checkbox state

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL_SERVER_THLA}/api/compare-weighing`, {
        fromDate,
        toDate,
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi gọi API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  // Gộp và xử lý dữ liệu
  const mergedData = () => {
    const result = {};
    data.forEach((row) => {
      const key = `${row.lenhsx || row.id}__${row.inkcode || row.nguyenlieu}`;
      if (!result[key]) {
        result[key] = {
          lenhsx: row.lenhsx || row.id,
          inkcode: row.inkcode || row.nguyenlieu,
          thucte: 0,
          kehoach: 0,
        };
      }
      if (row.muc === 1) {
        result[key].kehoach = row[''] || 0;
      } else if (row.muc === 2) {
        result[key].thucte = row[''] || 0;
      }
    });
    return Object.values(result);
  };

  // ✅ Áp dụng lọc nếu checkbox được tick
  const displayedData = () => {
    const rawData = mergedData();
    if (filterDiff) {
      return rawData.filter((item) => Math.abs(item.thucte - item.kehoach) > 30);
    }
    return rawData;
  };

  const exportExcel = () => {
  const title = `📊 So sánh Yêu cầu vs Thực tế xuất kho từ ${fromDate} đến ${toDate}`;
  const wsData = [];

  // Tiêu đề
  wsData.push([title]);
  wsData.push([]);
  wsData.push(["Lệnh SX", "Mã mực", "Yêu cầu (g)", "Thực tế (g)", "Chênh lệch (g)"]);

  // Merge tiêu đề
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  let currentRow = 3;

  // Group theo Lệnh SX để xen kẽ màu
  let grouped = {};
  displayedData().forEach((item) => {
    if (!grouped[item.lenhsx]) grouped[item.lenhsx] = [];
    grouped[item.lenhsx].push(item);
  });

  Object.entries(grouped).forEach(([lenhsx, rows]) => {
    rows.forEach((row) => {
      wsData.push([
        lenhsx,
        row.inkcode,
        row.kehoach,
        row.thucte,
        row.thucte - row.kehoach,
      ]);
      currentRow++;
    });
  });

  // Tạo sheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
  ];

  // Style
  const range = XLSX.utils.decode_range(ws["!ref"]);
  let currentGroupColor = false;
  let lastLenh = "";

  for (let R = 0; R <= range.e.r; ++R) {
    const firstCellValue = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v;

    // Đổi màu xen kẽ mỗi khi sang Lệnh SX mới
    if (firstCellValue && R > 2 && firstCellValue !== lastLenh) {
      currentGroupColor = !currentGroupColor;
      lastLenh = firstCellValue;
    }

    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      if (R === 0) {
        // Tiêu đề lớn
        ws[cellRef].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: "center", vertical: "center" },
        };
      } else if (R === 2) {
        // Header cột
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "DDDDDD" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
        };
      } else {
        const isNumberCol = C >= 2;
        ws[cellRef].s = {
          fill: currentGroupColor ? { fgColor: { rgb: "F9F9F9" } } : undefined,
          alignment: { horizontal: isNumberCol ? "right" : "center", vertical: "center" },
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          numFmt: isNumberCol ? "#,##0" : undefined,
        };
      }
    }
  }

  // Xuất file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "So sánh");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(
    new Blob([excelBuffer], { type: "application/octet-stream" }),
    `So_sanh_can_muc_${fromDate}_den_${toDate}.xlsx`
  );
};


  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h1 className="text-2xl font-bold">📊 So sánh Yêu cầu vs Thực tế xuất kho</h1>

        {/* Bộ lọc ngày và checkbox */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">Từ ngày</label>
            <input
              type="date"
              className="border px-3 py-2 rounded-lg"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Đến ngày</label>
            <input
              type="date"
              className="border px-3 py-2 rounded-lg"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="filterDiff"
              checked={filterDiff}
              onChange={(e) => setFilterDiff(e.target.checked)}
            />
            <label htmlFor="filterDiff" className="text-sm">
              Chỉ hiện mực chênh lệch &gt; 30g
            </label>
          </div>

          
  <button
    onClick={exportExcel}
    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 mt-2"
  >
    📥 Xuất Excel
  </button>
        </div>
        

        {/* Biểu đồ */}
        <div className="relative h-[400px] w-full">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white bg-opacity-60 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayedData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="inkcode" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="kehoach" name="Kế hoạch (g)" fill="#8884d8" />
              <Bar dataKey="thucte" name="Thực tế (g)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bảng dữ liệu */}
        <div className="relative overflow-auto border rounded min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white bg-opacity-60 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Lệnh SX</th>
                <th className="border px-4 py-2">Mã mực</th>
                <th className="border px-4 py-2">Yêu cầu (g)</th>
                <th className="border px-4 py-2">Thực tế (g)</th>
                <th className="border px-4 py-2">Chênh lệch (g)</th>
              </tr>
            </thead>
            <tbody>
              {displayedData().map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-4 py-2">{row.lenhsx}</td>
                  <td className="border px-4 py-2">{row.inkcode}</td>
                  <td className="border px-4 py-2">{row.kehoach?.toLocaleString('vi-VN')}</td>
                  <td className="border px-4 py-2">{row.thucte?.toLocaleString('vi-VN')}</td>
                  <td className="border px-4 py-2">
                    {(row.thucte - row.kehoach).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default CompareWeigh;
