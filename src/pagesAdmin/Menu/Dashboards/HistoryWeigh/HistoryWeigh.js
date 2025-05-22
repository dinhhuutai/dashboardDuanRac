import React, { useState, useEffect } from 'react';
import axios from 'axios';

function HistoryWeigh() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!date) return;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          'https://duanrac-api-node-habqhehnc6a2hkaq.southeastasia-01.azurewebsites.net/history/date',
          {
            params: { date },
          },
        );
        setData(res.data);
      } catch (err) {
        setError('❌ Lỗi khi tải dữ liệu lịch sử cân');
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [date]);

  function formatVietnamTimeString(datetimeStr) {
    if (!datetimeStr) return '';
    const [date, time] = datetimeStr.split('T');
    const [hour, minute] = time.split(':');
    return `${date} ${hour}:${minute}`;
  }

  return (
    <div style={{ padding: 20 }} className="relative">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}
      <div className="bg-white mx-[6px] my-[4px] pb-[50px] px-[10px] pt-[20px] rounded-[6px] shadow-lg">
        <h2 className="text-xl font-bold mb-4">📋 Lịch sử cân rác theo ngày</h2>

        <label className="font-medium text-base">
          Chọn ngày:{' '}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="border border-gray-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </label>

        {loading && <p className="mt-4 text-blue-500">Đang tải dữ liệu...</p>}
        {error && <p className="mt-4 text-red-600">{error}</p>}
        {!loading && !error && data.length === 0 && (
          <p className="mt-4 text-gray-600">Không có dữ liệu lịch sử cân cho ngày này.</p>
        )}

        {!loading && data.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-center">Người cân</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Bộ phận</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Đơn vị</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Loại rác</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Mã thùng rác</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Thời gian cân</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Khối lượng (kg)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-2 py-1">{item.fullName}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.departmentName}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.unitName || '-'}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.trashName}</td>
                    <td className="border border-gray-300 px-2 py-1">{item.trashBinCode}</td>
                    <td className="border border-gray-300 px-2 py-1">{formatVietnamTimeString(item.weighingTime)}</td>
                    <td className="border border-gray-300 px-2 py-1 text-right">{item.weightKg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryWeigh;
