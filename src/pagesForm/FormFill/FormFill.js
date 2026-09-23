// Nhân viên: điền / sửa phiếu
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, Lock, Send } from "lucide-react";
import config from "~/config";
import { userSelector } from "~/redux/selectors";
import { errorCode, errorMessage, fmApi } from "../shared/api";
import { isAnswered, visibleQuestionKeys } from "../shared/conditions";
import { deadlineText, fmtDateTime, isNotYetOpen, parseLocal } from "../shared/format";
import ProfileDialog, { ProfileSummary } from "../shared/ProfileDialog";
import QuestionField, { toSubmitValue } from "../shared/QuestionField";
import { Badge, Button, ErrorBox, Spinner, confirmDialog, toast } from "../shared/ui";

const draftKey = (formId, userId) => `fm_draft_${formId}_${userId}`;

function readDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function writeDraft(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {}
}
function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export default function FormFill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = useSelector(userSelector)?.login?.currentUser?.userID;
  const key = draftKey(id, userId);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [values, setValues] = useState({}); // { [questionId]: value }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null); // kết quả sau khi nộp
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const cardRefs = useRef({});

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await fmApi.myForm(id);
      setData(d);
      const draft = d.canSubmit ? readDraft(key) : null;
      if (draft && Object.keys(draft).length) {
        setValues(draft);
        setHasDraft(true);
      } else if (d.mode === "edit" && d.myResponse) {
        setValues(d.myResponse.answers || {});
      } else {
        setValues({});
      }
    } catch (e) {
      setError(errorMessage(e, "Không tải được biểu mẫu"));
    }
  }, [id, key]);

  useEffect(() => { load(); }, [load]);

  // Biểu mẫu chưa tới giờ mở: tới giờ thì tự tải lại để mở khoá (không bắt người dùng F5)
  const openAt = isNotYetOpen(data?.form) ? data.form.openAt : null;
  useEffect(() => {
    if (!openAt) return;
    const ms = parseLocal(openAt) - new Date();
    if (ms > 24 * 3600 * 1000) return;
    const t = setTimeout(load, Math.max(ms, 0) + 3000);
    return () => clearTimeout(t);
  }, [openAt, load]);

  // Tự lưu nháp trên máy (không gửi server) — tải lại trang không mất câu trả lời
  useEffect(() => {
    if (!data?.canSubmit || done) return;
    const t = setTimeout(() => {
      if (Object.keys(values).length) writeDraft(key, values);
    }, 600);
    return () => clearTimeout(t);
  }, [values, data, key, done]);

  const questions = useMemo(() => data?.questions || [], [data]);
  const visible = useMemo(() => {
    const byKey = {};
    for (const q of questions) byKey[q.questionKey] = values[q.questionId];
    return visibleQuestionKeys(questions, byKey);
  }, [questions, values]);

  const readOnly = !data?.canSubmit;
  const answerable = questions.filter((q) => q.type !== "section" && visible.has(q.questionKey));
  const answeredCount = answerable.filter((q) => isAnswered(q.type, values[q.questionId])).length;

  const setValue = (qid, v) => {
    setValues((xs) => ({ ...xs, [qid]: v }));
    if (errors[qid]) setErrors((xs) => ({ ...xs, [qid]: undefined }));
  };

  const validate = () => {
    const errs = {};
    for (const q of answerable) {
      const v = values[q.questionId];
      if (q.isRequired && !isAnswered(q.type, v)) errs[q.questionId] = "Câu hỏi bắt buộc";
      else if ((q.type === "single_choice" || q.type === "multiple_choice") && v) {
        const other = q.type === "multiple_choice" ? v.optionIds?.includes("__other__") : v.optionId === "__other__";
        if (other && !String(v.otherText || "").trim()) errs[q.questionId] = 'Vui lòng ghi rõ lựa chọn "Khác"';
      }
    }
    return errs;
  };

  const submit = async () => {
    if (data.profileRequired) {
      setProfileOpen(true);
      return;
    }
    const errs = validate();
    setErrors(errs);
    const firstErr = answerable.find((q) => errs[q.questionId]);
    if (firstErr) {
      cardRefs.current[firstErr.questionId]?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error(`Còn ${Object.keys(errs).length} câu cần trả lời`);
      return;
    }
    if (data.mode === "edit" && data.myResponse) {
      const ok = await confirmDialog({ title: "Cập nhật phiếu", message: "Câu trả lời mới sẽ thay thế phiếu bạn đã nộp trước đó.", confirmText: "Cập nhật" });
      if (!ok) return;
    }
    const answers = {};
    for (const q of answerable) {
      const v = toSubmitValue(q.type, values[q.questionId]);
      if (v !== undefined) answers[q.questionId] = v;
    }
    setSubmitting(true);
    try {
      const r = await fmApi.submit(id, answers);
      clearDraft(key);
      setHasDraft(false);
      setDone(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      if (errorCode(e) === "PROFILE_REQUIRED") setProfileOpen(true);
      toast.error(errorMessage(e, "Nộp phiếu thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const discardDraft = async () => {
    const ok = await confirmDialog({ title: "Xoá bản nháp", message: "Xoá các câu trả lời chưa nộp trên máy này?", confirmText: "Xoá nháp", danger: true });
    if (!ok) return;
    clearDraft(key);
    setHasDraft(false);
    setValues(data.mode === "edit" && data.myResponse ? data.myResponse.answers || {} : {});
    setErrors({});
  };

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!data) return <Spinner />;

  const { form, profile } = data;
  const accent = form.themeColor || "#1f4e79";

  /* ---------------------------- Đã nộp xong ---------------------------- */
  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-3 text-xl font-bold text-slate-800">{done.isEdit ? "Đã cập nhật phiếu" : "Đã nộp phiếu"}</h1>
        <p className="mt-1 text-sm text-slate-500">{form.title} · {fmtDateTime(done.savedAt)}</p>
        <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-slate-600">
          {done.thankYouMessage || "Cảm ơn bạn đã dành thời gian trả lời!"}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(config.routes.form)}>Về danh sách</Button>
          {(form.allowEditAfterSubmit || form.allowMultiple) && form.isOpenNow && (
            <Button onClick={() => { setDone(null); load(); }}>{form.allowMultiple ? "Nộp thêm phiếu" : "Xem / sửa lại"}</Button>
          )}
        </div>
      </div>
    );
  }

  const deadline = form.isOpenNow ? deadlineText(form.closeAt) : null;
  let num = 0;

  return (
    <div className="space-y-4">
      <Link to={config.routes.form} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Danh sách biểu mẫu
      </Link>

      {/* Tiêu đề */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-2" style={{ background: accent }} />
        <div className="p-5">
          <h1 className="text-xl font-bold text-slate-800">{form.title}</h1>
          {form.description && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{form.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {deadline && <Badge tone={deadline.urgent ? "amber" : "slate"}><Clock className="h-3 w-3" /> {deadline.text}</Badge>}
            {data.myResponse && (
              <Badge tone="green"><CheckCircle2 className="h-3 w-3" /> Đã nộp {fmtDateTime(data.myResponse.updatedAt || data.myResponse.submittedAt)}</Badge>
            )}
            {questions.some((q) => q.isRequired) && <span className="text-xs text-red-500">* Bắt buộc</span>}
          </div>
        </div>
      </div>

      {readOnly && openAt && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Biểu mẫu <b>chưa mở</b> — bắt đầu nhận phiếu lúc <b>{fmtDateTime(openAt)}</b>. Bạn chỉ xem trước được câu hỏi,
            tới giờ trang sẽ tự mở để điền.
          </span>
        </div>
      )}
      {readOnly && !openAt && (
        <div className="flex items-start gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{data.blockReason}{data.myResponse ? " — dưới đây là phiếu bạn đã nộp." : "."}</span>
        </div>
      )}

      {hasDraft && !readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span>Đã khôi phục câu trả lời bạn đang điền dở trên máy này.</span>
          <button type="button" className="font-medium underline" onClick={discardDraft}>Xoá nháp</button>
        </div>
      )}

      <ProfileSummary profile={profile} onEdit={readOnly ? undefined : () => setProfileOpen(true)} />
      {data.profileRequired && !readOnly && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Bạn cần cập nhật phòng ban và chức danh trước khi nộp.{" "}
            <button type="button" className="font-medium underline" onClick={() => setProfileOpen(true)}>Cập nhật ngay</button>
          </span>
        </div>
      )}

      {/* Câu hỏi */}
      {questions.map((q) => {
        if (!visible.has(q.questionKey)) return null;
        if (q.type === "section") {
          return (
            <div key={q.questionId} className="rounded-xl px-1 pt-3">
              <h2 className="text-base font-bold" style={{ color: accent }}>{q.label}</h2>
              {q.description && <p className="mt-0.5 whitespace-pre-line text-sm text-slate-500">{q.description}</p>}
            </div>
          );
        }
        num += 1;
        const err = errors[q.questionId];
        return (
          <div
            key={q.questionId}
            ref={(el) => { cardRefs.current[q.questionId] = el; }}
            className={`rounded-xl border bg-white p-4 shadow-sm transition-colors sm:p-5 ${err ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}
          >
            <p className="font-medium text-slate-800">
              <span className="mr-1 text-slate-400">{num}.</span>
              {q.label}
              {q.isRequired && <span className="ml-0.5 text-red-500">*</span>}
            </p>
            {q.description && <p className="mt-1 whitespace-pre-line text-sm text-slate-500">{q.description}</p>}
            <div className="mt-3">
              <QuestionField question={q} value={values[q.questionId]} onChange={(v) => setValue(q.questionId, v)} disabled={readOnly} error={err} />
            </div>
          </div>
        );
      })}

      {!readOnly && (
        <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:border">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">Đã trả lời {answeredCount}/{answerable.length}</span>
            <Button icon={Send} loading={submitting} onClick={submit}>
              {data.mode === "edit" && data.myResponse ? "Cập nhật phiếu" : "Nộp phiếu"}
            </Button>
          </div>
        </div>
      )}

      <ProfileDialog
        open={profileOpen}
        required={data.profileRequired}
        onClose={() => setProfileOpen(false)}
        onSaved={(p) => setData((d) => ({ ...d, profile: p, profileRequired: !!d.form.requireProfile && !p?.isComplete }))}
      />
    </div>
  );
}
