import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BASE_URL_SERVER_THLA } from '~/config';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { FiDownload, FiLoader } from 'react-icons/fi';
import http from '~/api/http';

function CompareWeigh() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDiff, setFilterDiff] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL_SERVER_THLA}/api/compare-weighing`, {
        fromDate,
        toDate,
      });
      setData(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi gọi API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  // Gộp & xử lý dữ liệu
  const mergedData = () => {
    const result = {};
    data.forEach((row) => {
      const key = `${row.lenhsx || row.id}__${row.inkcode || row.nguyenlieu}`;
      if (!result[key]) {
        result[key] = {
          lenhsx: row.lenhsx || row.id,
          inkcode: row.inkcode || row.nguyenlieu,
          thucte: 0,
          kehoach: 0,
        };
      }
      if (row.muc === 1) {
        result[key].kehoach = row[''] || 0;
      } else if (row.muc === 2) {
        result[key].thucte = row[''] || 0;
      }
    });
    return Object.values(result);
  };

  // Áp dụng lọc nếu bật checkbox
  const displayedData = () => {
    const raw = mergedData();
    return filterDiff ? raw.filter((i) => Math.abs(i.thucte - i.kehoach) > 30) : raw;
  };

  const exportExcel = () => {
    const title = `📊 So sánh Yêu cầu vs Thực tế xuất kho từ ${fromDate} đến ${toDate}`;
    const wsData = [];

    // Tiêu đề
    wsData.push([title]);
    wsData.push([]);
    wsData.push(['Lệnh SX', 'Mã mực', 'Yêu cầu (g)', 'Thực tế (g)', 'Chênh lệch (g)']);

    // Merge tiêu đề
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
    let currentRow = 3;

    // Group theo lệnh để zebra theo nhóm
    const grouped = {};
    displayedData().forEach((item) => {
      if (!grouped[item.lenhsx]) grouped[item.lenhsx] = [];
      grouped[item.lenhsx].push(item);
    });

    Object.entries(grouped).forEach(([lenhsx, rows]) => {
      rows.forEach((r) => {
        wsData.push([
          lenhsx,
          r.inkcode,
          r.kehoach,
          r.thucte,
          r.thucte - r.kehoach,
        ]);
        currentRow++;
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
    ];

    // Style
    const range = XLSX.utils.decode_range(ws['!ref']);
    let currentGroupColor = false;
    let lastLenh = '';

    for (let R = 0; R <= range.e.r; ++R) {
      const firstVal = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v;

      // đổi màu xen kẽ mỗi nhóm
      if (firstVal && R > 2 && firstVal !== lastLenh) {
        currentGroupColor = !currentGroupColor;
        lastLenh = firstVal;
      }

      for (let C = 0; C <= range.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cell]) continue;

        if (R === 0) {
          ws[cell].s = {
            font: { bold: true, sz: 16 },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        } else if (R === 2) {
          ws[cell].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '003366' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' },
            },
          };
        } else {
          const isNumberCol = C >= 2;
          ws[cell].s = {
            fill: currentGroupColor ? { fgColor: { rgb: 'F8FAFC' } } : undefined,
            alignment: { horizontal: isNumberCol ? 'right' : 'center', vertical: 'center' },
            border: {
              top: { style: 'thin' }, bottom: { style: 'thin' },
              left: { style: 'thin' }, right: { style: 'thin' },
            },
            numFmt: isNumberCol ? '#,##0' : undefined,
          };
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'So sánh');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }),
      `So_sanh_can_muc_${fromDate}_den_${toDate}.xlsx`
    );
  };

  // tick formatter (hiển thị đẹp trên trục Y)
  const tickNumber = (v) =>
    Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 0 });

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1300px] space-y-5">
        {/* Card chính */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                📊 So sánh Yêu cầu vs Thực tế xuất kho
              </h1>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <FiDownload className="text-base" />
                Xuất Excel
              </button>
            </div>

            {/* Bộ lọc */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    id="filterDiff"
                    type="checkbox"
                    className="h-4 w-4 rounded accent-indigo-600"
                    checked={filterDiff}
                    onChange={(e) => setFilterDiff(e.target.checked)}
                  />
                  <span>Chỉ hiện mực chênh lệch &gt; 30g</span>
                </label>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="p-0 sm:p-5">
            <div className="relative h-[420px] w-full rounded-xl border border-slate-200 overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedData()}
                  margin={{ top: 20, right: 24, left: 12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="inkcode" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={tickNumber} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => Number(v).toLocaleString('vi-VN')} />
                  <Legend />
                  <Bar dataKey="kehoach" name="Kế hoạch (g)" fill="#6366F1" />
                  <Bar dataKey="thucte" name="Thực tế (g)" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bảng */}
          <div className="p-0 sm:p-5 pt-0">
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {isLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 shadow">
                    <FiLoader className="animate-spin text-indigo-600 text-xl" />
                    <span className="text-sm text-slate-700">Đang tải dữ liệu...</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                      {['Lệnh SX','Mã mực','Yêu cầu (g)','Thực tế (g)','Chênh lệch (g)'].map((h) => (
                        <th key={h} className="border-b border-slate-200 px-3 py-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedData().map((row, idx) => {
                      const diff = row.thucte - row.kehoach;
                      const strongDiff = Math.abs(diff) > 30;
                      return (
                        <tr
                          key={`${row.lenhsx}-${row.inkcode}-${idx}`}
                          className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100`}
                        >
                          <td className="px-3 py-2">{row.lenhsx}</td>
                          <td className="px-3 py-2">{row.inkcode}</td>
                          <td className="px-3 py-2">
                            {row.kehoach?.toLocaleString('vi-VN')}
                          </td>
                          <td className="px-3 py-2">
                            {row.thucte?.toLocaleString('vi-VN')}
                          </td>
                          <td className={`px-3 py-2 font-medium ${strongDiff ? 'text-rose-600' : 'text-slate-800'}`}>
                            {diff.toLocaleString('vi-VN')}
                            {strongDiff && (
                              <span className="ml-2 inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                &gt; 30g
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {displayedData().length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-10 text-center text-slate-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          {/* end card */}
        </div>
      </div>
    </div>
  );
}

export default CompareWeigh;
