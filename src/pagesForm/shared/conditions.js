// Điều kiện hiện câu hỏi (settings.showIf) — PHẢI giống hệt backend:
// ApiDuAnRac/src/FormManagement/definition.js (isAnswered / matchCondition / visibleQuestionKeys).
// Server kiểm tra lại khi nộp; ở đây chỉ để ẩn/hiện trên giao diện.
import { CHOICE_TYPES, NUMERIC_TYPES } from "./questionTypes";

const str = (v) => (v === undefined || v === null ? "" : String(v)).trim();

export function isAnswered(type, v) {
  if (v === undefined || v === null) return false;
  if (CHOICE_TYPES.includes(type)) {
    if (type === "multiple_choice") return Array.isArray(v?.optionIds) && v.optionIds.length > 0;
    return !!str(v?.optionId);
  }
  if (NUMERIC_TYPES.includes(type)) return v !== "" && Number.isFinite(Number(v));
  return !!str(v);
}

function matchCondition(cond, refType, refValue) {
  const answered = isAnswered(refType, refValue);
  if (cond.op === "answered") return answered;
  let equal = false;
  if (answered) {
    if (refType === "multiple_choice") equal = refValue.optionIds.map(String).includes(cond.value);
    else if (CHOICE_TYPES.includes(refType)) equal = String(refValue.optionId) === cond.value;
    else equal = str(refValue) === cond.value;
  }
  return cond.op === "eq" ? equal : !equal;
}

/**
 * @param questions [{questionKey, type, settings}] theo thứ tự
 * @param valueByKey { [questionKey]: rawValue }
 * @returns Set questionKey đang hiện
 */
export function visibleQuestionKeys(questions, valueByKey) {
  const visible = new Set();
  const byKey = new Map(questions.map((q) => [q.questionKey, q]));
  for (const q of questions) {
    const cond = q.settings?.showIf;
    if (!cond) {
      visible.add(q.questionKey);
      continue;
    }
    const ref = byKey.get(cond.questionKey);
    const refValue = ref && visible.has(ref.questionKey) ? valueByKey[ref.questionKey] : undefined;
    if (ref && matchCondition(cond, ref.type, refValue)) visible.add(q.questionKey);
  }
  return visible;
}

/** Mô tả điều kiện dạng chữ để hiện trong trình tạo biểu mẫu */
export function describeCondition(cond, questions) {
  if (!cond) return "";
  const ref = questions.find((q) => q.questionKey === cond.questionKey);
  if (!ref) return "Điều kiện không hợp lệ";
  const name = `"${(ref.label || "(chưa đặt tên)").slice(0, 50)}"`;
  if (cond.op === "answered") return `Chỉ hiện khi đã trả lời ${name}`;
  let valueLabel = cond.value;
  if (ref.type === "yes_no") valueLabel = cond.value === "yes" ? ref.settings?.yesLabel || "Có" : ref.settings?.noLabel || "Không";
  else if (CHOICE_TYPES.includes(ref.type)) valueLabel = ref.settings?.options?.find((o) => o.id === cond.value)?.label || "(lựa chọn đã xoá)";
  return `Chỉ hiện khi ${name} ${cond.op === "eq" ? "là" : "không phải"} "${valueLabel}"`;
}
