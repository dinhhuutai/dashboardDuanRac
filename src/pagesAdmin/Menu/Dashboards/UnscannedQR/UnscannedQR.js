import React, { useState, useEffect } from 'react';

function UnscannedQRList() {
  const [data, setData] = useState({});
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workShift, setWorkShift] = useState('Ca 1');

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/trash-weighings/unscanned?workDate=${workDate}&workShift=${workShift}`);
      const json = await res.json();
      setData(json.unscanned || {});
    };
    fetchData();
  }, [workDate, workShift]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Danh sách tổ - đơn vị chưa quét mã QR</h2>
      <div className="flex gap-2 mb-4">
        <input type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} />
        <select value={workShift} onChange={(e) => setWorkShift(e.target.value)}>
          <option value="ca1">Ca 1</option>
          <option value="ca2">Ca 2</option>
          <option value="ca3">Ca 3</option>
          <option value="dai1">Dai 1</option>
          <option value="dai2">Dai 2</option>
          <option value="cahc">Ca Hành Chính</option>
        </select>
      </div>
      <div>
        {Object.keys(data).length === 0 ? (
          <p>✅ Tất cả tổ - đơn vị đã cân rác</p>
        ) : (
          Object.entries(data).map(([team, units]) => (
            <div key={team} className="mb-3">
              <h3 className="font-semibold text-blue-600">{team}</h3>
              <ul className="list-disc pl-6">
                {units.map((unit) => (
                  <li key={unit}>{unit}</li>
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
