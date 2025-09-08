import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BASE_URL_SERVER_THLA } from '../../../config';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import {
  FiDownload,
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiSave,
  FiX,
  FiCheck
} from 'react-icons/fi';

const PAGE_SIZE = 10;
const PAGE_SIZE_ALL = 100000;

function HistoryWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];

  const [allData, setAllData] = useState([]);
  const [filters, setFilters] = useState({
    date: todayStr || '',
    shift: '',
    department: '',
    unit: '',
    operation: '',
  });

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  // === Loading/Editing states ===
  const [editMap, setEditMap] = useState({});        // { [itemId]: true/false }
  const [formMap, setFormMap] = useState({});        // { [itemId]: { inkCode, inkName, weight2 } }
  const [savingMap, setSavingMap] = useState({});     // { [itemId]: true/false }
  const [exporting, setExporting] = useState(false);  // export Excel
  const isAnySaving = useMemo(() => Object.values(savingMap).some(Boolean), [savingMap]);

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

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

  const buildParams = (excludeKeys = []) => {
    const p = { ...filters };
    excludeKeys.forEach(k => delete p[k]);
    return { ...p, page: 1, pageSize: PAGE_SIZE_ALL };
  };

  const fetchMeta = async () => {
    setIsMetaLoading(true);
    try {
      const url = `${BASE_URL_SERVER_THLA}/api/ink-weighing/history`;
      const [totalsRes, depRes, unitRes] = await Promise.all([
        axios.get(url, { params: buildParams([]) }),
        axios.get(url, { params: buildParams(['department']) }),
        axios.get(url, { params: buildParams(['unit']) }),
      ]);

      const allSessions = totalsRes.data?.items || [];
      setAllData(allSessions);
      setTotalSessions(allSessions.length);

      let sum = 0;
      for (const s of allSessions) {
        if (Array.isArray(s.items)) {
          for (const it of s.items) sum += Number(it?.weight || 0);
        }
      }
      setTotalWeight(sum);

      const depItems = depRes.data?.items || [];
      const depOptions = [...new Set(depItems.map(s => s.department).filter(Boolean))];
      setDepartments(depOptions);

      const unitItems = unitRes.data?.items || [];
      const unitOptions = [...new Set(unitItems.map(s => s.unit).filter(Boolean))];
      setUnits(unitOptions);
    } catch (err) {
      console.error('Lỗi khi lấy meta (tổng & dropdown):', err);
      setTotalSessions(data.length);
      let sum = 0;
      data.forEach(s => s.items?.forEach(i => (sum += Number(i.weight || 0))));
      setTotalWeight(sum);
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

  const formatTime = (value) => {
    if (!value) return '';
    const s = String(value);
    const d = new Date(s);
    const isUTCStamp = /Z$|[+-]\d{2}:\d{2}$/.test(s);
    const hh = String(isUTCStamp ? d.getUTCHours() : d.getHours()).padStart(2, '0');
    const mm = String(isUTCStamp ? d.getUTCMinutes() : d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const source = (allData && allData.length) ? allData : data;
      const excelData = [[
        'STT', 'Mã cân', 'Nghiệp vụ', 'Mã HSKT', 'Tổ in', 'Chuyền',
        'Số CT', 'Thời gian', 'Mã mực', 'Tên mực', 'Khối lượng (kg)', 'NSX', 'Người nhận',
      ]];

      const toKg1 = (g) => Math.round(((Number(g) || 0) / 1000) * 10) / 10;

      source.forEach((session, sIdx) => {
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
              toKg1(item.weight),
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

      let currentRow = 1;
      source.forEach(session => {
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

      let groupIndex = 0;
      let rowPtr = 1;
      source.forEach(session => {
        const rows = (session.items && session.items.length) ? session.items.length : 1;
        const fill = { fgColor: { rgb: groupIndex % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } };
        for (let r = rowPtr; r < rowPtr + rows; r++) {
          for (let c = 0; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            if (!ws[addr]) continue;
            const isKgCol = c === 10;
            ws[addr].s = {
              ...(ws[addr].s || {}),
              fill,
              border,
              alignment: { horizontal: isKgCol ? 'right' : 'center', vertical: 'center', wrapText: true },
              numFmt: isKgCol ? '#,##0.0' : undefined,
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
      saveAs(new Blob([buf], { type: 'application/octet-stream' }),
        `lich_su_can_muc_${filters.date}.xlsx`
      );
    } finally {
      setExporting(false);
    }
  };

  function round1(num) {
    return num / 1000;
  }

  // ==== Handlers sửa item ====
  const startEdit = (item) => {
    const id = item.weighingSessionItemId;
    const kgForForm = (item?.weight2 != null ? item.weight2 : item.weight) / 1000;
    setEditMap(m => ({ ...m, [id]: true }));
    setFormMap(f => ({
      ...f,
      [id]: {
        inkCode: item.inkCode || '',
        inkName: item.inkName || '',
        weight2: Number.isFinite(kgForForm) ? kgForForm : ''
      }
    }));
  };

  const cancelEdit = (id) => {
    setEditMap(m => ({ ...m, [id]: false }));
  };

  const changeForm = (id, field, value) => {
    setFormMap(f => ({
      ...f,
      [id]: { ...(f[id] || { inkCode: '', inkName: '', weight2: '' }), [field]: value }
    }));
  };

  const saveEdit = async (sessionId, item) => {
    const id = item.weighingSessionItemId;
    const draft = formMap[id] || {};

    // Người dùng nhập KG -> convert sang GRAM để lưu
    const weight2Kg = draft.weight2 === '' ? null : Number(draft.weight2);
    const weight2Gr = weight2Kg == null || Number.isNaN(weight2Kg)
      ? null
      : Math.max(0, Math.round(weight2Kg * 1000)); // không âm

    const payload = {
      inkCode: (draft.inkCode ?? item.inkCode) || '',
      inkName: (draft.inkName ?? item.inkName) || '',
      weight2: weight2Gr, // gửi gram lên server
    };

    try {
      setSavingMap(m => ({ ...m, [id]: true }));
      await axios.put(`${BASE_URL_SERVER_THLA}/api/ink-weighing/items/${id}`, payload);

      // Cập nhật ngay UI: weight hiển thị (g) = COALESCE(weight2, weight)
      const newDisplayWeight = (weight2Gr ?? item.weight); // gram

      setData(prev => prev.map(s =>
        s.weighingSessionId === sessionId
          ? {
              ...s,
              items: s.items.map(it =>
                it.weighingSessionItemId === id
                  ? {
                      ...it,
                      inkCode: payload.inkCode,
                      inkName: payload.inkName,
                      weight2: weight2Gr,
                      weight: newDisplayWeight,
                      updatedAt: new Date().toISOString(),
                    }
                  : it
              )
            }
          : s
      ));

      setAllData(prev => prev.map(s =>
        s.weighingSessionId === sessionId
          ? {
              ...s,
              items: s.items.map(it =>
                it.weighingSessionItemId === id
                  ? {
                      ...it,
                      inkCode: payload.inkCode,
                      inkName: payload.inkName,
                      weight2: weight2Gr,
                      weight: newDisplayWeight,
                      updatedAt: new Date().toISOString(),
                    }
                  : it
              )
            }
          : s
      ));

      setEditMap(m => ({ ...m, [id]: false }));

      // Refetch để đồng bộ hoàn toàn với backend
      await fetchPage();
      await fetchMeta();

    } catch (e) {
      console.error('Lỗi lưu item:', e);
      alert('Lưu thất bại');
    } finally {
      setSavingMap(m => ({ ...m, [id]: false }));
    }
  };

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
                disabled={exporting || isLoading}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2
                ${exporting || isLoading
                  ? 'bg-emerald-400 text-white opacity-70 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500/40'}`}
              >
                {exporting ? <FiLoader className="animate-spin" /> : <FiDownload className="text-base" />}
                {exporting ? 'Đang xuất...' : 'Xuất Excel'}
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
                  {isMetaLoading && <FiLoader className="animate-spin text-indigo-600" />} {(totalWeight / 1000).toFixed(2)} kg
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
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      {[
                        'STT','Mã cân','Nghiệp vụ','Mã HSKT','Tổ in','Chuyền','Số CT','Thời gian',
                        'Mã mực','Tên mực','Khối lượng (kg)','Khối lượng (g)',
                        'Thao tác','Đã sửa?','Người nhận'
                      ].map((h, i) => (
                        <th key={i} className="border-b border-slate-200 px-3 py-2 text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td colSpan={17} className="px-3 py-10 text-center text-slate-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      data.map((session, sIdx) =>
                        Array.isArray(session.items) && session.items.length > 0 ? (
                          session.items.map((item, iIdx) => {
                            const id = item.weighingSessionItemId;
                            const isEditing = !!editMap[id];
                            const form = formMap[id] || {};
                            return (
                              <tr
                                key={`row-${sIdx}-${iIdx}`}
                                className={`transition-colors ${sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-100'} hover:bg-slate-200 border-b border-slate-300`}
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

                                {/* Mã mực (editable) */}
                                <td className="px-3 py-2 align-middle">
                                  {isEditing ? (
                                    <input
                                      value={form.inkCode ?? ''}
                                      onChange={(e)=>changeForm(id,'inkCode',e.target.value)}
                                      disabled={!!savingMap[id]}
                                      className={`w-36 rounded border px-2 py-1 text-sm ${savingMap[id] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                      placeholder="Mã mực"
                                    />
                                  ) : (
                                    item.inkCode
                                  )}
                                </td>

                                {/* Tên mực (editable) */}
                                <td className="px-3 py-2 align-middle">
                                  {isEditing ? (
                                    <input
                                      value={form.inkName ?? ''}
                                      onChange={(e)=>changeForm(id,'inkName',e.target.value)}
                                      disabled={!!savingMap[id]}
                                      className={`w-44 rounded border px-2 py-1 text-sm ${savingMap[id] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                      placeholder="Tên mực"
                                    />
                                  ) : (
                                    item.inkName
                                  )}
                                </td>

                                {/* Khối lượng (kg) (editable) */}
                                <td className="px-3 py-2 text-right font-medium align-middle">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="0.001"
                                      inputMode="decimal"
                                      value={form.weight2 ?? ''}
                                      onChange={(e)=>changeForm(id,'weight2',e.target.value)}
                                      disabled={!!savingMap[id]}
                                      className={`w-28 rounded border px-2 py-1 text-sm text-right ${savingMap[id] ? 'bg-slate-100 text-slate-400' : 'border-slate-300'}`}
                                      placeholder={`${(item.weight/1000).toFixed(2)} kg`}
                                    />
                                  ) : (
                                    <span className="tabular-nums">
                                      {(item.weight/1000).toFixed(2)}
                                    </span>
                                  )}
                                </td>

                                {/* Khối lượng (g) */}
                                <td className="px-3 py-2 text-right font-medium align-middle">
                                  {item.weight}
                                </td>

                                {/* Thao tác */}
                                <td className="px-3 py-2 align-middle">
                                  {isEditing ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={()=>saveEdit(session.weighingSessionId, item)}
                                        disabled={!!savingMap[id]}
                                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs
                                          ${savingMap[id] ? 'bg-emerald-400 text-white opacity-70 cursor-not-allowed' : 'bg-emerald-600 text-white'}`}
                                      >
                                        {savingMap[id] ? <FiLoader className="animate-spin" /> : <FiSave />}
                                        {savingMap[id] ? 'Đang lưu...' : 'Lưu'}
                                      </button>
                                      <button
                                        onClick={()=>cancelEdit(id)}
                                        disabled={!!savingMap[id]}
                                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs
                                          ${savingMap[id] ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-700'}`}
                                      >
                                        <FiX /> Huỷ
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={()=>startEdit(item)}
                                      disabled={isAnySaving}
                                      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs
                                        ${isAnySaving ? 'border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                                      title="Sửa mã, tên & khối lượng (kg)"
                                    >
                                      <FiEdit2 /> Sửa
                                    </button>
                                  )}
                                </td>

                                {/* Đã sửa? */}
                                <td className="px-3 py-2 align-middle text-center">
                                  {item.weight2 == null
                                    ? <FiX className="text-red-500 inline" title="Chưa chỉnh sửa" />
                                    : <FiCheck className="text-emerald-600 inline" title="Đã chỉnh sửa" />
                                  }
                                </td>

                                {/* Người nhận (rowSpan theo session) */}
                                {iIdx === 0 && (
                                  <td className="px-3 py-2 align-middle" rowSpan={session.items.length}>
                                    {session.receivedBy}
                                  </td>
                                )}
                              </tr>
                            );
                          })
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
                            {/* Không có item => gộp 8 cột item-level */}
                            <td className="px-3 py-2 italic text-slate-400" colSpan={8}>(Không có mục mực nào)</td>
                            <td className="px-3 py-2">{session.receivedBy}</td>
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

      {/* Toast trạng thái chung khi đang lưu */}
      {isAnySaving && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white/90 shadow-lg ring-1 ring-slate-200 px-3 py-2 flex items-center gap-2">
          <FiLoader className="animate-spin text-indigo-600" />
          <span className="text-sm text-slate-700">Đang lưu thay đổi…</span>
        </div>
      )}
    </div>
  );
}

export default HistoryWeigh;
