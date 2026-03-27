import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTaskManagerRole } from "~/redux/slices/authSlice";
import { userRoleTaskManager } from "~/redux/selectors";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Dashboard() {
  const dispatch = useDispatch();
  const roleTaskManager = useSelector(userRoleTaskManager);
  const [loading, setLoading] = useState(false);
  const [myTotal, setMyTotal] = useState(0);
  const [teamTotal, setTeamTotal] = useState(0);
  const [departmentTotal, setDepartmentTotal] = useState(0);
  const [companyTotal, setCompanyTotal] = useState(0);
  const [projectsTotal, setProjectsTotal] = useState(0);

  useEffect(() => {
    dispatch(fetchTaskManagerRole());
  }, [dispatch]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [my, projects] = await Promise.all([
          http.get(`${BASE_URL}/api/task-management/my`, { params: { page: 1, pageSize: 1 } }),
          http.get(`${BASE_URL}/api/task-management/projects/my`, { params: { page: 1, pageSize: 1 } }),
        ]);
        setMyTotal(my.data?.totalRows || 0);
        setProjectsTotal(projects.data?.totalRows || 0);
      } catch {}

      try {
        const rs = await http.get(`${BASE_URL}/api/task-management/team`, { params: { page: 1, pageSize: 1 } });
        setTeamTotal(rs.data?.totalRows || 0);
      } catch {}
      try {
        const rs = await http.get(`${BASE_URL}/api/task-management/department`, { params: { page: 1, pageSize: 1 } });
        setDepartmentTotal(rs.data?.totalRows || 0);
      } catch {}
      try {
        const rs = await http.get(`${BASE_URL}/api/task-management/company`, { params: { page: 1, pageSize: 1 } });
        setCompanyTotal(rs.data?.totalRows || 0);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const roleText = useMemo(
    () => (roleTaskManager ? `${roleTaskManager.name} (${roleTaskManager.code})` : "Nhân viên"),
    [roleTaskManager]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Dashboard quản lý công việc</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tổng quan nhanh theo quyền truy cập hiện tại. Chạm vào từng khu vực để đi sâu theo phạm vi.
        </p>
        <div className="mt-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs text-indigo-700">
          Vai trò: {roleText}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Việc của tôi" value={myTotal} />
        <StatCard label="Theo team" value={teamTotal} />
        <StatCard label="Theo phòng" value={departmentTotal} />
        <StatCard label="Toàn công ty" value={companyTotal} />
        <StatCard label="Dự án của tôi" value={projectsTotal} />
      </div>

      {loading && <div className="text-sm text-slate-500">Đang cập nhật số liệu...</div>}
    </div>
  );
}

export default Dashboard;

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value || 0}</div>
    </div>
  );
}
