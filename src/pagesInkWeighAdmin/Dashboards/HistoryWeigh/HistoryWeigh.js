import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL, BASE_URL_SERVER_THLA } from '../../../config';
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

const PAGE_SIZE = 10;

function HistoryWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    date: todayStr || '',
    shift: '',
    department: '',
    unit: '',
    operation: '',
  });
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/history`, {
        params: {
          ...filters,
          page: currentPage,
          pageSize: PAGE_SIZE,
        },
      });

      const sessions = res.data.items || [];

      setData(sessions || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalSessions(res.data.items?.length || 0);

      let sum = 0;
      res.data.items?.forEach(session =>
        session.items.forEach(i => sum += i.weight)
      );
      setTotalWeight(sum);

      
        // Trích xuất bộ phận và chuyền duy nhất
        const uniqueDepartments = [...new Set(sessions.map(s => s.department).filter(Boolean))];
        const uniqueUnits = [...new Set(sessions.map(s => s.unit).filter(Boolean))];
        setDepartments(uniqueDepartments);
        setUnits(uniqueUnits);

    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu lịch sử:', err);
    } finally {
      setIsLoading(false); // Dừng hiệu ứng loading
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const formatDate = (isoDateStr) => {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    return date.toLocaleDateString('vi-VN'); // ví dụ: 27/06/2025
  };

  const formatTime = (isoTimeStr) => {
    if (!isoTimeStr) return '';
    const [_, hhmm] = isoTimeStr.split('T')[1].split(':');
    return `${isoTimeStr.slice(11, 13)}:${isoTimeStr.slice(14, 16)}`;
  };

  const formatWeight = (num) => {
    if (!num) return '0';
    return `${Number(num).toFixed(1).toLocaleString('vi-VN')}`; // ví dụ: 4,001.4 g
  };

  const exportToExcel = () => {
  const excelData = [
    [
      "STT", "Mã cân", "Nghiệp vụ", "Mã HSKT", "Tổ in", "Chuyền", "Số CT", "Thời gian",
      "Mã mực", "Tên mực", "Khối lượng (g)", "NSX", "Người nhận"
    ]
  ];

  // Gộp dữ liệu theo session
  data.forEach((session, sIdx) => {
    if (Array.isArray(session.items) && session.items.length > 0) {
      session.items.forEach((item, iIdx) => {
        excelData.push([
          iIdx === 0 ? sIdx + 1 : "",
          iIdx === 0 ? session.scaleCode : "",
          iIdx === 0
            ? (session.operationCode === "CP" ? "Cấp phát" :
               session.operationCode === "TH" ? "Thu hồi" :
               session.operationCode === "CM" ? "Cấp mực" :
               session.operationCode === "TV" ? "Trả về" :
               session.operationCode === "GC" ? "Giao ca" :
               session.operationCode === "CX" ? "Chuyển xe" : session.operationCode)
            : "",
          iIdx === 0 ? session.hsktId || "" : "",
          iIdx === 0 ? session.department?.replace(/^T/, "Tổ ") : "",
          iIdx === 0 ? session.unit : "",
          iIdx === 0 ? session.workShift : "",
          iIdx === 0
            ? `${formatTime(session.startTime)} ${formatDate(session.weighStartDate)} - ${formatTime(session.endTime)} ${formatDate(session.weighEndDate)}`
            : "",
          item.inkCode,
          item.inkName,
          formatWeight(item.weight),
          formatDate(item.productionDate),
          iIdx === 0 ? session.receivedBy : ""
        ]);
      });
    } else {
      excelData.push([
        sIdx + 1,
        session.scaleCode,
        (session.operationCode === "CP" ? "Cấp phát" :
         session.operationCode === "TH" ? "Thu hồi" :
         session.operationCode === "CM" ? "Cấp mực" :
         session.operationCode === "TV" ? "Trả về" :
         session.operationCode === "GC" ? "Giao ca" :
         session.operationCode === "CX" ? "Chuyển xe" : session.operationCode),
        session.hsktId || "",
        session.department?.replace(/^T/, "Tổ "),
        session.unit,
        session.workShift,
        `${formatTime(session.startTime)} ${formatDate(session.weighStartDate)} - ${formatTime(session.endTime)} ${formatDate(session.weighEndDate)}`,
        "(Không có mục mực nào)",
        "",
        "",
        "",
        session.receivedBy || ""
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Merge ô cho các cột thông tin chung
  let currentRow = 1;
  data.forEach(session => {
    const rowCount = Array.isArray(session.items) && session.items.length > 0 ? session.items.length : 1;
    if (rowCount > 1) {
      for (let col = 0; col <= 7; col++) {
        ws["!merges"] = ws["!merges"] || [];
        ws["!merges"].push({
          s: { r: currentRow, c: col },
          e: { r: currentRow + rowCount - 1, c: col }
        });
      }
      ws["!merges"].push({
        s: { r: currentRow, c: 12 },
        e: { r: currentRow + rowCount - 1, c: 12 }
      });
    }
    currentRow += rowCount;
  });

  // Style chung
  const borderStyle = {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } }
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F81BD" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: borderStyle
  };

  // Tạo màu xen kẽ cho từng nhóm
  const whiteFill = { fgColor: { rgb: "FFFFFF" } };
  const grayFill = { fgColor: { rgb: "F2F2F2" } };

  // Áp dụng style
  const range = XLSX.utils.decode_range(ws["!ref"]);
  let sessionIndex = -1;
  let currentSessionRows = [];
  let rowCounter = 1; // bỏ header

  data.forEach(session => {
    sessionIndex++;
    const rowCount = Array.isArray(session.items) && session.items.length > 0 ? session.items.length : 1;
    const fillColor = sessionIndex % 2 === 0 ? whiteFill : grayFill;

    for (let r = rowCounter; r < rowCounter + rowCount; r++) {
      for (let c = 0; c <= range.e.c; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) continue;
        ws[cellRef].s = {
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: borderStyle,
          fill: fillColor
        };
      }
    }
    rowCounter += rowCount;
  });

  // Style cho header
  for (let C = 0; C <= range.e.c; C++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[cellRef]) ws[cellRef].s = headerStyle;
  }

  // Độ rộng cột
  ws["!cols"] = [
    { wch: 5 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 20 },
    { wch: 15 }, { wch: 12 }, { wch: 15 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Lịch sử cân mực");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, `lich_su_can_muc_${filters.date}.xlsx`);
};

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
      <div className="flex justify-between items-center mb-4">
  <h1 className="text-2xl font-bold">📜 Lịch sử cân mực</h1>
  <button
    onClick={exportToExcel}
    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
  >
    Xuất Excel
  </button>
</div>

      {/* Tổng quan */}
      <div className="mb-4 text-sm text-gray-800">
        <strong>Tổng lượt cân:</strong> {totalSessions} | 
        <strong> Tổng khối lượng:</strong> {formatWeight(totalWeight)} g
      </div>

      {/* Bộ lọc */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
          value={filters.operation}
          onChange={(e) => handleFilterChange('operation', e.target.value)}
        >
          <option value="">Chọn nghiệp vụ</option>
          <option value="CP">Cấp phát</option>
          <option value="TH">Thu hồi</option>
          <option value="CM">Cấp mực</option>
          <option value="TV">Trả về</option>
          <option value="GC">Giao ca</option>
          <option value="CX">Chuyển xe</option>
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
          value={filters.department}
          onChange={(e) => handleFilterChange('department', e.target.value)}
        >
          <option value="">Chọn bộ phận</option>
          {departments.map((d, idx) => (
            <option key={idx} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
          value={filters.unit}
          onChange={(e) => handleFilterChange('unit', e.target.value)}
        >
          <option value="">Chọn chuyền</option>
          {units.map((u, idx) => (
            <option key={idx} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Danh sách phiên cân */}
      <div className="overflow-auto border rounded shadow min-h-[200px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <table className="min-w-full text-sm border-separate border-spacing-0 overflow-hidden shadow">
  <thead className="bg-blue-100 text-blue-900 font-semibold">
    <tr>
      <th className="border border-gray-300 px-4 py-3">STT</th>
      <th className="border border-gray-300 px-4 py-3">Mã cân</th>
      <th className="border border-gray-300 px-4 py-3">Nghiệp vụ</th>
      <th className="border border-gray-300 px-4 py-3">Mã HSKT</th>
      <th className="border border-gray-300 px-4 py-3">Tổ in</th>
      <th className="border border-gray-300 px-4 py-3">Chuyền</th>
      <th className="border border-gray-300 px-4 py-3">Số CT</th>
      <th className="border border-gray-300 px-4 py-3">Thời gian</th>
      <th className="border border-gray-300 px-4 py-3">Mã mực</th>
      <th className="border border-gray-300 px-4 py-3">Tên mực</th>
      <th className="border border-gray-300 px-4 py-3">Khối lượng (g)</th>
      <th className="border border-gray-300 px-4 py-3">NSX</th>
      <th className="border border-gray-300 px-4 py-3">Người nhận</th>
    </tr>
  </thead>
  <tbody>
    {data.map((session, sIdx) =>
      Array.isArray(session.items) && session.items.length > 0 ? (
      session.items.map((item, iIdx) => (
        <tr
          key={`row-${sIdx}-${iIdx}`}
          className={sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
        >
          {iIdx === 0 && (
            <>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {sIdx + 1}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session?.scaleCode}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.operationCode === 'CP' ? 'Cấp phát' :
                  session.operationCode === 'TH' ? 'Thu hồi' :
                  session.operationCode === 'CM' ? 'Cấp mực' :
                  session.operationCode === 'TV' ? 'Trả về' :
                  session.operationCode === 'GC' ? 'Giao ca' :
                  session.operationCode === 'CX' ? 'Chuyển xe' :
                  session.operationCode}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session?.hsktId}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.department.replace(/^T/, 'Tổ ')}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.unit}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.workShift}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                 {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
                 <span className='p-[4px]'>-</span>
                 {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
              </td>
            </>
          )}
          <td className="border border-gray-300 px-4 py-3">{item.inkCode}</td>
          <td className="border border-gray-300 px-4 py-3">{item.inkName}</td>
          <td className="border border-gray-300 px-4 py-3">{formatWeight(item.weight)}</td>
          <td className="border border-gray-300 px-4 py-3">{formatDate(item.productionDate)}</td>
          {iIdx === 0 && (
            <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
              {session.receivedBy}
            </td>
          )}
        </tr>
      ))
  ) : (
    <tr key={`row-${sIdx}-0`} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
      <td className="border border-gray-300 px-4 py-3">{sIdx + 1}</td>
      <td className="border border-gray-300 px-4 py-3">{session?.scaleCode}</td>
      <td className="border border-gray-300 px-4 py-3">
        {session.operationCode === 'CP' ? 'Cấp phát' :
         session.operationCode === 'TH' ? 'Thu hồi' :
         session.operationCode === 'CM' ? 'Cấp mực' :
         session.operationCode === 'TV' ? 'Trả về' :
         session.operationCode === 'GC' ? 'Giao ca' :
         session.operationCode === 'CX' ? 'Chuyển xe' :
         session.operationCode}
      </td>
      <td className="border border-gray-300 px-4 py-3">
        {session?.hsktId}
      </td>
      <td className="border border-gray-300 px-4 py-3">{session.department?.replace(/^T/, 'Tổ ')}</td>
      <td className="border border-gray-300 px-4 py-3">{session.unit}</td>
      <td className="border border-gray-300 px-4 py-3">{session.workShift}</td>
      <td className="border border-gray-300 px-4 py-3">
        {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
        <span className="p-[4px]">-</span>
        {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
      </td>
      <td className="border border-gray-300 px-4 py-3 italic text-gray-400" colSpan={5}>
        (Không có mục mực nào)
      </td>
    </tr>
  )
    )}
  </tbody>
</table>
      </div>

      {/* Phân trang */}
      <div className="mt-6 flex justify-end items-center gap-2 text-sm">
        <span>Trang:</span>
        {Array.from({ length: totalPages }, (_, idx) => (
          <button
            key={idx + 1}
            className={`px-3 py-1 rounded-lg border ${currentPage === idx + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
            onClick={() => setCurrentPage(idx + 1)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}

export default HistoryWeigh;
