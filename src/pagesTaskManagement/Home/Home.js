import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import http from "~/api/http";
import config, { BASE_URL } from "~/config";

export default function TaskManagementHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myTasks: 0,
    projects: 0,
    pendingRequests: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [my, pj] = await Promise.all([
          http.get(`${BASE_URL}/api/task-management/my`, { params: { page: 1, pageSize: 1 } }),
          http.get(`${BASE_URL}/api/task-management/projects/my`, { params: { page: 1, pageSize: 1 } }),
        ]);
        setStats((s) => ({
          ...s,
          myTasks: my.data?.totalRows || 0,
          projects: pj.data?.totalRows || 0,
        }));
      } catch {}
      try {
        const rs = await http.get(`${BASE_URL}/api/task-management/requests/pending`);
        setStats((s) => ({ ...s, pendingRequests: (rs.data?.data || []).length }));
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
        <h1 className="text-xl font-bold text-slate-900">Home quản lý công việc & dự án</h1>
        <p className="mt-1 text-sm text-slate-500">Đi nhanh tới màn bạn cần và theo dõi số liệu cơ bản.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickCard title="Công việc" value={stats.myTasks} action="Mở việc của tôi" onClick={() => navigate(config.routes.taskManagementMyTasks)} />
        <QuickCard title="Dự án" value={stats.projects} action="Mở danh sách dự án" onClick={() => navigate(config.routes.taskManagementProjectList)} />
        <QuickCard title="Đề nghị chờ duyệt" value={stats.pendingRequests} action="Mở trang Request" onClick={() => navigate(config.routes.taskManagementRequests)} />
      </div>
    </div>
  );
}

function QuickCard({ title, value, action, onClick }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-1 text-3xl font-bold text-slate-900">{value || 0}</div>
      <div className="mt-2 text-xs text-indigo-700 font-semibold">{action}</div>
    </button>
  );
}
