// Thẻ soạn 1 câu hỏi (thu gọn / mở rộng) + các cấu hình theo loại + điều kiện hiện
import { useSortable } from "@dnd-kit/sortable";
import { ArrowDown, ArrowUp, Copy, GitBranch, GripVertical, Plus, Trash2, X } from "lucide-react";
import {
  CHOICE_TYPES,
  QUESTION_TYPES,
  TYPE_META,
  changeType,
  conditionValues,
  uid,
} from "~/pagesForm/shared/questionTypes";
import { describeCondition } from "~/pagesForm/shared/conditions";
import { Badge, Field, IconButton, Toggle, cn, inputCls } from "~/pagesForm/shared/ui";

/* ------------------------------ Lựa chọn ------------------------------ */
function OptionsEditor({ q, onChange }) {
  const s = q.settings;
  const options = s.options || [];
  const setOptions = (next) => onChange({ ...q, settings: { ...s, options: next } });

  const update = (i, label) => setOptions(options.map((o, j) => (j === i ? { ...o, label } : o)));
  const remove = (i) => options.length > 1 && setOptions(options.filter((_, j) => j !== i));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= options.length) return;
    const next = [...options];
    [next[i], next[j]] = [next[j], next[i]];
    setOptions(next);
  };
  const add = () => setOptions([...options, { id: uid("o"), label: `Lựa chọn ${options.length + 1}` }]);

  // Dán nhiều dòng vào 1 ô → tách thành nhiều lựa chọn
  const onPaste = (i, e) => {
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    if (lines.length < 2) return;
    e.preventDefault();
    const next = [...options];
    next[i] = { ...next[i], label: lines[0] };
    next.splice(i + 1, 0, ...lines.slice(1).map((label) => ({ id: uid("o"), label })));
    setOptions(next.slice(0, 100));
  };

  const mark = q.type === "multiple_choice" ? "rounded" : q.type === "dropdown" ? "" : "rounded-full";
  return (
    <div className="space-y-2">
      {options.map((o, i) => (
        <div key={o.id} className="group flex items-center gap-2">
          {q.type === "dropdown" ? (
            <span className="w-5 text-right text-xs text-slate-400">{i + 1}.</span>
          ) : (
            <span className={cn("h-4 w-4 shrink-0 border border-slate-400", mark)} />
          )}
          <input
            className={cn(inputCls, "py-1.5")}
            value={o.label}
            placeholder={`Lựa chọn ${i + 1}`}
            maxLength={300}
            onChange={(e) => update(i, e.target.value)}
            onPaste={(e) => onPaste(i, e)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <div className="flex opacity-60 group-hover:opacity-100">
            <IconButton icon={ArrowUp} title="Lên" onClick={() => move(i, -1)} disabled={i === 0} />
            <IconButton icon={ArrowDown} title="Xuống" onClick={() => move(i, 1)} disabled={i === options.length - 1} />
            <IconButton icon={X} title="Xoá lựa chọn" danger onClick={() => remove(i)} disabled={options.length <= 1} />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3 pl-6">
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
          <Plus className="h-4 w-4" /> Thêm lựa chọn
        </button>
        <span className="text-xs text-slate-400">Mẹo: dán danh sách nhiều dòng để thêm nhanh</span>
      </div>
      {q.type !== "dropdown" && (
        <div className="flex flex-wrap gap-6 pt-2">
          <Toggle label='Cho phép "Khác…" (tự ghi)' checked={!!s.allowOther} onChange={(v) => onChange({ ...q, settings: { ...s, allowOther: v } })} />
          {q.type === "multiple_choice" && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              Chọn tối đa
              <input
                type="number"
                min={1}
                className={cn(inputCls, "w-20 py-1")}
                placeholder="∞"
                value={s.maxSelect ?? ""}
                onChange={(e) => onChange({ ...q, settings: { ...s, maxSelect: e.target.value ? Number(e.target.value) : undefined } })}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------- Cấu hình theo loại --------------------------- */
function TypeSettings({ q, onChange }) {
  const s = q.settings || {};
  const set = (patch) => onChange({ ...q, settings: { ...s, ...patch } });
  const numOrUndef = (v) => (v === "" ? undefined : Number(v));

  if (CHOICE_TYPES.includes(q.type)) return <OptionsEditor q={q} onChange={onChange} />;

  switch (q.type) {
    case "yes_no":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nhãn 'Có'"><input className={inputCls} value={s.yesLabel || ""} maxLength={50} onChange={(e) => set({ yesLabel: e.target.value })} /></Field>
          <Field label="Nhãn 'Không'"><input className={inputCls} value={s.noLabel || ""} maxLength={50} onChange={(e) => set({ noLabel: e.target.value })} /></Field>
        </div>
      );
    case "number":
    case "currency":
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Nhỏ nhất"><input type="number" className={inputCls} value={s.min ?? ""} onChange={(e) => set({ min: numOrUndef(e.target.value) })} /></Field>
          <Field label="Lớn nhất"><input type="number" className={inputCls} value={s.max ?? ""} onChange={(e) => set({ max: numOrUndef(e.target.value) })} /></Field>
          <Field label="Đơn vị"><input className={inputCls} value={s.unit || ""} maxLength={20} placeholder={q.type === "currency" ? "VNĐ" : "vd: giờ, người"} onChange={(e) => set({ unit: e.target.value })} /></Field>
        </div>
      );
    case "linear_scale":
      return (
        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Từ">
            <select className={inputCls} value={s.min ?? 1} onChange={(e) => set({ min: Number(e.target.value) })}>
              <option value={0}>0</option><option value={1}>1</option>
            </select>
          </Field>
          <Field label="Đến">
            <select className={inputCls} value={s.max ?? 5} onChange={(e) => set({ max: Number(e.target.value) })}>
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Nhãn đầu"><input className={inputCls} value={s.minLabel || ""} maxLength={60} placeholder="vd: Rất kém" onChange={(e) => set({ minLabel: e.target.value })} /></Field>
          <Field label="Nhãn cuối"><input className={inputCls} value={s.maxLabel || ""} maxLength={60} placeholder="vd: Rất tốt" onChange={(e) => set({ maxLabel: e.target.value })} /></Field>
        </div>
      );
    case "rating":
      return (
        <Field label="Số sao" className="max-w-[160px]">
          <select className={inputCls} value={s.max ?? 5} onChange={(e) => set({ max: Number(e.target.value) })}>
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
      );
    case "short_text":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kiểu dữ liệu">
            <select className={inputCls} value={s.inputKind || "text"} onChange={(e) => set({ inputKind: e.target.value })}>
              <option value="text">Văn bản</option>
              <option value="email">Email</option>
              <option value="phone">Số điện thoại</option>
            </select>
          </Field>
          <Field label="Gợi ý trong ô"><input className={inputCls} value={s.placeholder || ""} maxLength={200} onChange={(e) => set({ placeholder: e.target.value })} /></Field>
        </div>
      );
    case "long_text":
      return <Field label="Gợi ý trong ô"><input className={inputCls} value={s.placeholder || ""} maxLength={200} onChange={(e) => set({ placeholder: e.target.value })} /></Field>;
    default:
      return null;
  }
}

/* ---------------------------- Điều kiện hiện ---------------------------- */
function ConditionEditor({ q, earlier, onChange }) {
  const cond = q.settings?.showIf;
  const candidates = earlier.filter((x) => x.type !== "section");
  const set = (showIf) => {
    const settings = { ...q.settings };
    if (showIf) settings.showIf = showIf;
    else delete settings.showIf;
    onChange({ ...q, settings });
  };

  if (!cond) {
    return (
      <button
        type="button"
        disabled={!candidates.length}
        title={candidates.length ? "" : "Cần có câu hỏi đứng trước"}
        onClick={() => {
          const ref = [...candidates].reverse().find((x) => conditionValues(x).length) || candidates[candidates.length - 1];
          const vals = conditionValues(ref);
          set({ questionKey: ref.questionKey, op: vals.length ? "eq" : "answered", value: vals[0]?.value });
        }}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        <GitBranch className="h-4 w-4" /> Chỉ hiện khi…
      </button>
    );
  }

  const ref = candidates.find((x) => x.questionKey === cond.questionKey);
  const vals = conditionValues(ref);
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-violet-800"><GitBranch className="h-4 w-4" /> Chỉ hiện câu này khi</span>
        <IconButton icon={X} title="Bỏ điều kiện" onClick={() => set(null)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1.5fr]">
        <select
          className={inputCls}
          value={ref ? cond.questionKey : ""}
          onChange={(e) => {
            const r = candidates.find((x) => x.questionKey === e.target.value);
            const v = conditionValues(r);
            set({ questionKey: e.target.value, op: v.length ? "eq" : "answered", value: v[0]?.value });
          }}
        >
          {!ref && <option value="">(Câu hỏi không còn hợp lệ)</option>}
          {candidates.map((x, i) => (
            <option key={x.questionKey} value={x.questionKey}>{`Câu ${i + 1}: ${(x.label || "(chưa đặt tên)").slice(0, 60)}`}</option>
          ))}
        </select>
        <select className={inputCls} value={cond.op} onChange={(e) => set({ ...cond, op: e.target.value, value: e.target.value === "answered" ? undefined : cond.value ?? vals[0]?.value })}>
          {vals.length > 0 && <option value="eq">là</option>}
          {vals.length > 0 && <option value="neq">không phải</option>}
          <option value="answered">đã được trả lời</option>
        </select>
        {cond.op !== "answered" && (
          <select className={inputCls} value={cond.value || ""} onChange={(e) => set({ ...cond, value: e.target.value })}>
            {vals.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Thẻ câu hỏi ------------------------------- */
export default function QuestionEditor({ q, index, number, all, expanded, problem, onExpand, onChange, onDuplicate, onRemove, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.questionKey });
  // (tương đương CSS.Transform.toString của @dnd-kit/utilities — gói đó không khai báo trong package.json)
  const style = {
    transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
    transition,
  };
  const meta = TYPE_META[q.type];
  const Icon = meta?.icon;
  const earlier = all.slice(0, index);
  const locked = q.answerCount > 0; // đã có người trả lời → không đổi loại
  const isSection = q.type === "section";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-shadow",
        isDragging && "z-10 shadow-lg",
        expanded ? "border-blue-400 ring-1 ring-blue-200" : "border-slate-200",
        problem && "border-red-400 ring-1 ring-red-200",
        isSection && !expanded && "border-l-4 border-l-slate-700"
      )}
    >
      {/* Hàng tóm tắt */}
      <div className="flex items-start gap-2 p-3">
        <button type="button" className="mt-0.5 cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing" title="Kéo để sắp xếp" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onExpand}>
          <div className="flex flex-wrap items-center gap-2">
            {!isSection && <span className="text-xs font-semibold text-slate-400">Câu {number}</span>}
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">{Icon && <Icon className="h-3.5 w-3.5" />} {meta?.label}</span>
            {q.isRequired && <Badge tone="red">Bắt buộc</Badge>}
            {q.settings?.showIf && <Badge tone="blue"><GitBranch className="h-3 w-3" /> Có điều kiện</Badge>}
            {q.answerCount > 0 && <Badge>{q.answerCount} trả lời</Badge>}
          </div>
          <p className={cn("mt-1 truncate", isSection ? "font-bold text-slate-800" : "font-medium text-slate-800", !q.label && "italic text-slate-400")}>
            {q.label || (isSection ? "(Tiêu đề phần)" : "(Chưa nhập câu hỏi)")}
          </p>
          {problem && <p className="mt-1 text-xs text-red-600">{problem}</p>}
          {!expanded && q.settings?.showIf && <p className="mt-0.5 truncate text-xs text-violet-700">{describeCondition(q.settings.showIf, all)}</p>}
        </button>
      </div>

      {/* Phần soạn */}
      {expanded && (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3 sm:pl-11">
          <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
            <Field label={isSection ? "Tiêu đề phần" : "Câu hỏi"} required>
              <textarea
                autoFocus={!q.label}
                rows={isSection ? 1 : 2}
                className={cn(inputCls, "resize-y")}
                value={q.label}
                maxLength={1000}
                placeholder={isSection ? "vd: Thông tin sử dụng AI" : "Nhập câu hỏi"}
                onChange={(e) => onChange({ ...q, label: e.target.value })}
              />
            </Field>
            <Field label="Loại" hint={locked ? "Đã có người trả lời — không đổi loại được" : undefined}>
              <select className={inputCls} value={q.type} disabled={locked} onChange={(e) => onChange(changeType(q, e.target.value))}>
                {QUESTION_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Mô tả / hướng dẫn (không bắt buộc)">
            <input className={inputCls} value={q.description || ""} maxLength={2000} placeholder="Giải thích thêm cho người điền" onChange={(e) => onChange({ ...q, description: e.target.value })} />
          </Field>

          {!isSection && <TypeSettings q={q} onChange={onChange} />}

          <ConditionEditor q={q} earlier={earlier} onChange={onChange} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            {!isSection ? (
              <Toggle label="Bắt buộc trả lời" checked={q.isRequired} onChange={(v) => onChange({ ...q, isRequired: v })} />
            ) : <span />}
            <div className="flex gap-1">
              <IconButton icon={ArrowUp} title="Lên" onClick={() => onMove(-1)} disabled={index === 0} />
              <IconButton icon={ArrowDown} title="Xuống" onClick={() => onMove(1)} disabled={index === all.length - 1} />
              <IconButton icon={Copy} title="Nhân bản" onClick={onDuplicate} />
              <IconButton icon={Trash2} title="Xoá" danger onClick={onRemove} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
