// src/pages/admin/ResponseList.jsx
import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { FaSpinner } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import { BASE_URL } from '~/config/index';
import http from '~/api/http';
import routes from '~/config/routes';

const fmt = (s) => (s ? new Date(s).toLocaleString('vi-VN') : '');

export default function ResponseList() {
  const { id } = useParams(); // formId
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // filters
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [q, setQ] = useState(''); // name/phone/dept

  // paging
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const params = useMemo(() => {
    const p = { page, pageSize };
    if (q.trim()) p.q = q.trim();
    if (from) p.from = from.toISOString();
    if (to) p.to = to.toISOString();
    return p;
  }, [q, from, to, page]);

  const load = async () => {
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/forms/${id}/responses`, { params });
      setRows(rs.data?.data || []);
      setTotal(rs.data?.total || 0);
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách câu trả lời.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params, id]);

  const toggleValid = async (r) => {
    try {
      setLoading(true);
      await http.patch(`${BASE_URL}/api/responses/${r.responseId}/valid`, { isValid: r.isValid ? 0 : 1 });
      load();
    } catch (e) {
      console.error(e);
      alert('Không cập nhật trạng thái.');
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    try {
      setLoading(true);
      const rs = await http.post(
        `${BASE_URL}/api/forms/${id}/responses/export?fmt=csv`,
        { q: q || null, from: from?.toISOString() || null, to: to?.toISOString() || null },
        { responseType: 'blob' }
      );
      const blob = new Blob([rs.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `responses_form_${id}_${dateStr}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Xuất CSV thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const toPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="neu-page p-3 md:p-6 bg-gradient-to-b from-violet-50/70 via-white to-fuchsia-50/40 min-h-screen">
      {/* Overlay */}
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-2">
            <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang xử lý…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 max-w-7xl mx-auto">
        <div>
          <div className="text-2xl font-bold text-slate-800">Câu trả lời</div>
          <div className="mt-1 text-slate-600 text-sm">Theo biểu mẫu #{id} • Quản lý phản hồi và kiểm duyệt dữ liệu</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="neu-btn neu-btn--primary">
            Xuất CSV
          </button>
          <Link to={`${routes.adminFormEdit}/${id}`} className="neu-btn neu-btn--ghost">
            Quay lại Form
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="neu-section mb-4 max-w-7xl mx-auto border-violet-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tìm nhanh (Họ tên / SĐT / Bộ phận)</label>
            <input
              className="neu-input mt-1"
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="VD: 090..., KCS, Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Từ ngày</label>
            <DatePicker
              selected={from}
              onChange={(d) => { setPage(1); setFrom(d); }}
              dateFormat="dd/MM/yyyy"
              className="neu-input mt-1"
              locale={vi}
              placeholderText="Chọn ngày"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Đến ngày</label>
            <DatePicker
              selected={to}
              onChange={(d) => { setPage(1); setTo(d); }}
              dateFormat="dd/MM/yyyy"
              className="neu-input mt-1"
              locale={vi}
              placeholderText="Chọn ngày"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 max-w-7xl mx-auto">
        <div className="neu-section">
          <div className="text-sm text-slate-500">Tổng phản hồi</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{total}</div>
        </div>
        <div className="neu-section">
          <div className="text-sm text-slate-500">Hợp lệ</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{rows.filter((x) => !!x.isValid).length}</div>
        </div>
        <div className="neu-section">
          <div className="text-sm text-slate-500">Đang hiển thị trang</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{rows.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="neu-section p-0 overflow-auto max-w-7xl mx-auto border-violet-100">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-[1]">
            <tr className="bg-[var(--neu-card)] text-slate-600">
              <th className="text-left px-3 py-2">Thời gian</th>
              <th className="text-left px-3 py-2">Họ tên</th>
              <th className="text-left px-3 py-2">SĐT</th>
              <th className="text-left px-3 py-2">Bộ phận</th>
              <th className="text-left px-3 py-2">Trạng thái</th>
              <th className="text-right px-3 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.responseId}
                className={`border-t border-transparent ${
                  i % 2 ? 'bg-white/30' : ''
                }`}
              >
                <td className="px-3 py-2">{fmt(r.createdAt)}</td>
                <td className="px-3 py-2">{r.respondentName || '—'}</td>
                <td className="px-3 py-2">{r.respondentPhone || '—'}</td>
                <td className="px-3 py-2">{r.respondentDept || '—'}</td>
                <td className="px-3 py-2">
                  {r.isValid ? (
                    <span className="neu-chip neu-chip--success">Hợp lệ</span>
                  ) : (
                    <span className="neu-chip">Đã huỷ</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`${routes.adminFormResponseDetail}/${r.responseId}`} className="neu-btn neu-btn--ghost">
                      Xem
                    </Link>
                    <button
                      onClick={() => toggleValid(r)}
                      className={`neu-btn ${r.isValid ? 'neu-btn--danger' : 'neu-btn--primary'}`}
                    >
                      {r.isValid ? 'Invalidate' : 'Restore'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-slate-500">
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-sm text-slate-600">
          {total > 0 ? `Hiển thị ${rows.length} / ${total} bản ghi` : '—'}
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`neu-btn neu-btn--ghost ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Trước
          </button>
          <div className="text-sm">{page} / {toPages}</div>
          <button
            disabled={page >= toPages}
            onClick={() => setPage((p) => Math.min(toPages, p + 1))}
            className={`neu-btn neu-btn--ghost ${page >= toPages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
