// Admin: tạo / sửa biểu mẫu
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ArrowLeft, BarChart3, Eye, ListChecks, Save, Settings } from "lucide-react";
import config from "~/config";
import { errorMessage, fmApi } from "~/pagesForm/shared/api";
import { QUESTION_TYPES, newQuestion, uid } from "~/pagesForm/shared/questionTypes";
import { TEMPLATES } from "~/pagesForm/shared/templates";
import { Badge, Button, ErrorBox, Spinner, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import QuestionEditor from "./QuestionEditor";
import SettingsPanel from "./SettingsPanel";
import FormPreview from "./FormPreview";

const EMPTY_FORM = {
  title: "",
  description: "",
  isVisible: false,
  acceptResponses: true,
  openAt: null,
  closeAt: null,
  audienceType: "all",
  audiences: [],
  allowEditAfterSubmit: true,
  allowMultiple: false,
  requireProfile: true,
  themeColor: "#1f4e79",
  thankYouMessage: "",
  questions: [],
};

const TABS = [
  { key: "questions", label: "Câu hỏi", icon: ListChecks },
  { key: "settings", label: "Cài đặt & đối tượng", icon: Settings },
  { key: "preview", label: "Xem trước", icon: Eye },
];

/** Điều kiện phải trỏ về câu hỏi đứng TRƯỚC (backend kiểm tra y như vậy) */
function conditionProblems(questions) {
  const problems = {};
  const seen = new Set();
  for (const q of questions) {
    const c = q.settings?.showIf;
    if (c && !seen.has(c.questionKey)) problems[q.questionKey] = "Điều kiện dựa trên câu hỏi không đứng trước câu này — sửa lại điều kiện hoặc thứ tự";
    if (q.type !== "section") seen.add(q.questionKey);
  }
  return problems;
}

/** Payload gửi backend */
function toPayload(form) {
  return {
    ...form,
    audiences: form.audiences.map(({ targetType, targetId }) => ({ targetType, targetId })),
    questions: form.questions.map(({ questionKey, type, label, description, isRequired, settings }) => ({
      questionKey, type, label, description, isRequired, settings,
    })),
  };
}

/** Dữ liệu từ server → state của builder */
function fromServer(f) {
  return {
    ...EMPTY_FORM,
    ...f,
    description: f.description || "",
    thankYouMessage: f.thankYouMessage || "",
    questions: (f.questions || []).filter((q) => q.isActive).map((q) => ({ ...q, description: q.description || "" })),
  };
}

export default function FormBuilder() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("questions");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    if (isNew) {
      const tpl = TEMPLATES.find((t) => t.key === params.get("template")) || TEMPLATES[0];
      const built = tpl.build();
      setForm({ ...EMPTY_FORM, ...built });
      setExpanded(built.questions.length ? null : undefined);
      setDirty(tpl.key !== "blank");
      return;
    }
    try {
      setForm(fromServer(await fmApi.form(id)));
      setDirty(false);
    } catch (e) {
      setError(errorMessage(e, "Không tải được biểu mẫu"));
    }
  }, [id, isNew, params]);

  useEffect(() => { load(); }, [load]);

  // Cảnh báo khi đóng tab lúc còn thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const update = (next) => { setForm(next); setDirty(true); };
  const setQuestions = (fn) => update({ ...form, questions: fn(form.questions) });
  const problems = useMemo(() => (form ? conditionProblems(form.questions) : {}), [form]);

  const save = useCallback(async () => {
    if (!form || saving) return;
    if (!form.title.trim()) { setTab("questions"); return toast.error("Chưa nhập tên biểu mẫu"); }
    const bad = form.questions.find((q) => !q.label.trim());
    if (bad) { setTab("questions"); setExpanded(bad.questionKey); return toast.error("Có câu hỏi chưa nhập nội dung"); }
    if (Object.keys(problems).length) { setTab("questions"); return toast.error("Có điều kiện hiện câu hỏi không hợp lệ (đánh dấu đỏ)"); }
    if (form.audienceType === "targeted" && !form.audiences.length) { setTab("settings"); return toast.error("Chưa chọn đối tượng được xem biểu mẫu"); }

    setSaving(true);
    try {
      const saved = isNew ? await fmApi.createForm(toPayload(form)) : await fmApi.updateForm(id, toPayload(form));
      setForm(fromServer(saved));
      setDirty(false);
      toast.success(isNew ? "Đã tạo biểu mẫu" : "Đã lưu");
      if (isNew) navigate(`${config.routes.adminFormBuilder}/${saved.formId}`, { replace: true });
    } catch (e) {
      toast.error(errorMessage(e, "Lưu thất bại"));
    } finally {
      setSaving(false);
    }
  }, [form, saving, problems, isNew, id, navigate]);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setQuestions((qs) => {
      const from = qs.findIndex((q) => q.questionKey === active.id);
      const to = qs.findIndex((q) => q.questionKey === over.id);
      return arrayMove(qs, from, to);
    });
  };

  const addQuestion = (type) => {
    const q = newQuestion(type);
    setQuestions((qs) => {
      const at = expanded ? qs.findIndex((x) => x.questionKey === expanded) : -1;
      if (at < 0) return [...qs, q];
      const next = [...qs];
      next.splice(at + 1, 0, q);
      return next;
    });
    setExpanded(q.questionKey);
    setTimeout(() => document.getElementById(`q-${q.questionKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const removeQuestion = async (q) => {
    const dependents = form.questions.filter((x) => x.settings?.showIf?.questionKey === q.questionKey);
    const msg = [
      `Xoá "${q.label || "câu hỏi này"}"?`,
      q.answerCount ? `Câu này đã có ${q.answerCount} câu trả lời — dữ liệu cũ vẫn được giữ trong kết quả.` : "",
      dependents.length ? `${dependents.length} câu có điều kiện dựa trên câu này sẽ bị bỏ điều kiện.` : "",
    ].filter(Boolean).join("\n");
    if (!(await confirmDialog({ title: "Xoá câu hỏi", message: msg, confirmText: "Xoá", danger: true }))) return;
    setQuestions((qs) =>
      qs
        .filter((x) => x.questionKey !== q.questionKey)
        .map((x) => {
          if (x.settings?.showIf?.questionKey !== q.questionKey) return x;
          const { showIf, ...rest } = x.settings;
          return { ...x, settings: rest };
        })
    );
  };

  const duplicateQuestion = (q, i) => {
    const copy = {
      ...q,
      questionKey: uid("q"),
      questionId: undefined,
      answerCount: 0,
      label: `${q.label} (bản sao)`.slice(0, 1000),
      settings: {
        ...q.settings,
        ...(q.settings?.options ? { options: q.settings.options.map((o) => ({ ...o, id: uid("o") })) } : {}),
      },
    };
    setQuestions((qs) => { const next = [...qs]; next.splice(i + 1, 0, copy); return next; });
    setExpanded(copy.questionKey);
  };

  const moveQuestion = (i, d) => setQuestions((qs) => {
    const j = i + d;
    return j < 0 || j >= qs.length ? qs : arrayMove(qs, i, j);
  });

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!form) return <Spinner />;

  let number = 0;
  const numbers = form.questions.map((q) => (q.type === "section" ? null : ++number));

  return (
    <div className="space-y-4">
      {/* Thanh trên */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur lg:top-0 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link to={config.routes.adminFormList} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200" title="Danh sách biểu mẫu">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-800">{form.title || "Biểu mẫu mới"}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {isNew ? <Badge tone="blue">Chưa lưu</Badge> : form.isVisible ? <Badge tone="green">Đang hiện</Badge> : <Badge>Đang ẩn</Badge>}
              {dirty && !isNew && <span className="text-amber-600">● Có thay đổi chưa lưu</span>}
              {!isNew && form.responseCount > 0 && <span className="text-slate-500">{form.responseCount} phiếu đã nộp</span>}
            </div>
          </div>
          {!isNew && (
            <Button variant="secondary" size="sm" icon={BarChart3} onClick={() => navigate(`${config.routes.adminFormResults}/${id}`)}>Kết quả</Button>
          )}
          <Button icon={Save} loading={saving} disabled={!dirty && !isNew} onClick={save} title="Ctrl+S">
            {isNew ? "Tạo biểu mẫu" : "Lưu"}
          </Button>
        </div>
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/60")}>
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "questions" && (
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Tên + mô tả */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5" style={{ background: form.themeColor || "#1f4e79" }} />
            <div className="space-y-3 p-4">
              <input
                className="w-full border-0 border-b border-transparent px-0 text-xl font-bold text-slate-800 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-0"
                placeholder="Tên biểu mẫu"
                maxLength={300}
                value={form.title}
                onChange={(e) => update({ ...form, title: e.target.value })}
              />
              <textarea
                className={cn(inputCls, "min-h-[64px] resize-y")}
                placeholder="Mô tả / mục đích (hiện ở đầu biểu mẫu và trong file Excel)"
                maxLength={4000}
                value={form.description}
                onChange={(e) => update({ ...form, description: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Họ tên, MSNV, phòng ban, chức danh được lấy tự động từ hồ sơ người điền — không cần tạo câu hỏi.
              </p>
            </div>
          </div>

          {isNew && form.questions.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Bắt đầu nhanh từ mẫu có sẵn:</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.filter((t) => t.key !== "blank").map((t) => (
                  <Button key={t.key} variant="secondary" size="sm" onClick={() => navigate(`${config.routes.adminFormBuilder}?template=${t.key}`, { replace: true })}>
                    {t.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext items={form.questions.map((q) => q.questionKey)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {form.questions.map((q, i) => (
                  <div key={q.questionKey} id={`q-${q.questionKey}`}>
                    <QuestionEditor
                      q={q}
                      index={i}
                      number={numbers[i]}
                      all={form.questions}
                      expanded={expanded === q.questionKey}
                      problem={problems[q.questionKey]}
                      onExpand={() => setExpanded((k) => (k === q.questionKey ? null : q.questionKey))}
                      onChange={(next) => setQuestions((qs) => qs.map((x) => (x.questionKey === q.questionKey ? next : x)))}
                      onDuplicate={() => duplicateQuestion(q, i)}
                      onRemove={() => removeQuestion(q)}
                      onMove={(d) => moveQuestion(i, d)}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Thêm câu hỏi */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Thêm câu hỏi{expanded && form.questions.some((q) => q.questionKey === expanded) ? " (chèn sau câu đang mở)" : ""}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {QUESTION_TYPES.map((t) => (
                <button key={t.type} type="button" onClick={() => addQuestion(t.type)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-blue-400 hover:bg-blue-50">
                  <t.icon className="h-4 w-4 shrink-0 text-blue-700" /> {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="mx-auto max-w-3xl">
          <SettingsPanel form={form} onChange={update} />
        </div>
      )}

      {tab === "preview" && <FormPreview form={form} />}
    </div>
  );
}
