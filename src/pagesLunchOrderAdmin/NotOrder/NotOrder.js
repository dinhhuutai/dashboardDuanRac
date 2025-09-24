// src/pages/Datcom/NotOrderedPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiDownload, FiCalendar, FiUsers, FiFilter } from 'react-icons/fi';
import { LuUtensilsCrossed } from 'react-icons/lu';
import ExcelJS from 'exceljs';
import http from '~/api/http';
import { BASE_URL } from '~/config';

const cn = (...xs) => xs.filter(Boolean).join(' ');

// ===== Helpers =====
function formatDateInput(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 Sun..6 Sat
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function relativeTime(ts) {
  if (!ts) return '—';
  const now = Date.now();
  const d = new Date(ts).getTime();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(ts).toLocaleString();
}

// ===== Small UI atoms =====
const Card = ({ children, className }) => (
  <div className={cn('rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm', className)}>{children}</div>
);

const HeaderCard = ({ title, subtitle, onExport }) => (
  <div className="rounded-2xl bg-sky-50 ring-1 ring-sky-100 p-4 md:p-5 flex items-center justify-between">
    <div className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
        <FiUsers />
      </div>
      <div className="min-w-0">
        <div className="text-base md:text-lg font-semibold text-slate-800">{title}</div>
        {subtitle && <div className="text-sm text-slate-500">{subtitle}</div>}
      </div>
    </div>
    <button
      onClick={onExport}
      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700"
    >
      <FiDownload /> Xuất Excel
    </button>
  </div>
);

const FilterCard = ({ children }) => (
  <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 md:p-5">{children}</div>
);

const Chip = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-50 ring-1 ring-slate-200 text-slate-700">
    {icon}
    <span className="font-medium">{children}</span>
  </span>
);

const Badge = ({ children, tone = 'slate' }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1',
      `bg-${tone}-50 text-${tone}-700 ring-${tone}-200`
    )}
  >
    {children}
  </span>
);

function SkeletonRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3 border-b border-slate-100">
          <div className="h-3 w-full max-w-[200px] animate-pulse rounded bg-slate-200/70" />
        </td>
      ))}
    </tr>
  );
}

// ===== Page =====
export default function NotOrderedPage() {
  const [date, setDate] = useState(formatDateInput());
  const [weekStart, setWeekStart] = useState(getMonday(formatDateInput()));
  const [mode, setMode] = useState('any'); // 'any' | 'incomplete'
  const [departmentId, setDepartmentId] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState({
    items: [],
    summaryByDepartment: [],
    totalEligible: 0,
    totalUnordered: 0,
    weekAvailableDays: 0,
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    setWeekStart(getMonday(date));
  }, [date]);

  useEffect(() => {
    (async () => {
      try {
        const rs = await http.get(`${BASE_URL}/api/lunch-order/departments`);
        setDepartments([{ departmentId: '', departmentName: '-- Tất cả --' }, ...(rs.data || [])]);
      } catch {
        setDepartments([{ departmentId: '', departmentName: '-- Tất cả --' }]);
      }
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/lunch-order/unordered-week`, {
        params: {
          week: weekStart,
          departmentId: departmentId || undefined,
          q: q?.trim() || undefined,
          mode,
        },
      });
      setData(
        res.data || {
          items: [],
          summaryByDepartment: [],
          totalEligible: 0,
          totalUnordered: 0,
          weekAvailableDays: 0,
        }
      );
    } catch (e) {
      console.error(e);
      setData({
        items: [],
        summaryByDepartment: [],
        totalEligible: 0,
        totalUnordered: 0,
        weekAvailableDays: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // gọi fetchData mỗi khi filter thay đổi
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, departmentId, mode, q]);

  const filtered = useMemo(() => data?.items || [], [data]);

  const totalText = useMemo(() => {
    const total = data?.totalEligible || 0;
    const missing = data?.totalUnordered || 0;
    return `${missing}/${total} chưa đặt (${mode === 'incomplete' ? 'chưa đủ ngày' : 'chưa đặt gì'})`;
  }, [data, mode]);

  const weekRangeText = useMemo(() => {
    const d0 = new Date(weekStart + 'T00:00:00');
    const d1 = new Date(d0);
    d1.setDate(d0.getDate() + 6);
    const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${fmt(d0)} đến ${fmt(d1)}`;
  }, [weekStart]);

  // ===== Export Excel =====
  const onExportExcel = async () => {
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('ChuaDatComTuan');
      const baseHeaders = ['STT', 'Họ tên', 'Tài khoản', 'SĐT', 'Phòng ban', 'Lần cuối online'];
      const headers = mode === 'incomplete' ? [...baseHeaders, 'Đã đặt (ngày)', 'Ngày có món'] : baseHeaders;
      ws.getRow(1).values = headers;
      ws.getRow(2).values = [`Tuần: ${weekRangeText}`];
      ws.mergeCells(2, 1, 2, headers.length);
      ws.getRow(1).eachCell((c) => {
        c.font = { bold: true };
        c.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      (filtered || []).forEach((it, idx) => {
        const rowIdx = idx + 3;
        const rowVals = [
          idx + 1,
          it.fullName || '',
          it.username || '',
          it.phone || '',
          it.departmentName || '',
          it.lastLogin ? new Date(it.lastLogin) : '',
        ];
        if (mode === 'incomplete') {
          rowVals.push(it.selectedDays || 0);
          rowVals.push(data.weekAvailableDays || 0);
        }
        ws.getRow(rowIdx).values = rowVals;
      });
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ChuaDatCom_Tuan_${weekStart}_${mode}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export Excel error', e);
    }
  };

  // ... sau weekRangeText useMemo
const colsCount = useMemo(() => (mode === 'incomplete' ? 8 : 6), [mode]);

  return (
    <div className="mx-auto w-full bg-[#fff] p-4 lg:p-6 space-y-4">
      <HeaderCard
        title="Báo cáo chưa đặt cơm theo tuần"
        subtitle="Lọc theo tuần & bộ phận • Xuất Excel"
        onExport={onExportExcel}
      />

      <FilterCard>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <FiCalendar /> Chọn tuần
              </div>
              <input
                type="date"
                className="h-12 px-3 rounded-xl bg-[#f7faff] border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <div className="text-sm text-slate-600">Bộ phận</div>
              <select
                className="h-12 w-full px-3 rounded-xl bg-[#f7faff] border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d.departmentId ?? 'all'} value={d.departmentId}>
                    {d.departmentName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <FiSearch /> Tìm nhanh
              </div>
              <input
                className="h-12 px-3 rounded-xl bg-[#f7faff] border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
                placeholder="Tên / tài khoản / SĐT"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Chip icon={<FiUsers />}>{filtered.length} người</Chip>
            <Chip icon={<LuUtensilsCrossed />}>{data.weekAvailableDays || 0} ngày có món</Chip>
          </div>
        </div>
      </FilterCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence>
          {(data.summaryByDepartment || []).map((s, idx) => (
            <motion.div
              key={s.departmentName + idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <div className="rounded-2xl bg-sky-50 ring-1 ring-sky-100 px-4 py-3 flex items-center justify-between">
                <div className="text-slate-700 truncate pr-3">{s.departmentName}</div>
                <Badge tone="rose">{s.count}</Badge>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Card>
        <div className="overflow-auto rounded-2xl">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-50">
              <tr className="text-slate-700">
                {['#', 'Họ tên', 'Tài khoản', 'SĐT', 'Phòng ban', 'Lần cuối online']
                  .concat(mode === 'incomplete' ? ['Đã đặt', 'Ngày có món'] : [])
                  .map((h, i) => (
                    <th key={i} className="px-3 py-3 text-left border-b border-slate-200 font-semibold">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colsCount} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={colsCount} className="px-3 py-8 text-center text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filtered.map((it, idx) => {
                  const days = it.selectedDays || 0;
                  const tone = days === 0 ? 'rose' : 'slate';
                  return (
                    <tr key={it.userID ?? `${it.username}-${idx}`} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                      <td className="px-3 py-2 border-b border-slate-100">{idx + 1}</td>
                      <td className="px-3 py-2 border-b border-slate-100 font-medium text-slate-800">{it.fullName}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-700">{it.username}</td>
                      <td className="px-3 py-2 border-b border-slate-100 text-slate-700">{it.phone}</td>
                      <td className="px-3 py-2 border-b border-slate-100">
                        {it.departmentName ? (
                          <Badge tone="slate">{it.departmentName}</Badge>
                        ) : (
                          <i className="text-slate-400">Chưa gán</i>
                        )}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100">
                        <div className="text-slate-700">{relativeTime(it.lastLogin)}</div>
                        <div className="text-xs text-slate-400">
                          {it.lastLogin ? new Date(it.lastLogin).toLocaleString() : ''}
                        </div>
                      </td>
                      {mode === 'incomplete' && (
                        <>
                          <td
                            className={cn(
                              'px-3 py-2 border-b border-slate-100 font-semibold',
                              tone === 'rose' ? 'text-rose-600' : 'text-slate-700'
                            )}
                          >
                            {days}
                          </td>
                          <td className="px-3 py-2 border-b border-slate-100">{data.weekAvailableDays || 0}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-amber-50">
                <td className="px-3 py-3 font-semibold text-slate-800 border-t border-amber-100" colSpan={2}>
                  Tổng
                </td>
                <td
                  className="px-3 py-3 text-slate-700 border-t border-amber-100"
                  colSpan={mode === 'incomplete' ? 6 : 4}
                >
                  {totalText}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}
