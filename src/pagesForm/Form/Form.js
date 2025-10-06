// src/pages/form/Form.jsx
import 'react-datepicker/dist/react-datepicker.css';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { BASE_URL } from '~/config/index';
import http from '~/api/http';
import FloatingLanterns from "~/components/FloatingLanterns";

/**
 * Form trả lời – UI hiện đại & thân thiện
 *
 * Nâng cấp chính:
 * - Header gradient, badges (bắt buộc, thời gian đóng nếu có)
 * - Progress mini (đếm câu bắt buộc đã/đủ)
 * - Sticky submit bar (desktop & mobile)
 * - Thông báo lỗi tinh tế, chỉ hiển thị sau khi bấm Gửi lần đầu
 * - Lưu bản nháp localStorage, tự khôi phục theo formId
 * - Layout gọn, thẻ câu hỏi có hover, focus-ring rõ ràng
 */

export default function Form({ formId: formIdProp, code: codeProp }) {
  const params = useParams?.() || {};
  const codeFromRoute = params.id; // route kiểu /forms/:code
  const [code] = useState(codeProp || codeFromRoute || null);

  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]); // dùng khi không có formId
  const [formId, setFormId] = useState(formIdProp || null);
  const [meta, setMeta] = useState(null); // { form, sections, questions }
  const [who, setWho] = useState({ name: '', phone: '', dept: '' });
  const [values, setValues] = useState({}); // { [questionId]: value }
  const [sent, setSent] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const firstLoad = useRef(true);

  // lấy formId từ query ?id=... nếu chưa có
  useEffect(() => {
    if (!formIdProp && !formId) {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      if (id) setFormId(Number(id));
    }
  }, [formIdProp, formId]);

  // tải danh sách form đang mở hoặc chi tiết form
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (code) {
          const rs = await http.get(`${BASE_URL}/api/forms/code/${code}`);
          setMeta(rs.data);
          setFormId(rs.data?.form?.formId || null);
        } else if (formId) {
          const rs = await http.get(`${BASE_URL}/api/forms/${formId}`);
          setMeta(rs.data);
        } else {
          // fallback: chọn form active từ danh sách
          const rs = await http.get(`${BASE_URL}/api/forms`, { params: { activeOnly: 1 } });
          setForms(rs.data || []);
        }
      } catch (e) {
        console.error(e);
        alert('Không tải được dữ liệu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [code, formId]);

  // == Khôi phục & Lưu bản nháp localStorage theo formId
  useEffect(() => {
    if (!meta?.form?.formId) return;
    const key = `form_draft_${meta.form.formId}`;
    // chỉ khôi phục 1 lần khi vừa có meta
    if (firstLoad.current) {
      firstLoad.current = false;
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft?.who) setWho(draft.who);
          if (draft?.values) setValues(draft.values);
        }
      } catch {}
    }
    const handle = setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ who, values }));
      } catch {}
    }, 800);
    return () => clearInterval(handle);
  }, [meta?.form?.formId, who, values]);

  // kiểm tra hợp lệ
  const mustName = meta?.form?.requireName;
  const mustPhone = meta?.form?.requirePhone;
  const mustDept = meta?.form?.requireDept;

  const requiredQuestions = useMemo(
    () => (meta?.questions || []).filter((q) => q.isRequired),
    [meta]
  );

  const missingRequired = useMemo(() => {
    const miss = [];
    for (const q of requiredQuestions) {
      const v = values[q.questionId];
      if (q.questionType === 'short_text' || q.questionType === 'long_text') {
        if (!v || !String(v).trim()) miss.push(q.questionId);
      } else if (q.questionType === 'linear_scale') {
        if (v === undefined || v === null || v === '') miss.push(q.questionId);
      } else {
        // multiple_choice / checkboxes / dropdown
        if (!v || (Array.isArray(v) ? v.length === 0 : !String(v).trim())) miss.push(q.questionId);
      }
    }
    return new Set(miss);
  }, [requiredQuestions, values]);

  const canSubmit = useMemo(() => {
    if (!meta?.form) return false;
    if (mustName && !who.name.trim()) return false;
    if (mustPhone && !who.phone.trim()) return false;
    if (mustDept && !who.dept.trim()) return false;
    if (missingRequired.size > 0) return false;
    return true;
  }, [meta, who, missingRequired]);

  const answeredRequired = requiredQuestions.length - missingRequired.size;
  const totalRequired = requiredQuestions.length;

  const handleChange = (q, next) => {
    setValues((prev) => ({ ...prev, [q.questionId]: next }));
  };

  const submit = async () => {
    setTriedSubmit(true);
    if (!canSubmit) return;
    try {
      setLoading(true);

      // map values -> answers
      const answers = [];
      for (const q of meta.questions) {
        const v = values[q.questionId];
        if (v === undefined) continue;

        if (q.questionType === 'short_text' || q.questionType === 'long_text') {
          answers.push({ questionId: q.questionId, answerText: String(v) });
        } else if (q.questionType === 'linear_scale') {
          answers.push({ questionId: q.questionId, answerNumber: Number(v) });
        } else if (q.questionType === 'checkboxes') {
          // v: array optionValue
          answers.push({ questionId: q.questionId, answerOptions: v });
        } else if (q.questionType === 'multiple_choice' || q.questionType === 'dropdown') {
          // v: single optionValue
          answers.push({ questionId: q.questionId, answerOptions: [v] });
        }
      }

      const payload = {
        respondent: {
          name: who.name || null,
          phone: who.phone || null,
          department: who.dept || null,
        },
        answers,
        clientMeta: { ua: navigator.userAgent || '' },
      };

      const rs = await http.post(`${BASE_URL}/api/responses/${meta.form.formId}/submit`, payload);
      if (rs.data?.ok) {
        setSent(true);
        // clear bản nháp
        try { localStorage.removeItem(`form_draft_${meta.form.formId}`); } catch {}
        // reset nếu muốn
        // setValues({}); setWho({name:'', phone:'', dept:''}); setTriedSubmit(false);
      } else {
        alert(rs.data?.message || 'Gửi không thành công!');
      }
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || 'Có lỗi khi gửi biểu mẫu.');
    } finally {
      setLoading(false);
    }
  };

  // ==== UI chọn form khi chưa có id
  if (!formId && !loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Chọn biểu mẫu</h1>
        <div className="grid gap-3">
          {(forms || []).map((f) => (
            <button
              key={f.formId}
              onClick={() => setFormId(f.formId)}
              className="text-left rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition flex items-start justify-between gap-3"
            >
              <div>
                <div className="font-semibold text-slate-900">{f.title}</div>
                {f.description && (
                  <div className="text-slate-600 mt-1 line-clamp-2">{f.description}</div>
                )}
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Đang mở</span>
            </button>
          ))}
          {(!forms || forms.length === 0) && (
            <div className="text-slate-500">Hiện chưa có biểu mẫu nào đang mở.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-slate-50 to-white">
      <div className="px-4 md:px-6 max-w-4xl mx-auto pb-28 md:pb-36">
        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <FaSpinner className="animate-spin text-emerald-600 text-4xl" />
              <span className="text-slate-700 text-sm font-medium">Đang xử lý…</span>
            </div>
          </div>
        )}

        {/* CONTENT */}
        {meta && !sent && (
          <>
            {/* Header */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 md:p-7 bg-[radial-gradient(circle_at_10%_10%,#ecfdf5,transparent_40%),radial-gradient(circle_at_90%_20%,#eff6ff,transparent_35%)]">
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                      {meta.form.title}
                    </h1>
                    {totalRequired > 0 && (
                      <span className="shrink-0 text-xs md:text-sm px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Bắt buộc: {answeredRequired}/{totalRequired}
                      </span>
                    )}
                  </div>
                  {meta.form.description && (
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                      {meta.form.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {meta.form.requireName && (
                      <Badge>Yêu cầu họ tên</Badge>
                    )}
                    {meta.form.requirePhone && (
                      <Badge>Yêu cầu số điện thoại</Badge>
                    )}
                    {meta.form.requireDept && <Badge>Yêu cầu bộ phận</Badge>}
                    {meta.form.closeAt && (
                      <Badge tone="blue">
                        Đóng: {fmtDateTime(meta.form.closeAt)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin người điền */}
            <Card className="mt-5">
              <h2 className="text-lg font-semibold">Thông tin người điền</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <Field
                  label={
                    <>
                      Họ và tên {meta.form.requireName && <Required />}
                    </>
                  }
                  value={who.name}
                  onChange={(v) => setWho({ ...who, name: v })}
                  placeholder="VD: Nguyễn Văn A"
                  invalid={triedSubmit && mustName && !who.name.trim()}
                />
                <Field
                  label={
                    <>
                      Số điện thoại {meta.form.requirePhone && <Required />}
                    </>
                  }
                  value={who.phone}
                  onChange={(v) => setWho({ ...who, phone: v })}
                  placeholder="VD: 0901 234 567"
                  inputMode="tel"
                  invalid={triedSubmit && mustPhone && !who.phone.trim()}
                />
                <Field
                  label={
                    <>
                      Bộ phận {meta.form.requireDept && <Required />}
                    </>
                  }
                  value={who.dept}
                  onChange={(v) => setWho({ ...who, dept: v })}
                  placeholder="VD: KCS / Pha màu / ... "
                  invalid={triedSubmit && mustDept && !who.dept.trim()}
                />
              </div>
            </Card>

            {/* Sections (giới thiệu) */}
            {(meta.sections || []).length > 0 && (
              <div className="mt-4 space-y-3">
                {meta.sections.map((s) => (
                  <Card key={s.sectionId}>
                    {s.title && <div className="font-semibold">{s.title}</div>}
                    {s.description && (
                      <div className="text-slate-700 mt-1 whitespace-pre-line">{s.description}</div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* Questions */}
            <div className="mt-4 space-y-3">
              {(meta.questions || []).map((q) => (
                <Card key={q.questionId} hover>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-slate-900">
                      {q.questionText} {q.isRequired && <Required />}
                    </div>
                  </div>
                  {q.helpText && (
                    <div className="text-slate-500 text-sm mt-1">{q.helpText}</div>
                  )}

                  {/* Render input theo loại câu hỏi */}
                  {q.questionType === 'short_text' && (
                    <input
                      className={cx(
                        'w-full border rounded-xl p-2 mt-3 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                        triedSubmit && missingRequired.has(q.questionId) && 'border-rose-400'
                      )}
                      value={values[q.questionId] || ''}
                      onChange={(e) => handleChange(q, e.target.value)}
                      placeholder="Nhập câu trả lời..."
                    />
                  )}

                  {q.questionType === 'long_text' && (
                    <div className="mt-3">
                      <textarea
                        rows={4}
                        className={cx(
                          'w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                          triedSubmit && missingRequired.has(q.questionId) && 'border-rose-400'
                        )}
                        value={values[q.questionId] || ''}
                        onChange={(e) => handleChange(q, e.target.value)}
                        placeholder="Nhập câu trả lời..."
                      />
                      <CharCount value={values[q.questionId] || ''} />
                    </div>
                  )}

                  {q.questionType === 'linear_scale' && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>{q.scaleMinLabel || q.scaleMin}</span>
                        <span>{q.scaleMaxLabel || q.scaleMax}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-5 md:flex md:flex-wrap gap-2">
                        {Array.from({ length: (q.scaleMax ?? 5) - (q.scaleMin ?? 1) + 1 }).map((_, idx) => {
                          const val = (q.scaleMin ?? 1) + idx;
                          const active = Number(values[q.questionId]) === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              className={cx(
                                'px-3 py-2 rounded-xl border transition',
                                active
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white hover:bg-slate-50'
                              )}
                              onClick={() => handleChange(q, val)}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                      {triedSubmit && missingRequired.has(q.questionId) && (
                        <div className="text-rose-600 text-sm mt-1">Vui lòng chọn một mức.</div>
                      )}
                    </div>
                  )}

                  {(q.questionType === 'multiple_choice' || q.questionType === 'dropdown') && (
                    <div className="mt-3">
                      {q.questionType === 'dropdown' ? (
                        <select
                          className={cx(
                            'w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                            triedSubmit && missingRequired.has(q.questionId) && 'border-rose-400'
                          )}
                          value={values[q.questionId] || ''}
                          onChange={(e) => handleChange(q, e.target.value)}
                        >
                          <option value="">-- Chọn --</option>
                          {(q.options || []).map((opt) => (
                            <option key={opt.optionId} value={opt.optionValue || opt.optionLabel}>
                              {opt.optionLabel}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="grid gap-2 mt-1">
                          {(q.options || []).map((opt) => {
                            const v = values[q.questionId] || '';
                            const val = opt.optionValue || opt.optionLabel;
                            const checked = v === val;
                            return (
                              <label
                                key={opt.optionId}
                                className={cx(
                                  'flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition',
                                  checked ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'
                                )}
                              >
                                <input
                                  type="radio"
                                  className="accent-emerald-600"
                                  name={`q_${q.questionId}`}
                                  checked={checked}
                                  onChange={() => handleChange(q, val)}
                                />
                                <span>{opt.optionLabel}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                      {q.allowOtherOption && (
                        <div className="mt-2">
                          <input
                            className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Khác (nhập tại đây)…"
                            onBlur={(e) => {
                              const txt = e.target.value.trim();
                              if (txt) handleChange(q, txt);
                            }}
                          />
                        </div>
                      )}
                      {triedSubmit && missingRequired.has(q.questionId) && (
                        <div className="text-rose-600 text-sm mt-1">Vui lòng chọn một phương án.</div>
                      )}
                    </div>
                  )}

                  {q.questionType === 'checkboxes' && (
                    <div className="mt-3 grid gap-2">
                      {(q.options || []).map((opt) => {
                        const cur = Array.isArray(values[q.questionId]) ? values[q.questionId] : [];
                        const val = opt.optionValue || opt.optionLabel;
                        const checked = cur.includes(val);
                        return (
                          <label
                            key={opt.optionId}
                            className={cx(
                              'flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition',
                              checked ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'
                            )}
                          >
                            <input
                              type="checkbox"
                              className="accent-emerald-600"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) handleChange(q, [...cur, val]);
                                else handleChange(q, cur.filter((x) => x !== val));
                              }}
                            />
                            <span>{opt.optionLabel}</span>
                          </label>
                        );
                      })}
                      {q.allowOtherOption && (
                        <input
                          className="w-full border rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Khác (nhập tại đây)…"
                          onBlur={(e) => {
                            const txt = e.target.value.trim();
                            if (!txt) return;
                            const cur = Array.isArray(values[q.questionId]) ? values[q.questionId] : [];
                            if (!cur.includes(txt)) handleChange(q, [...cur, txt]);
                            e.target.value = '';
                          }}
                        />
                      )}
                      {triedSubmit && missingRequired.has(q.questionId) && (
                        <div className="text-rose-600 text-sm">Vui lòng chọn ít nhất một phương án.</div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Khoảng trống cho sticky bar */}
            <div className="h-24 md:h-28" />

            {/* Sticky Submit Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <div className="mx-auto max-w-4xl px-4 md:px-6">
                <div className="mb-3 rounded-2xl border border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg">
                  <div className="p-3 md:p-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-slate-600">
                      {totalRequired > 0 ? (
                        <span>
                          Hoàn thành bắt buộc: <b>{answeredRequired}</b>/{totalRequired}
                        </span>
                      ) : (
                        <span>Kiểm tra lại câu trả lời trước khi gửi.</span>
                      )}
                    </div>
                    <button
                      disabled={!canSubmit}
                      onClick={submit}
                      className={cx(
                        'px-5 py-2 rounded-xl text-white font-medium transition',
                        canSubmit
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                          : 'bg-slate-400 cursor-not-allowed'
                      )}
                    >
                      Gửi biểu mẫu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sent state */}
        {sent && (
          <div className="mt-10">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-emerald-900 shadow-sm">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="text-2xl" />
                <div>
                  <div className="text-xl md:text-2xl font-semibold">Cảm ơn bạn đã gửi biểu mẫu! ✅</div>
                  <div className="mt-2">Chúng tôi đã ghi nhận câu trả lời của bạn.</div>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => {
                        setSent(false);
                        setValues({});
                        setWho({ name: '', phone: '', dept: '' });
                        setTriedSubmit(false);
                      }}
                    >
                      Gửi thêm phản hồi
                    </button>
                    <a
                      className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-white"
                      href="/"
                    >
                      Về trang chủ
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== Tiện ích UI ====================== */
function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition',
        hover && 'hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      {children}
    </div>
  );
}

function Badge({ children, tone = 'emerald' }) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
  };
  return (
    <span className={cx('text-xs px-2.5 py-1 rounded-full border', toneMap[tone] || toneMap.emerald)}>
      {children}
    </span>
  );
}

function Field({ label, value, onChange, placeholder, inputMode, invalid }) {
  return (
    <label className="block">
      <div className="text-sm text-slate-700">{label}</div>
      <input
        className={cx(
          'w-full border rounded-xl p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500',
          invalid && 'border-rose-400'
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
      />
      {invalid && <div className="text-rose-600 text-xs mt-1">Trường này là bắt buộc.</div>}
    </label>
  );
}

function CharCount({ value }) {
  const len = String(value).length;
  return <div className="mt-1 text-xs text-slate-500">{len} ký tự</div>;
}

function Required() {
  return <span className="text-rose-600" title="Bắt buộc">*</span>;
}

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function fmtDateTime(dt) {
  try {
    const d = new Date(dt);
    return d.toLocaleString('vi-VN');
  } catch {
    return String(dt);
  }
}
