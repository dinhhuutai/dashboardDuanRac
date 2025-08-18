import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL_SERVER_THLA } from '../../../config';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { FiDownload, FiLoader, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import http from '~/api/http';

const PAGE_SIZE = 10;
// pageSize lớn để gom meta (tổng & dropdown). Nếu backend có endpoint summary riêng thì dùng thay cho cách này.
const PAGE_SIZE_ALL = 100000;

function HistoryWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({
    date: todayStr || '',
    shift: '',
    department: '',
    unit: '',
    operation: '',
  });

  // dữ liệu trang hiện tại
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // meta trên TOÀN BỘ dữ liệu theo filter (không theo trang)
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);     // tổng toàn bộ
  const [totalSessions, setTotalSessions] = useState(0); // tổng toàn bộ

  const [isLoading, setIsLoading] = useState(false);     // loading cho trang
  const [isMetaLoading, setIsMetaLoading] = useState(false); // loading cho meta

  // lấy dữ liệu theo trang
  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  // lấy meta (tổng & dropdown) – chỉ khi thay đổi bộ lọc, KHÔNG chạy lại khi đổi trang
  useEffect(() => {
    fetchMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPage = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/ink-weighing/history`, {
        params: { ...filters, page: currentPage, pageSize: PAGE_SIZE },
      });
      const sessions = res.data.items || [];
      setData(sessions);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu lịch sử (page):', err);
    } finally {
      setIsLoading(false);
    }
  };

  // helper: build params cho meta, có thể loại bỏ vài khóa filter nhất định
const buildParams = (excludeKeys = []) => {
  const p = { ...filters };
  excludeKeys.forEach(k => delete p[k]);
  return { ...p, page: 1, pageSize: PAGE_SIZE_ALL };
};

const fetchMeta = async () => {
  setIsMetaLoading(true);
  try {
    const url = `${BASE_URL_SERVER_THLA}/api/ink-weighing/history`;

    // 1) Tổng & thống kê toàn bộ: dùng đầy đủ filter
    // 2) Danh sách bộ phận: bỏ filter 'department', giữ các filter còn lại (ngày/ca/nghiệp vụ/chuyền)
    // 3) Danh sách chuyền: bỏ filter 'unit', giữ các filter còn lại (ngày/ca/nghiệp vụ/bộ phận)
    const [totalsRes, depRes, unitRes] = await Promise.all([
      axios.get(url, { params: buildParams([]) }),
      axios.get(url, { params: buildParams(['department']) }),
      axios.get(url, { params: buildParams(['unit']) }),
    ]);

    // ===== Tổng toàn bộ (KHÔNG theo trang) =====
    const allSessions = totalsRes.data?.items || [];
    setTotalSessions(allSessions.length);

    let sum = 0;
    for (const s of allSessions) {
      if (Array.isArray(s.items)) {
        for (const it of s.items) sum += Number(it?.weight || 0);
      }
    }
    setTotalWeight(sum);

    // ===== Options Bộ phận (bỏ chính filter department) =====
    const depItems = depRes.data?.items || [];
    const depOptions = [...new Set(depItems.map(s => s.department).filter(Boolean))];
    setDepartments(depOptions);

    // ===== Options Chuyền (bỏ chính filter unit, nhưng vẫn tôn trọng bộ phận đã chọn) =====
    const unitItems = unitRes.data?.items || [];
    const unitOptions = [...new Set(unitItems.map(s => s.unit).filter(Boolean))];
    setUnits(unitOptions);

  } catch (err) {
    console.error('Lỗi khi lấy meta (tổng & dropdown):', err);
    // fallback gần đúng: dùng dữ liệu trang hiện tại
    setTotalSessions(data.length);
    let sum = 0;
    data.forEach(s => s.items?.forEach(i => (sum += Number(i.weight || 0))));
    setTotalWeight(sum);
    // không thay đổi departments/units để tránh “co” danh sách
  } finally {
    setIsMetaLoading(false);
  }
};


  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN');
  };

  // Trả về HH:mm, KHÔNG bị +7 khi đầu vào là UTC (có 'Z' hoặc '+07:00'...)
const formatTime = (value) => {
  if (!value) return '';
  const s = String(value);
  const d = new Date(s);
  const isUTCStamp = /Z$|[+-]\d{2}:\d{2}$/.test(s); // có 'Z' hoặc offset => coi là UTC

  const hh = String(isUTCStamp ? d.getUTCHours()   : d.getHours()).padStart(2, '0');
  const mm = String(isUTCStamp ? d.getUTCMinutes() : d.getMinutes()).padStart(2, '0');

  return `${hh}:${mm}`;
};


  const formatWeight = (num) =>
    Number(num ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // =================== EXPORT EXCEL (giữ nguyên logic, dùng data của TRANG hiện tại cho bảng; nếu muốn all -> thay data bằng allSessions trong fetchMeta) ===================
  const exportToExcel = () => {
    const excelData = [[
      'STT', 'Mã cân', 'Nghiệp vụ', 'Mã HSKT', 'Tổ in', 'Chuyền',
      'Số CT', 'Thời gian', 'Mã mực', 'Tên mực', 'Khối lượng (g)', 'NSX', 'Người nhận',
    ]];

    data.forEach((session, sIdx) => {
      if (Array.isArray(session.items) && session.items.length > 0) {
        session.items.forEach((item, iIdx) => {
          excelData.push([
            iIdx === 0 ? sIdx + 1 : '',
            iIdx === 0 ? session.scaleCode : '',
            iIdx === 0
              ? (session.operationCode === 'CP' ? 'Cấp phát'
                : session.operationCode === 'TH' ? 'Thu hồi'
                : session.operationCode === 'CM' ? 'Cấp mực'
                : session.operationCode === 'TV' ? 'Trả về'
                : session.operationCode === 'GC' ? 'Giao ca'
                : session.operationCode === 'CX' ? 'Chuyển xe'
                : session.operationCode)
              : '',
            iIdx === 0 ? (session.hsktId || '') : '',
            iIdx === 0 ? (session.department?.replace(/^T/, 'Tổ ') || '') : '',
            iIdx === 0 ? (session.unit || '') : '',
            iIdx === 0 ? (session.workShift || '') : '',
            iIdx === 0
              ? `${formatTime(session.startTime)} ${formatDate(session.weighStartDate)} - ${formatTime(session.endTime)} ${formatDate(session.weighEndDate)}`
              : '',
            item.inkCode,
            item.inkName,
            Number(item.weight || 0),
            formatDate(item.productionDate),
            iIdx === 0 ? (session.receivedBy || '') : '',
          ]);
        });
      } else {
        excelData.push([
          sIdx + 1,
          session.scaleCode,
          (session.operationCode === 'CP' ? 'Cấp phát'
            : session.operationCode === 'TH' ? 'Thu hồi'
            : session.operationCode === 'CM' ? 'Cấp mực'
            : session.operationCode === 'TV' ? 'Trả về'
            : session.operationCode === 'GC' ? 'Giao ca'
            : session.operationCode === 'CX' ? 'Chuyển xe'
            : session.operationCode),
          session.hsktId || '',
          session.department?.replace(/^T/, 'Tổ ') || '',
          session.unit || '',
          session.workShift || '',
          `${formatTime(session.startTime)} ${formatDate(session.weighStartDate)} - ${formatTime(session.endTime)} ${formatDate(session.weighEndDate)}`,
          '(Không có mục mực nào)', '', '', '', session.receivedBy || '',
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // merge theo nhóm
    let currentRow = 1;
    data.forEach(session => {
      const rowCount = (Array.isArray(session.items) && session.items.length > 0) ? session.items.length : 1;
      if (rowCount > 1) {
        for (let c = 0; c <= 7; c++) {
          ws['!merges'] = ws['!merges'] || [];
          ws['!merges'].push({ s: { r: currentRow, c }, e: { r: currentRow + rowCount - 1, c } });
        }
        ws['!merges'].push({ s: { r: currentRow, c: 12 }, e: { r: currentRow + rowCount - 1, c: 12 } });
      }
      currentRow += rowCount;
    });

    const border = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } },
    };
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '003366' } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border,
    };

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let c = 0; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cell]) ws[cell].s = headerStyle;
    }

    // zebra theo nhóm
    let groupIndex = 0;
    let rowPtr = 1;
    data.forEach(session => {
      const rows = (session.items && session.items.length) ? session.items.length : 1;
      const fill = { fgColor: { rgb: groupIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } };
      for (let r = rowPtr; r < rowPtr + rows; r++) {
        for (let c = 0; c <= range.e.c; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          if (!ws[addr]) continue;
          const isNumber = c === 10; // cột Khối lượng
          ws[addr].s = {
            ...(ws[addr].s || {}),
            fill,
            border,
            alignment: { horizontal: isNumber ? 'right' : 'center', vertical: 'center', wrapText: true },
            numFmt: isNumber ? '#,##0.0' : undefined,
          };
        }
      }
      rowPtr += rows;
      groupIndex++;
    });

    ws['!cols'] = [
      { wch: 6 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 10 },
      { wch: 10 }, { wch: 10 }, { wch: 28 }, { wch: 14 }, { wch: 22 },
      { wch: 16 }, { wch: 12 }, { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lịch sử cân mực');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `lich_su_can_muc_${filters.date}.xlsx`);
  };

  
  function round1(num) {
  return Math.round((num / 1000) * 10) / 10;
}

  // =================== UI ===================
  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1300px] space-y-5">
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">📜 Lịch sử cân mực</h1>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <FiDownload className="text-base" />
                Xuất Excel
              </button>
            </div>

            {/* Stats mini */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-200/70 p-3">
                <div className="text-[11px] uppercase text-slate-500">Tổng lượt cân (tất cả)</div>
                <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  {isMetaLoading && <FiLoader className="animate-spin text-indigo-600" />} {totalSessions}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/70 p-3">
                <div className="text-[11px] uppercase text-slate-500">Tổng khối lượng (tất cả)</div>
                <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  {isMetaLoading && <FiLoader className="animate-spin text-indigo-600" />} {round1(totalWeight).toFixed(2)} kg
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Ngày</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Nghiệp vụ</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.operation}
                  onChange={(e) => handleFilterChange('operation', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="CP">Cấp phát</option>
                  <option value="TH">Thu hồi</option>
                  <option value="CM">Cấp mực</option>
                  <option value="TV">Trả về</option>
                  <option value="GC">Giao ca</option>
                  <option value="CX">Chuyển xe</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Bộ phận</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {departments.map((d, idx) => (
                    <option key={idx} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Chuyền</label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={filters.unit}
                  onChange={(e) => handleFilterChange('unit', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {units.map((u, idx) => (
                    <option key={idx} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-0 sm:p-5">
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      {['STT','Mã cân','Nghiệp vụ','Mã HSKT','Tổ in','Chuyền','Số CT','Thời gian','Mã mực','Tên mực','Khối lượng (kg)','NSX','Người nhận'].map((h, i) => (
                        <th key={i} className="border-b border-slate-200 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="px-3 py-10 text-center text-slate-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      data.map((session, sIdx) =>
                        Array.isArray(session.items) && session.items.length > 0 ? (
                          session.items.map((item, iIdx) => (
                            <tr
  key={`row-${sIdx}-${iIdx}`}
  className={`transition-colors ${
    sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-100'
  } hover:bg-slate-200 border-b border-slate-300`}
>
  {iIdx === 0 && (
    <>
      <td className="px-3 py-2 align-middle font-semibold" rowSpan={session.items.length}>
        {sIdx + 1}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {session?.scaleCode}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {session.operationCode === 'CP' ? 'Cấp phát'
          : session.operationCode === 'TH' ? 'Thu hồi'
          : session.operationCode === 'CM' ? 'Cấp mực'
          : session.operationCode === 'TV' ? 'Trả về'
          : session.operationCode === 'GC' ? 'Giao ca'
          : session.operationCode === 'CX' ? 'Chuyển xe'
          : session.operationCode}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {session?.hsktId}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {session.department?.replace(/^T/, 'Tổ ')}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {session.unit}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {session.workShift}
      </td>
      <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
        {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
        <span className="px-2">—</span>
        {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
      </td>
    </>
  )}
  <td className="px-3 py-2 align-middle">{item.inkCode}</td>
  <td className="px-3 py-2 align-middle">{item.inkName}</td>
  <td className="px-3 py-2 text-right font-medium align-middle">
    {round1(item.weight).toFixed(2)}
  </td>
  <td className="px-3 py-2 align-middle">{formatDate(item.productionDate)}</td>
  {iIdx === 0 && (
    <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
      {session.receivedBy}
    </td>
  )}
</tr>

                          ))
                        ) : (
                          <tr key={`row-${sIdx}-0`} className={`transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100`}>
                            <td className="px-3 py-2">{sIdx + 1}</td>
                            <td className="px-3 py-2">{session?.scaleCode}</td>
                            <td className="px-3 py-2">
                              {session.operationCode === 'CP' ? 'Cấp phát'
                                : session.operationCode === 'TH' ? 'Thu hồi'
                                : session.operationCode === 'CM' ? 'Cấp mực'
                                : session.operationCode === 'TV' ? 'Trả về'
                                : session.operationCode === 'GC' ? 'Giao ca'
                                : session.operationCode === 'CX' ? 'Chuyển xe'
                                : session.operationCode}
                            </td>
                            <td className="px-3 py-2">{session?.hsktId}</td>
                            <td className="px-3 py-2">{session.department?.replace(/^T/, 'Tổ ')}</td>
                            <td className="px-3 py-2">{session.unit}</td>
                            <td className="px-3 py-2">{session.workShift}</td>
                            <td className="px-3 py-2">
                              {formatTime(session.startTime)} {formatDate(session.weighStartDate)}
                              <span className="px-2">—</span>
                              {formatTime(session.endTime)} {formatDate(session.weighEndDate)}
                            </td>
                            <td className="px-3 py-2 italic text-slate-400" colSpan={5}>(Không có mục mực nào)</td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
              >
                <FiChevronLeft /> Trước
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm ${
                    currentPage === p
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
              >
                Sau <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryWeigh;
