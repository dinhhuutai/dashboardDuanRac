// ... các phần import giữ nguyên
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config/index';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import { FaSpinner } from 'react-icons/fa';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


function HistoryWeigh() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [missingFilter, setMissingFilter] = useState('all');

  const [confirmedData, setConfirmedData] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [isWorkShift, setIsWorkShift] = useState(true);
  const [isWorkDate, setIsWorkDate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [messageModal, setMessageModal] = useState(null);

  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  const [filters, setFilters] = useState({
    userName: '',
    departmentName: '',
    unitName: '',
    trashName: '',
    workShift: '',
    timeFrom: '',
    timeTo: '',
    disposalDate: '',
  });

  console.log(filters, data);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!date) return;
    fetchHistory();
  }, [date]);

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

  const uniqueOptions = (key) => [...new Set(data.map((d) => d[key]).filter(Boolean))];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const match = (value, keyword) => value?.toLowerCase().includes(keyword.toLowerCase());

      const passesTextFilters =
        match(item.userName, filters.userName) &&
        match(item.departmentName, filters.departmentName) &&
        match(item.unitName || '', filters.unitName) &&
        match(item.trashName, filters.trashName) &&
        (!filters.workShift || item.workShift === filters.workShift) &&
        (!filters.timeFrom || new Date(item.weighingTime) >= new Date(`${date}T${filters.timeFrom}`)) &&
        (!filters.timeTo || new Date(item.weighingTime) <= new Date(`${date}T${filters.timeTo}`)) &&
        (!filters.disposalDate || item.workDate?.startsWith(filters.disposalDate));

      const hasDate = Boolean(item.workDate);
      const hasShift = Boolean(item.workShift);

      let passesMissingFilter = true;
      switch (missingFilter) {
        case 'validOnly':
          passesMissingFilter = hasDate && hasShift;
          break;
        case 'missingDate':
          passesMissingFilter = !hasDate;
          break;
        case 'missingShift':
          passesMissingFilter = !hasShift;
          break;
        case 'missingEither':
          passesMissingFilter = !hasDate || !hasShift;
          break;
        case 'missingBoth':
          passesMissingFilter = !hasDate && !hasShift;
          break;
        default:
          passesMissingFilter = true;
      }

      return passesTextFilters && passesMissingFilter;
    });
  }, [data, filters, date, missingFilter]);

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

  const exportToExcel = () => {
  const exportData = filteredData.map((item, index) => ({
    STT: index + 1,
    'Tài khoản cân': item.fullName,
    'Bộ phận': item.departmentName,
    'Đơn vị': item.unitName || '-',
    'Loại rác': item.trashName,
    'Mã thùng': item.trashBinCode,
    'Thời gian cân': formatDateTime(item.weighingTime),
    'Ngày đổ': item.workDate ? formatVietnamTimeString2(item.workDate) : 'Không ngày',
    'Ca': item.workShift || 'Không ca',
    'Người cân': item.userName,
    'Khối lượng (kg)': item.weightKg,
  }));

  // Thêm dòng tổng ở cuối
  exportData.push({});
  exportData.push({
    STT: '',
    'Tài khoản cân': 'Tổng cộng:',
    'Khối lượng (kg)': totalWeight.toFixed(1),
    'Loại rác': `Lượt cân: ${filteredData.length}`,
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { skipHeader: false });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BaoCaoCanRac');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `BaoCaoCanRac_${date}.xlsx`);
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

          <div>
            <label>Lọc ngày/ca:</label>
            <select
              value={missingFilter}
              onChange={(e) => setMissingFilter(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="all">Tất cả</option>
              <option value="validOnly">Loại bỏ không ngày & không ca</option>
              <option value="missingDate">Không ngày</option>
              <option value="missingShift">Không ca</option>
              <option value="missingEither">Không ca hoặc không ngày</option>
              <option value="missingBoth">Không ca và không ngày</option>
            </select>
          </div>

          <div>
            <label>Ngày đổ:</label>
            <input
              type="date"
              value={filters.disposalDate}
              onChange={(e) => setFilters((f) => ({ ...f, disposalDate: e.target.value }))}
              className="border rounded px-2 py-1"
            />
          </div>

        </div>

        <button
  onClick={exportToExcel}
  className="mb-4 px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
>
  📤 Xuất Excel
</button>


        {loading ? (
          
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4">
                <FaSpinner className="animate-spin text-blue-600 text-5xl" />
                <span
            className="animate-spin text-gray-700 text-lg font-medium"
            style={{ animationDirection: 'reverse' }}
          >
            Loading...
          </span>
          
              </div>
            </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div>
            <p className="font-medium">
              🔢 Tổng lượt cân: {filteredData.length} | ⚖️ Tổng khối lượng: {totalWeight.toFixed(1)} kg
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
                    {
                      user?.actionHistoryWeigh &&
                      <th className="px-2 py-3">Thao tác</th>
                    }
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedData.map((item, i) => (
                    <tr
                      key={item.weighingID}
                      className={`text-center ${
                        !item.workShift || !item.workDate
                          ? 'bg-[#ff564a] text-[#fff]'
                          : 'hover:bg-gray-50 odd:bg-white even:bg-gray-50'
                      }`}
                    >
                      <td className="px-2 py-2 border">{(currentPage - 1) * pageSize + i + 1}</td>
                      <td className="px-2 py-2 border">{item.fullName}</td>
                      <td className="px-2 py-2 border">{item.departmentName}</td>
                      <td className="px-2 py-2 border">{item.unitName || '-'}</td>
                      <td className="px-2 py-2 border">{item.trashName}</td>
                      <td className="px-2 py-2 border">{item.trashBinCode}</td>
                      <td className="px-2 py-2 border">{formatDateTime(item.weighingTime)}</td>
                      <td className="px-2 py-2 border">
                        {!item.workDate ? (
                          <button
                            className="px-2 py-1 rounded border text-sm bg-red-200 text-red-600 cursor-default"
                            disabled
                          >
                            Không ngày
                          </button>
                        ) : (
                          formatVietnamTimeString2(item.workDate)
                        )}
                      </td>
                      <td className="px-2 py-2 border">
                        {!item.workShift ? (
                          <button
                            className="px-2 py-1 rounded border text-sm bg-red-200 text-red-600 cursor-default"
                            disabled
                          >
                            Không ca
                          </button>
                        ) : (
                          item.workShift
                        )}
                      </td>
                      <td className="px-2 py-2 border">{item.userName}</td>
                      <td
                        className={`px-2 py-2 border text-right font-medium ${
                          !item.workShift || !item.workDate ? 'text-[#fff]' : 'text-blue-800'
                        }`}
                      >
                        {item.weightKg}
                      </td>
                      {
                        user?.actionHistoryWeigh &&
                      <td className="px-2 py-2 border">
                        <div className="flex items-center gap-3 justify-between">
                          {/* Nút chỉnh sửa */}
                          <button
                            onClick={() => {
                              setConfirmedData(item);
                              setIsWorkDate(!!item.workDate);
                              setIsWorkShift(!!item.workShift);
                              setEditModalVisible(true);
                            }}
                            className={`${
                              !item.workShift || !item.workDate ? 'text-[#fff]' : 'text-blue-600'
                            } hover:text-blue-800`}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>

                          {/* Nút xóa */}
                          <button
                            onClick={() => setDeleteItem(item)}
                            className={`${
                              !item.workShift || !item.workDate ? 'text-[#fff]' : 'text-red-500'
                            } hover:text-red-700`}
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                      }
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

      {editModalVisible && confirmedData && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditModalVisible(false)}
        >
          <motion.div
            className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-md mx-4 space-y-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">✏️ Chỉnh sửa thông tin</h2>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">⚖️ Khối lượng:</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={confirmedData.weightKg}
                onChange={(e) =>
                  setConfirmedData({ ...confirmedData, weightKg: parseFloat(e.target.value.replace(',', '.')) || 0 })
                }
              />
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">🕓 Ca làm:</label>
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shift"
                    value="true"
                    checked={isWorkShift === true}
                    onChange={() => setIsWorkShift(true)}
                  />
                  <span>Có ca</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="shift"
                    value="false"
                    checked={isWorkShift === false}
                    onChange={() => setIsWorkShift(false)}
                  />
                  <span>Không ca</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {isWorkShift ? (
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    value={confirmedData.workShift}
                    onChange={(e) => setConfirmedData({ ...confirmedData, workShift: e.target.value })}
                  >
                    <option value="ca1">Ca Ngắn 1 (06h00 → 14h00)</option>
                    <option value="ca2">Ca Ngắn 2 (14h00 → 22h00)</option>
                    <option value="ca3">Ca Ngắn 3 (22h00 → 06h00)</option>
                    <option value="dai1">Ca Dài 1 (06h00 → 18h00)</option>
                    <option value="dai2">Ca Dài 2 (18h00 → 06h00)</option>
                    <option value="cahc">Ca Hành Chính (07h30 → 16h30)</option>
                  </select>
                ) : (
                  <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                    Tem không để ca
                  </button>
                )}
              </div>
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="date"
                    value="true"
                    checked={isWorkDate === true}
                    onChange={() => setIsWorkDate(true)}
                  />
                  <span>Có ngày</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="date"
                    value="false"
                    checked={isWorkDate === false}
                    onChange={() => setIsWorkDate(false)}
                  />
                  <span>Không ngày</span>
                </label>
              </div>
              {isWorkDate ? (
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  value={confirmedData.workDate}
                  onChange={(e) => setConfirmedData({ ...confirmedData, workDate: e.target.value })}
                />
              ) : (
                <button className="px-4 py-2 rounded border text-sm bg-red-100 text-red-600 cursor-default" disabled>
                  Tem không để ngày
                </button>
              )}
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">👤 Người cân:</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={confirmedData.userName}
                onChange={(e) => setConfirmedData({ ...confirmedData, userName: e.target.value })}
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => {
                  setEditModalVisible(false);
                }}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                ❌ Hủy
              </button>

              <button
                onClick={async () => {
                  setIsSaving(true);
                  const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
                  console.log(confirmedData);
                  try {
                    const res = await fetch(`${BASE_URL}/trash-weighings/${confirmedData.weighingID}`, {
                      method: 'PUT', // hoặc PATCH nếu có ID
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...confirmedData,
                        updatedAt: nowUTC7.toISOString(),
                        updatedBy: user.userID, // thay bằng user ID thực tế
                      }),
                    });

                    if (res.ok) {
                      setMessageModal({ type: 'success', message: '✅ Đã chỉnh sửa dữ liệu cân rác thành công!' });

                      await fetchHistory();
                    } else {
                      const err = await res.text();
                      setMessageModal({ type: 'error', message: `❌ Lỗi: ${err}` });
                    }
                  } catch {
                    setMessageModal({ type: 'error', message: '❌ Không thể kết nối server!' });
                  } finally {
                    setEditModalVisible(false);
                    setIsSaving(false);
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {isSaving ? (
                  <svg
                    className="w-4 h-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  '💾 Lưu'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <AnimatePresence>
        {messageModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-xl shadow-xl space-y-4 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={`text-sm ${messageModal.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {messageModal.message}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setMessageModal(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HistoryWeigh;
