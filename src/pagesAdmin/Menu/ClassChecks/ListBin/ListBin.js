import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';

function ListBin() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableType, setTableType] = useState('current'); // 'current' | 'standard'

  useEffect(() => {
    const endpoint = tableType === 'current' ? '/api/bin-standard' : '/api/bin-summary';
    setLoading(true);
    axios
      .get(`${BASE_URL}${endpoint}`)
      .then((res) => setData(res.data || []))
      .catch((err) => alert('Lỗi khi tải dữ liệu: ' + err.message))
      .finally(() => setLoading(false));
  }, [tableType]);

  const renderSkeletonRows = (rows = 6, cols = 9) =>
    Array.from({ length: rows }).map((_, r) => (
      <tr key={`sk-${r}`} className="bg-white">
        {Array.from({ length: cols }).map((__, c) => (
          <td key={`skc-${r}-${c}`} className="px-4 py-3 border border-slate-200">
            <div className="h-4 w-full max-w-[140px] rounded animate-pulse bg-slate-200" />
          </td>
        ))}
      </tr>
    ));

  return (
    <div className="p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg sm:text-xl font-semibold tracking-[-0.01em] text-slate-800">
              {tableType === 'current'
                ? 'Danh sách thùng rác bố trí hiện có'
                : 'Bảng số lượng thùng rác theo quy định'}
            </h1>

            {/* Segmented control (radio) */}
            <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
              <label className="cursor-pointer select-none">
                <input
                  type="radio"
                  name="tableType"
                  value="current"
                  checked={tableType === 'current'}
                  onChange={() => setTableType('current')}
                  className="sr-only peer"
                />
                <span
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg text-slate-600
                             peer-checked:bg-white peer-checked:shadow-sm peer-checked:text-slate-900
                             peer-checked:ring-1 peer-checked:ring-slate-200 transition"
                >
                  Bảng hiện có
                </span>
              </label>

              <label className="cursor-pointer select-none">
                <input
                  type="radio"
                  name="tableType"
                  value="standard"
                  checked={tableType === 'standard'}
                  onChange={() => setTableType('standard')}
                  className="sr-only peer"
                />
                <span
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm rounded-lg text-slate-600
                             peer-checked:bg-white peer-checked:shadow-sm peer-checked:text-slate-900
                             peer-checked:ring-1 peer-checked:ring-slate-200 transition"
                >
                  Bảng quy định
                </span>
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 overflow-auto rounded-xl ring-1 ring-slate-200">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                <tr className="text-slate-700">
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap first:rounded-tl-xl">
                    Bộ phận
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Đơn vị
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Giẻ lau dính mực thường
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Giẻ lau dính mực lapa
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Vụn logo
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Băng keo dính hóa chất
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Mực in thường thải
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap">
                    Mực in lapa thải
                  </th>
                  <th className="px-4 py-3 border border-slate-200 font-semibold text-xs sm:text-[13px] whitespace-nowrap last:rounded-tr-xl">
                    Tổng
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  renderSkeletonRows()
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      Không có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  (() => {
                    // Tính rowSpan cho cột Bộ phận
                    const rowSpanMap = {};
                    data.forEach((row) => {
                      rowSpanMap[row.departmentName] =
                        (rowSpanMap[row.departmentName] || 0) + 1;
                    });

                    const renderedDepts = new Set();

                    return data.map((row, idx) => {
                      const isFirstDeptRow = !renderedDepts.has(row.departmentName);
                      if (isFirstDeptRow) renderedDepts.add(row.departmentName);

                      return (
                        <tr
                          key={idx}
                          className="odd:bg-white even:bg-slate-50 hover:bg-emerald-50/50 transition-colors"
                        >
                          {isFirstDeptRow && (
                            <td
                              className="px-4 py-3 border border-slate-200 align-middle font-medium text-slate-800"
                              rowSpan={rowSpanMap[row.departmentName]}
                            >
                              {row.departmentName}
                            </td>
                          )}
                          <td className="px-4 py-3 border border-slate-200 text-slate-700">
                            {row.unitName}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {row['Giẻ lau dính mực thường']}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {row['Giẻ lau dính mực lapa']}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {row['Vụn logo']}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {row['Băng keo dính hóa chất']}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {row['Mực in thường thải']}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {row['Mực in lapa thải']}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center font-semibold text-slate-900">
                            {row.totalQuantity}
                          </td>
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListBin;
