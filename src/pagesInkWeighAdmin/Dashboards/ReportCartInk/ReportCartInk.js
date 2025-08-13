import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { BASE_URL_SERVER_THLA } from '~/config';

function ReportCartInk() {
  const [data, setData] = useState([]);
  const [from, setFrom] = useState(dayjs().startOf('day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('day').format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [from, to]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/report/cart-ink`, {
        params: { from, to },
      });
      setData(res.data);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu:', error);
    }
    setLoading(false);
  };

  const groupedData = data.reduce((acc, item) => {
    const key = item.vehicleName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const exportExcel = () => {
  const title = `📦 Báo cáo Xe mực từ ${from} đến ${to}`;
  const wsData = [];
  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  wsData.push([title]);
  wsData.push([]);
  wsData.push(["#", "Tên mực", "Chuyền", "Ngày giờ cân", "Nghiệp vụ", "Khối lượng (g)"]);

  let currentRow = 3;
  Object.entries(groupedData).forEach(([vehicleName, records]) => {
    wsData.push([`Xe mực: ${vehicleName}`]);
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } });
    currentRow++;

    records.forEach((r, i) => {
      wsData.push([
        i + 1,
        r.inkName,
        r.lineName,
        dayjs(r.createdAt).subtract(7, 'hour').format('DD/MM/YYYY HH:mm'),
        r.operationCode === 'TV' ? 'Trả' : 'Cấp mực',
        r.weight,
      ]);
      currentRow++;
    });

    wsData.push([]);
    currentRow++;
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!merges"] = merges;
  ws["!cols"] = [
    { wch: 5 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
  ];

  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = 0; R <= range.e.r; ++R) {
    const isTitle = R === 0;
    const isHeader = R === 2;
    const isVehicleRow = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v?.toString().startsWith("Xe mực:");
    const isOddRow = R % 2 === 1;

    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      const isNumberCol = C === 5;

      let style = {
        alignment: { horizontal: isNumberCol ? "right" : "center", vertical: "center" },
        font: { name: "Calibri", sz: 11 },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        }
      };

      if (isTitle) {
        style.font = { bold: true, sz: 16, name: "Calibri" };
        style.alignment = { horizontal: "center", vertical: "center" };
      } else if (isHeader) {
        style.font.bold = true;
        style.fill = { fgColor: { rgb: "DDDDDD" } };
      } else if (isVehicleRow) {
        style.font.bold = true;
        style.fill = { fgColor: { rgb: "FFF2CC" } };
        style.alignment = { horizontal: "left", vertical: "center" };
      } else {
        style.fill = isOddRow ? { fgColor: { rgb: "F9F9F9" } } : undefined;
      }

      if (isNumberCol && !isHeader && !isVehicleRow && !isTitle) {
        style.numFmt = "#,##0.0";
      }

      ws[cellRef].s = style;
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Báo cáo Xe mực");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Bao_cao_Xe_muc_${from}_den_${to}.xlsx`);
};


  return (
    <div className="p-6 max-w-screen-xl mx-auto">
      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 mt-1 text-sm shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 mt-1 text-sm shadow-sm"
          />
        </div>
        <button
          onClick={exportExcel}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          📥 Xuất Excel
        </button>
      </div>

      {loading ? (
        <div className="text-blue-500">Đang tải dữ liệu...</div>
      ) : (
        Object.entries(groupedData).map(([vehicleName, records], idx) => {
          const summary = records.reduce(
            (acc, r) => {
              if (!acc.inks[r.inkName]) acc.inks[r.inkName] = 0;
              if (r.operationCode === 'CM') {
                acc.inks[r.inkName] += r.weight;
                acc.total += r.weight;
              } else if (r.operationCode === 'TV') {
                acc.inks[r.inkName] -= r.weight;
                acc.total -= r.weight;
              }
              return acc;
            },
            { inks: {}, total: 0 }
          );

          return (
            <div
              key={idx}
              className="mb-10 border border-gray-300 p-5 rounded-xl shadow-sm bg-white"
            >
              <h2 className="text-2xl font-semibold mb-3 text-blue-700">
                Xe mực: {vehicleName}
              </h2>

              <div className="mt-2 text-base">
                <strong>Tổng mực sử dụng:</strong>{' '}
                <span className="text-red-600 font-bold">{summary.total.toFixed(1)} g</span>
              </div>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border border-gray-300 shadow-sm">
                  <thead>
                    <tr className="bg-gray-200 text-gray-700">
                      <th className="border px-3 py-2">#</th>
                      <th className="border px-3 py-2 text-left">Tên mực</th>
                      <th className="border px-3 py-2 text-left">Chuyền</th>
                      <th className="border px-3 py-2 text-left">Ngày giờ cân</th>
                      <th className="border px-3 py-2 text-left">Nghiệp vụ</th>
                      <th className="border px-3 py-2 text-right">Khối lượng (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={i} className="odd:bg-white even:bg-gray-50">
                        <td className="border px-3 py-1 text-center">{i + 1}</td>
                        <td className="border px-3 py-1">{r.inkName}</td>
                        <td className="border px-3 py-1">{r.lineName}</td>
                        <td className="border px-3 py-1">
                          {dayjs(r.createdAt).subtract(7, 'hour').format('DD/MM/YYYY HH:mm')}
                        </td>
                        <td className="border px-3 py-1">
                          {r.operationCode === 'TV' ? 'Trả' : 'Cấp mực'}
                        </td>
                        <td className="border px-3 py-1 text-right">{r.weight.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default ReportCartInk;
