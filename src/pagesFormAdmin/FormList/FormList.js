// src/pages/admin/FormList.jsx
import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { FaSpinner, FaPlus, FaSearch, FaTrash, FaCopy } from 'react-icons/fa';
import { BASE_URL } from '~/config/index';
import http from '~/api/http';
import routes from '~/config/routes';
import { NavLink } from 'react-router-dom';

const fmt = (s) => (s ? new Date(s).toLocaleString('vi-VN') : '');
const normalize = (s='') => s.toLowerCase().trim();

export default function FormList() {
  const [loading, setLoading] = useState(true);
  const [allRows, setAllRows] = useState([]);   // dữ liệu gốc (server)
  const [rows, setRows] = useState([]);         // dữ liệu đã lọc (client)
  const [total, setTotal] = useState(0);

  // filters (client)
  const [q, setQ] = useState('');
  const [activeOnly, setActiveOnly] = useState('all'); // 'all' | '1' | '0'
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);

  // paging (client)
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // tải tất cả form (isDeleted=0) để lọc client
  const load = async () => {
    setLoading(true);
    try {
      // lấy tất cả (kể cả tắt) -> activeOnly=0
      const rs = await http.get(`${BASE_URL}/api/forms`, { params: { activeOnly: 0 } });
      const data = Array.isArray(rs.data) ? rs.data : [];
      setAllRows(data);
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách biểu mẫu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // lọc + sắp xếp + phân trang (client)
  useEffect(() => {
    const nq = normalize(q);
    const start = from ? new Date(from).setHours(0,0,0,0) : null;
    const end   = to   ? new Date(to).setHours(23,59,59,999) : null;

    let filtered = allRows.slice();

    // search theo title/code
    if (nq) {
      filtered = filtered.filter(r => {
        const t = normalize(r.title || '');
        const c = normalize(r.code || '');
        return t.includes(nq) || c.includes(nq);
      });
    }

    // filter trạng thái
    if (activeOnly === '1') filtered = filtered.filter(r => !!r.isActive);
    if (activeOnly === '0') filtered = filtered.filter(r => !r.isActive);

    // filter theo createdAt
    if (start) filtered = filtered.filter(r => r.createdAt ? new Date(r.createdAt) >= new Date(start) : false);
    if (end)   filtered = filtered.filter(r => r.createdAt ? new Date(r.createdAt) <= new Date(end)   : false);

    // sort mới cập nhật lên trước
    filtered.sort((a,b)=>{
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

    setTotal(filtered.length);

    // paginate
    const fromIdx = (page - 1) * pageSize;
    const pageRows = filtered.slice(fromIdx, fromIdx + pageSize);
    setRows(pageRows);
  }, [allRows, q, activeOnly, from, to, page]);

  const toPages = Math.max(1, Math.ceil(total / pageSize));

  const resetToFirstPage = (fn) => (...args) => { setPage(1); fn(...args); };

  const togglePublish = async (form) => {
    try {
      setLoading(true);
      await http.patch(`${BASE_URL}/api/forms/${form.formId}/publish`, { isActive: form.isActive ? 0 : 1 });
      await load();
    } catch (e) {
      console.error(e);
      alert('Không cập nhật được trạng thái công bố.');
      setLoading(false);
    }
  };

  const onDuplicate = async (form) => {
    if (!window.confirm(`Nhân bản biểu mẫu "${form.title}"?`)) return;
    try {
      setLoading(true);
      const rs = await http.post(`${BASE_URL}/api/forms/${form.formId}/duplicate`);
      const link = `${window.location.origin}/forms/${rs.data.code}`;
      alert(`Đã nhân bản: ${rs.data.title}\nLink: ${link}`);
      await load();
    } catch (e) {
      console.error(e);
      alert('Không nhân bản được biểu mẫu.');
      setLoading(false);
    }
  };

  const onDelete = async (form) => {
    if (!window.confirm(`Xoá (mềm) biểu mẫu "${form.title}"?`)) return;
    try {
      setLoading(true);
      await http.delete(`${BASE_URL}/api/forms/${form.formId}`);
      await load();
    } catch (e) {
      console.error(e);
      alert('Không xoá được biểu mẫu.');
      setLoading(false);
    }
  };

  const copyCode = async (r) => {
    try {
      await navigator.clipboard.writeText(r.code || '');
      alert('Đã copy code!');
    } catch {
      alert('Copy không thành công');
    }
  };
  const copyLink = async (r) => {
    try {
      const link = `${window.location.origin}${routes.form}/${r.code}`;
      await navigator.clipboard.writeText(link);
      alert('Đã copy link!');
    } catch {
      alert('Copy không thành công');
    }
  };

  return (
    <div className="neu-page p-3 md:p-6">
      {/* Overlay */}
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang tải…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">Quản lý biểu mẫu</div>
          <div className="text-slate-600 text-sm">Danh sách, tìm kiếm, lọc & thao tác nhanh</div>
        </div>
        <a href="/admin/forms/create" className="neu-btn neu-btn--primary">
          <FaPlus /> Tạo mới
        </a>
      </div>

      {/* Filters */}
      <div className="neu-section mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tìm theo tiêu đề / code</label>
            <div className="relative mt-1">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="neu-input pl-9"
                placeholder="VD: khao sat, ... hoặc code"
                value={q}
                onChange={resetToFirstPage((e)=>setQ(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Trạng thái</label>
            <select
              className="neu-select mt-1"
              value={activeOnly}
              onChange={resetToFirstPage((e)=>setActiveOnly(e.target.value))}
            >
              <option value="all">Tất cả</option>
              <option value="1">Đang công bố</option>
              <option value="0">Đã tắt</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Từ ngày</label>
              <DatePicker
                selected={from}
                onChange={resetToFirstPage(setFrom)}
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
                onChange={resetToFirstPage(setTo)}
                dateFormat="dd/MM/yyyy"
                className="neu-input mt-1"
                locale={vi}
                placeholderText="Chọn ngày"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="neu-section p-0 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-slate-600">
              <th className="text-left px-3 py-3">Tiêu đề</th>
              <th className="text-left px-3 py-3">Link</th>
              <th className="text-left px-3 py-3">Trạng thái</th>
              <th className="text-left px-3 py-3">Tạo lúc</th>
              <th className="text-left px-3 py-3">Cập nhật</th>
              <th className="text-right px-3 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.formId} className="neu-row--table border-t">
                <td className="px-3 py-3 align-top">
                  <div className="font-medium">{r.title}</div>
                  {r.description && <div className="text-slate-500 text-xs line-clamp-1">{r.description}</div>}
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center gap-2">
                    <a
                      href={`${routes.form}/${r.code}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline"
                    >
                      {r.code}
                    </a>
                    <button className="neu-btn neu-btn--ghost" onClick={()=>copyLink(r)} title="Copy code">
                      <FaCopy />
                    </button>
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  {r.isActive ? (
                    <span className="neu-chip neu-chip--success">Đang công bố</span>
                  ) : (
                    <span className="neu-chip">Đã tắt</span>
                  )}
                </td>
                <td className="px-3 py-3 align-top">{fmt(r.createdAt)}</td>
                <td className="px-3 py-3 align-top">{fmt(r.updatedAt)}</td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center justify-end gap-2">
                    <NavLink to={`${routes.adminFormEdit}/${r.formId}`} className="neu-btn neu-btn--ghost" title="Sửa">
                      Sửa
                    </NavLink>
                    <NavLink to={`${routes.adminFormResponses}/${r.formId}`} className="neu-btn neu-btn--ghost" title="Câu trả lời">
                      Trả lời
                    </NavLink>
                    <button onClick={() => onDuplicate(r)} className="neu-btn neu-btn--ghost" title="Nhân bản">
                      <FaCopy />
                    </button>
                    <button
                      onClick={() => togglePublish(r)}
                      className={`neu-btn ${r.isActive ? 'neu-btn--primary' : 'neu-btn--muted'}`}
                      title={r.isActive ? 'Tắt công bố' : 'Công bố'}
                    >
                      {r.isActive ? 'Tắt' : 'Bật'}
                    </button>
                    <button onClick={() => onDelete(r)} className="neu-btn neu-btn--danger" title="Xoá (soft)">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td className="px-3 py-10 text-center text-slate-500" colSpan={6}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 neu-section flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {total > 0 ? `Hiển thị ${rows.length} / ${total} biểu mẫu` : '—'}
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
