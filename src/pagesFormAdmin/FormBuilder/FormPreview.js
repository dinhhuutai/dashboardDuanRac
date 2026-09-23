// Xem trước biểu mẫu đúng như nhân viên thấy (điền thử được, không gửi đi)
import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { visibleQuestionKeys } from "~/pagesForm/shared/conditions";
import QuestionField from "~/pagesForm/shared/QuestionField";
import { Button } from "~/pagesForm/shared/ui";

export default function FormPreview({ form }) {
  const [values, setValues] = useState({});
  const questions = form.questions;
  const visible = useMemo(() => {
    const byKey = {};
    for (const q of questions) byKey[q.questionKey] = values[q.questionKey];
    return visibleQuestionKeys(questions, byKey);
  }, [questions, values]);
  const accent = form.themeColor || "#1f4e79";
  let num = 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
        <span>Chế độ xem trước — điền thử để kiểm tra điều kiện hiện câu hỏi, không lưu.</span>
        <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => setValues({})}>Làm lại</Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2" style={{ background: accent }} />
        <div className="p-5">
          <h1 className="text-xl font-bold text-slate-800">{form.title || "(Chưa đặt tên)"}</h1>
          {form.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{form.description}</p>}
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
        Họ tên · MSNV · Phòng ban · Chức danh — tự lấy từ hồ sơ người điền
      </div>
      {questions.map((q) => {
        if (!visible.has(q.questionKey)) return null;
        if (q.type === "section") {
          return (
            <div key={q.questionKey} className="px-1 pt-3">
              <h2 className="text-base font-bold" style={{ color: accent }}>{q.label}</h2>
              {q.description && <p className="mt-0.5 text-sm text-slate-500">{q.description}</p>}
            </div>
          );
        }
        num += 1;
        return (
          <div key={q.questionKey} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="font-medium text-slate-800">
              <span className="mr-1 text-slate-400">{num}.</span>
              {q.label || <span className="italic text-slate-400">(Chưa nhập câu hỏi)</span>}
              {q.isRequired && <span className="ml-0.5 text-red-500">*</span>}
            </p>
            {q.description && <p className="mt-1 text-sm text-slate-500">{q.description}</p>}
            <div className="mt-3">
              <QuestionField question={q} value={values[q.questionKey]} onChange={(v) => setValues((xs) => ({ ...xs, [q.questionKey]: v }))} />
            </div>
          </div>
        );
      })}
      {questions.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Chưa có câu hỏi nào.</p>}
    </div>
  );
}
