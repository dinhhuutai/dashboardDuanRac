// src/pages/admin/FormCreate.jsx
import 'react-datepicker/dist/react-datepicker.css';
import React, { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { vi } from 'date-fns/locale';
import { FaSpinner, FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { BASE_URL } from '~/config/index';
import http from '~/api/http';

// =================== factories & constants ===================
const defaultQuestion = (displayOrder, sectionId = '') => ({
  localId: crypto.randomUUID(),
  sectionId,
  questionType: 'short_text',
  questionText: '',
  helpText: '',
  isRequired: false,
  displayOrder,
  scaleMin: 1,
  scaleMax: 5,
  scaleMinLabel: 'Không hài lòng',
  scaleMaxLabel: 'Rất hài lòng',
  allowOtherOption: false,
  options: [{ label: 'Lựa chọn 1', value: '1', displayOrder: 1 }],
});

const defaultSection = (order) => ({
  localId: crypto.randomUUID(),
  title: `Phần ${order}`,
  description: '',
  displayOrder: order,
});

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Văn bản ngắn' },
  { value: 'long_text', label: 'Đoạn văn' },
  { value: 'multiple_choice', label: 'Chọn một' },
  { value: 'checkboxes', label: 'Chọn nhiều' },
  { value: 'dropdown', label: 'Danh sách' },
  { value: 'linear_scale', label: 'Thang điểm' },
];

// =================== shared UI atoms ===================
const Card = ({ children, className = '' }) => (
  <div className={`neu-section ${className}`}>{children}</div>
);

const NeuBtn = ({ children, className = '', ...rest }) => (
  <button className={`neu-btn ${className}`} {...rest}>
    {children}
  </button>
);

const Field = ({ label, children, className = '' }) => (
  <label className={className}>
    <div className="text-sm font-medium text-slate-700">{label}</div>
    {children}
  </label>
);

// =================== Meta form ===================
const FormMetaCard = React.memo(function FormMetaCard({
  title, setTitle,
  description, setDescription,
  flags, setFlags,
  startAt, setStartAt,
  endAt, setEndAt,
}) {
  return (
    <Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Tiêu đề biểu mẫu" className="md:col-span-2">
          <input
            className="neu-input mt-1 text-lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Khảo sát mức độ hài lòng nội bộ"
          />
        </Field>

        <Field label="Mô tả / Mục đích" className="md:col-span-2">
          <textarea
            rows={3}
            className="neu-input mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Giới thiệu ngắn gọn về mục đích biểu mẫu…"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3 md:col-span-2">
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={flags.isActive}
              onChange={(e) => setFlags({ ...flags, isActive: e.target.checked })}
            />
            Công bố ngay
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={flags.allowMultiple}
              onChange={(e) => setFlags({ ...flags, allowMultiple: e.target.checked })}
            />
            Cho phép 1 SĐT gửi nhiều lần
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={flags.allowAnonymous}
              onChange={(e) => setFlags({ ...flags, allowAnonymous: e.target.checked })}
            />
            Không cần đăng nhập
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3 md:col-span-2">
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={flags.requireName}
              onChange={(e) => setFlags({ ...flags, requireName: e.target.checked })}
            />
            Bắt buộc Họ tên
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={flags.requirePhone}
              onChange={(e) => setFlags({ ...flags, requirePhone: e.target.checked })}
            />
            Bắt buộc SĐT
          </label>
          <label className="inline-flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={flags.requireDept}
              onChange={(e) => setFlags({ ...flags, requireDept: e.target.checked })}
            />
            Bắt buộc Bộ phận
          </label>
        </div>

        <Field label="Bắt đầu (tuỳ chọn)">
          <DatePicker
            selected={startAt}
            onChange={setStartAt}
            showTimeSelect
            timeIntervals={15}
            dateFormat="dd/MM/yyyy HH:mm"
            className="neu-input mt-1"
            locale={vi}
            placeholderText="Chọn thời điểm bắt đầu"
          />
        </Field>

        <Field label="Kết thúc (tuỳ chọn)">
          <DatePicker
            selected={endAt}
            onChange={setEndAt}
            showTimeSelect
            timeIntervals={15}
            dateFormat="dd/MM/yyyy HH:mm"
            className="neu-input mt-1"
            locale={vi}
            placeholderText="Chọn thời điểm kết thúc"
          />
        </Field>
      </div>
    </Card>
  );
});

// =================== Sections ===================
const SectionsCard = React.memo(function SectionsCard({
  sections, setSections, onAddQuestion, onAddSection, onRemoveSection,
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg text-slate-800">Phần (Section)</div>
        <NeuBtn className="neu-btn--muted" onClick={onAddSection}>
          <FaPlus /> Thêm phần
        </NeuBtn>
      </div>

      {sections.length === 0 && (
        <div className="text-slate-500">Chưa có phần nào — bạn có thể thêm “Lời giới thiệu”.</div>
      )}

      <div className="grid gap-3">
        {sections
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((s) => (
            <Card key={s.localId} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Tiêu đề">
                  <input
                    className="neu-input mt-1"
                    value={s.title}
                    onChange={(e) =>
                      setSections((arr) =>
                        arr.map((x) => (x.localId === s.localId ? { ...x, title: e.target.value } : x))
                      )
                    }
                  />
                </Field>
                <Field label="Thứ tự">
                  <input
                    type="number"
                    className="neu-input mt-1"
                    value={s.displayOrder}
                    onChange={(e) =>
                      setSections((arr) =>
                        arr.map((x) =>
                          x.localId === s.localId ? { ...x, displayOrder: Number(e.target.value) } : x
                        )
                      )
                    }
                  />
                </Field>
                <Field label="Mô tả" className="md:col-span-2">
                  <textarea
                    rows={2}
                    className="neu-input mt-1"
                    value={s.description}
                    onChange={(e) =>
                      setSections((arr) =>
                        arr.map((x) => (x.localId === s.localId ? { ...x, description: e.target.value } : x))
                      )
                    }
                  />
                </Field>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <NeuBtn className="neu-btn--primary" onClick={() => onAddQuestion(s.localId)}>
                  <FaPlus /> Thêm câu hỏi vào phần này
                </NeuBtn>
                <NeuBtn className="neu-btn--danger" onClick={() => onRemoveSection(s.localId)}>
                  <FaTrash /> Xoá phần
                </NeuBtn>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
});

// =================== Question subparts ===================
const LinearScaleConfig = React.memo(function LinearScaleConfig({ q, update }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Field label="Min">
        <input
          type="number"
          className="neu-input mt-1"
          value={q.scaleMin}
          onChange={(e) => update({ scaleMin: Number(e.target.value) })}
        />
      </Field>
      <Field label="Max">
        <input
          type="number"
          className="neu-input mt-1"
          value={q.scaleMax}
          onChange={(e) => update({ scaleMax: Number(e.target.value) })}
        />
      </Field>
      <Field label="Nhãn min">
        <input
          className="neu-input mt-1"
          value={q.scaleMinLabel}
          onChange={(e) => update({ scaleMinLabel: e.target.value })}
        />
      </Field>
      <Field label="Nhãn max">
        <input
          className="neu-input mt-1"
          value={q.scaleMaxLabel}
          onChange={(e) => update({ scaleMaxLabel: e.target.value })}
        />
      </Field>
    </div>
  );
});

const OptionsEditor = React.memo(function OptionsEditor({ q, update }) {
  const addOption = () =>
    update({
      options: [
        ...(q.options || []),
        { label: 'Lựa chọn', value: '', displayOrder: (q.options?.length || 0) + 1 },
      ],
    });

  const removeOption = (idx) => {
    const cp = [...(q.options || [])];
    cp.splice(idx, 1);
    update({ options: cp });
  };

  const patchOption = (idx, patch) => {
    const cp = [...(q.options || [])];
    cp[idx] = { ...(cp[idx] || {}), ...patch };
    update({ options: cp });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-700">Tuỳ chọn</div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={q.allowOtherOption}
            onChange={(e) => update({ allowOtherOption: e.target.checked })}
          />
          Cho phép “Khác”
        </label>
      </div>

      {(q.options || []).map((opt, idx) => (
        <div key={idx} className="flex gap-2">
          <input
            className="flex-1 neu-input"
            value={opt.label}
            onChange={(e) => patchOption(idx, { label: e.target.value })}
            placeholder={`Tuỳ chọn ${idx + 1}`}
          />
          <input
            className="w-40 neu-input"
            value={opt.value || ''}
            onChange={(e) => patchOption(idx, { value: e.target.value })}
            placeholder="value"
          />
          <input
            type="number"
            className="w-28 neu-input"
            value={opt.displayOrder ?? idx + 1}
            onChange={(e) => patchOption(idx, { displayOrder: Number(e.target.value) })}
          />
          <NeuBtn className="neu-btn--danger" onClick={() => removeOption(idx)} title="Xoá lựa chọn">
            <FaTrash />
          </NeuBtn>
        </div>
      ))}

      <NeuBtn className="neu-btn--muted" onClick={addOption}>
        <FaPlus /> Thêm tuỳ chọn
      </NeuBtn>
    </div>
  );
});

// =================== Questions ===================
const QuestionItem = React.memo(function QuestionItem({ q, updateQuestion, removeQuestion }) {
  const update = (patch) => updateQuestion(q.localId, patch);

  return (
    <Card className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="Câu hỏi" className="md:col-span-2">
          <input
            className="neu-input mt-1"
            value={q.questionText}
            onChange={(e) => update({ questionText: e.target.value })}
          />
        </Field>
        <Field label="Loại">
          <select
            className="neu-select mt-1"
            value={q.questionType}
            onChange={(e) => update({ questionType: e.target.value })}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Thứ tự">
          <input
            type="number"
            className="neu-input mt-1"
            value={q.displayOrder}
            onChange={(e) => update({ displayOrder: Number(e.target.value) })}
          />
        </Field>

        <Field label="Gợi ý (help text)" className="md:col-span-3">
          <input
            className="neu-input mt-1"
            value={q.helpText}
            onChange={(e) => update({ helpText: e.target.value })}
          />
        </Field>

        <label className="inline-flex items-center gap-2 text-slate-700">
          <input
            type="checkbox"
            checked={q.isRequired}
            onChange={(e) => update({ isRequired: e.target.checked })}
          />
          Bắt buộc
        </label>
      </div>

      {q.questionType === 'linear_scale' && <LinearScaleConfig q={q} update={update} />}

      {['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType) && (
        <OptionsEditor q={q} update={update} />
      )}

      <div className="flex justify-end">
        <NeuBtn className="neu-btn--danger" onClick={() => removeQuestion(q.localId)}>
          <FaTrash /> Xoá câu hỏi
        </NeuBtn>
      </div>
    </Card>
  );
});

const QuestionsCard = React.memo(function QuestionsCard({
  questions, addQuestion, updateQuestion, removeQuestion,
}) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg text-slate-800">Câu hỏi</div>
        <NeuBtn className="neu-btn--primary" onClick={() => addQuestion('')}>
          <FaPlus /> Thêm câu hỏi
        </NeuBtn>
      </div>

      {questions.length === 0 && (
        <div className="text-slate-500">Chưa có câu hỏi — hãy thêm “Thang điểm 1–5” hoặc “Chọn một”.</div>
      )}

      <div className="grid gap-3">
        {questions
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((q) => (
            <QuestionItem
              key={q.localId}
              q={q}
              updateQuestion={updateQuestion}
              removeQuestion={removeQuestion}
            />
          ))}
      </div>
    </div>
  );
});

// =================== main ===================
export default function FormCreate() {
  const [loading, setLoading] = useState(false);

  // form meta
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [flags, setFlags] = useState({
    isActive: false,
    allowMultiple: false,
    allowAnonymous: true,
    requireName: true,
    requirePhone: true,
    requireDept: true,
  });
  const [startAt, setStartAt] = useState(null);
  const [endAt, setEndAt] = useState(null);

  // sections & questions (local)
  const [sections, setSections] = useState([]);
  const [questions, setQuestions] = useState([]);

  const canSaveForm = useMemo(() => title.trim().length > 0, [title]);
  const nextSectionOrder = sections.length + 1;
  const nextQuestionOrder = questions.length + 1;

  // handlers: sections
  const onAddSection = () => setSections((s) => [...s, defaultSection(nextSectionOrder)]);
  const onRemoveSection = (localId) => setSections((s) => s.filter((x) => x.localId !== localId));

  // handlers: questions
  const addQuestion = (sectionLocalId = '') =>
    setQuestions((qs) => [...qs, defaultQuestion(nextQuestionOrder, sectionLocalId)]);
  const removeQuestion = (localId) =>
    setQuestions((qs) => qs.filter((x) => x.localId !== localId));
  const updateQuestion = (localId, patch) =>
    setQuestions((qs) => qs.map((q) => (q.localId === localId ? { ...q, ...patch } : q)));

  // save
  const saveAll = async () => {
    if (!canSaveForm) return;
    setLoading(true);
    try {
      const resForm = await http.post(`${BASE_URL}/api/forms`, {
        title,
        description,
        isActive: flags.isActive ? 1 : 0,
        allowMultiple: flags.allowMultiple ? 1 : 0,
        allowAnonymous: flags.allowAnonymous ? 1 : 0,
        requireName: flags.requireName ? 1 : 0,
        requirePhone: flags.requirePhone ? 1 : 0,
        requireDept: flags.requireDept ? 1 : 0,
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null,
      });
      const formId = resForm.data.formId;
      const code = resForm.data.code;

      // sections
      const sectionIdMap = {};
      for (const s of sections.slice().sort((a, b) => a.displayOrder - b.displayOrder)) {
        const r = await http.post(`${BASE_URL}/api/forms/${formId}/sections`, {
          title: s.title || null,
          description: s.description || null,
          displayOrder: s.displayOrder,
        });
        sectionIdMap[s.localId] = r.data.sectionId;
      }

      // questions
      for (const q of questions.slice().sort((a, b) => a.displayOrder - b.displayOrder)) {
        const payload = {
          sectionId: q.sectionId ? sectionIdMap[q.sectionId] || null : null,
          questionType: q.questionType,
          questionText: q.questionText,
          helpText: q.helpText || null,
          isRequired: !!q.isRequired,
          displayOrder: q.displayOrder,
          scaleMin: q.questionType === 'linear_scale' ? q.scaleMin : null,
          scaleMax: q.questionType === 'linear_scale' ? q.scaleMax : null,
          scaleMinLabel: q.questionType === 'linear_scale' ? q.scaleMinLabel : null,
          scaleMaxLabel: q.questionType === 'linear_scale' ? q.scaleMaxLabel : null,
          allowOtherOption: !!q.allowOtherOption,
          options: ['multiple_choice', 'checkboxes', 'dropdown'].includes(q.questionType)
            ? (q.options || []).map((o, i) => ({
                label: o.label,
                value: o.value || null,
                displayOrder: o.displayOrder || i + 1,
              }))
            : [],
        };
        await http.post(`${BASE_URL}/api/forms/${formId}/questions`, payload);
      }

      if (flags.isActive) {
        await http.patch(`${BASE_URL}/api/forms/${formId}/publish`, { isActive: 1 });
      }

      alert(`Đã tạo biểu mẫu!\nLink chia sẻ: ${window.location.origin}/forms/${code}`);
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi lưu biểu mẫu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neu-page p-2 md:p-6">
      {/* Loading overlay */}
      {loading && (
        <div className="neu-overlay">
          <div className="neu-card flex flex-col items-center gap-3">
            <FaSpinner className="animate-spin text-emerald-600 text-3xl" />
            <span className="text-slate-700 text-sm">Đang xử lý…</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-slate-800">Tạo biểu mẫu</div>
        <NeuBtn
          className={`neu-btn--primary ${!canSaveForm ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={!canSaveForm}
          onClick={saveAll}
          title={!canSaveForm ? 'Nhập tiêu đề trước' : 'Lưu biểu mẫu'}
        >
          <FaSave /> Lưu biểu mẫu
        </NeuBtn>
      </div>

      {/* Meta */}
      <FormMetaCard
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        flags={flags}
        setFlags={setFlags}
        startAt={startAt}
        setStartAt={setStartAt}
        endAt={endAt}
        setEndAt={setEndAt}
      />

      {/* Sections */}
      <SectionsCard
        sections={sections}
        setSections={setSections}
        onAddSection={onAddSection}
        onRemoveSection={onRemoveSection}
        onAddQuestion={addQuestion}
      />

      {/* Questions */}
      <QuestionsCard
        questions={questions}
        addQuestion={addQuestion}
        updateQuestion={updateQuestion}
        removeQuestion={removeQuestion}
      />
    </div>
  );
}
