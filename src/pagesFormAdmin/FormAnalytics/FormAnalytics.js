// src/pages/admin/Analytics.jsx
import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { FaSpinner } from 'react-icons/fa';
import { BASE_URL } from '~/config';
import http from '~/api/http';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend
} from 'recharts';

const fmtDateVN = (s) => (s ? new Date(s).toLocaleDateString('vi-VN') : '');

export default function Analytics() {
  const [loading, setLoading] = useState(true);

  const [forms, setForms] = useState([]);
  const [formId, setFormId] = useState(null);

  const [summary, setSummary] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [q, setQ] = useState('');

  const [csatQid, setCsatQid] = useState(null);
  const [choiceQid, setChoiceQid] = useState(null);
  const [csatDetail, setCsatDetail] = useState(null);
  const [choiceDetail, setChoiceDetail] = useState(null);

  const params = useMemo(() => {
    const p = {};
    if (from) p.from = from.toISOString();
    if (to) p.to = to.toISOString();
    if (q.trim()) p.q = q.trim();
    return p;
  }, [from, to, q]);

  const loadForms = async () => {
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/forms`, { params: { activeOnly: 1 } });
      const list = rs.data || [];
      const sorted = [...list].sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      });
      if (sorted.length === 0) {
        const rs2 = await http.get(`${BASE_URL}/api/forms`, { params: { activeOnly: 0 } });
        const all = rs2.data || [];
        all.sort((a, b) => {
          const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return tb - ta;
        });
        setForms(all);
        setFormId(all[0]?.formId || null);
      } else {
        setForms(sorted);
        setFormId(sorted[0].formId);
      }
    } catch (e) {
      console.error(e);
      alert('Không tải được danh sách biểu mẫu cho dropdown.');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (currentFormId) => {
    if (!currentFormId) return;
    setLoading(true);
    try {
      const [sumRs, metaRs] = await Promise.all([
        http.get(`${BASE_URL}/api/forms/${currentFormId}/analytics/summary`, { params }),
        http.get(`${BASE_URL}/api/forms/${currentFormId}`)
      ]);
      setSummary(sumRs.data || null);
      setQuestions(metaRs.data?.questions || []);
    } catch (e) {
      console.error(e);
      alert('Không tải được dữ liệu thống kê.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionDetail = async (qid, setter) => {
    if (!qid || !formId) { setter(null); return; }
    try {
      const rs = await http.get(`${BASE_URL}/api/bm/forms/${formId}/analytics/questions/${qid}`, { params });
      setter(rs.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadForms(); }, []);
  useEffect(() => {
    setCsatQid(null); setChoiceQid(null);
    setCsatDetail(null); setChoiceDetail(null);
    if (formId) loadSummary(formId);
    // eslint-disable-next-line
  }, [formId, params]);
  useEffect(() => { loadQuestionDetail(csatQid, setCsatDetail); /* eslint-disable-next-line */ }, [csatQid, params, formId]);
  useEffect(() => { loadQuestionDetail(choiceQid, setChoiceDetail); /* eslint-disable-next-line */ }, [choiceQid, params, formId]);

  const csatList = useMemo(() => (summary?.csat || []), [summary]);
  const choiceList = useMemo(() => (summary?.topOptions || []), [summary]);

  return (
    <div className="neu-page p-3 md:p-6">
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-2">
            <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang xử lý…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="neu-section">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <div className="text-2xl font-bold text-slate-800">Thống kê & trực quan hóa</div>
              <div className="mt-1 text-slate-600 text-sm">
                Biểu mẫu: {formId ? (
                  <>#{formId} — <span className="font-medium">{forms.find(f => f.formId === formId)?.title || ''}</span></>
                ) : '—'}
              </div>
            </div>

            {/* Form selector + Filters (inline) */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 w-full md:w-auto">
              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-600 mb-1">Chọn biểu mẫu</div>
                <select
                  className="neu-select"
                  value={formId || ''}
                  onChange={(e) => setFormId(e.target.value ? Number(e.target.value) : null)}
                >
                  {forms.length === 0 && <option value="">— Không có biểu mẫu —</option>}
                  {forms.map(f => (
                    <option key={f.formId} value={f.formId}>
                      {f.title} {f.isActive ? '' : '(đã đóng)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="text-[12px] text-slate-600 mb-1">Tìm nhanh (Họ tên/SĐT/Bộ phận)</div>
                <input
                  className="neu-input"
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                  placeholder="VD: 090..., Nguyễn Văn A, KCS"
                />
              </div>

              <div>
                <div className="text-[12px] text-slate-600 mb-1">Từ ngày</div>
                <DatePicker
                  selected={from}
                  onChange={setFrom}
                  dateFormat="dd/MM/yyyy"
                  className="neu-input"
                  locale={vi}
                  placeholderText="Chọn"
                />
              </div>
              <div>
                <div className="text-[12px] text-slate-600 mb-1">Đến ngày</div>
                <DatePicker
                  selected={to}
                  onChange={setTo}
                  dateFormat="dd/MM/yyyy"
                  className="neu-input"
                  locale={vi}
                  placeholderText="Chọn"
                />
              </div>
            </div>

            <div className="flex gap-2 md:ml-4">
              <button
                onClick={() => loadSummary(formId)}
                disabled={!formId}
                className={`neu-btn neu-btn--primary ${!formId ? 'opacity-60 cursor-not-allowed' : ''}`}
                title={!formId ? 'Chưa chọn biểu mẫu' : 'Áp dụng bộ lọc'}
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div className="neu-stat">
          <div className="text-slate-500 text-sm">Tổng lượt trả lời</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {summary?.totals?.responses ?? '—'}
          </div>
        </div>
        <div className="neu-stat">
          <div className="text-slate-500 text-sm">Hợp lệ</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {summary?.totals?.validResponses ?? '—'}
          </div>
        </div>
        <div className="neu-stat">
          <div className="text-slate-500 text-sm">Khoảng thời gian</div>
          <div className="font-medium text-slate-800 mt-1">
            {from ? fmtDateVN(from) : '—'} → {to ? fmtDateVN(to) : '—'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="neu-section">
          <div className="font-semibold text-slate-800 mb-3">Lượt trả lời theo ngày</div>
          <div className="neu-chart h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.byDay || []}>
                <defs>
                  <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.25}/>
                    <stop offset="95%" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#c)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neu-section">
          <div className="font-semibold text-slate-800 mb-3">Lượt trả lời theo tuần</div>
          <div className="neu-chart h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.byWeek || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekStart" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Số lượt" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CSAT */}
      <div className="neu-section mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="font-semibold text-slate-800">Phân bố thang điểm (Linear scale)</div>
          <select
            className="neu-select md:w-[360px]"
            value={csatQid || ''}
            onChange={(e)=>setCsatQid(e.target.value ? Number(e.target.value) : null)}
            disabled={!formId}
          >
            <option value="">— Chọn câu —</option>
            {questions
              .filter(q => q.questionType === 'linear_scale')
              .map(q => <option key={q.questionId} value={q.questionId}>{q.questionText}</option>)}
          </select>
        </div>

        {csatDetail ? (
          <>
            <div className="text-slate-600 text-sm mt-3">
              Điểm trung bình: <span className="font-semibold text-slate-800">{csatDetail.avg}</span> (min {csatDetail.min} → max {csatDetail.max})
            </div>
            <div className="neu-chart h-64 mt-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(csatDetail.dist || []).map(d => ({ label: String(d.value), count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số lượt" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="text-slate-500 text-sm mt-3">Chọn 1 câu linear_scale để xem chi tiết.</div>
        )}
      </div>

      {/* Top lựa chọn */}
      <div className="neu-section">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="font-semibold text-slate-800">Top lựa chọn (Multiple/Checkbox/Dropdown)</div>
          <select
            className="neu-select md:w-[360px]"
            value={choiceQid || ''}
            onChange={(e)=>setChoiceQid(e.target.value ? Number(e.target.value) : null)}
            disabled={!formId}
          >
            <option value="">— Chọn câu —</option>
            {questions
              .filter(q => ['multiple_choice','checkboxes','dropdown'].includes(q.questionType))
              .map(q => <option key={q.questionId} value={q.questionId}>{q.questionText}</option>)}
          </select>
        </div>

        {choiceDetail ? (
          <div className="neu-chart h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(choiceDetail.items || []).map(i => ({ option: i.option, count: i.count }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="option" tick={{ fontSize: 12 }} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Số lượt" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-slate-500 text-sm mt-3">Chọn 1 câu tùy chọn để xem top.</div>
        )}
      </div>
    </div>
  );
}
