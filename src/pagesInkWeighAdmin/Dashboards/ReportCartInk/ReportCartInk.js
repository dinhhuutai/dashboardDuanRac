import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
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
  
  const formatDate = (isoDateStr) => {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    return date.toLocaleDateString('vi-VN'); // ví dụ: 27/06/2025
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

              <div className="mb-3 text-sm text-gray-700">
                {/* <strong className="block mb-1">🎨 Mực sử dụng:</strong>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(summary.inks).map(([name, weight]) => (
                    <span
                      key={name}
                      className="bg-gray-100 px-3 py-1 rounded-full text-sm shadow-sm"
                    >
                      {name}: <strong>{weight.toFixed(1)} g</strong>
                    </span>
                  ))}
                </div> */}

                <div className="mt-2 text-base">
                  <strong>Tổng mực sử dụng:</strong>{' '}
                  <span className="text-red-600 font-bold">{summary.total.toFixed(1)} g</span>
                </div>
              </div>

              <div className="overflow-x-auto">
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
