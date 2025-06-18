import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';

function ListBin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableType, setTableType] = useState('current'); // 'current' | 'standard'

  useEffect(() => {
    const endpoint = tableType === 'current' ? '/api/bin-standard' : '/api/bin-summary';
    setLoading(true);
    axios.get(`${BASE_URL}${endpoint}`)
      .then(res => setData(res.data))
      .catch(err => alert("Lỗi khi tải dữ liệu: " + err.message))
      .finally(() => setLoading(false));
  }, [tableType]);

  return (
    <div className="p-4 space-y-4">
      {/* Radio Buttons */}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-semibold mb-4 text-gray-700">
          {tableType === 'current' ? 'Danh sách thùng rác bố trí hiện có' : 'Bảng số lượng thùng rác theo quy định'}
        </h1>
        
      <div className="flex space-x-6 items-center">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="tableType"
            value="current"
            checked={tableType === 'current'}
            onChange={() => setTableType('current')}
          />
          <span>Bảng hiện có</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="tableType"
            value="standard"
            checked={tableType === 'standard'}
            onChange={() => setTableType('standard')}
          />
          <span>Bảng quy định</span>
        </label>
      </div>
        <div className="overflow-auto rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 border">Bộ phận</th>
                <th className="px-4 py-2 border">Đơn vị</th>
                <th className="px-4 py-2 border">Giẻ lau dính mực</th>
                <th className="px-4 py-2 border">Vụn logo</th>
                <th className="px-4 py-2 border">Băng keo dính hóa chất</th>
                <th className="px-4 py-2 border">Mực in thải thường</th>
                <th className="px-4 py-2 border">Mực in thải lapa</th>
                <th className="px-4 py-2 border">Rác sinh hoạt</th>
                <th className="px-4 py-2 border font-bold">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                    <p className="text-gray-500 mt-4 italic">Đang tải dữ liệu...</p>
                ) : (() => {
    const rowSpanMap = {};
    data.forEach(row => {
      rowSpanMap[row.departmentName] = (rowSpanMap[row.departmentName] || 0) + 1;
    });

    const renderedDepts = new Set();

    return data.map((row, idx) => {
      const isFirstDeptRow = !renderedDepts.has(row.departmentName);
      if (isFirstDeptRow) renderedDepts.add(row.departmentName);

      return (
        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          {isFirstDeptRow && (
            <td
              className="px-4 py-2 border align-middle font-medium"
              rowSpan={rowSpanMap[row.departmentName]}
            >
              {row.departmentName}
            </td>
          )}
          <td className="px-4 py-2 border">{row.unitName}</td>
          <td className="px-4 py-2 border text-center">{row['Giẻ lau dính mực']}</td>
          <td className="px-4 py-2 border text-center">{row['Vụn logo']}</td>
          <td className="px-4 py-2 border text-center">{row['Băng keo dính hóa chất']}</td>
          <td className="px-4 py-2 border text-center">{row['Mực in thải thường']}</td>
          <td className="px-4 py-2 border text-center">{row['Mực in thải lapa']}</td>
          <td className="px-4 py-2 border text-center">{row['Rác sinh hoạt']}</td>
          <td className="px-4 py-2 border text-center font-semibold">{row.totalQuantity}</td>
        </tr>
      );
    });
  })()
}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ListBin;
