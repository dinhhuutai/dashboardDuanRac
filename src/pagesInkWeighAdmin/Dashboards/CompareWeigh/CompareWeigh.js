import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BASE_URL_SERVER_THLA } from '~/config';

function CompareWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        result[key].kehoach = row[''];
      } else if (row.muc === 2) {
        result[key].thucte = row[''];
      }
    });
    return Object.values(result);
  };

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
      <h1 className="text-2xl font-bold">📊 So sánh Yêu cầu vs Thực tế xuất kho</h1>

      {/* Bộ lọc */}
      <div className="flex gap-4 flex-wrap">
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
      </div>

      {/* Biểu đồ + Loading overlay */}
<div className="relative h-[400px] w-full">
  {isLoading && (
    <div className="absolute inset-0 z-10 bg-white bg-opacity-60 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )}
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={mergedData()}
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

{/* Bảng dữ liệu + Loading overlay */}
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
      {mergedData().map((row, idx) => (
        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
          <td className="border px-4 py-2">{row.lenhsx}</td>
          <td className="border px-4 py-2">{row.inkcode}</td>
          <td className="border px-4 py-2">{row.kehoach?.toLocaleString('vi-VN')}</td>
          <td className="border px-4 py-2">{row.thucte?.toLocaleString('vi-VN')}</td>
          <td className="border px-4 py-2">{(row.thucte - row.kehoach).toLocaleString('vi-VN')}</td>
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