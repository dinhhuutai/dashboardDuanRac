import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config/index';
import { FaTrash } from 'react-icons/fa';

function HistoryWeigh() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!date) return;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${BASE_URL}/history/date`, {
          params: { date },
        });
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
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    return `${day}-${month}-${year} ${hour}:${minute}`;
  }

  function formatVietnamTimeString2(datetimeStr) {
    if (!datetimeStr) return '';
    const [date, time] = datetimeStr.split('T');
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  async function handleConfirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);

    console.log(deleteItem);

    try {
      await axios.delete(`${BASE_URL}/history/delete/${deleteItem.weighingID}`);
      setData((prev) => prev.filter((item) => item.weighingID !== deleteItem.weighingID));
    } catch (err) {
      console.error('❌ Lỗi khi xóa dữ liệu:', err);
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
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

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {!loading && !error && data.length === 0 && (
          <p className="mt-4 text-gray-600">Không có dữ liệu lịch sử cân cho ngày này.</p>
        )}

        {!loading && data.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-center">Tài khoản cân</th>
                  <th className="border px-2 py-1 text-center">Bộ phận</th>
                  <th className="border px-2 py-1 text-center">Đơn vị</th>
                  <th className="border px-2 py-1 text-center">Loại rác</th>
                  <th className="border px-2 py-1 text-center">Mã thùng rác</th>
                  <th className="border px-2 py-1 text-center">Thời gian cân</th>
                  <th className="border px-2 py-1 text-center">Ngày đổ rác</th>
                  <th className="border px-2 py-1 text-center">Ca đổ rác</th>
                  <th className="border px-2 py-1 text-center">Người cân rác</th>
                  <th className="border px-2 py-1 text-center">Khối lượng (kg)</th>
                  <th className="border px-2 py-1 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{item.fullName}</td>
                    <td className="border px-2 py-1">{item.departmentName}</td>
                    <td className="border px-2 py-1">{item.unitName || '-'}</td>
                    <td className="border px-2 py-1">{item.trashName}</td>
                    <td className="border px-2 py-1">{item.trashBinCode}</td>
                    <td className="border px-2 py-1">{formatVietnamTimeString(item.weighingTime)}</td>
                    <td className="border px-2 py-1">{formatVietnamTimeString2(item.workDate)}</td>
                    <td className="border px-2 py-1">
                      {item.workShift === 'ca1'
                        ? 'Ca ngắn 1'
                        : item.workShift === 'ca2'
                        ? 'Ca ngắn 2'
                        : item.workShift === 'ca3'
                        ? 'Ca ngắn 3'
                        : item.workShift === 'dai1'
                        ? 'Ca dài 1'
                        : 'Ca dài 2'}
                    </td>
                    <td className="border px-2 py-1">{item.userName}</td>
                    <td className="border px-2 py-1 text-right">{item.weightKg}</td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="text-red-600 hover:text-red-800"
                        title="Xóa dòng này"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal xác nhận xóa */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-xl animate-fade-in">
            <p className="mb-4 text-lg font-semibold text-gray-800">
              ❓Bạn có chắc chắn muốn xoá bản ghi cân rác
              <br />
              <span className="text-red-600">
                ({deleteItem.trashBinCode} - {formatVietnamTimeString(deleteItem.weighingTime)})
              </span>
              ?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryWeigh;
