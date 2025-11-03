// src/pages/Lunch/SearchTodayMeals.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch, FaCalendarDay } from "react-icons/fa";
import { BASE_URL } from "~/config";
import http from "~/api/http";

function fmtToday() {
  const d = new Date();
  // lấy local date, format YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// helper chuyển statusType -> tiếng Việt + style
function statusToVN(s) {
  switch ((s || "").toLowerCase()) {
    case "ot": return "Tăng ca";
    case "ws": return "Theo ca";
    case "re": return "Ca ngày";
    default: return s || "Không rõ";
  }
}

function StatusChip({ type }) {
  const t = (type || "").toLowerCase();
  const base = "inline-flex items-center rounded-md border text-[11.5px] px-1.5 py-0.5";
  if (t === "overtime")
    return <span className={`${base} bg-amber-50 border-amber-200 text-amber-700`}> {statusToVN(type)} </span>;
  if (t === "workshift")
    return <span className={`${base} bg-indigo-50 border-indigo-200 text-indigo-700`}> {statusToVN(type)} </span>;
  if (t === "normal")
    return <span className={`${base} bg-emerald-50 border-emerald-200 text-emerald-700`}> {statusToVN(type)} </span>;
  return <span className={`${base} bg-slate-50 border-slate-200 text-slate-600`}> {statusToVN(type)} </span>;
}
function QtyChip({ value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 text-[12px] px-2 py-0.5">
      x<b className="ml-0.5">{value}</b>
    </span>
  );
}


export default function SearchTodayMeals() {
  const [date, setDate] = useState(fmtToday());
  const [q, setQ] = useState("");
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // [{userId, fullName, username, items:[...]}]

  // debounce fetch
  const timerRef = useRef(null);
  const triggerFetch = (delay = 0) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchData();
    }, delay);
  };

  useEffect(() => {
    // load lần đầu với ngày hiện tại, q=""
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTyping(true);
    triggerFetch(400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, date]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await http.get(`${BASE_URL}/api/lunch-order/search/day`, {
        params: { date, q },
      });
      setResults(res.data?.data ?? []);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">
        Tra cứu món ăn theo CNV
      </h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm flex-1">
          <FaSearch className="text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập tên: username hoặc họ tên..."
            className="w-full outline-none text-slate-800 placeholder:text-slate-400"
          />
        </label>

        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white shadow-sm">
          <FaCalendarDay className="text-slate-500" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="outline-none text-slate-800"
          />
        </label>
      </div>

      {/* State */}
      {(loading || typing) && (
        <div className="text-sm text-slate-600 mb-3">
          Đang tải dữ liệu…
        </div>
      )}

      {/* Results */}
      {(!results || results.length === 0) && !loading ? (
        <div className="text-slate-500">Không có kết quả.</div>
      ) : (
        <div className="space-y-4">
          {results.map((u) => (
            <div
              key={u.userId}
              className="bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-800 truncate">
                    {u.fullName}
                  </div>
                  <div className="text-[13px] text-slate-500">@{u.username}</div>
                </div>
              </div>

              {/* items */}
              {(!u.items || u.items.length === 0) ? (
                <div className="text-slate-500 text-sm">Chưa đặt món hôm nay.</div>
              ) : (
                <ul className="grid md:grid-cols-2 gap-3">
                  {u.items.map((it, idx) => (
                    <li
                      key={`${it.foodId}-${idx}`}
                      className="flex items-start gap-3 border border-slate-200 rounded-xl p-3 bg-slate-50"
                    >
                      <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden">
                        {it.imageUrl ? (
                          <img
                            src={it.imageUrl}
                            alt={it.foodName}
                            className="h-10 w-10 object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">IMG</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {it.foodName}
                        </div>
                        <div className="text-[12.5px] text-slate-600 mt-0.5">
                          Ghi chú:{" "}
                          <span className="font-medium">
                            {it.branchName || "-"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
  <StatusChip type={it.statusType} />
  <QtyChip value={it.quantity} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
