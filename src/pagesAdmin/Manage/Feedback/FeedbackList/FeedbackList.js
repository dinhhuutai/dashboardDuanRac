import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '~/config';
import http from '~/api/http';

function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // yyyy-mm-dd
  });

  const formatUTCToVNTime = (isoString) => {
  const utc = new Date(isoString);
  const vn = new Date(utc.getTime() - 7 * 60 * 60 * 1000); // cộng 7 giờ
  const yyyy = vn.getFullYear();
  const mm = String(vn.getMonth() + 1).padStart(2, '0');
  const dd = String(vn.getDate()).padStart(2, '0');
  const hh = String(vn.getHours()).padStart(2, '0');
  const mi = String(vn.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};



  const fetchFeedbacks = async (date) => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/feedbacks?date=${date}`);
      setFeedbacks(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy góp ý:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks(selectedDate);
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">📋 Danh sách góp ý</h1>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-gray-700 font-medium">Chọn ngày:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Đang tải dữ liệu...</div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center text-gray-500 italic">Không có góp ý nào trong ngày này.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200">
              <thead className="bg-blue-100 text-left">
                <tr>
                  <th className="py-3 px-4 border-b">🕒 Ngày gửi</th>
                  <th className="py-3 px-4 border-b">✏️ Nội dung</th>
                  <th className="py-3 px-4 border-b">📷 Hình ảnh</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((fb, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b text-gray-600">{formatUTCToVNTime(fb.createdAt)}</td>
                    <td className="py-2 px-4 border-b text-gray-800 whitespace-pre-wrap">{fb.content}</td>
                    <td className="py-2 px-4 border-b">
                      {fb.imageUrls?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {fb.imageUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={`${BASE_URL}${url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-20 h-20 overflow-hidden border rounded"
                            >
                              <img
                                src={`${BASE_URL}${url}`}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Không có</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackList;
