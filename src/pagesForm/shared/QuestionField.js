// Ô trả lời cho 1 câu hỏi — dùng chung cho trang điền phiếu và phần xem trước của admin.
// Dạng giá trị (khớp backend buildAnswerRows):
//   short_text/long_text/date/yes_no: string   number/currency: string|number
//   linear_scale/rating: number                single_choice/dropdown: { optionId, otherText }
//   multiple_choice: { optionIds: [], otherText }
import { Star } from "lucide-react";
import { OTHER_ID } from "./questionTypes";
import { cn, inputCls } from "./ui";

const digitsOnly = (s) => String(s ?? "").replace(/[^\d]/g, "");
const groupThousands = (s) => (s ? Number(s).toLocaleString("vi-VN") : "");

function ChoiceRow({ type, checked, onClick, disabled, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        checked ? "border-blue-500 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-700",
        disabled ? "cursor-not-allowed opacity-60" : !checked && "hover:border-slate-300"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border",
          type === "radio" ? "rounded-full" : "rounded",
          checked ? "border-blue-600 bg-blue-600" : "border-slate-400 bg-white"
        )}
      >
        {checked && (type === "radio" ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <span className="text-[10px] leading-none text-white">✓</span>)}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export default function QuestionField({ question: q, value, onChange, disabled, error }) {
  const s = q.settings || {};
  const set = (v) => onChange?.(v);

  let body = null;
  switch (q.type) {
    case "short_text":
      body = (
        <input
          className={inputCls}
          type={s.inputKind === "email" ? "email" : s.inputKind === "phone" ? "tel" : "text"}
          inputMode={s.inputKind === "phone" ? "tel" : undefined}
          placeholder={s.placeholder || "Câu trả lời của bạn"}
          value={value ?? ""}
          maxLength={4000}
          disabled={disabled}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;

    case "long_text":
      body = (
        <textarea
          className={cn(inputCls, "min-h-[96px] resize-y")}
          placeholder={s.placeholder || "Câu trả lời của bạn"}
          value={value ?? ""}
          maxLength={4000}
          disabled={disabled}
          onChange={(e) => set(e.target.value)}
        />
      );
      break;

    case "number":
      body = (
        <div className="flex items-center gap-2">
          <input
            className={cn(inputCls, "max-w-xs")}
            type="number"
            inputMode="decimal"
            min={s.min}
            max={s.max}
            value={value ?? ""}
            disabled={disabled}
            onChange={(e) => set(e.target.value)}
          />
          {s.unit && <span className="text-sm text-slate-500">{s.unit}</span>}
        </div>
      );
      break;

    case "currency":
      body = (
        <div className="flex items-center gap-2">
          <input
            className={cn(inputCls, "max-w-xs text-right")}
            inputMode="numeric"
            placeholder="0"
            value={groupThousands(digitsOnly(value))}
            disabled={disabled}
            onChange={(e) => set(digitsOnly(e.target.value))}
          />
          <span className="text-sm text-slate-500">{s.unit || "VNĐ"}</span>
        </div>
      );
      break;

    case "yes_no":
      body = (
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          {[["yes", s.yesLabel || "Có"], ["no", s.noLabel || "Không"]].map(([v, label]) => (
            <ChoiceRow key={v} type="radio" checked={value === v} disabled={disabled} onClick={() => set(value === v && !q.isRequired ? "" : v)}>
              {label}
            </ChoiceRow>
          ))}
        </div>
      );
      break;

    case "single_choice": {
      const cur = value || {};
      body = (
        <div className="space-y-2">
          {(s.options || []).map((o) => (
            <ChoiceRow key={o.id} type="radio" checked={cur.optionId === o.id} disabled={disabled}
              onClick={() => set(cur.optionId === o.id && !q.isRequired ? null : { optionId: o.id, otherText: "" })}>
              {o.label}
            </ChoiceRow>
          ))}
          {s.allowOther && (
            <>
              <ChoiceRow type="radio" checked={cur.optionId === OTHER_ID} disabled={disabled}
                onClick={() => set({ optionId: OTHER_ID, otherText: cur.otherText || "" })}>
                Khác…
              </ChoiceRow>
              {cur.optionId === OTHER_ID && (
                <input className={cn(inputCls, "ml-7 w-[calc(100%-1.75rem)]")} placeholder="Ghi rõ" autoFocus
                  value={cur.otherText || ""} maxLength={300} disabled={disabled}
                  onChange={(e) => set({ optionId: OTHER_ID, otherText: e.target.value })} />
              )}
            </>
          )}
        </div>
      );
      break;
    }

    case "multiple_choice": {
      const cur = value || { optionIds: [] };
      const ids = cur.optionIds || [];
      const toggle = (id) => {
        const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
        if (s.maxSelect && next.length > s.maxSelect) return;
        set({ optionIds: next, otherText: next.includes(OTHER_ID) ? cur.otherText || "" : "" });
      };
      body = (
        <div className="space-y-2">
          {s.maxSelect ? <p className="text-xs text-slate-500">Chọn tối đa {s.maxSelect}</p> : null}
          {(s.options || []).map((o) => (
            <ChoiceRow key={o.id} type="checkbox" checked={ids.includes(o.id)} disabled={disabled} onClick={() => toggle(o.id)}>
              {o.label}
            </ChoiceRow>
          ))}
          {s.allowOther && (
            <>
              <ChoiceRow type="checkbox" checked={ids.includes(OTHER_ID)} disabled={disabled} onClick={() => toggle(OTHER_ID)}>
                Khác…
              </ChoiceRow>
              {ids.includes(OTHER_ID) && (
                <input className={cn(inputCls, "ml-7 w-[calc(100%-1.75rem)]")} placeholder="Ghi rõ" autoFocus
                  value={cur.otherText || ""} maxLength={300} disabled={disabled}
                  onChange={(e) => set({ optionIds: ids, otherText: e.target.value })} />
              )}
            </>
          )}
        </div>
      );
      break;
    }

    case "dropdown":
      body = (
        <select
          className={cn(inputCls, "sm:max-w-md")}
          value={value?.optionId || ""}
          disabled={disabled}
          onChange={(e) => set(e.target.value ? { optionId: e.target.value } : null)}
        >
          <option value="">— Chọn —</option>
          {(s.options || []).map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      );
      break;

    case "linear_scale": {
      const min = s.min ?? 1, max = s.max ?? 5;
      const vals = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      body = (
        <div>
          <div className="flex flex-wrap gap-2">
            {vals.map((v) => (
              <button key={v} type="button" disabled={disabled}
                onClick={() => set(value === v && !q.isRequired ? null : v)}
                className={cn(
                  "h-10 w-10 rounded-lg border text-sm font-medium transition-colors",
                  value === v ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700",
                  disabled ? "cursor-not-allowed opacity-60" : value !== v && "hover:border-blue-400"
                )}>
                {v}
              </button>
            ))}
          </div>
          {(s.minLabel || s.maxLabel) && (
            <div className="mt-1.5 flex justify-between text-xs text-slate-500" style={{ maxWidth: vals.length * 48 }}>
              <span>{s.minLabel}</span>
              <span>{s.maxLabel}</span>
            </div>
          )}
        </div>
      );
      break;
    }

    case "rating": {
      const max = s.max ?? 5;
      body = (
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((v) => (
            <button key={v} type="button" disabled={disabled} title={`${v}/${max}`}
              onClick={() => set(value === v && !q.isRequired ? null : v)} className={cn("p-0.5", disabled && "cursor-not-allowed opacity-60")}>
              <Star className={cn("h-8 w-8 transition-colors", value >= v ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
            </button>
          ))}
        </div>
      );
      break;
    }

    case "date":
      body = (
        <input className={cn(inputCls, "max-w-xs")} type="date" value={value ?? ""} disabled={disabled}
          onChange={(e) => set(e.target.value)} />
      );
      break;

    default:
      body = <p className="text-sm text-slate-400">Loại câu hỏi không hỗ trợ</p>;
  }

  return (
    <div>
      {body}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/** Chuyển giá trị trên giao diện sang dạng gửi backend (số tiền/số: chuỗi → number) */
export function toSubmitValue(type, v) {
  if (v === undefined || v === null || v === "") return undefined;
  if (type === "number" || type === "currency") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return v;
}
