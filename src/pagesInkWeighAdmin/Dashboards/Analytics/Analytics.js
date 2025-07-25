import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL_SERVER_THLA } from '~/config';
import { FaSpinner } from 'react-icons/fa';

const formatDate = (date) => date.toISOString().slice(0, 10);

const Analytics = () => {
  const [tab, setTab] = useState('hskt');
  const [hsktData, setHsktData] = useState([]);
  const [truckData, setTruckData] = useState([]);
  const [from, setFrom] = useState(formatDate(new Date()));
  const [to, setTo] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = from && to ? { from, to } : {};
        if (tab === 'hskt') {
          const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/by-hskt`, { params });
          setHsktData(res.data);
        } else {
          const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/by-truck`, { params });
          setTruckData(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tab, from, to]);

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <div className="mb-4 flex gap-2 items-center">
          <button
            onClick={() => setTab('hskt')}
            className={`px-4 py-2 rounded ${tab === 'hskt' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Theo Lệnh Sản Xuất
          </button>
          <button
            onClick={() => setTab('truck')}
            className={`px-4 py-2 rounded ${tab === 'truck' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Theo Xe Cấp Mực
          </button>

          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border px-2 py-1 rounded"
          />
          <span>→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border px-2 py-1 rounded"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        ) : tab === 'hskt' ? (
          <table className="w-full table-auto border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">HSKT</th>
                <th className="border p-2">Ca</th>
                <th className="border p-2">Ngày</th>
                <th className="border p-2">Mực Cấp (g)</th>
                <th className="border p-2">Mực Hoàn (g)</th>
                <th className="border p-2">Mực Sử Dụng (g)</th>
                <th className="border p-2">Định Mức (g)</th>
                <th className="border p-2">Sai Biệt (g)</th>
              </tr>
            </thead>
            <tbody>
              {hsktData.map((row, i) => (
                <tr key={i}>
                  <td className="border p-2">{row.hskt}</td>
                  <td className="border p-2">{row.workShift}</td>
                  <td className="border p-2">{row.weighDate}</td>
                  <td className="border p-2 text-right">{row.inkIssued?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.inkReturned?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.inkUsed?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.inkNorm?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.deviation?.toFixed(1) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full table-auto border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Xe</th>
                <th className="border p-2">Ca</th>
                <th className="border p-2">Ngày</th>
                <th className="border p-2">Nhận từ kho</th>
                <th className="border p-2">Nhận bàn giao</th>
                <th className="border p-2">Cấp chuyền</th>
                <th className="border p-2">Chuyền hoàn</th>
                <th className="border p-2">Chuyển ca</th>
                <th className="border p-2">Trả kho</th>
                <th className="border p-2">Hao hụt</th>
              </tr>
            </thead>
            <tbody>
              {truckData.map((row, i) => (
                <tr key={i}>
                  <td className="border p-2">{row.truckCode}</td>
                  <td className="border p-2">{row.workShift}</td>
                  <td className="border p-2">{row.weighDate}</td>
                  <td className="border p-2 text-right">{row.receivedFromWarehouse?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.receivedFromShift?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.deliveredToLine?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.returnedFromLine?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.transferredToNextShift?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.returnedToWarehouse?.toFixed(1) || '-'}</td>
                  <td className="border p-2 text-right">{row.loss?.toFixed(1) || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Analytics;
