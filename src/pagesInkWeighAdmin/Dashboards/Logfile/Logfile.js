import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { FaFileAlt } from 'react-icons/fa';

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
  }, [from, to]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/logfile`, {
        params: { from, to }
      });
      setLogs(res.data);
      setPage(1);
    } catch (err) {
      console.error('Lỗi tải log:', err);
    } finally {
      setLoading(false);
    }
  };

  const logsToShow = logs.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(logs.length / pageSize);

  return (
    <div className="p-4">
      <div className="p-4 space-y-6 bg-white rounded-[6px]">
        <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
            <FaFileAlt className="text-blue-500" />
            Log File
        </h2>

      <div className="flex gap-6 mb-4 items-end">
  <div className="flex flex-col">
    <label className="text-sm text-gray-700 mb-1">Từ ngày</label>
    <input
      type="date"
      value={from}
      onChange={(e) => setFrom(e.target.value)}
      className="border px-3 py-1 rounded shadow"
    />
  </div>

  <div className="flex flex-col">
    <label className="text-sm text-gray-700 mb-1">Đến ngày</label>
    <input
      type="date"
      value={to}
      onChange={(e) => setTo(e.target.value)}
      className="border px-3 py-1 rounded shadow"
    />
  </div>
</div>


      <div className="overflow-auto border rounded shadow min-h-[200px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
          </div>
        )}

        <table className="min-w-full text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">STT</th>
              <th className="px-4 py-2 text-left">Raw Text</th>
              <th className="px-4 py-2 text-left">Received At</th>
              <th className="px-4 py-2 text-left">Error</th>
            </tr>
          </thead>
          <tbody>
            {logsToShow.map((log, idx) => (
              <tr key={log.Id} className="odd:bg-white even:bg-gray-50">
                <td className="px-4 py-2">{(page - 1) * pageSize + idx + 1}</td>
                <td className="px-4 py-2 whitespace-pre-wrap">{log.raw_text}</td>
                <td className="px-4 py-2">{new Date(log.received_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-red-600">{log.error_message || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination buttons */}
      <div className="flex flex-wrap items-center justify-end mt-4 gap-2">
        Trang:
        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
          <button
            key={pg}
            className={`w-8 h-8 rounded text-sm font-medium border ${
              page === pg ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-300'
            }`}
            onClick={() => setPage(pg)}
          >
            {pg}
          </button>
        ))}
      </div>
    </div>
    </div>
  );
}

export default Logfile;
