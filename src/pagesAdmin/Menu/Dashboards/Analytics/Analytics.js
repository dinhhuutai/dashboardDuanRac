import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { BsSpeedometer2, BsBarChart, BsExclamationOctagon, BsTrash, BsPeople } from 'react-icons/bs';

import { BASE_URL } from '~/config/index';
import http from '~/api/http';
import TimeDrillChart from './TimeDrillChart';

// Danh sách phòng ban để chọn so sánh
const departmentsList = [
  'C1',
  'C2',
  'C3',
  'C4',
  'Mẫu',
  'Chụp khuôn',
  'Kcs',
  'Sửa hàng',
  'Pha màu',
];

// palette mềm hiện đại
const COLORS = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#3b82f6', '#eab308'];

const formatDayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { weekday: 'short' });
};

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div
    className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm hover:shadow-md transition"
    role="group"
  >
    <div
      className="absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-10"
      style={{ background: `radial-gradient(closest-side, ${accent} 40%, transparent)` }}
    />
    <div className="p-5 flex items-center gap-4">
      <div className="grid place-items-center h-11 w-11 rounded-xl" style={{ background: `${accent}1a`, color: accent }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-slate-500 text-[13px]">{label}</div>
        <div className="text-xl font-semibold text-slate-800">{value}</div>
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-5 animate-pulse">
    <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
    <div className="h-6 w-16 bg-slate-200 rounded"></div>
  </div>
);

const SectionCard = ({ title, children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm ${className}`}>
    <div className="px-5 pt-5">
      <h2 className="text-lg font-semibold text-slate-800 text-center md:text-left">{title}</h2>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm text-[12px]">
      {label && <div className="font-medium text-slate-700 mb-1">{label}</div>}
      {payload.map((p, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded"
            style={{ background: p.color || p.payload?.fill || '#64748b' }}
          />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-medium text-slate-800">
            {Number(p.value).toLocaleString('vi-VN')}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

const WeightComparisonChart = ({ department1, department2 }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const go = async () => {
      if (!department1 || !department2) return;
      setLoading(true);
      try {
        const res = await http.get(`${BASE_URL}/trash-weighings/compare-weight-by-department`, {
          params: { department1, department2 },
        });
        const formatted = (res.data?.chartData || []).map((item) => ({
          date: formatDayOfWeek(item.date),
          [department1]: parseFloat(item[department1]) || 0,
          [department2]: parseFloat(item[department2]) || 0,
        }));
        setChartData(formatted);
      } catch (e) {
        setChartData([]);
        console.error('Lỗi biểu đồ so sánh:', e?.message);
      } finally {
        setLoading(false);
      }
    };
    go();
  }, [department1, department2]);

  return (
    <div className="h-72 md:h-80">
      {loading ? (
        <div className="h-full w-full grid place-items-center">
          <div className="animate-spin h-8 w-8 border-2 border-slate-300 border-t-emerald-500 rounded-full" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis unit=" kg" stroke="#64748b" />
            <Tooltip content={<CustomTooltip unit="kg" />} />
            <Legend />
            <Line type="monotone" dataKey={department1} stroke="url(#gradA)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={department2} stroke="url(#gradB)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const [todayStats, setTodayStats] = useState({
    totalWeighings: 0,
    totalWeight: 0,
    mostActiveDepartment: '-',
    mostCommonTrashType: '-',
    totalAccounts: 0,
  });

  const [departmentData, setDepartmentData] = useState([]);
  const [trashTypeData, setTrashTypeData] = useState([]);

  const [selectedDep1, setSelectedDep1] = useState('C1');
  const [selectedDep2, setSelectedDep2] = useState('C2');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [todayRes, depRes, trashRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/statistics/today`),
          axios.get(`${BASE_URL}/api/statistics/weight-by-department`),
          axios.get(`${BASE_URL}/api/statistics/today-percentage`),
        ]);

        if (todayRes.data?.status === 'success') setTodayStats(todayRes.data.data);
        if (depRes.data?.status === 'success') setDepartmentData(depRes.data.data || []);
        if (trashRes.data?.status === 'success') setTrashTypeData(trashRes.data.data || []);
      } catch (e) {
        console.error('Lỗi lấy dữ liệu:', e?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLoadingOverlay(true), 250);
    } else {
      setShowLoadingOverlay(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  const donutTotal = useMemo(
    () => trashTypeData.reduce((sum, d) => sum + Number(d.value || 0), 0),
    [trashTypeData]
  );

  const formatNow = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  return (
    <div className="relative">
      {showLoadingOverlay && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm grid place-items-center z-50">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Header title */}
        <div className="px-4 md:px-6 pt-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-2xl border border-emerald-200/40 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4 md:p-5 text-center shadow-sm">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">📈 Thống kê cân rác hôm nay</h1>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="px-4 md:px-6 mt-5">
          <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <StatCard icon={BsSpeedometer2} label="Lượt cân" value={todayStats.totalWeighings} accent="#3b82f6" />
                <StatCard
                  icon={BsBarChart}              // <-- đã sửa: thay BsScale bằng BsBarChart
                  label="Tổng (kg)"
                  value={`${Number(todayStats.totalWeight || 0).toFixed(1)} (${formatNow()})`}
                  accent="#22c55e"
                />
                <StatCard
                  icon={BsExclamationOctagon}
                  label="Bộ phận nhiều nhất"
                  value={todayStats.mostActiveDepartment}
                  accent="#ef4444"
                />
                <StatCard icon={BsTrash} label="Loại rác nhiều nhất" value={todayStats.mostCommonTrashType} accent="#f59e0b" />
                <StatCard icon={BsPeople} label="Tài khoản" value={todayStats.totalAccounts} accent="#06b6d4" />
              </>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6 mt-6">
          <div className="mx-auto max-w-7xl">
            <SectionCard title="Phân tích theo thời gian (Ngày/Tuần/Tháng)">
              <TimeDrillChart />
            </SectionCard>
          </div>
        </div>

        {/* Line compare */}
        <div className="px-4 md:px-6 mt-6">
          <div className="mx-auto max-w-7xl">
            <SectionCard title={`So sánh khối lượng rác: ${selectedDep1} vs ${selectedDep2}`} className="p-0">
              <div className="px-5 pb-2 flex flex-wrap items-center justify-center gap-3">
                <select
                  value={selectedDep1}
                  onChange={(e) => setSelectedDep1(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {departmentsList.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedDep2}
                  onChange={(e) => setSelectedDep2(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {departmentsList.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
                    </option>
                  ))}
                </select>
              </div>
              <WeightComparisonChart department1={selectedDep1} department2={selectedDep2} />
            </SectionCard>
          </div>
        </div>

        {/* Bar + Donut */}
        <div className="px-4 md:px-6 mt-6 pb-14">
          <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Khối lượng theo bộ phận">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip content={<CustomTooltip unit="kg" />} />
                    <Legend />
                    <Bar dataKey="weight" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

            <SectionCard title="Tỉ lệ loại rác hôm nay">
              <div className="h-[380px]">
                <ResponsiveContainer width="110%" height="100%">
                  <PieChart>
                    <Pie
                      data={trashTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {trashTypeData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* tổng giữa donut */}
              <div className="mt-3 text-center">
                <div className="inline-flex items-baseline gap-1 rounded-full border border-slate-200 px-3 py-1 bg-white">
                  <span className="text-slate-500 text-sm">Tổng khối lượng</span>
                  <span className="font-semibold text-slate-800">{donutTotal.toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
