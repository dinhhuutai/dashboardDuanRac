import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import { useSelector } from 'react-redux';
import { userSelector } from '~/redux/selectors';

function History() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // lấy ngày hiện tại
  const [userID, setUserID] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const tmp = useSelector(userSelector);

  // Cập nhật userID khi redux thay đổi
  useEffect(() => {
    setUserID(tmp?.login?.currentUser?.userID);
  }, [tmp]);

  // Tự động fetch khi có userID và date
  useEffect(() => {
    if (!userID || !date) return;
    setLoading(true);
    axios.get(`${BASE_URL}/history`, {
      params: { userID, date },
    })
      .then(res => setData(res.data))
      .catch(err => alert("Lỗi khi tải dữ liệu: " + err.message))
      .finally(() => setLoading(false));
  }, [userID, date]);

  
  const formatDateTime = (datetimeStr) => {
    const [date, time] = datetimeStr.split('T');
    const [year, month, day] = date.split('-');
    const [hour, minute] = time.split(':');
    return `${day}-${month}-${year} ${hour}:${minute}`;
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-700">Lịch sử cân rác theo ngày</h1>

      {/* Bộ chọn ngày */}
      <div className="flex items-center space-x-4">
        <label className="text-gray-600 font-medium">Chọn ngày:</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="border px-3 py-2 rounded"
        />
      </div>

      {/* Hiển thị bảng dữ liệu */}
      {loading ? (
        <p className="text-gray-500 italic">Đang tải dữ liệu...</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500 italic">Không có dữ liệu cho ngày đã chọn.</p>
      ) : (
        <div className="overflow-auto rounded-xl border">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="border px-4 py-2">STT</th>
                <th className="border px-4 py-2">Thời gian</th>
                <th className="border px-4 py-2">Bộ phận</th>
                <th className="border px-4 py-2">Đơn vị</th>
                <th className="border px-4 py-2">Thùng rác</th>
                <th className="border px-4 py-2">Loại rác</th>
                <th className="border px-4 py-2">Khối lượng (kg)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border px-4 py-2 text-center">{idx + 1}</td>
                  <td className="border px-4 py-2">{formatDateTime(item.weighingTime)}</td>
                  <td className="border px-4 py-2">{item.departmentName}</td>
                  <td className="border px-4 py-2">{item.unitName || '-'}</td>
                  <td className="border px-4 py-2">{item.trashBinCode}</td>
                  <td className="border px-4 py-2">{item.trashName}</td>
                  <td className="border px-4 py-2 text-center font-semibold">{item.weightKg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
