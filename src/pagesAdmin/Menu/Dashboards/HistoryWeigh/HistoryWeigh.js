// ... các phần import giữ nguyên
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config/index';
import { FaTrash, FaEdit, FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import http from '~/api/http';

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
      const res = await http.get(`${BASE_URL}/history/date`, { params: { date } });
      setData(res.data);
      setCurrentPage(1);
    } catch (err) {
      setError('❌ Lỗi khi tải dữ liệu lịch sử cân');
    } finally {
      setLoading(false);
    }
  }

  const uniqueOptions = (key) => [...new Set(data.map((d) => d[key]).filter(Boolean))];

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const match = (value, keyword) => (value || '').toLowerCase().includes((keyword || '').toLowerCase());

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

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages]); // reset nếu lọc làm giảm số trang

  const totalWeight = filteredData.reduce((sum, item) => sum + (item.weightKg || 0), 0);

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await http.delete(`${BASE_URL}/history/delete/${deleteItem.weighingID}`);
      setData((prev) => prev.filter((item) => item.weighingID !== deleteItem.weighingID));
    } catch (err) {
      // silent
    } finally {
      setDeleting(false);
      setDeleteItem(null);
    }
  };

  const formatDateTime = (datetimeStr) => {
    const [d, t] = datetimeStr.split('T');
    const [y, m, day] = (d || '').split('-');
    const [hh, mm] = (t || '').split(':');
    return `${day}-${m}-${y} ${hh}:${mm}`;
  };

  const formatVietnamTimeString2 = (datetimeStr) => {
    if (!datetimeStr) return '';
    const [d] = datetimeStr.split('T');
    const [y, m, day] = (d || '').split('-');
    return `${day}-${m}-${y}`;
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

    // Dòng tổng
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

  const CellPill = ({ children, variant = 'ok' }) => {
    const map = {
      ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      warn: 'bg-amber-50 text-amber-700 border-amber-200',
      danger: 'bg-rose-50 text-rose-700 border-rose-200',
      gray: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${map[variant] || map.gray}`}>
        {children}
      </span>
    );
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header card */}
      <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 shadow-sm mb-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-800 text-center md:text-left">📊 Lịch sử cân rác theo ngày</h2>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="col-span-1">
            <label className="block text-xs text-slate-500 mb-1">📅 Chọn ngày</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {['userName', 'departmentName', 'unitName', 'trashName'].map((key) => (
            <div key={key} className="col-span-1">
              <label className="block text-xs text-slate-500 mb-1">
                {{
                  userName: 'Người cân',
                  departmentName: 'Bộ phận',
                  unitName: 'Đơn vị',
                  trashName: 'Loại rác',
                }[key]}
              </label>
              <select
                value={filters[key]}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, [key]: e.target.value }));
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          <div className="col-span-1">
            <label className="block text-xs text-slate-500 mb-1">Ca</label>
            <select
              value={filters.workShift}
              onChange={(e) => {
                setFilters((f) => ({ ...f, workShift: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

          <div className="col-span-1">
            <label className="block text-xs text-slate-500 mb-1">Lọc ngày/ca</label>
            <select
              value={missingFilter}
              onChange={(e) => {
                setMissingFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả</option>
              <option value="validOnly">Loại bỏ không ngày & không ca</option>
              <option value="missingDate">Không ngày</option>
              <option value="missingShift">Không ca</option>
              <option value="missingEither">Không ca hoặc không ngày</option>
              <option value="missingBoth">Không ca và không ngày</option>
            </select>
          </div>

          <div className="col-span-1">
            <label className="block text-xs text-slate-500 mb-1">Ngày đổ</label>
            <input
              type="date"
              value={filters.disposalDate}
              onChange={(e) => {
                setFilters((f) => ({ ...f, disposalDate: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="text-sm text-slate-600">
            🔢 <span className="font-semibold">{filteredData.length}</span> lượt cân | ⚖️{' '}
            <span className="font-semibold">{totalWeight.toFixed(1)}</span> kg
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 active:scale-[.98] transition"
            >
              ↻ Tải lại
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 text-sm rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[.98] shadow-sm"
            >
              📤 Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
              <tr className="text-center text-slate-700">
                <th className="px-2 py-3">#</th>
                <th className="px-2 py-3">Tài khoản cân</th>
                <th className="px-2 py-3">Bộ phận</th>
                <th className="px-2 py-3">Đơn vị</th>
                <th className="px-2 py-3">Loại rác</th>
                <th className="px-2 py-3">Mã thùng</th>
                <th className="px-2 py-3">Thời gian cân</th>
                <th className="px-2 py-3">Ngày đổ</th>
                <th className="px-2 py-3">Ca</th>
                <th className="px-2 py-3">Ghi chú</th>
                <th className="px-2 py-3 text-right">Khối lượng</th>
                {user?.actionHistoryWeigh && <th className="px-2 py-3">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item, i) => {
                const invalid = !item.workShift || !item.workDate;
                return (
                  <tr
                    key={item.weighingID}
                    className={`text-center ${
                      invalid ? 'bg-rose-500/90 text-white' : 'hover:bg-slate-50 odd:bg-white even:bg-slate-50/60'
                    } transition`}
                  >
                    <td className="px-2 py-2">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="px-2 py-2">{item.fullName}</td>
                    <td className="px-2 py-2">{item.departmentName}</td>
                    <td className="px-2 py-2">{item.unitName || '-'}</td>
                    <td className="px-2 py-2">{item.trashName}</td>
                    <td className="px-2 py-2">{item.trashBinCode}</td>
                    <td className="px-2 py-2">{formatDateTime(item.weighingTime)}</td>
                    <td className="px-2 py-2">
                      {!item.workDate ? (
                        <CellPill variant={invalid ? 'danger' : 'warn'}>Không ngày</CellPill>
                      ) : (
                        <CellPill variant="ok">{formatVietnamTimeString2(item.workDate)}</CellPill>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {!item.workShift ? (
                        <CellPill variant={invalid ? 'danger' : 'warn'}>Không ca</CellPill>
                      ) : (
                        <CellPill variant="ok">{item.workShift}</CellPill>
                      )}
                    </td>
                    <td className="px-2 py-2">{item.userName}</td>
                    <td className={`px-2 py-2 text-right font-semibold ${invalid ? 'text-white' : 'text-slate-900'}`}>
                      {Number(item.weightKg || 0).toFixed(1)}
                    </td>
                    {(user?.userID === 3 || user?.userID === 1) && (
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-3 justify-center">
                          <button
                            onClick={() => {
                              setConfirmedData(item);
                              setIsWorkDate(!!item.workDate);
                              setIsWorkShift(!!item.workShift);
                              setEditModalVisible(true);
                            }}
                            className={`${invalid ? 'text-white' : 'text-blue-600 hover:text-blue-800'}`}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setDeleteItem(item)}
                            className={`${invalid ? 'text-white' : 'text-rose-600 hover:text-rose-700'}`}
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination + size */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border-t border-slate-200 text-sm">
          <div>
            Hiển thị:
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="ml-2 rounded border border-slate-300 bg-white px-2 py-1"
            >
              {[10, 30, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            Trang:
            {Array.from({ length: totalPages }).map((_, n) => (
              <button
                key={n}
                onClick={() => setCurrentPage(n + 1)}
                className={`px-3 py-1 rounded border ${
                  n + 1 === currentPage
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-slate-300 hover:bg-slate-50'
                }`}
              >
                {n + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteItem && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-xl">
            <p className="mb-4 text-base font-semibold text-slate-800">
              ❓Xoá bản ghi cân rác
              <br />
              <span className="text-rose-600">
                ({deleteItem.trashBinCode} - {formatDateTime(deleteItem.weighingTime)})
              </span>
              ?
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-white bg-rose-600 hover:bg-rose-700"
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editModalVisible && confirmedData && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditModalVisible(false)}
        >
          <motion.div
            className="bg-white text-black p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">✏️ Chỉnh sửa thông tin</h2>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">⚖️ Khối lượng:</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={confirmedData.weightKg}
                onChange={(e) =>
                  setConfirmedData({
                    ...confirmedData,
                    weightKg: parseFloat(e.target.value.replace(',', '.')) || 0,
                  })
                }
              />
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">🕓 Ca làm:</label>
              <div className="flex items-center gap-6 mb-3">
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

              {isWorkShift ? (
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={confirmedData.workShift || ''}
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
                <button className="px-4 py-2 rounded border text-sm bg-rose-50 text-rose-600 cursor-default" disabled>
                  Tem không để ca
                </button>
              )}
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">📅 Ngày làm việc:</label>
              <div className="flex items-center gap-6 mb-3">
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={confirmedData.workDate || ''}
                  onChange={(e) => setConfirmedData({ ...confirmedData, workDate: e.target.value })}
                />
              ) : (
                <button className="px-4 py-2 rounded border text-sm bg-rose-50 text-rose-600 cursor-default" disabled>
                  Tem không để ngày
                </button>
              )}
            </div>

            <div className="text-sm">
              <label className="block mb-1 font-semibold">👤 Người cân:</label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                value={confirmedData.userName || ''}
                onChange={(e) => setConfirmedData({ ...confirmedData, userName: e.target.value })}
              />
            </div>

            <div className="flex justify-between pt-3">
              <button
                onClick={() => setEditModalVisible(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
              >
                ❌ Hủy
              </button>

              <button
                onClick={async () => {
                  setIsSaving(true);
                  const nowUTC7 = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
                  try {
                    const res = await http.put(`${BASE_URL}/trash-weighings/${confirmedData.weighingID}`, {
                      ...confirmedData,
                      workShift: isWorkShift ? confirmedData.workShift || 'ca1' : null,
                      workDate: isWorkDate ? confirmedData.workDate : null,
                      updatedAt: nowUTC7.toISOString(),
                      updatedBy: user.userID
                    });

                    if (res.status === 200) {
                      setMessageModal({ type: 'success', message: '✅ Đã chỉnh sửa dữ liệu cân rác thành công!' });
                      await fetchHistory();
                    } else {

                      const err = await res.data;
                      setMessageModal({ type: 'error', message: `❌ Lỗi: ${err}` });
                    }
                  } catch (err) {
                    console.log(err)
                    setMessageModal({ type: 'error', message: '❌ Không thể kết nối server!' });
                  } finally {
                    setEditModalVisible(false);
                    setIsSaving(false);
                  }
                }}
                className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? (
                  <svg className="w-4 h-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {/* Message modal */}
      <AnimatePresence>
        {messageModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMessageModal(null)}
          >
            <motion.div
              className="bg-white text-black p-6 rounded-2xl shadow-xl space-y-4 w-full max-w-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={`text-sm ${messageModal.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                {messageModal.message}
              </p>
              <div className="flex justify-end pt-2">
                <button onClick={() => setMessageModal(null)} className="px-4 py-2 rounded-lg text-white bg-slate-700 hover:bg-slate-800">
                  Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global loading */}
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
            <span className="text-slate-700 text-sm">Đang tải dữ liệu...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoryWeigh;
