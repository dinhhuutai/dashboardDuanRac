import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL_SERVER_THLA } from '~/config';
import { FaFileAlt } from 'react-icons/fa';
import { FiLoader, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import http from '~/api/http';

function Logfile() {
  const today = new Date();
  const localToday = today.toLocaleDateString('en-CA'); // yyyy-mm-dd theo local time

  const [logs, setLogs] = useState([]);
  const [from, setFrom] = useState(localToday);
  const [to, setTo] = useState(localToday);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL_SERVER_THLA}/api/logfile`, {
        params: { from, to },
      });
      setLogs(res.data || []);
      setPage(1);
    } catch (err) {
      console.error('Lỗi tải log:', err);
    } finally {
      setLoading(false);
    }
  };

  const logsToShow = logs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1200px] space-y-5">
        {/* card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 p-4 sm:p-5">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FaFileAlt />
              </span>
              Log file
            </h2>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
              <span>Tổng số dòng:</span>
              <span className="font-medium text-slate-700">{logs.length}</span>
            </div>
          </div>

          {/* filters */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div>
          </div>

          {/* table */}
          <div className="p-0 sm:p-5 pt-0">
            <div className="relative overflow-hidden rounded-xl border border-slate-200">
              {/* loading overlay */}
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
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
                      <th className="px-3 py-2 text-left border-b border-slate-200">STT</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">Raw text</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">Received at</th>
                      <th className="px-3 py-2 text-left border-b border-slate-200">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsToShow.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-10 text-center text-slate-500">
                          Không có dữ liệu
                        </td>
                      </tr>
                    ) : (
                      logsToShow.map((log, idx) => (
                        <tr
                          key={log.Id ?? `${page}-${idx}`}
                          className="transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-slate-100"
                        >
                          <td className="px-3 py-2 align-top">
                            {(page - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-3 py-2 align-top">
                            <div className="font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-slate-800">
                              {log.raw_text}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-top text-slate-700">
                            {new Date(log.received_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-3 py-2 align-top">
                            {log.error_message ? (
                              <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[12px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                                {log.error_message}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[12px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* pagination */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Trang <span className="font-medium">{page}</span> / {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                >
                  <FiChevronLeft /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`min-w-[36px] rounded-lg px-3 py-1.5 text-sm ${
                      page === pg
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50 hover:bg-slate-50"
                >
                  Sau <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
          {/* end body */}
        </div>
      </div>
    </div>
  );
}

export default Logfile;
