// src/pages/admin/ResponseDetail.jsx
import React, { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { Link, useParams } from 'react-router-dom';
import { BASE_URL } from '~/config/index';
import http from '~/api/http';
import routes from '~/config/routes';

const fmt = (s) => (s ? new Date(s).toLocaleString('vi-VN') : '');

function InfoRow({ label, children, full = false }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-[12px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-800 break-words">{children || '—'}</div>
    </div>
  );
}

function AnswerCard({ a }) {
  const empty =
    !a.answerText &&
    (a.answerNumber === null || a.answerNumber === undefined) &&
    (!a.answerOptions || a.answerOptions.length === 0);

  return (
    <div className="neu-section">
      <div className="font-medium text-slate-800">{a.questionText}</div>
      {a.helpText && <div className="text-slate-500 text-sm mt-1">{a.helpText}</div>}
      <div className="mt-3">
        {a.answerText && (
          <div className="neu-chip neu-chip--ghost whitespace-pre-line">{a.answerText}</div>
        )}
        {a.answerNumber !== null && a.answerNumber !== undefined && (
          <div className="neu-chip neu-chip--primary">Điểm: {a.answerNumber}</div>
        )}
        {a.answerOptions && a.answerOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {a.answerOptions.map((x, i) => (
              <span key={i} className="neu-chip">{x}</span>
            ))}
          </div>
        )}
        {empty && <div className="text-slate-500 italic">— Không trả lời —</div>}
      </div>
    </div>
  );
}

export default function ResponseDetail() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null); // { response, answers: [], formTitle }

  const load = async () => {
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/responses/${id}`);
      setData(rs.data);
    } catch (e) {
      console.error(e);
      alert('Không tải được chi tiết câu trả lời.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const toggleValid = async () => {
    try {
      setLoading(true);
      await http.patch(`${BASE_URL}/api/responses/${id}/valid`, {
        isValid: data.response.isValid ? 0 : 1
      });
      await load();
    } catch (e) {
      console.error(e);
      alert('Không cập nhật trạng thái.');
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <div className="neu-page p-6">
        {loading ? (
          <div className="flex items-center gap-2">
            <FaSpinner className="animate-spin" /> Đang tải…
          </div>
        ) : (
          'Không có dữ liệu'
        )}
      </div>
    );
  }

  const r = data.response;

  return (
    <div className="neu-page p-3 md:p-6 bg-gradient-to-b from-violet-50/70 via-white to-fuchsia-50/40 min-h-screen">
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-2">
            <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang xử lý…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 max-w-6xl mx-auto">
        <div>
          <div className="text-2xl font-bold text-slate-800">Chi tiết câu trả lời</div>
          <div className="mt-1 text-slate-600 text-sm">
            Biểu mẫu: <span className="font-medium">{data.formTitle || '—'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`${routes.adminFormResponses}/${r.formId}`} className="neu-btn neu-btn--ghost">
            Quay lại
          </Link>
          <button
            onClick={toggleValid}
            className={`neu-btn ${r.isValid ? 'neu-btn--danger' : 'neu-btn--primary'}`}
          >
            {r.isValid ? 'Invalidate' : 'Restore'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 max-w-6xl mx-auto">
        <div className="neu-section">
          <div className="text-sm text-slate-500">Mã phản hồi</div>
          <div className="text-base font-semibold text-slate-800 mt-1">#{r.responseId}</div>
        </div>
        <div className="neu-section">
          <div className="text-sm text-slate-500">Số câu đã trả lời</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{(data.answers || []).length}</div>
        </div>
        <div className="neu-section">
          <div className="text-sm text-slate-500">Trạng thái</div>
          <div className="text-base font-semibold text-emerald-700 mt-1">{r.isValid ? "Hợp lệ" : "Đã hủy"}</div>
        </div>
      </div>

      {/* Meta */}
      <div className="neu-section max-w-6xl mx-auto border-violet-100">
        <div className="flex items-center justify-between mb-3">
          <div className="text-slate-700 font-semibold">Thông tin gửi</div>
          {r.isValid ? (
            <span className="neu-chip neu-chip--success">Hợp lệ</span>
          ) : (
            <span className="neu-chip">Đã huỷ hiệu lực</span>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <InfoRow label="Thời gian">{fmt(r.createdAt)}</InfoRow>
          <InfoRow label="Trạng thái">{r.isValid ? 'Hợp lệ' : 'Đã huỷ'}</InfoRow>
          <InfoRow label="Họ tên">{r.respondentName}</InfoRow>
          <InfoRow label="SĐT">{r.respondentPhone}</InfoRow>
          <InfoRow label="Bộ phận">{r.respondentDept}</InfoRow>
          <InfoRow label="IP">{r.clientIp}</InfoRow>
          <InfoRow label="User-Agent" full>
            {r.clientUa}
          </InfoRow>
        </div>
      </div>

      {/* Answers */}
      <div className="mt-4 grid gap-3 max-w-6xl mx-auto">
        {(data.answers || []).map((a) => (
          <AnswerCard key={a.questionId} a={a} />
        ))}
        {(!data.answers || data.answers.length === 0) && (
          <div className="text-slate-500">Không có câu trả lời nào.</div>
        )}
      </div>
    </div>
  );
}
