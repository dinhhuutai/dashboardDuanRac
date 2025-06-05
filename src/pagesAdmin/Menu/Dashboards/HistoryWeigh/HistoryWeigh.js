// ... các phần import giữ nguyên
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config/index';
import { FaTrash } from 'react-icons/fa';

function HistoryWeigh() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    userName: '',
    departmentName: '',
    unitName: '',
    trashName: '',
    workShift: '',
    timeFrom: '',
    timeTo: '',
  });

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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

  const uniqueOptions = (key) => [...new Set(data.map((d) => d[key]).filter(Boolean))];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const match = (value, keyword) => value?.toLowerCase().includes(keyword.toLowerCase());
      return (
        match(item.userName, filters.userName) &&
        match(item.departmentName, filters.departmentName) &&
        match(item.unitName || '', filters.unitName) &&
        match(item.trashName, filters.trashName) &&
        (!filters.workShift || item.workShift === filters.workShift) &&
        (!filters.timeFrom || new Date(item.weighingTime) >= new Date(`${date}T${filters.timeFrom}`)) &&
        (!filters.timeTo || new Date(item.weighingTime) <= new Date(`${date}T${filters.timeTo}`))
      );
    });
  }, [data, filters, date]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalWeight = filteredData.reduce((sum, item) => sum + (item.weightKg || 0), 0);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await axios.delete(`${BASE_URL}/history/delete/${deleteItem.weighingID}`);
      setData((prev) => prev.filter((item) => item.weighingID !== deleteItem.weighingID));
    } catch (err) {
      console.error('❌ Lỗi khi xóa dữ liệu:', err);
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const formatDateTime = (datetimeStr) => {
    const [date, time] = datetimeStr.split('T');
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    return `${day}-${month}-${year} ${hour}:${minute}`;
  };

  const formatVietnamTimeString2 = (datetimeStr) => {
    if (!datetimeStr) return '';
    const [date] = datetimeStr.split('T');
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h2 className="text-xl font-bold text-blue-700">📊 Lịch cân rác theo ngày</h2>

        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label>📅 Chọn ngày:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="border rounded px-2 py-1"
            />
          </div>

          {['userName', 'departmentName', 'unitName', 'trashName'].map((key) => (
            <div key={key}>
              <label>
                {
                  {
                    userName: 'Người cân',
                    departmentName: 'Bộ phận',
                    unitName: 'Đơn vị',
                    trashName: 'Loại rác',
                  }[key]
                }
                :
              </label>
              <select
                value={filters[key]}
                onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.value }))}
                className="border rounded px-2 py-1"
              >
                <option value="">Tất cả</option>
                {uniqueOptions(key).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label>Ca:</label>
            <select
              value={filters.workShift}
              onChange={(e) => setFilters((f) => ({ ...f, workShift: e.target.value }))}
              className="border rounded px-2 py-1"
            >
              <option value="">Tất cả</option>
              <option value="ca1">Ca ngắn 1</option>
              <option value="ca2">Ca ngắn 2</option>
              <option value="ca3">Ca ngắn 3</option>
              <option value="dai1">Ca dài 1</option>
              <option value="dai2">Ca dài 2</option>
              <option value="cahc">Ca hành chính</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-blue-500">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div>
            <p className="font-medium">
              🔢 Tổng lượt cân: {filteredData.length} | ⚖️ Tổng khối lượng: {totalWeight.toFixed(2)} kg
            </p>
            <div className="overflow-x-auto mt-4 rounded-lg border border-gray-200">
              <table className="min-w-full text-sm text-gray-700 border border-gray-300 border-collapse">
                <thead className="bg-blue-100 text-center text-gray-800 font-semibold border-b border-gray-300">
                  <tr className="divide-x divide-gray-300">
                    <th className="px-2 py-3">#</th>
                    <th className="px-2 py-3">Tài khoản cân</th>
                    <th className="px-2 py-3">Bộ phận</th>
                    <th className="px-2 py-3">Đơn vị</th>
                    <th className="px-2 py-3">Loại rác</th>
                    <th className="px-2 py-3">Mã thùng</th>
                    <th className="px-2 py-3">Thời gian cân</th>
                    <th className="px-2 py-3">Ngày đổ</th>
                    <th className="px-2 py-3">Ca</th>
                    <th className="px-2 py-3">Người cân</th>
                    <th className="px-2 py-3 text-right">Khối lượng</th>
                    <th className="px-2 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((item, i) => (
                    <tr key={item.weighingID} className="text-center hover:bg-gray-50 odd:bg-white even:bg-gray-50">
                      <td className="px-2 py-2 border">{(currentPage - 1) * pageSize + i + 1}</td>
                      <td className="px-2 py-2 border">{item.fullName}</td>
                      <td className="px-2 py-2 border">{item.departmentName}</td>
                      <td className="px-2 py-2 border">{item.unitName || '-'}</td>
                      <td className="px-2 py-2 border">{item.trashName}</td>
                      <td className="px-2 py-2 border">{item.trashBinCode}</td>
                      <td className="px-2 py-2 border">{formatDateTime(item.weighingTime)}</td>
                      <td className="px-2 py-2 border">{formatVietnamTimeString2(item.workDate)}</td>
                      <td className="px-2 py-2 border">{item.workShift}</td>
                      <td className="px-2 py-2 border">{item.userName}</td>
                      <td className="px-2 py-2 border text-right font-medium text-blue-800">{item.weightKg}</td>
                      <td className="px-2 py-2 border">
                        <button onClick={() => setDeleteItem(item)} className="text-red-500 hover:text-red-700">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 text-sm">
              <div>
                Hiển thị:
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="ml-2 border px-2 py-1 rounded"
                >
                  {[10, 30, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                Trang:
                {[...Array(Math.ceil(filteredData.length / pageSize)).keys()].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n + 1)}
                    className={`mx-1 px-3 py-1 rounded ${
                      n + 1 === currentPage ? 'bg-blue-500 text-white' : 'bg-gray-200'
                    }`}
                  >
                    {n + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {deleteItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm text-center shadow-xl">
              <p className="mb-4 text-lg font-semibold text-gray-800">
                ❓Xoá bản ghi cân rác
                <br />
                <span className="text-red-600">
                  ({deleteItem.trashBinCode} - {formatDateTime(deleteItem.weighingTime)})
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
                  onClick={handleDelete}
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
    </div>
  );
}

export default HistoryWeigh;
