import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../../config';

const PAGE_SIZE = 10;

function HistoryWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    date: todayStr || '',
    shift: '',
    department: '',
    unit: '',
  });
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filters, currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/ink-weighing/history`, {
        params: {
          ...filters,
          page: currentPage,
          pageSize: PAGE_SIZE,
        },
      });

      const sessions = res.data.items || [];

      console.log(sessions);

      setData(sessions || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalSessions(res.data.items?.length || 0);

      let sum = 0;
      res.data.items?.forEach(session =>
        session.items.forEach(i => sum += i.weight)
      );
      setTotalWeight(sum);

      
        // ✅ Trích xuất bộ phận và chuyền duy nhất
        const uniqueDepartments = [...new Set(sessions.map(s => s.department).filter(Boolean))];
        const uniqueUnits = [...new Set(sessions.map(s => s.unit).filter(Boolean))];
        setDepartments(uniqueDepartments);
        setUnits(uniqueUnits);

    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu lịch sử:', err);
    } finally {
      setIsLoading(false); // ✅ Dừng hiệu ứng loading
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const formatDate = (isoDateStr) => {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    return date.toLocaleDateString('vi-VN'); // ví dụ: 27/06/2025
  };

  const formatTime = (isoTimeStr) => {
    if (!isoTimeStr) return '';
    const [_, hhmm] = isoTimeStr.split('T')[1].split(':');
    return `${isoTimeStr.slice(11, 13)}:${isoTimeStr.slice(14, 16)}`;
  };

  const formatWeight = (num) => {
    if (!num) return '0';
    return `${Number(num).toFixed(2).toLocaleString('vi-VN')}`; // ví dụ: 4,001.4 g
  };



  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
      <h1 className="text-2xl font-bold mb-4">📜 Lịch sử cân mực</h1>

      {/* Tổng quan */}
      <div className="mb-4 text-sm text-gray-800">
        <strong>Tổng lượt cân:</strong> {totalSessions} | 
        <strong> Tổng khối lượng:</strong> {formatWeight(totalWeight)} g
      </div>

      {/* Bộ lọc */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2 w-full"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
          value={filters.shift}
          onChange={(e) => handleFilterChange('shift', e.target.value)}
        >
          <option value="">Chọn ca làm việc</option>
          <option value="C1">Ca 1</option>
          <option value="C2">Ca 2</option>
          <option value="C3">Ca 3</option>
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
          value={filters.department}
          onChange={(e) => handleFilterChange('department', e.target.value)}
        >
          <option value="">Chọn bộ phận</option>
          {departments.map((d, idx) => (
            <option key={idx} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 w-full"
          value={filters.unit}
          onChange={(e) => handleFilterChange('unit', e.target.value)}
        >
          <option value="">Chọn chuyền</option>
          {units.map((u, idx) => (
            <option key={idx} value={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Danh sách phiên cân */}
      <div className="overflow-auto border rounded shadow min-h-[200px] relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <table className="min-w-full text-sm border-separate border-spacing-0 overflow-hidden shadow">
  <thead className="bg-blue-100 text-blue-900 font-semibold">
    <tr>
      <th className="border border-gray-300 px-4 py-3">STT</th>
      <th className="border border-gray-300 px-4 py-3">Nghiệp vụ</th>
      <th className="border border-gray-300 px-4 py-3">Bộ phận</th>
      <th className="border border-gray-300 px-4 py-3">Đơn vị</th>
      <th className="border border-gray-300 px-4 py-3">Ca làm</th>
      <th className="border border-gray-300 px-4 py-3">Thời gian</th>
      <th className="border border-gray-300 px-4 py-3">Mã mực</th>
      <th className="border border-gray-300 px-4 py-3">Tên mực</th>
      <th className="border border-gray-300 px-4 py-3">Khối lượng (g)</th>
      <th className="border border-gray-300 px-4 py-3">NSX</th>
      <th className="border border-gray-300 px-4 py-3">Người nhận</th>
    </tr>
  </thead>
  <tbody>
    {data.map((session, sIdx) =>
      session.items.map((item, iIdx) => (
        <tr
          key={`${session.weighingSessionId}-${iIdx}`}
          className={sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
        >
          {iIdx === 0 && (
            <>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {sIdx + 1}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.operation === 'CP' ? 'Cấp phát' :
                  session.operation === 'TH' ? 'Thu hồi' :
                  session.operation === 'CM' ? 'Cấp mực' :
                  session.operation === 'TV' ? 'Trả lời' :
                  session.operation === 'GC' ? 'Giao ca' :
                  session.operation === 'CX' ? 'Chuyển xe' :
                  session.operation}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.department.replace(/^T/, 'Tổ ')}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.unit}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                {session.workShift}
              </td>
              <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
                 {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
                 <span className='p-[4px]'>-</span>
                 {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
              </td>
            </>
          )}
          <td className="border border-gray-300 px-4 py-3">{item.inkCode}</td>
          <td className="border border-gray-300 px-4 py-3">{item.inkName}</td>
          <td className="border border-gray-300 px-4 py-3">{formatWeight(item.weight)}</td>
          <td className="border border-gray-300 px-4 py-3">{formatDate(item.productionDate)}</td>
          {iIdx === 0 && (
            <td className="border border-gray-300 px-4 py-3" rowSpan={session.items.length}>
              {session.receivedBy}
            </td>
          )}
        </tr>
      ))
    )}
  </tbody>
</table>
      </div>

      {/* Phân trang */}
      <div className="mt-6 flex justify-end items-center gap-2 text-sm">
        <span>Trang:</span>
        {Array.from({ length: totalPages }, (_, idx) => (
          <button
            key={idx + 1}
            className={`px-3 py-1 rounded-lg border ${currentPage === idx + 1 ? 'bg-blue-500 text-white' : 'bg-white text-black'}`}
            onClick={() => setCurrentPage(idx + 1)}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      </div>
    </div>
  );
}

export default HistoryWeigh;
