import React, { useState, useEffect } from 'react';
import { BASE_URL } from '~/config';

function UnscannedQR() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [longestUnweighed, setLongestUnweighed] = useState([]);
  const [loadingLongest, setLoadingLongest] = useState(false);
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workShift, setWorkShift] = useState('ca1');

  // Fetch unscanned QR
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}/trash-weighings/unscanned-teams?workDate=${workDate}&workShift=${workShift}`,
        );
        const json = await res.json();
        setData(json.unscannedTeams || {});
      } catch (err) {
        console.error('Lỗi khi fetch dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [workDate, workShift]);

  // Fetch longest-unweighed list (chỉ 1 lần)
  useEffect(() => {
    const fetchLongestUnweighed = async () => {
      setLoadingLongest(true);
      try {
        const res = await fetch(`${BASE_URL}/trash-weighings/longest-unweighed`);
        const json = await res.json();
        setLongestUnweighed(json.longestUnweighed || []);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách chưa cân lâu nhất:', err);
      } finally {
        setLoadingLongest(false);
      }
    };
    fetchLongestUnweighed();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl mt-6 border border-gray-200 shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📋 Danh sách tổ - đơn vị chưa quét mã QR</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-600 mb-1 block">Ngày làm việc:</label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">Ca làm việc:</label>
          <select
            value={workShift}
            onChange={(e) => setWorkShift(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          >
            <option value="ca1">Ca 1</option>
            <option value="ca2">Ca 2</option>
            <option value="ca3">Ca 3</option>
            <option value="dai1">Dài 1</option>
            <option value="dai2">Dài 2</option>
            <option value="cahc">Ca Hành Chính</option>
          </select>
        </div>

        {(loading || loadingLongest) && (
          <div className="flex items-end justify-center">
            <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Danh sách chưa quét QR */}
      <div>
        {loading ? (
          <p className="text-center text-gray-500">Đang tải dữ liệu...</p>
        ) : Object.keys(data).length === 0 ? (
          <p className="text-green-600 text-center font-medium mt-3">✅ Tất cả tổ - đơn vị đã cân rác</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(data).map(([team, units]) => (
              <div key={team} className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                <h3 className="text-sm font-semibold text-red-600 mb-1">{team}</h3>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {units.map((unit) => (
                    <li key={unit}>{unit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {longestUnweighed.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold text-orange-800 text-center mb-6">📌 Danh sách tổ lâu nhất chưa cân rác</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border border-gray-200 rounded-lg shadow-sm bg-white">
              <thead>
                <tr className="bg-yellow-100 text-gray-800 text-sm">
                  <th className="px-4 py-2 border">#</th>
                  <th className="px-4 py-2 border text-left">Tổ</th>
                  <th className="px-4 py-2 border text-left">Đơn vị</th>
                  <th className="px-4 py-2 border text-center">Số ngày chưa cân</th>
                </tr>
              </thead>
              <tbody>
                {longestUnweighed.map((item, idx) => {
                  const severity =
                    item.days >= 9999
                      ? 'bg-red-100 text-red-700'
                      : item.days > 10
                      ? 'bg-red-50 text-red-600'
                      : item.days > 5
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-gray-50 text-gray-700';

                  return (
                    <tr key={idx} className={`${severity} text-sm`}>
                      <td className="px-4 py-2 border text-center font-medium">{idx + 1}</td>
                      <td className="px-4 py-2 border">{item.team}</td>
                      <td className="px-4 py-2 border">{item.unit || '-'}</td>
                      <td className="px-4 py-2 border text-center font-semibold">
                        {item.days === 9999 ? 'Chưa từng' : `${item.days} ngày`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnscannedQR;
