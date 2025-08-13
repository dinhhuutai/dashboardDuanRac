import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiLoader } from 'react-icons/fi';
import XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { BASE_URL_SERVER_THLA } from '~/config';

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
        params: { from, to }
      });
      setData(res.data);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

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
    "Hao hụt"
  ]);

  // Dữ liệu
  data.forEach(row => {
    wsData.push([
      row.scaleName || row.scaleCode,
      row.muc_nhan_tu_kho,
      row.muc_tra_ve_kho,
      row.muc_cap_cho_chuyen,
      row.muc_chuyen_hoan_ve,
      row.nhan_ban_giao_ca,
      row.muc_chuyen_ca_sau,
      row.su_dung,
      row.hao_hut
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Merge tiêu đề
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }];

  // Đặt độ rộng cột
  ws["!cols"] = [
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
  ];

  // Áp style
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let R = 0; R <= range.e.r; ++R) {
    const isTitle = R === 0;
    const isHeader = R === 2;
    const isHsktRow = !isHeader && !isTitle && ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v?.toLowerCase?.().includes('hskt');

    for (let C = 0; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;
      const isNumberCol = C >= 1; // từ cột 1 trở đi là số

      let fill;
      if (isHsktRow) {
        fill = { fgColor: { rgb: "FFF2CC" } }; // vàng nhạt
      } else if (!isHeader && !isTitle && R % 2 === 1) {
        fill = { fgColor: { rgb: "F9F9F9" } }; // xám rất nhạt
      }

      if (isTitle) {
        ws[cellRef].s = {
          font: { bold: true, sz: 16 },
          alignment: { horizontal: "center", vertical: "center" }
        };
      } else if (isHeader) {
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "DDDDDD" } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          }
        };
      } else {
        ws[cellRef].s = {
          font: { bold: isHsktRow },
          fill,
          alignment: { horizontal: isNumberCol ? "right" : "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
          numFmt: isNumberCol ? "#,##0.0" : undefined
        };
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Thống kê mực theo xe");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), `Thong_ke_muc_theo_xe_${from}_den_${to}.xlsx`);
};


  useEffect(() => {
    fetchData();
  }, [from, to]);

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h2 className="text-xl font-bold mb-4">📦 Thống kê mực theo xe</h2>

        <div className="flex gap-4 mb-4 items-end">
          <div>
            <label className="block text-sm">Từ ngày</label>
            <input
              type="date"
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Đến ngày</label>
            <input
              type="date"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="border px-2 py-1 rounded"
            />
          </div>
          <button
            onClick={exportExcel}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Xuất Excel
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <FiLoader className="animate-spin text-xl" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : (
          <table className="w-full border border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Xe (Cân)</th>
                <th className="border px-2 py-1">Mực nhận từ kho</th>
                <th className="border px-2 py-1">Trả về kho</th>
                <th className="border px-2 py-1">Mực cấp</th>
                <th className="border px-2 py-1">Mực hoàn về</th>
                <th className="border px-2 py-1">Nhận bàn giao ca</th>
                <th className="border px-2 py-1">Chuyển xe</th>
                <th className="border px-2 py-1">Mực sử dụng</th>
                <th className="border px-2 py-1">Hao hụt</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-gray-500 py-3">Không có dữ liệu</td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{row.scaleName || row.scaleCode}</td>
                    <td className="border px-2 py-1 text-right">{row.muc_nhan_tu_kho.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right">{row.muc_tra_ve_kho.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right">{row.muc_cap_cho_chuyen.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right">{row.muc_chuyen_hoan_ve.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right">{row.nhan_ban_giao_ca.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right">{row.muc_chuyen_ca_sau.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right">{row.su_dung.toFixed(1)}</td>
                    <td className="border px-2 py-1 text-right font-bold text-red-600">{row.hao_hut.toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InkTransferCart;
