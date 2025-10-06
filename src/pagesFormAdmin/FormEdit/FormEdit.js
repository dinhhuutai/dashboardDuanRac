// src/pages/admin/FormEdit.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSpinner, FaEye, FaArrowUp, FaArrowDown, FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import { BASE_URL } from '~/config/index';
import http from '~/api/http';
import routes from '~/config/routes';

const TYPES = [
  { id: 'short_text', label: 'Văn bản ngắn' },
  { id: 'long_text', label: 'Văn bản dài' },
  { id: 'linear_scale', label: 'Thang điểm (1-5)' },
  { id: 'multiple_choice', label: 'Chọn một' },
  { id: 'checkboxes', label: 'Chọn nhiều' },
  { id: 'dropdown', label: 'Dropdown' },
  { id: 'prioritized_list', label: 'Danh sách ưu tiên' },
];

// ========= atoms =========
const Card = ({ children, className = '' }) => <div className={`neu-section ${className}`}>{children}</div>;
const NeuBtn = ({ children, className = '', ...rest }) => (
  <button className={`neu-btn ${className}`} {...rest}>{children}</button>
);
const Field = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <div className="text-sm font-medium text-slate-700">{label}</div>
    {children}
  </label>
);

export default function FormEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState(null);
  const [savingMeta, setSavingMeta] = useState(false);

  // form meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flags, setFlags] = useState({
    allowMultiple: false,
    allowAnonymous: true,
    requireName: true,
    requirePhone: true,
    requireDept: true,
  });
  const [windowAt, setWindowAt] = useState({ startAt: '', endAt: '' });

  // sections editor
  const [secTitle, setSecTitle] = useState('');
  const [secDesc, setSecDesc] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null); // null = đóng

  // question editor
  const [qEditing, setQEditing] = useState(null);

  const previewLink = useMemo(
    () => (meta?.form?.code ? `${routes.form}/${meta.form.code}` : null),
    [meta]
  );

  // load meta
  const load = async () => {
    setLoading(true);
    try {
      const rs = await http.get(`${BASE_URL}/api/forms/${id}`);
      setMeta(rs.data);
      setTitle(rs.data.form.title || '');
      setDescription(rs.data.form.description || '');
      setFlags({
        allowMultiple: !!rs.data.form.allowMultiple,
        allowAnonymous: !!rs.data.form.allowAnonymous,
        requireName: !!rs.data.form.requireName,
        requirePhone: !!rs.data.form.requirePhone,
        requireDept: !!rs.data.form.requireDept,
      });
      setWindowAt({
        startAt: rs.data.form.startAt ? rs.data.form.startAt.slice(0, 16) : '',
        endAt: rs.data.form.endAt ? rs.data.form.endAt.slice(0, 16) : '',
      });
    } catch (e) {
      console.error(e);
      alert('Không tải được biểu mẫu.');
      navigate('/admin/forms');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  // save meta
  const saveMeta = async () => {
    if (!title.trim()) return alert('Tiêu đề không được để trống');
    try {
      setSavingMeta(true);
      await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}`, {
        title,
        description,
        ...flags,
        startAt: windowAt.startAt || null,
        endAt: windowAt.endAt || null,
      });
      await load();
    } catch (e) {
      console.error(e);
      alert('Không lưu được thông tin biểu mẫu.');
    } finally {
      setSavingMeta(false);
    }
  };

  // ====== Sections ======
  const upDownSection = async (section, dir) => {
    const list = meta.sections.slice().sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const idx = list.findIndex(s => s.sectionId === section.sectionId);
    if (idx < 0) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === list.length - 1) return;
    const swapWith = dir === 'up' ? list[idx - 1] : list[idx + 1];

    try {
      setLoading(true);
      await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}/sections/${section.sectionId}`, {
        newDisplayOrder: swapWith.displayOrder,
      });
      await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}/sections/${swapWith.sectionId}`, {
        newDisplayOrder: section.displayOrder,
      });
      await load();
    } catch (e) {
      console.error(e);
      alert('Không đổi thứ tự section.');
      setLoading(false);
    }
  };

  const startEditSection = (s) => {
    setEditingSectionId(s?.sectionId ?? 0); // 0 = thêm mới
    setSecTitle(s?.title || '');
    setSecDesc(s?.description || '');
  };
  const cancelEditSection = () => {
    setEditingSectionId(null);
    setSecTitle(''); setSecDesc('');
  };
  const saveSection = async () => {
    if (!secTitle.trim()) return alert('Nhập tiêu đề section');
    try {
      setLoading(true);
      if (editingSectionId && editingSectionId !== 0) {
        await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}/sections/${editingSectionId}`, {
          title: secTitle,
          description: secDesc,
        });
      } else {
        await http.post(`${BASE_URL}/api/forms/${meta.form.formId}/sections`, {
          title: secTitle,
          description: secDesc,
        });
      }
      cancelEditSection();
      await load();
    } catch (e) {
      console.error(e);
      alert('Không lưu được section.');
      setLoading(false);
    }
  };
  const delSection = async (s) => {
    if (!window.confirm('Xoá section này? (Các câu hỏi trong section sẽ được chuyển về “không thuộc section”)')) return;
    try {
      setLoading(true);
      await http.delete(`${BASE_URL}/api/forms/${meta.form.formId}/sections/${s.sectionId}`);
      await load();
    } catch (e) {
      console.error(e);
      alert('Không xoá được section.');
      setLoading(false);
    }
  };

  // ====== Questions ======
  const startNewQuestion = () => {
    setQEditing({
      questionId: null,
      sectionId: null,
      questionType: 'short_text',
      questionText: '',
      helpText: '',
      isRequired: false,
      scaleMin: 1, scaleMax: 5,
      scaleMinLabel: '', scaleMaxLabel: '',
      allowOtherOption: false,
      options: [],
    });
  };
  const startEditQuestion = (q) => {
    setQEditing({
      questionId: q.questionId,
      sectionId: q.sectionId,
      questionType: q.questionType,
      questionText: q.questionText,
      helpText: q.helpText || '',
      isRequired: !!q.isRequired,
      scaleMin: q.scaleMin ?? 1,
      scaleMax: q.scaleMax ?? 5,
      scaleMinLabel: q.scaleMinLabel || '',
      scaleMaxLabel: q.scaleMaxLabel || '',
      allowOtherOption: !!q.allowOtherOption,
      options: (q.options || []).slice().sort((a,b)=> (a.displayOrder??0)-(b.displayOrder??0)),
    });
  };
  const cancelEditQuestion = () => setQEditing(null);

  const pushOpt = () => {
    setQEditing(prev => ({
      ...prev,
      options: [...(prev.options || []), { optionLabel: '', optionValue: '', displayOrder: (prev.options?.length || 0) + 1 }]
    }));
  };
  const upDownOpt = (idx, dir) => {
    setQEditing(prev => {
      const opts = prev.options.slice();
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= opts.length) return prev;
      [opts[idx].displayOrder, opts[swap].displayOrder] = [opts[swap].displayOrder, opts[idx].displayOrder];
      opts.sort((a,b)=> (a.displayOrder??0)-(b.displayOrder??0));
      return { ...prev, options: opts };
    });
  };
  const delOpt = (idx) => {
    setQEditing(prev => {
      const opts = prev.options.slice();
      opts.splice(idx, 1);
      return { ...prev, options: opts.map((o, i) => ({ ...o, displayOrder: i + 1 })) };
    });
  };

  const saveQuestion = async () => {
    if (!qEditing.questionText.trim()) return alert('Nhập nội dung câu hỏi');
    if (['multiple_choice','checkboxes','dropdown'].includes(qEditing.questionType)) {
      if (!qEditing.options || qEditing.options.length === 0) return alert('Thêm ít nhất 1 lựa chọn');
    }
    try {
      setLoading(true);
      const payload = {
        sectionId: qEditing.sectionId || null,
        questionType: qEditing.questionType,
        questionText: qEditing.questionText,
        helpText: qEditing.helpText || null,
        isRequired: !!qEditing.isRequired,
        displayOrder: null, // server tự set
        scaleMin: qEditing.questionType === 'linear_scale' ? qEditing.scaleMin : null,
        scaleMax: qEditing.questionType === 'linear_scale' ? qEditing.scaleMax : null,
        scaleMinLabel: qEditing.questionType === 'linear_scale' ? (qEditing.scaleMinLabel || null) : null,
        scaleMaxLabel: qEditing.questionType === 'linear_scale' ? (qEditing.scaleMaxLabel || null) : null,
        allowOtherOption: ['multiple_choice','checkboxes','dropdown'].includes(qEditing.questionType) ? !!qEditing.allowOtherOption : false,
        options: ['multiple_choice','checkboxes','dropdown'].includes(qEditing.questionType)
          ? qEditing.options.map((o, i) => ({
              optionLabel: o.optionLabel,
              optionValue: o.optionValue || o.optionLabel,
              displayOrder: i + 1
            }))
          : [],
      };

      if (qEditing.questionId) {
        await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}/questions/${qEditing.questionId}`, payload);
      } else {
        await http.post(`${BASE_URL}/api/forms/${meta.form.formId}/questions`, payload);
      }
      cancelEditQuestion();
      await load();
    } catch (e) {
      console.error(e);
      alert('Không lưu được câu hỏi.');
      setLoading(false);
    }
  };

  const delQuestion = async (q) => {
    if (!window.confirm('Xoá câu hỏi này?')) return;
    try {
      setLoading(true);
      await http.delete(`${BASE_URL}/api/forms/${meta.form.formId}/questions/${q.questionId}`);
      await load();
    } catch (e) {
      console.error(e);
      alert('Không xoá được câu hỏi.');
      setLoading(false);
    }
  };

  const upDownQuestion = async (q, dir) => {
    const sameSec = meta.questions
      .filter(x => (x.sectionId || null) === (q.sectionId || null))
      .sort((a,b)=> (a.displayOrder??0)-(b.displayOrder??0));
    const idx = sameSec.findIndex(x => x.questionId === q.questionId);
    if (idx < 0) return;
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === sameSec.length - 1) return;
    const swapWith = dir === 'up' ? sameSec[idx - 1] : sameSec[idx + 1];

    try {
      setLoading(true);
      await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}/questions/${q.questionId}`, {
        newDisplayOrder: swapWith.displayOrder,
      });
      await http.patch(`${BASE_URL}/api/forms/${meta.form.formId}/questions/${swapWith.questionId}`, {
        newDisplayOrder: q.displayOrder,
      });
      await load();
    } catch (e) {
      console.error(e);
      alert('Không đổi thứ tự câu hỏi.');
      setLoading(false);
    }
  };

  return (
    <div className="neu-page p-3 md:p-6 max-w-6xl mx-auto">
      {/* Loading overlay */}
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-2">
            <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang xử lý…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">Chỉnh sửa biểu mẫu</div>
          {previewLink && (
            <a
              href={previewLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-emerald-700 hover:underline mt-1"
            >
              <FaEye /> Xem trước: {previewLink}
            </a>
          )}
        </div>
        <NeuBtn
          onClick={saveMeta}
          className={`neu-btn--primary ${savingMeta ? 'opacity-60 cursor-wait' : ''}`}
          disabled={savingMeta}
          title="Lưu thông tin biểu mẫu"
        >
          <FaSave /> Lưu biểu mẫu
        </NeuBtn>
      </div>

      {/* Meta */}
      <Card>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tiêu đề">
            <input className="neu-input mt-1" value={title} onChange={(e)=>setTitle(e.target.value)} />
          </Field>

          <Field label="Cửa sổ hiệu lực">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                className="neu-input mt-1"
                value={windowAt.startAt}
                onChange={(e)=>setWindowAt(v=>({...v, startAt: e.target.value}))}
              />
              <input
                type="datetime-local"
                className="neu-input mt-1"
                value={windowAt.endAt}
                onChange={(e)=>setWindowAt(v=>({...v, endAt: e.target.value}))}
              />
            </div>
          </Field>
        </div>

        <Field label="Mô tả" className="mt-3">
          <textarea className="neu-input mt-1" rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </Field>

        <div className="mt-3 grid md:grid-cols-3 gap-3">
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={flags.allowMultiple} onChange={(e)=>setFlags(v=>({...v, allowMultiple: e.target.checked}))} />
            Cho phép 1 người gửi nhiều lần
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input type="checkbox" checked={flags.allowAnonymous} onChange={(e)=>setFlags(v=>({...v, allowAnonymous: e.target.checked}))} />
            Cho phép ẩn danh
          </label>
          <div>
            <div className="text-sm font-medium text-slate-700">Bắt buộc thông tin người điền</div>
            <div className="flex flex-wrap gap-4 mt-1 text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={flags.requireName} onChange={(e)=>setFlags(v=>({...v, requireName: e.target.checked}))} />
                Họ tên
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={flags.requirePhone} onChange={(e)=>setFlags(v=>({...v, requirePhone: e.target.checked}))} />
                SĐT
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={flags.requireDept} onChange={(e)=>setFlags(v=>({...v, requireDept: e.target.checked}))} />
                Bộ phận
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Body: Sections + Questions */}
      <div className="mt-6 grid md:grid-cols-2 gap-6">
        {/* Sections */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">Sections</div>
            <NeuBtn className="neu-btn--muted" onClick={()=>startEditSection(null)}>
              <FaPlus /> Thêm
            </NeuBtn>
          </div>

          <div className="grid gap-2">
            {meta?.sections?.sort((a,b)=> (a.displayOrder??0)-(b.displayOrder??0)).map((s) => (
              <div key={s.sectionId} className="neu-row between">
                <div>
                  <div className="font-medium">{s.title || '(Không tiêu đề)'}</div>
                  {s.description && <div className="text-slate-600 text-sm">{s.description}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <NeuBtn className="neu-btn--ghost" onClick={()=>upDownSection(s, 'up')} title="Lên">
                    <FaArrowUp/>
                  </NeuBtn>
                  <NeuBtn className="neu-btn--ghost" onClick={()=>upDownSection(s, 'down')} title="Xuống">
                    <FaArrowDown/>
                  </NeuBtn>
                  <NeuBtn className="neu-btn--ghost" onClick={()=>startEditSection(s)}>Sửa</NeuBtn>
                  <NeuBtn className="neu-btn--danger" onClick={()=>delSection(s)} title="Xoá">
                    <FaTrash/>
                  </NeuBtn>
                </div>
              </div>
            ))}
            {(!meta?.sections || meta.sections.length === 0) && (
              <div className="text-slate-500 text-sm">Chưa có section.</div>
            )}
          </div>

          {/* Section Editor */}
          {editingSectionId !== null && (
            <div className="mt-3 neu-inner p-3 rounded-xl">
              <div className="font-medium mb-2">{editingSectionId ? 'Sửa section' : 'Thêm section'}</div>
              <Field label="Tiêu đề">
                <input className="neu-input mt-1" value={secTitle} onChange={(e)=>setSecTitle(e.target.value)} />
              </Field>
              <Field label="Mô tả" className="mt-2">
                <textarea className="neu-input mt-1" rows={2} value={secDesc} onChange={(e)=>setSecDesc(e.target.value)} />
              </Field>
              <div className="mt-3 flex gap-2">
                <NeuBtn className="neu-btn--primary" onClick={saveSection}><FaSave/> Lưu</NeuBtn>
                <NeuBtn className="neu-btn--muted" onClick={cancelEditSection}>Huỷ</NeuBtn>
              </div>
            </div>
          )}
        </Card>

        {/* Questions */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">Câu hỏi</div>
            <NeuBtn className="neu-btn--muted" onClick={startNewQuestion}>
              <FaPlus /> Thêm
            </NeuBtn>
          </div>

          <div className="grid gap-2">
            {meta?.questions
              ?.slice()
              ?.sort((a,b)=> (a.sectionId||0)-(b.sectionId||0) || (a.displayOrder??0)-(b.displayOrder??0))
              ?.map(q => (
              <div key={q.questionId} className="neu-row between">
                <div>
                  <div className="font-medium">{q.questionText}</div>
                  <div className="text-slate-500 text-xs">
                    [{TYPES.find(t=>t.id===q.questionType)?.label || q.questionType}]
                    {q.sectionId ? ` • Section: ${meta.sections.find(s=>s.sectionId===q.sectionId)?.title || '—'}` : ' • (Không section)'}
                    {q.isRequired ? ' • Bắt buộc' : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <NeuBtn className="neu-btn--ghost" onClick={()=>upDownQuestion(q, 'up')} title="Lên"><FaArrowUp/></NeuBtn>
                  <NeuBtn className="neu-btn--ghost" onClick={()=>upDownQuestion(q, 'down')} title="Xuống"><FaArrowDown/></NeuBtn>
                  <NeuBtn className="neu-btn--ghost" onClick={()=>startEditQuestion(q)}>Sửa</NeuBtn>
                  <NeuBtn className="neu-btn--danger" onClick={()=>delQuestion(q)} title="Xoá"><FaTrash/></NeuBtn>
                </div>
              </div>
            ))}
            {(!meta?.questions || meta.questions.length === 0) && (
              <div className="text-slate-500 text-sm">Chưa có câu hỏi.</div>
            )}
          </div>

          {/* Question Editor */}
          {qEditing && (
            <div className="mt-3 neu-inner p-3 rounded-xl">
              <div className="font-medium mb-2">{qEditing.questionId ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}</div>

              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Section">
                  <select
                    className="neu-select mt-1"
                    value={qEditing.sectionId || ''}
                    onChange={(e)=>setQEditing(prev=>({...prev, sectionId: e.target.value ? Number(e.target.value) : null}))}
                  >
                    <option value="">— Không section —</option>
                    {meta?.sections?.sort((a,b)=> (a.displayOrder??0)-(b.displayOrder??0)).map(s=>(
                      <option key={s.sectionId} value={s.sectionId}>{s.title || `(Section ${s.sectionId})`}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Loại câu hỏi">
                  <select
                    className="neu-select mt-1"
                    value={qEditing.questionType}
                    onChange={(e)=>setQEditing(prev=>({...prev, questionType: e.target.value }))}
                  >
                    {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Nội dung" className="mt-2">
                <input className="neu-input mt-1" value={qEditing.questionText} onChange={(e)=>setQEditing(prev=>({...prev, questionText: e.target.value}))} />
              </Field>

              <Field label="Gợi ý / mô tả ngắn" className="mt-2">
                <input className="neu-input mt-1" value={qEditing.helpText} onChange={(e)=>setQEditing(prev=>({...prev, helpText: e.target.value}))} />
              </Field>

              <div className="mt-2 flex flex-wrap gap-4 text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={qEditing.isRequired} onChange={(e)=>setQEditing(prev=>({...prev, isRequired: e.target.checked}))} />
                  Bắt buộc
                </label>
                {['multiple_choice','checkboxes','dropdown'].includes(qEditing.questionType) && (
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={qEditing.allowOtherOption} onChange={(e)=>setQEditing(prev=>({...prev, allowOtherOption: e.target.checked}))} />
                    Cho phép "Khác"
                  </label>
                )}
              </div>

              {qEditing.questionType === 'linear_scale' && (
                <div className="grid md:grid-cols-2 gap-3 mt-2">
                  <Field label="Điểm thấp nhất">
                    <input type="number" className="neu-input mt-1" value={qEditing.scaleMin} onChange={(e)=>setQEditing(prev=>({...prev, scaleMin: Number(e.target.value)}))}/>
                  </Field>
                  <Field label="Điểm cao nhất">
                    <input type="number" className="neu-input mt-1" value={qEditing.scaleMax} onChange={(e)=>setQEditing(prev=>({...prev, scaleMax: Number(e.target.value)}))}/>
                  </Field>
                  <Field label="Nhãn điểm thấp">
                    <input className="neu-input mt-1" value={qEditing.scaleMinLabel} onChange={(e)=>setQEditing(prev=>({...prev, scaleMinLabel: e.target.value}))}/>
                  </Field>
                  <Field label="Nhãn điểm cao">
                    <input className="neu-input mt-1" value={qEditing.scaleMaxLabel} onChange={(e)=>setQEditing(prev=>({...prev, scaleMaxLabel: e.target.value}))}/>
                  </Field>
                </div>
              )}

              {qEditing.questionType === 'prioritized_list' && (
  <div className="mt-3">
    <div className="flex items-center justify-between">
      <div className="font-medium">Gợi ý mục có sẵn</div>
      <button onClick={pushOpt} className="px-3 py-1 rounded-xl border hover:bg-slate-50">Thêm</button>
    </div>
    <div className="grid gap-2 mt-2">
      {(qEditing.options || []).map((o, idx) => (
        <div key={idx} className="rounded-xl border p-2 flex items-center gap-2">
          <input
            className="flex-1 border rounded-xl p-2"
            placeholder="Tên mục"
            value={o.optionLabel}
            onChange={(e)=>setQEditing(prev=>{
              const opts = prev.options.slice();
              opts[idx] = {...opts[idx], optionLabel: e.target.value };
              return { ...prev, options: opts };
            })}
          />
          <button onClick={()=>upDownOpt(idx, 'up')} className="px-2 py-1 rounded-lg border hover:bg-slate-50">▲</button>
          <button onClick={()=>upDownOpt(idx, 'down')} className="px-2 py-1 rounded-lg border hover:bg-slate-50">▼</button>
          <button onClick={()=>delOpt(idx)} className="px-2 py-1 rounded-lg border hover:bg-rose-50 text-rose-600">Xoá</button>
        </div>
      ))}
      {(!qEditing.options || qEditing.options.length===0) && <div className="text-slate-500 text-sm">Chưa có mục gợi ý.</div>}
    </div>
  </div>
)}


              {['multiple_choice','checkboxes','dropdown'].includes(qEditing.questionType) && (
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Lựa chọn</div>
                    <NeuBtn className="neu-btn--muted" onClick={pushOpt}><FaPlus/> Thêm</NeuBtn>
                  </div>
                  <div className="grid gap-2 mt-2">
                    {(qEditing.options || []).map((o, idx) => (
                      <div key={idx} className="neu-row">
                        <input
                          className="flex-1 neu-input"
                          placeholder="Nhãn hiển thị"
                          value={o.optionLabel}
                          onChange={(e)=>setQEditing(prev=>{
                            const opts = prev.options.slice();
                            opts[idx] = {...opts[idx], optionLabel: e.target.value };
                            return { ...prev, options: opts };
                          })}
                        />
                        <input
                          className="w-48 neu-input"
                          placeholder="Giá trị (trống = dùng nhãn)"
                          value={o.optionValue || ''}
                          onChange={(e)=>setQEditing(prev=>{
                            const opts = prev.options.slice();
                            opts[idx] = {...opts[idx], optionValue: e.target.value };
                            return { ...prev, options: opts };
                          })}
                        />
                        <div className="flex items-center gap-2">
                          <NeuBtn className="neu-btn--ghost" onClick={()=>upDownOpt(idx, 'up')} title="Lên"><FaArrowUp/></NeuBtn>
                          <NeuBtn className="neu-btn--ghost" onClick={()=>upDownOpt(idx, 'down')} title="Xuống"><FaArrowDown/></NeuBtn>
                          <NeuBtn className="neu-btn--danger" onClick={()=>delOpt(idx)} title="Xoá"><FaTrash/></NeuBtn>
                        </div>
                      </div>
                    ))}
                    {(!qEditing.options || qEditing.options.length===0) && (
                      <div className="text-slate-500 text-sm">Chưa có lựa chọn.</div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <NeuBtn className="neu-btn--primary" onClick={saveQuestion}><FaSave/> Lưu câu hỏi</NeuBtn>
                <NeuBtn className="neu-btn--muted" onClick={cancelEditQuestion}>Huỷ</NeuBtn>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
