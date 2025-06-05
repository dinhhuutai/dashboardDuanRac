import React, { useState, useEffect } from 'react';

function UnscannedQRList() {
  const [data, setData] = useState({});
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workShift, setWorkShift] = useState('ca1');

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/trash-weighings/unscanned-teams?workDate=${workDate}&workShift=${workShift}`);
      const json = await res.json();
      setData(json.unscanned || {});
    };
    fetchData();
  }, [workDate, workShift]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md mt-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📋 Danh sách tổ - đơn vị chưa quét mã QR</h2>

      {/* Bộ lọc ngày và ca */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Ngày làm việc:</label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">Ca làm việc:</label>
          <select
            value={workShift}
            onChange={(e) => setWorkShift(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="ca1">Ca 1</option>
            <option value="ca2">Ca 2</option>
            <option value="ca3">Ca 3</option>
            <option value="dai1">Dai 1</option>
            <option value="dai2">Dai 2</option>
            <option value="cahc">Ca Hành Chính</option>
          </select>
        </div>
      </div>

      {/* Danh sách tổ - đơn vị */}
      <div>
        {Object.keys(data).length === 0 ? (
          <p className="text-green-600 text-lg font-semibold text-center">✅ Tất cả tổ - đơn vị đã cân rác</p>
        ) : (
          Object.entries(data).map(([team, units]) => (
            <div key={team} className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">{team}</h3>
              <ul className="list-disc list-inside text-gray-700 pl-2">
                {units.map((unit) => (
                  <li key={unit} className="ml-4">
                    {unit}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UnscannedQRList;
