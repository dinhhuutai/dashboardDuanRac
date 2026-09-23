// Danh mục loại câu hỏi — phải khớp QUESTION_TYPES ở backend (FormManagement/definition.js)
// và CHECK constraint của fm_Questions.type (sql/06).
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Coins,
  Gauge,
  Hash,
  Heading,
  Star,
  ToggleLeft,
  Type,
} from "lucide-react";

export const OTHER_ID = "__other__";

let seq = 0;
/** Mã ổn định cho câu hỏi / lựa chọn (dùng cho điều kiện hiện câu hỏi) */
export function uid(prefix = "q") {
  seq = (seq + 1) % 1000;
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}${seq}`;
}

const opts = (...labels) => labels.map((label, i) => ({ id: uid("o"), label: label || `Lựa chọn ${i + 1}` }));

export const QUESTION_TYPES = [
  { type: "short_text", label: "Trả lời ngắn", icon: Type, group: "Văn bản" },
  { type: "long_text", label: "Đoạn văn", icon: AlignLeft, group: "Văn bản" },
  { type: "single_choice", label: "Chọn một", icon: CircleDot, group: "Lựa chọn" },
  { type: "multiple_choice", label: "Chọn nhiều", icon: CheckSquare, group: "Lựa chọn" },
  { type: "dropdown", label: "Danh sách thả xuống", icon: ChevronDownSquare, group: "Lựa chọn" },
  { type: "yes_no", label: "Có / Không", icon: ToggleLeft, group: "Lựa chọn" },
  { type: "number", label: "Số", icon: Hash, group: "Số" },
  { type: "currency", label: "Số tiền", icon: Coins, group: "Số" },
  { type: "linear_scale", label: "Thang điểm", icon: Gauge, group: "Số" },
  { type: "rating", label: "Đánh giá sao", icon: Star, group: "Số" },
  { type: "date", label: "Ngày", icon: Calendar, group: "Khác" },
  { type: "section", label: "Tiêu đề phần", icon: Heading, group: "Khác" },
];

export const TYPE_META = Object.fromEntries(QUESTION_TYPES.map((t) => [t.type, t]));
export const CHOICE_TYPES = ["single_choice", "multiple_choice", "dropdown"];
export const NUMERIC_TYPES = ["number", "currency", "linear_scale", "rating"];

/** Cấu hình mặc định khi thêm câu hỏi mới */
export function defaultSettings(type) {
  switch (type) {
    case "single_choice":
    case "multiple_choice":
    case "dropdown":
      return { options: opts("Lựa chọn 1", "Lựa chọn 2") };
    case "yes_no":
      return { yesLabel: "Có", noLabel: "Không" };
    case "currency":
      return { min: 0, unit: "VNĐ" };
    case "linear_scale":
      return { min: 1, max: 5, minLabel: "", maxLabel: "" };
    case "rating":
      return { max: 5 };
    case "short_text":
      return { inputKind: "text" };
    default:
      return {};
  }
}

export function newQuestion(type = "short_text") {
  return {
    questionKey: uid("q"),
    type,
    label: type === "section" ? "Phần mới" : "",
    description: "",
    isRequired: false,
    settings: defaultSettings(type),
  };
}

/**
 * Đổi loại câu hỏi, giữ lại những gì còn dùng được (nội dung, lựa chọn giữa các loại lựa chọn, điều kiện).
 */
export function changeType(q, type) {
  const next = { ...q, type, settings: defaultSettings(type) };
  if (CHOICE_TYPES.includes(q.type) && CHOICE_TYPES.includes(type)) next.settings.options = q.settings.options;
  if (q.settings?.showIf) next.settings.showIf = q.settings.showIf;
  if (type === "section") next.isRequired = false;
  return next;
}

/** Các lựa chọn để dùng làm giá trị điều kiện (câu hỏi được tham chiếu) */
export function conditionValues(q) {
  if (!q) return [];
  if (q.type === "yes_no") {
    return [
      { value: "yes", label: q.settings?.yesLabel || "Có" },
      { value: "no", label: q.settings?.noLabel || "Không" },
    ];
  }
  if (CHOICE_TYPES.includes(q.type)) return (q.settings?.options || []).map((o) => ({ value: o.id, label: o.label }));
  return [];
}
