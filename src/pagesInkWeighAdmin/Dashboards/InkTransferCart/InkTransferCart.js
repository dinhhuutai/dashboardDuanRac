import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiLoader } from 'react-icons/fi';
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
              <th className="border px-2 py-1">Nhận bàn giao ca</th>
              <th className="border px-2 py-1">Mực cấp</th>
              <th className="border px-2 py-1">Mực hoàn về</th>
              <th className="border px-2 py-1">Chuyển ca sau</th>
              <th className="border px-2 py-1">Trả về kho</th>
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
                  <td className="border px-2 py-1 text-right">{row.nhan_ban_giao_ca.toFixed(1)}</td>
                  <td className="border px-2 py-1 text-right">{row.muc_cap_cho_chuyen.toFixed(1)}</td>
                  <td className="border px-2 py-1 text-right">{row.muc_chuyen_hoan_ve.toFixed(1)}</td>
                  <td className="border px-2 py-1 text-right">{row.muc_chuyen_ca_sau.toFixed(1)}</td>
                  <td className="border px-2 py-1 text-right">{row.muc_tra_ve_kho.toFixed(1)}</td>
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
