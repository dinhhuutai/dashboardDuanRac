import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { BASE_URL_SERVER_THLA } from '~/config';
import { FiDownload, FiLoader } from 'react-icons/fi';
import http from '~/api/http';

function ReportCartInk() {
  const [data, setData] = useState([]);
  const [from, setFrom] = useState(dayjs().startOf('day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().endOf('day').format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [from, to]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/report/cart-ink`, {
        params: { from, to },
      });
      setData(res.data || []);
    } catch (error) {
      console.error('Lỗi lấy dữ liệu:', error);
    }
    setLoading(false);
  };

  const groupedData = data.reduce((acc, item) => {
    const key = item.vehicleName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const nfmt = (n) =>
    Number(n ?? 0).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const exportExcel = () => {
    const title = `📦 Báo cáo Xe mực từ ${from} đến ${to}`;
    const wsData = [];
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

    wsData.push([title]);
    wsData.push([]);
    wsData.push(['#', 'Tên mực', 'Chuyền', 'Ngày giờ cân', 'Nghiệp vụ', 'Khối lượng (g)']);

    let currentRow = 3;
    Object.entries(groupedData).forEach(([vehicleName, records]) => {
      wsData.push([`Xe mực: ${vehicleName}`]);
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } });
      currentRow++;

      records.forEach((r, i) => {
        wsData.push([
          i + 1,
          r.inkName,
          r.lineName,
          dayjs(r.createdAt).subtract(7, 'hour').format('DD/MM/YYYY HH:mm'),
          r.operationCode === 'TV' ? 'Trả' : 'Cấp mực',
          r.weight,
        ]);
        currentRow++;
      });

      wsData.push([]);
      currentRow++;
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = merges;
    ws['!cols'] = [
      { wch: 6 }, { wch: 28 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 16 },
    ];

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 0; R <= range.e.r; ++R) {
      const isTitle = R === 0;
      const isHeader = R === 2;
      const firstVal = ws[XLSX.utils.encode_cell({ r: R, c: 0 })]?.v?.toString() || '';
      const isVehicleRow = firstVal.startsWith('Xe mực:');
      const isOddBody = !isTitle && !isHeader && !isVehicleRow && R % 2 === 1;

      for (let C = 0; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellRef]) continue;
        const isNumberCol = C === 5;

        let style = {
          alignment: { horizontal: isNumberCol ? 'right' : 'center', vertical: 'center' },
          font: { name: 'Calibri', sz: 11 },
          border: {
            top: { style: 'thin', color: { rgb: 'CBD5E1' } },
            bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } },
          },
        };

        if (isTitle) {
          style.font = { bold: true, sz: 16, name: 'Calibri' };
          style.alignment = { horizontal: 'center', vertical: 'center' };
        } else if (isHeader) {
          style.font = { bold: true, color: { rgb: 'FFFFFF' }, name: 'Calibri' };
          style.fill = { fgColor: { rgb: '003366' } };
        } else if (isVehicleRow) {
          style.font.bold = true;
          style.fill = { fgColor: { rgb: 'FFF2CC' } };
          style.alignment = { horizontal: 'left', vertical: 'center' };
        } else if (isOddBody) {
          style.fill = { fgColor: { rgb: 'F8FAFC' } };
        }

        if (isNumberCol && !isHeader && !isVehicleRow && !isTitle) {
          style.numFmt = '#,##0.0';
        }

        ws[cellRef].s = style;
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo Xe mực');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([excelBuffer], { type: 'application/octet-stream' }),
      `Bao_cao_Xe_muc_${from}_den_${to}.xlsx`
    );
  };

  
  function round1(num) {
  return Math.round((num / 1000) * 10) / 10;
}

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1300px] space-y-5">
        {/* Card bộ lọc + header */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200/60 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                📦 Báo cáo Xe mực
              </h1>
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              >
                <FiDownload className="text-base" />
                Xuất Excel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-600 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <div className="flex items-end">
                {loading && (
                  <div className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <FiLoader className="animate-spin text-indigo-600" />
                    Đang tải dữ liệu...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body: danh sách xe */}
          <div className="p-4 sm:p-5">
            {Object.entries(groupedData).length === 0 ? (
              <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                Không có dữ liệu
              </div>
            ) : (
              Object.entries(groupedData).map(([vehicleName, records], idx) => {
                // tổng & chi tiết theo mực
                const summary = records.reduce(
                  (acc, r) => {
                    if (!acc.inks[r.inkName]) acc.inks[r.inkName] = 0;
                    if (r.operationCode === 'CM') {
                      acc.inks[r.inkName] += r.weight;
                      acc.total += r.weight;
                    } else if (r.operationCode === 'TV') {
                      acc.inks[r.inkName] -= r.weight;
                      acc.total -= r.weight;
                    }
                    return acc;
                  },
                  { inks: {}, total: 0 }
                );

                return (
                  <div
                    key={`${vehicleName}-${idx}`}
                    className="mb-6 last:mb-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    {/* header nhóm */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                        Xe mực: <span className="text-indigo-700">{vehicleName}</span>
                      </h2>
                      <div className="text-sm">
                        <span className="mr-2 text-slate-600">Tổng mực sử dụng:</span>
                        <span className="inline-flex items-center rounded-md bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
                          {round1(summary.total).toFixed(2)} kg
                        </span>
                      </div>
                    </div>

                    {/* badges thành phần mực */}
                    <div className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(summary.inks).map(([ink, val]) => (
                          <span
                            key={ink}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200"
                          >
                            <span className="truncate max-w-[220px]">{ink}</span>
                            <span className={`font-semibold ${val < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {round1(val).toFixed(2)} kg
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* bảng chi tiết */}
                    <div className="relative overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full text-sm">
                          <thead className="sticky top-0 z-10 bg-slate-50">
                            <tr className="text-[12px] uppercase tracking-wide text-slate-600">
                              {['#','Tên mực','Chuyền','Ngày giờ cân','Nghiệp vụ','Khối lượng (kg)'].map((h) => (
                                <th key={h} className="border-b border-slate-200 px-3 py-2 text-left">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {records.map((r, i) => (
                              <tr
                                key={`${vehicleName}-${i}`}
                                className={`transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-slate-100`}
                              >
                                <td className="px-3 py-2 text-center">{i + 1}</td>
                                <td className="px-3 py-2">{r.inkName}</td>
                                <td className="px-3 py-2">{r.lineName}</td>
                                <td className="px-3 py-2">
                                  {dayjs(r.createdAt).subtract(7, 'hour').format('DD/MM/YYYY HH:mm')}
                                </td>
                                <td className="px-3 py-2">
                                  {r.operationCode === 'TV' ? (
                                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                                      Trả
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                      Cấp mực
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-medium">{round1(r.weight).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportCartInk;
