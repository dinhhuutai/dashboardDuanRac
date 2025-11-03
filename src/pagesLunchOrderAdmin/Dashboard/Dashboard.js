// src/pages/Datcom/DashboardAdmin.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
} from "recharts";
import { FiUsers, FiCheckCircle, FiXCircle, FiTrendingUp, FiCalendar, FiClock } from "react-icons/fi";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const cn = (...xs) => xs.filter(Boolean).join(" ");
const NumericCell = ({ value }) => (
  <td className="px-3 py-2 text-right tabular-nums text-slate-800">
    {Number(value || 0).toLocaleString("vi-VN")}
  </td>
);
const PLACEHOLDER_IMG = /* như cũ */ "data:image/svg+xml;utf8,"+encodeURIComponent(/* ...svg... */);

function FoodHighlight({ title, food }) {
  const label = food
    ? (food.branchName ? `${food.foodName} — ${food.branchName}` : `${food.foodName}`)
    : "—";
  const qty = food?.totalOrders ?? "";
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
          {food ? `${label} (${qty})` : "—"}
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
const dayLbl = (d) => (d === 7 ? "CN" : `T${d}`);
function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export default function DashboardAdmin() {
  const [foodDay, setFoodDay] = useState(1);
  const [week, setWeek] = useState(getMonday());
  const [orderType, setOrderType] = useState("all"); // 'all' | 're' | 'ws' | 'ot'
  const [branchMode, setBranchMode] = useState("aggregate"); // 'aggregate' | 'split'

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const params = { week, statusType: orderType, branchMode };
      const res = await http.get(`${BASE_URL}/api/lunch-order/dashboard`, { params });
      setData(res.data);
    } catch (e) {
      console.error("dashboard fetch error", e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { fetchDashboard(); }, [week, orderType, branchMode]);

  // ===== Chart stacked =====
  const stackedData = useMemo(() => {
    if (!data?.chart) return [];
    // key theo branchMode
    const keyOf = (r) => branchMode === "split"
      ? `${r.foodName}${r.branchName ? ` (${r.branchName})` : " (Chung)"}`
      : r.foodName;
    const map = new Map(); // "T2" -> { day: "T2", 'Cơm gà': 10, ... }
    data.chart.forEach((r) => {
      const key = dayLbl(r.dayOfWeek);
      if (!map.has(key)) map.set(key, { day: key });
      const seriesKey = keyOf(r);
      map.get(key)[seriesKey] = (map.get(key)[seriesKey] || 0) + (r.totalOrders || 0);
    });
    return Array.from(map.values());
  }, [data, branchMode]);

  const foodKeys = useMemo(() => {
    if (!data?.chart) return [];
    const set = new Set();
    data.chart.forEach((r) => {
      if (branchMode === "split") {
        set.add(`${r.foodName}${r.branchName ? ` (${r.branchName})` : " (Chung)"}`);
      } else {
        set.add(r.foodName);
      }
    });
    return Array.from(set);
  }, [data, branchMode]);

  // ===== Department × Food (theo ngày) pivot =====
  const deptFoodPivot = useMemo(() => {
    if (!data?.deptDayFood) return { foods: [], rows: [], totalsRow: null, maxCell: 0 };
    const filtered = data.deptDayFood.filter(r => r.dayOfWeek === foodDay);

    const colLabel = (r) =>
      branchMode === "split"
        ? `${r.foodName}${r.branchName ? ` (${r.branchName})` : " (Chung)"}`
        : r.foodName;

    const foods = Array.from(new Set(filtered.map(colLabel)))
      .sort((a,b) => a.localeCompare(b, "vi", { sensitivity: "base" }));

    const rowsMap = new Map();
    let colTotals = Object.fromEntries(foods.map(f => [f, 0]));
    let maxCell = 0;

    filtered.forEach(r => {
      const dep = r.departmentName || "Chưa gán";
      const col = colLabel(r);
      if (!rowsMap.has(dep)) {
        rowsMap.set(dep, { departmentName: dep, ...Object.fromEntries(foods.map(f => [f, 0])), total: 0 });
      }
      const row = rowsMap.get(dep);
      row[col] = (row[col] || 0) + (r.totalMeals || 0);
      row.total += (r.totalMeals || 0);
    });

    const rows = Array.from(rowsMap.values()).sort((a,b) =>
      a.departmentName.localeCompare(b.departmentName, "vi", { sensitivity: "base" })
    );

    rows.forEach(row => {
      foods.forEach(f => {
        const v = row[f] || 0;
        colTotals[f] += v;
        maxCell = Math.max(maxCell, v);
      });
    });

    const totalsRow = {
      departmentName: "Tổng",
      ...colTotals,
      total: rows.reduce((s, r) => s + r.total, 0)
    };

    return { foods, rows, totalsRow, maxCell };
  }, [data, foodDay, branchMode]);

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-[#f7faff] min-h-screen">
      {/* Header + filters */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-sky-50 ring-sky-100">
        <div>
          <div className="text-xs text-slate-500">Theo tuần</div>
          <h1 className="text-lg font-semibold text-slate-800">Dashboard đặt cơm</h1>
          <p className="text-sm text-slate-500">Tổng quan người dùng, suất ăn & thống kê phòng ban</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Chọn tuần */}
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

          {/* Loại: all / re / ws / ot */}
          <div className="space-y-1">
            <div className="text-sm text-slate-600">Loại</div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {[
                {k:'all', label:'Tất cả'},
                {k:'re',  label:'Ca ngày'},
                {k:'ws',  label:'Đi ca'},
                {k:'ot',  label:'Tăng ca'},
              ].map(t => (
                <button
                  key={t.k}
                  onClick={() => setOrderType(t.k)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${orderType===t.k ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Branch mode: aggregate / split */}
          <div className="space-y-1">
            <div className="text-sm text-slate-600">Hiển thị Branch</div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {[
                {k:'aggregate', label:'Gộp'},
                {k:'split',     label:'Chia theo ghi chú'},
              ].map(t => (
                <button
                  key={t.k}
                  onClick={() => setBranchMode(t.k)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${branchMode===t.k ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<FiUsers />} label="Tổng user có module" value={data.totals?.totalUsers} tone="emerald" />
            <StatCard icon={<FiCheckCircle />} label="User đã đặt (tuần)" value={data.totals?.totalOrdered} tone="indigo" />
            <StatCard icon={<FiXCircle />} label="Chưa đặt (tuần)" value={data.totals?.totalNotOrdered} tone="rose" />
            <StatCard icon={<FiTrendingUp />} label="Tỷ lệ đặt (%)" value={`${data.totals?.orderRate ?? 0}%`} tone="amber" />
            <StatCard icon={<FiCalendar />} label="Tổng suất (tuần)" value={data.totals?.totalMeals} tone="cyan" />
          </div>

          {/* Dept × Food (theo ngày) */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500">Thống kê theo ngày</div>
                <div className="text-base md:text-lg font-semibold text-slate-800 mt-0.5">Phòng ban × Món ăn {branchMode==='split' && <span className="text-sm text-slate-500">(chia theo branch)</span>}</div>
              </div>

              <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {[1,2,3,4,5,6,7].map((d) => (
                  <button
                    key={d}
                    onClick={() => setFoodDay(d)}
                    className={`relative px-3 py-1.5 text-sm rounded-lg transition ${foodDay===d ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    {dayLbl(d)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-auto rounded-xl ring-1 ring-slate-200 shadow-sm">
              {deptFoodPivot.foods.length === 0 ? (
                <div className="text-sm text-slate-500 px-3 py-4">Không có dữ liệu cho {dayLbl(foodDay)}.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-white/80 backdrop-blur sticky top-0 z-20 border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 sticky left-0 z-30 bg-white/80 backdrop-blur border-r border-slate-200">Phòng ban</th>
                      {deptFoodPivot.foods.map((f) => (
                        <th key={f} className="px-3 py-2 text-right font-semibold text-slate-700 whitespace-nowrap" title={f}>{f}</th>
                      ))}
                      <th className="px-3 py-2 text-right font-semibold text-slate-700 whitespace-nowrap">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptFoodPivot.rows.map((row, i) => (
                      <tr key={row.departmentName + i} className={i % 2 ? "bg-slate-50/60" : "bg-white"}>
                        <td className="px-3 py-2 text-slate-800 font-medium sticky left-0 z-10 bg-inherit border-r border-slate-100">
                          <div className="truncate" title={row.departmentName}>{row.departmentName}</div>
                        </td>
                        {deptFoodPivot.foods.map((f) => (
                          <NumericCell key={f} value={row[f] || 0} />
                        ))}
                        <td className="px-3 py-2 text-right font-semibold text-slate-900">
                          {Number(row.total || 0).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td className="px-3 py-2 sticky left-0 bg-slate-50 font-semibold text-slate-800 border-r border-slate-200">Tổng</td>
                      {deptFoodPivot.foods.map((f) => (
                        <td key={f} className="px-3 py-2 text-right font-semibold text-slate-800">
                          {Number(deptFoodPivot.totalsRow[f] || 0).toLocaleString("vi-VN")}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {Number(deptFoodPivot.totalsRow.total || 0).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </Card>

          {/* Highlights + Peak hour + Department summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="grid grid-cols-1 gap-4">
              <Card className="p-4">
                <div className="grid grid-cols-1 gap-4">
                  <FoodHighlight title={branchMode==='split' ? "Món×Branch nhiều nhất" : "Món nhiều nhất tuần"} food={data.topFood} />
                  <FoodHighlight title={branchMode==='split' ? "Món×Branch ít nhất" : "Món ít nhất tuần"}  food={data.leastFood} />
                </div>
              </Card>
              <StatCard
                icon={<FiClock />}
                label="Giờ cao điểm đặt"
                value={data.leadTime ? `${data.leadTime.hourSlot}h (${data.leadTime.totalOrders} suất)` : "—"}
                tone="violet"
              />
            </div>

            <Card className="p-4 lg:col-span-2">
              <div className="text-base font-semibold text-slate-800 mb-3">Phân bổ theo phòng ban (người & suất)</div>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-700">
                      {["Phòng ban", "Tổng user", "Đã đặt (user)", "Chưa đặt (user)", "Tổng suất (tuần)"].map((h) => (
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
                        <td className="px-3 py-2 border-b border-slate-100 font-medium">{r.totalMeals}</td>
                      </tr>
                    ))}
                    {(!data.byDepartment || !data.byDepartment.length) && (
                      <tr><td className="px-3 py-3 text-slate-500" colSpan={5}>Không có dữ liệu</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Stacked Bar Chart */}
          <Card className="p-4">
            <div className="text-base font-semibold text-slate-800 mb-4">
              Biểu đồ đặt món theo ngày trong tuần (stacked theo {branchMode==='split' ? 'món×branch' : 'món'})
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
