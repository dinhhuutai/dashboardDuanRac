import axios from 'axios';
import React, { useEffect, useState } from 'react';
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

import { BASE_URL } from '~/config/index';

const departmentsList = [
  'Điều hành',
  'Chất lượng',
  'Bán hàng',
  'Kế hoạch',
  'IT - Bảo trì',
  'Văn phòng',
  'Vật tư',
  'Tổ canh hàng',
  'Tổ bổ sung',
  'Tổ mẫu',
  'Tổ 3',
  'Tổ 4',
  'Tổ 5',
  'Tổ sửa hàng',
  'Tổ ép',
  'Tổ logo',
  'Kcs',
  'Chụp khung',
  'Pha màu',
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);

  const [todayStats, setTodayStats] = useState({
    totalWeighings: 38,
    totalWeight: 542.3,
    mostActiveDepartment: 'Tổ 3',
    mostCommonTrashType: 'Băng keo',
    totalAccounts: 27,
  });

  const [departmentData, setDepartmentData] = useState([]);
  const [trashTypeData, setTrashTypeData] = useState([]);

  const [selectedDep1, setSelectedDep1] = useState('Tổ 3');
  const [selectedDep2, setSelectedDep2] = useState('Tổ 4');

  useEffect(() => {
    setLoading(true);

    const fetchTodayStats = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/statistics/today`);
        if (res.data.status === 'success') {
          setTodayStats(res.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu hôm nay:', error.message);
      }
    };

    const fetchDepartmentData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/statistics/weight-by-department`);
        if (res.data.status === 'success') {
          setDepartmentData(res.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu phòng ban:', error.message);
      }
    };

    const fetchTrashTypeData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/statistics/today-percentage`);
        if (res.data.status === 'success') {
          setTrashTypeData(res.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu loại rác:', error.message);
      }
    };

    fetchTodayStats();
    fetchDepartmentData();
    fetchTrashTypeData();

    setLoading(false);
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#0088FE'];

  return (
    <div className="relative">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}

      <div className="p-4 pb-[60px] bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-center">📈 Thống kê cân rác hôm nay</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Lượt cân</div>
            <div className="text-2xl font-bold text-blue-600">{todayStats.totalWeighings}</div>
          </div>
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Tổng (kg)</div>
            <div className="text-2xl font-bold text-green-600">{parseFloat(todayStats?.totalWeight?.toFixed(2))}</div>
          </div>
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Bộ phận nhiều nhất</div>
            <div className="text-xl font-bold text-purple-600">{todayStats.mostActiveDepartment}</div>
          </div>
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Loại rác nhiều nhất</div>
            <div className="text-xl font-bold text-pink-600">{todayStats.mostCommonTrashType}</div>
          </div>
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Tài khoản</div>
            <div className="text-2xl font-bold text-gray-800">{todayStats.totalAccounts}</div>
          </div>
        </div>

        {/* Biểu đồ Line so sánh khối lượng 2 bộ phận */}
        <div className="mt-8">
          <div className="w-full h-96 p-4 bg-white rounded-xl shadow flex flex-col">
            <h2 className="text-xl font-bold text-center mb-2 h-12">
              So sánh khối lượng rác: {selectedDep1} vs {selectedDep2}
            </h2>
            <div className="flex flex-wrap gap-4 items-center justify-center mb-4">
              <select
                value={selectedDep1}
                onChange={(e) => setSelectedDep1(e.target.value)}
                className="border border-gray-300 rounded p-2"
              >
                <option value="">Chọn tổ 1</option>
                {departmentsList.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>

              <select
                value={selectedDep2}
                onChange={(e) => setSelectedDep2(e.target.value)}
                className="border border-gray-300 rounded p-2"
              >
                <option value="">Chọn tổ 2</option>
                {departmentsList.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
            </div>

            <WeightComparisonChart department1={selectedDep1} department2={selectedDep2} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-[35px]">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-center">Khối lượng theo bộ phận</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="weight" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-center">Tỉ lệ loại rác hôm nay</h2>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={trashTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {trashTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const formatDayOfWeek = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { weekday: 'short' }); // => "Th 2", "Th 3"
};

const WeightComparisonChart = ({ department1, department2 }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/trash-weighings/compare-weight-by-department`, {
          params: { department1, department2 },
        });

        // Format lại ngày và số liệu
        const formattedData = res.data.chartData.map((item) => ({
          date: formatDayOfWeek(item.date),
          [department1]: parseFloat(item[department1]),
          [department2]: parseFloat(item[department2]),
        }));

        setChartData(formattedData);
      } catch (err) {
        console.error('Lỗi lấy dữ liệu biểu đồ:', err);
      }
    };

    if (department1 && department2) {
      fetchChartData();
    }
  }, [department1, department2]);

  return (
    <div className="flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis unit=" kg" />
          <Tooltip formatter={(value) => `${parseFloat(value).toFixed(2)} kg`} />
          <Legend />
          <Line type="monotone" dataKey={department1} stroke="#8884d8" strokeWidth={2} />
          <Line type="monotone" dataKey={department2} stroke="#82ca9d" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Analytics;
