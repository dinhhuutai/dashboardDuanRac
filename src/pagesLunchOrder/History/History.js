import React, { useEffect, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import { FaCheck } from "react-icons/fa";

function dayNameVN(day) {
  return ["","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7","CN"][day];
}

export default function LunchOrderHistory() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  const [weekStart, setWeekStart] = useState(""); // yyyy-mm-dd
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // tổng suất (cộng theo quantity)
  const totalQty = history.reduce((s, r) => s + (r.quantity ?? 0), 0);

  // Load API
  async function loadHistory(dateStr) {
    if (!dateStr || !user?.userID) return;
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/lunch-order/history`, {
        params: { date: dateStr, userId: user.userID },
      });
      setHistory(rs.data?.data || []);
    } finally {
      setLoading(false);
    }
  }

  // Lần đầu vào → lấy ngày hiện tại
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setWeekStart(today);
  }, []);

  // Khi đổi ngày hoặc user → load lại
  useEffect(() => {
    if (weekStart && user?.userID) {
      loadHistory(weekStart);
    }
  }, [weekStart, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Filter bar */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <input
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 shadow-inner 
                       focus:ring-2 focus:ring-emerald-400 outline-none"
          />
          {history.length > 0 && (
            <div className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700">
              🍚 <b>{totalQty}</b> suất (tuần này)
            </div>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-3xl bg-slate-100 h-56"
              />
            ))}
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="card relative rounded-3xl bg-gray-100 p-4 overflow-hidden 
                           shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]
                           hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]
                           transition"
              >
                {/* Hiệu ứng ánh sáng lấp lánh */}
                <div className="shine"></div>

                {/* Badge đã chọn */}
                {item.selectedAt && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1 
                               bg-emerald-100 text-emerald-700 text-[11px] px-2.5 py-1 rounded-full shadow"
                    title={new Date(item.selectedAt).toLocaleString("vi-VN")}
                  >
                    <FaCheck className="text-[10px]" /> Đã chọn
                  </div>
                )}

                {/* Ảnh */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.foodName}
                    className="w-full h-36 object-cover rounded-2xl mb-3"
                  />
                ) : (
                  <div className="w-full h-36 flex items-center justify-center bg-slate-200 rounded-2xl mb-3 text-slate-400">
                    Không có hình
                  </div>
                )}

                {/* Tên món */}
                <h3 className="font-semibold text-base text-slate-700 mb-1 text-center line-clamp-2">
                  {item.foodName}
                </h3>

                {/* Ngày + Số lượng */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{dayNameVN(item.dayOfWeek)}</p>
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold
                               bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-sm"
                    title="Số lượng đã đặt"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                    x{item.quantity ?? 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && weekStart && history.length === 0 && (
          <div className="text-slate-500 italic text-center">
            Bạn chưa đặt cơm tuần này
          </div>
        )}
      </div>

      {/* CSS shimmer */}
      <style>{`
        .card { position: relative; overflow: hidden; }
        .card .shine {
          position: absolute;
          top: -60%;
          left: -60%;
          height: 220%;
          width: 120px;
          transform: rotate(25deg) translateX(-200%);
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.5) 50%,
            rgba(255,255,255,0) 100%
          );
          pointer-events: none;
          animation: shine 3s ease-in-out infinite;
        }
        @keyframes shine {
          0%   { transform: rotate(25deg) translateX(-200%); opacity: 0; }
          10%  { opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: rotate(25deg) translateX(250%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
