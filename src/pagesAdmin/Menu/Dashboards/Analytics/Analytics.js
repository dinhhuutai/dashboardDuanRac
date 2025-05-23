import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [loading, setLoading] = useState(true);

  const [todayStats, setTodayStats] = useState({
    totalWeighings: 38,
    totalWeight: 542.3,
    mostActiveDepartment: 'Tổ 3',
    mostCommonTrashType: 'Băng keo',
    totalAccounts: 27,
  });

  const [departmentData, setDepartmentData] = useState([
    { name: 'T3', weight: 35 },
    { name: 'T4', weight: 50 },
    { name: 'T5', weight: 112 },
    { name: 'Bổ Sung', weight: 80 },
    { name: 'Mẫu', weight: 60 },
    { name: 'Canh hàng', weight: 25 },
    { name: 'Pha màu', weight: 29 },
    { name: 'Chụp khuôn', weight: 14 },
    { name: 'Kế hoạch', weight: 56 },
    { name: 'Bán hàng', weight: 95 },
    { name: 'Logo', weight: 13 },
    { name: 'Chất lượng', weight: 15 },
    { name: 'Kcs', weight: 4 },
    { name: 'Điều hành', weight: 7 },
    { name: 'Ép', weight: 36 },
    { name: 'Sửa hàng', weight: 48 },
    { name: 'Vật tư', weight: 22 },
    { name: 'IT - Bảo trì', weight: 25 },
    { name: 'Văn phòng', weight: 38 },
  ]);

  const [trashTypeData, setTrashTypeData] = useState([
    { name: 'Rác sinh hoạt', value: 90 },
    { name: 'Băng keo', value: 120 },
    { name: 'Giẻ lau dính mực', value: 80 },
    { name: 'Lụa căng khung', value: 60 },
    { name: 'Mực in thải', value: 55 },
    { name: 'Keo bàn thải', value: 30 },
    { name: 'Vụn logo', value: 57 },
  ]);

  useEffect(() => {
    setLoading(true);

    const fetchTodayStats = async () => {
      try {
        const res = await axios.get(
          'https://duanrac-api-node-habqhehnc6a2hkaq.southeastasia-01.azurewebsites.net/api/statistics/today',
        );
        if (res.data.status === 'success') {
          setTodayStats(res.data.data);
        }
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu hôm nay:', error.message);
      }
    };

    const fetchDepartmentData = async () => {
      try {
        const res = await axios.get(
          'https://duanrac-api-node-habqhehnc6a2hkaq.southeastasia-01.azurewebsites.net/api/statistics/weight-by-department',
        );
        if (res.data.status === 'success') {
          setDepartmentData(res.data.data);
        }
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu phòng ban:', error.message);
      }
    };

    const fetchTrashTypeData = async () => {
      try {
        const res = await axios.get(
          'https://duanrac-api-node-habqhehnc6a2hkaq.southeastasia-01.azurewebsites.net/api/statistics/today-percentage',
        );
        if (res.data.status === 'success') {
          setTrashTypeData(res.data.data);
        }
      } catch (error) {
        setLoading(false);
        console.error('Lỗi khi tải dữ liệu loại rác:', error.message);
      }
    };

    // Gọi lần lượt từng API
    fetchTodayStats();
    fetchDepartmentData();
    fetchTrashTypeData();

    setLoading(false);
  }, []);

  const COLORS = [
    '#8884d8', // tím
    '#82ca9d', // xanh lá nhạt
    '#ffc658', // vàng cam
    '#ff8042', // cam đậm
    '#a4de6c', // xanh lá sáng
    '#d0ed57', // vàng chanh nhạt
    '#0088FE', // xanh dương tươi
  ];

  return (
    <div className="relative">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        </div>
      )}

      <div className="p-4 pb-[60px] bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-center">📈 Thống kê cân rác hôm nay</h1>

        {/* Tổng quan 5 thông số */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Lượt cân</div>
            <div className="text-2xl font-bold text-blue-600">{todayStats.totalWeighings}</div>
          </div>
          <div className="bg-white shadow p-4 rounded-lg text-center">
            <div className="text-[16px] font-semibold text-gray-600">Tổng (kg)</div>
            <div className="text-2xl font-bold text-green-600">{todayStats.totalWeight}</div>
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

        {/* Biểu đồ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Thêm biểu đồ nếu muốn */}
      </div>
    </div>
  );
};

export default Analytics;
