import React, { useEffect, useMemo, useState } from "react";
import { FaChartBar, FaListUl, FaPlus, FaSpinner, FaWpforms } from "react-icons/fa";
import { Link } from "react-router-dom";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import routes from "~/config/routes";

export default function FormDashboard() {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rs = await http.get(`${BASE_URL}/api/forms`, { params: { activeOnly: 0 } });
        const data = Array.isArray(rs.data) ? rs.data : rs.data?.data || [];
        data.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        setForms(data);
      } catch (e) {
        console.error(e);
        alert("Không tải được dashboard biểu mẫu.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = forms.length;
    const active = forms.filter((x) => !!x.isActive).length;
    return { total, active, inactive: total - active };
  }, [forms]);

  return (
    <div className="neu-page p-3 md:p-6">
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-2">
            <FaSpinner className="animate-spin text-violet-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang tải dashboard...</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="neu-section mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FaWpforms className="text-violet-600" /> Dashboard biểu mẫu nội bộ
              </div>
              <div className="text-slate-600 text-sm mt-1">
                Quản lý nhanh tạo biểu mẫu, theo dõi danh sách và phân tích phản hồi.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="neu-btn neu-btn--primary" to={routes.adminFormCreate}>
                <FaPlus /> Tạo biểu mẫu
              </Link>
              <Link className="neu-btn neu-btn--ghost" to={routes.adminFormList}>
                <FaListUl /> Danh sách
              </Link>
              <Link className="neu-btn neu-btn--muted" to={routes.adminFormAnalytics}>
                <FaChartBar /> Analytics
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="neu-stat">
            <div className="text-sm text-slate-500">Tổng biểu mẫu</div>
            <div className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</div>
          </div>
          <div className="neu-stat">
            <div className="text-sm text-slate-500">Đang công bố</div>
            <div className="text-3xl font-bold text-emerald-700 mt-1">{stats.active}</div>
          </div>
          <div className="neu-stat">
            <div className="text-sm text-slate-500">Đang tắt</div>
            <div className="text-3xl font-bold text-amber-700 mt-1">{stats.inactive}</div>
          </div>
        </div>

        <div className="neu-section mt-4">
          <div className="font-semibold text-slate-800 mb-3">Biểu mẫu cập nhật gần đây</div>
          <div className="grid gap-2">
            {forms.slice(0, 8).map((f) => (
              <div key={f.formId} className="neu-row between">
                <div>
                  <div className="font-medium text-slate-900">{f.title}</div>
                  <div className="text-xs text-slate-500">{f.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`neu-chip ${f.isActive ? "neu-chip--success" : ""}`}>
                    {f.isActive ? "Đang công bố" : "Đã tắt"}
                  </span>
                  <Link className="neu-btn neu-btn--ghost" to={`${routes.adminFormEdit}/${f.formId}`}>
                    Mở
                  </Link>
                </div>
              </div>
            ))}
            {forms.length === 0 && !loading && (
              <div className="text-slate-500 text-sm">Chưa có biểu mẫu nào.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
