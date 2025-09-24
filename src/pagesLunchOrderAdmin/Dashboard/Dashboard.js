// src/pages/Datcom/DashboardAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { FiUsers, FiCheckCircle, FiXCircle, FiTrendingUp, FiCalendar, FiClock } from "react-icons/fi";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const cn = (...xs) => xs.filter(Boolean).join(" ");

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0..6
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'>
  <rect width='100%' height='100%' fill='#f1f5f9'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='sans-serif' font-size='12' fill='#94a3b8'>No Image</text>
</svg>`);

function FoodHighlight({ title, food }) {
  return (
    <div className="flex items-center gap-4">
      <img
        src={food?.imageUrl || PLACEHOLDER_IMG}
        alt={food?.foodName || "Food image"}
        className="h-16 w-16 rounded-xl object-cover ring-1 ring-slate-200"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
      />
      <div className="min-w-0">
        <div className="text-sm text-slate-500 mb-0.5">{title}</div>
        <div className="text-lg font-semibold text-slate-800 truncate">
          {food ? `${food.foodName} (${food.totalOrders})` : "—"}
        </div>
      </div>
    </div>
  );
}


const StatCard = ({ icon, label, value, tone = "emerald" }) => (
  <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex items-center gap-3">
    <div className={cn(
      "h-10 w-10 rounded-xl flex items-center justify-center",
      `bg-${tone}-50 text-${tone}-600 ring-1 ring-${tone}-100`
    )}>
      {icon}
    </div>
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-800">{value ?? "-"}</div>
    </div>
  </div>
);

const Card = ({ className, children }) => (
  <div className={cn("rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm", className)}>{children}</div>
);

export default function DashboardAdmin() {
  const [week, setWeek] = useState(getMonday());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await http.get(`${BASE_URL}/api/lunch-order/dashboard`, { params: { week } });
      setData(res.data);
    } catch (e) {
      console.error("dashboard fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [week]);

  // Chuẩn hoá dữ liệu biểu đồ stacked
  const stackedData = useMemo(() => {
    if (!data?.chart) return [];
    const map = new Map(); // key: day (T2..T7/CN)
    const label = (d) => `T${d}`; // 1..7
    data.chart.forEach((r) => {
      const key = label(r.dayOfWeek);
      if (!map.has(key)) map.set(key, { day: key });
      map.get(key)[r.foodName] = r.totalOrders;
    });
    // luôn đủ từ T1..T7 (Mon..Sun => 1..7) nếu muốn
    return Array.from(map.values());
  }, [data]);

  // danh sách tất cả foodName (để render <Bar>)
  const foodKeys = useMemo(() => {
    if (!data?.chart) return [];
    return Array.from(new Set(data.chart.map((x) => x.foodName)));
  }, [data]);

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-[#f7faff] min-h-screen">
      {/* Header */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-sky-50 ring-sky-100">
        <div>
          <div className="text-xs text-slate-500">Theo tuần</div>
          <h1 className="text-lg font-semibold text-slate-800">Dashboard đặt cơm (Admin)</h1>
          <p className="text-sm text-slate-500">Tổng quan người dùng & thống kê món theo tuần</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-600 flex items-center gap-1">
              <FiCalendar /> Chọn tuần (chọn ngày bất kỳ)
            </label>
            <input
              type="date"
              value={week}
              onChange={(e) => setWeek(getMonday(e.target.value))}
              className="h-10 px-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-emerald-400 outline-none"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="text-center text-slate-500">Đang tải dữ liệu...</div>
      ) : !data ? (
        <div className="text-center text-slate-500">Không có dữ liệu</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={<FiUsers />} label="Tổng user có module" value={data.totals?.totalUsers} tone="emerald" />
            <StatCard icon={<FiCheckCircle />} label="Đã đặt (tuần)" value={data.totals?.totalOrdered} tone="indigo" />
            <StatCard icon={<FiXCircle />} label="Chưa đặt (tuần)" value={data.totals?.totalNotOrdered} tone="rose" />
            <StatCard icon={<FiTrendingUp />} label="Tỷ lệ đặt (%)" value={`${data.totals?.orderRate ?? 0}%`} tone="amber" />
          </div>

          {/* Top/Least Foods + Department breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="grid grid-cols-1 gap-4">
            
            <Card className="p-4">
  <div className="grid grid-cols-1 gap-4">
    <FoodHighlight title="Món nhiều nhất tuần" food={data.topFood} />
    <FoodHighlight title="Món ít nhất tuần"  food={data.leastFood} />
  </div>
</Card>


            <StatCard
  icon={<FiClock />}
  label="Giờ cao điểm đặt"
  value={data.leadTime ? `${data.leadTime.hourSlot}h (${data.leadTime.totalOrders} lượt)` : "—"}
  tone="cyan"
/>
            </div>


            <Card className="p-4 lg:col-span-2">
              <div className="text-base font-semibold text-slate-800 mb-3">Phân bổ theo phòng ban</div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-700">
                      {["Phòng ban", "Tổng", "Đã đặt", "Chưa đặt"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left border-b border-slate-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data.byDepartment || []).map((r, i) => (
                      <tr key={r.departmentName + i} className={i % 2 ? "bg-slate-50/60" : ""}>
                        <td className="px-3 py-2 border-b border-slate-100">{r.departmentName}</td>
                        <td className="px-3 py-2 border-b border-slate-100">{r.total}</td>
                        <td className="px-3 py-2 border-b border-slate-100 text-emerald-700 font-medium">{r.ordered}</td>
                        <td className="px-3 py-2 border-b border-slate-100 text-rose-600 font-medium">{r.notOrdered}</td>
                      </tr>
                    ))}
                    {(!data.byDepartment || !data.byDepartment.length) && (
                      <tr><td className="px-3 py-3 text-slate-500" colSpan={4}>Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Stacked Bar Chart */}
          <Card className="p-4">
            <div className="text-base font-semibold text-slate-800 mb-4">
              Biểu đồ đặt món theo ngày trong tuần (stacked theo món)
            </div>
            <div className="w-full" style={{ height: 420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData}>
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {foodKeys.map((food, idx) => (
                    <Bar key={food} dataKey={food} stackId="a" fill={`hsl(${(idx * 53) % 360} 70% 55%)`} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
