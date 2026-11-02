// Chi tiết công việc — trên cùng là nội dung việc để người đọc tập trung; dưới đó là đúng 1 khung "việc cần làm tiếp" theo vai trò + trạng thái,
// rồi kết quả đã nộp. Trao đổi + lịch sử nằm trong khung chat ở góc phải (ChatPanel), mặc định thu gọn.
//   Người nhận: chọn hạn → Nhận việc, hoặc Hỏi lại · đang làm → Nộp kết quả (chữ, đường dẫn dán vào ô chữ, tệp)
//   Người giao: trả lời câu hỏi · Duyệt / Làm lại · sửa / huỷ (phải ghi lý do) / mở lại
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ExternalLink, Flag, MessageCircleQuestion, Pencil, Plus, RotateCcw, Send, Undo2, XCircle } from "lucide-react";
import config from "~/config";
import { Button, ErrorBox, Modal, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, FileGallery, UploadList, filesFromPaste, useAttachments } from "~/pagesRequest/shared/Attachments";
import { UPLOAD_ENDPOINT, errorMessage, pjApi, silent } from "../shared/api";
import { refreshCounts, usePj } from "../shared/store";
import { TASK_STATUS, addDays, fmtWhen, splitLinks, taskCode } from "../shared/meta";
import { DueBadge, Page, StatusChip } from "../shared/components";
import TaskForm from "../shared/TaskForm";
import ChatPanel from "./ChatPanel";

const R = config.routes;

/** Ô chữ + nút gửi (hỏi lại, trả lời, làm lại) — không đính kèm, không thêm bước */
function QuickReply({ placeholder, label, icon, onSubmit, onCancel, danger }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try { await onSubmit({ body: body.trim() }); setBody(""); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} autoFocus={!!onCancel} rows={2} placeholder={placeholder} className={cn(inputCls, "resize-y")} />
      <div className="flex justify-end gap-2">
        {onCancel && <Button variant="secondary" onClick={onCancel} disabled={busy}>Huỷ</Button>}
        <Button onClick={send} loading={busy} icon={icon} variant={danger ? "danger" : "primary"}>{label}</Button>
      </div>
    </div>
  );
}

/** Nộp kết quả: 1 ô chữ (dán đường dẫn vào đây luôn) + kẹp tệp */
function SubmitBox({ label, onSubmit }) {
  const files = usePj((s) => s.boot?.files);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: files });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    const { body, links } = splitLinks(text);
    setBusy(true);
    try {
      await onSubmit({ body, links, attachments: att.done });
      setText(""); att.clear();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2" data-submit-box>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Kết quả: ghi nội dung, dán đường dẫn hoặc đính kèm tệp"
        onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
        className={cn(inputCls, "resize-y")} />
      <UploadList att={att} />
      <div className="flex items-center justify-between gap-2">
        <AttachmentPicker att={att} compact />
        <Button onClick={send} loading={busy} icon={Send}>{label}</Button>
      </div>
    </div>
  );
}

/** Đúng 1 việc cần làm tiếp — không có việc gì thì không hiện gì (trạng thái đã có ở đầu trang) */
function NextStep({ t, act }) {
  const [mode, setMode] = useState(null);
  const [due, setDue] = useState(() => (t.expectedDate && t.expectedDate >= t.today ? t.expectedDate : addDays(t.today, 3)));
  const [busy, setBusy] = useState(false);
  const a = new Set(t.actions);
  const lastOf = (kind) => [...t.events].reverse().find((e) => e.kind === kind);
  const box = "rounded-xl border border-blue-200 bg-white p-3";

  if (a.has("accept")) {
    const accept = async () => {
      setBusy(true);
      try { await act("accept", { dueDate: due }, "Đã nhận việc"); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    if (mode === "question") {
      return (
        <section className={box} data-next-step="question">
          <QuickReply placeholder="Bạn chưa rõ điều gì?" label="Gửi câu hỏi" icon={Send} onCancel={() => setMode(null)} onSubmit={(x) => act("question", x, "Đã gửi câu hỏi")} />
        </section>
      );
    }
    return (
      <section className={box} data-next-step="accept">
        <div className="grid grid-cols-2 items-end gap-2 sm:flex">
          <label className="col-span-2 sm:flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-500">Hạn hoàn thành</span>
            <input type="date" value={due} min={t.today} onChange={(e) => setDue(e.target.value)} className={inputCls} />
          </label>
          <Button onClick={accept} loading={busy} icon={CheckCircle2} className="h-10 whitespace-nowrap">Nhận việc</Button>
          <Button variant="secondary" onClick={() => setMode("question")} icon={MessageCircleQuestion} className="h-10 whitespace-nowrap">Hỏi lại</Button>
        </div>
      </section>
    );
  }

  if (a.has("submit")) {
    const rv = t.status === "revise" ? lastOf("revise") : null;
    return (
      <section className={box} data-next-step="submit">
        {rv && <p className="mb-2 whitespace-pre-wrap rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"><b>Cần làm lại:</b> {rv.body}</p>}
        <SubmitBox label={rv ? "Nộp lại" : "Nộp kết quả"} onSubmit={(x) => act("submit", x, "Đã nộp kết quả")} />
      </section>
    );
  }

  if (a.has("answer")) {
    const q = lastOf("question");
    return (
      <section className={box} data-next-step="answer">
        <p className="mb-2 whitespace-pre-wrap text-sm text-slate-800"><b>{q?.fullName || "Người nhận"} hỏi:</b> {q?.body}</p>
        {q?.files?.length > 0 && <div className="mb-2"><FileGallery files={q.files} size="sm" /></div>}
        <QuickReply placeholder="Trả lời" label="Gửi trả lời" icon={Send} onSubmit={(x) => act("answer", x, "Đã trả lời")} />
      </section>
    );
  }

  if (a.has("approve")) {
    if (mode === "revise") {
      return (
        <section className={box} data-next-step="revise">
          <QuickReply danger placeholder="Cần làm lại / bổ sung gì?" label="Yêu cầu làm lại" icon={Undo2} onCancel={() => setMode(null)} onSubmit={(x) => act("revise", x, "Đã yêu cầu làm lại")} />
        </section>
      );
    }
    const approve = async () => {
      setBusy(true);
      try { await act("approve", {}, "Đã duyệt hoàn thành"); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
    };
    return (
      <section className={box} data-next-step="approve">
        <div className="grid grid-cols-2 gap-2">
          <Button icon={CheckCircle2} loading={busy} className="h-11 bg-emerald-600 hover:bg-emerald-700" onClick={approve}>Duyệt</Button>
          <Button variant="secondary" icon={Undo2} className="h-11" onClick={() => setMode("revise")}>Làm lại</Button>
        </div>
      </section>
    );
  }
  return null;
}

/** Huỷ việc phải nêu lý do (hiện ở cột Kết quả + báo cáo) */
function CancelDialog({ t, onClose, act }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (!reason.trim()) return toast.error("Ghi lý do huỷ");
    setBusy(true);
    try { await act("cancel", { body: reason.trim() }, "Đã huỷ công việc"); onClose(); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={busy ? undefined : onClose} title="Huỷ công việc"
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Không huỷ</Button><Button variant="danger" onClick={go} loading={busy}>Huỷ việc</Button></>}>
      <p className="mb-2 text-sm text-slate-600">{t.title}</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} autoFocus rows={3} placeholder="Lý do huỷ" className={cn(inputCls, "resize-y")} data-cancel-reason />
    </Modal>
  );
}

const Info = ({ label, children, strong }) => (
  <div className="min-w-0">
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className={cn("mt-0.5 break-words text-sm text-slate-800", strong && "font-semibold")}>{children}</dd>
  </div>
);

/** Kết quả đã nộp lần cuối (hoặc lý do huỷ) */
function ResultSection({ t }) {
  const last = [...t.events].reverse().find((e) => e.kind === "submit" || e.kind === "cancel");
  if (!last) return null;
  if (last.kind === "cancel" && t.status !== "cancelled") return null;
  if (last.kind === "submit" && !["submitted", "done"].includes(t.status)) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4" data-result>
      <h2 className="text-xs font-medium text-slate-500">{last.kind === "cancel" ? "Lý do huỷ" : "Kết quả"} · {last.fullName} · {fmtWhen(last.createdAt)}</h2>
      {last.body && <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">{last.body}</p>}
      {last.links.map((l) => (
        <a key={l} href={l} target="_blank" rel="noopener noreferrer" className="mt-1.5 flex items-center gap-1.5 text-sm text-blue-700 hover:underline">
          <ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">{l}</span>
        </a>
      ))}
      {last.files.length > 0 && <div className="mt-2"><FileGallery files={last.files} size="sm" /></div>}
    </section>
  );
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const me = usePj((s) => s.boot?.me?.userId);
  const [t, setT] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [project, setProject] = useState(null);
  const [assigningNext, setAssigningNext] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => params.get("chat") === "1");

  const load = useCallback(async () => {
    try { setT(await pjApi.task(id)); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [id]);
  const reload = useCallback(async () => {
    try { setT(await pjApi.task(id, silent)); } catch { /* lần hỏi sau thử lại */ }
  }, [id]);
  useEffect(() => {
    setT(null);
    load();
    pjApi.readNotifications({ taskId: Number(id) }).then(refreshCounts).catch(() => {});
  }, [id, load]);
  // quay lại tab → tải lại (người kia có thể vừa trả lời / duyệt)
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") reload(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reload]);

  const act = useCallback(async (action, x, okText) => {
    await pjApi.act(id, action, { body: x.body, attachments: x.attachments, links: x.links, dueDate: x.dueDate, mentionIds: x.mentionIds });
    if (okText) toast.success(okText);
    await load();
    refreshCounts();
  }, [id, load]);

  const openEdit = async () => {
    try { setProject(project || (await pjApi.project(t.projectId))); setEditing(true); } catch (e) { toast.error(errorMessage(e)); }
  };
  const openNext = async () => {
    try { setProject(await pjApi.project(t.projectId)); setAssigningNext(true); } catch (e) { toast.error(errorMessage(e)); } // tải lại: trạng thái "đang chặn" mới nhất
  };
  const reopen = async () => {
    if (!(await confirmDialog({ title: "Mở lại", message: `Mở lại công việc "${t.title}"?`, confirmText: "Mở lại" }))) return;
    try { await act("reopen", {}, "Đã mở lại công việc"); } catch (e) { toast.error(errorMessage(e)); }
  };

  if (error && !t) return <Page><ErrorBox message={error} onRetry={load} /></Page>;
  if (!t) return <Page><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="mt-4 h-24 w-full rounded-xl" /></Page>;

  const canAssign = t.role === "admin" || t.role === "assigner";
  const a = new Set(t.actions);
  const closed = !["new", "clarify", "doing", "submitted", "revise"].includes(t.status);

  return (
    // máy tính: chat mở thì chừa chỗ bên phải để không che nội dung; điện thoại: chừa chỗ cho nút chat nổi
    <Page wide={chatOpen} className={cn("pb-24 lg:pb-6", chatOpen && "lg:pr-[408px]")}>
      <div className="mb-3 flex items-center gap-2">
        {/* mở từ thông báo / đường dẫn thì không có trang trước → về danh sách */}
        <button type="button" onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(R.projectTasks))} aria-label="Quay lại" className="rounded-lg p-1 text-slate-500 hover:bg-slate-200"><ArrowLeft className="h-5 w-5" /></button>
        <Link to={`${R.projectView}/${t.projectId}`} className="min-w-0 flex-1 truncate text-sm text-slate-500 hover:text-slate-800">{t.projectName}</Link>
        {canAssign && (
          <div className="flex shrink-0 gap-1 text-slate-500">
            {a.has("edit") && <button type="button" onClick={openEdit} title="Sửa" aria-label="Sửa" className="rounded-lg p-2 hover:bg-slate-200"><Pencil className="h-4 w-4" /></button>}
            {a.has("cancel") && <button type="button" onClick={() => setCancelling(true)} title="Huỷ việc" aria-label="Huỷ việc" className="rounded-lg p-2 hover:bg-slate-200"><XCircle className="h-4 w-4" /></button>}
            {a.has("reopen") && <button type="button" onClick={reopen} title="Mở lại" aria-label="Mở lại" className="rounded-lg p-2 hover:bg-slate-200"><RotateCcw className="h-4 w-4" /></button>}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="tabular-nums">{taskCode(t.taskId)}</span>
            <StatusChip status={t.status} />
            <DueBadge task={t} today={t.today} />
            {t.priority === "high" && <span className="inline-flex items-center gap-1 font-medium text-red-600"><Flag className="h-3.5 w-3.5" /> Gấp</span>}
          </div>
          <h1 className="mt-2 whitespace-pre-wrap break-words text-lg font-semibold leading-snug text-slate-900 sm:text-xl">{t.title}</h1>
          {t.expectedOutput && (
            <div className="mt-3"><p className="text-xs text-slate-500">Kết quả đầu ra</p><p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">{t.expectedOutput}</p></div>
          )}
          {t.description && (
            <div className="mt-3"><p className="text-xs text-slate-500">Ghi chú</p><p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">{t.description}</p></div>
          )}
          {t.files.length > 0 && <div className="mt-3"><FileGallery files={t.files} size="sm" /></div>}
          <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
            <Info label="Người phụ trách">{t.assigneeName}</Info>
            <Info label="Người giao">{t.assignerName}</Info>
          </dl>
        </section>

        <NextStep key={t.status} t={t} act={act} />
        <ResultSection t={t} />

        {/* giao tuần tự: việc đã xong / huỷ → người giao giao tiếp việc mới cho cùng người nhận */}
        {t.next && closed && (
          t.next.canAssign ? (
            <button type="button" onClick={openNext} data-next
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              <Plus className="h-4 w-4" /> Giao việc tiếp theo cho {t.assigneeName}
            </button>
          ) : t.next.blockedBy && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t.assigneeName} đang có việc <Link to={`${R.projectTask}/${t.next.blockedBy.taskId}`} className="font-semibold underline">{t.next.blockedBy.title}</Link>{" "}
              ({TASK_STATUS[t.next.blockedBy.status]?.label.toLowerCase()}) chưa xong.
            </p>
          )
        )}
      </div>

      <ChatPanel t={t} me={me} act={act} reload={reload} open={chatOpen} setOpen={setChatOpen} />

      {cancelling && <CancelDialog t={t} onClose={() => setCancelling(false)} act={act} />}
      {editing && project && (
        <TaskForm open onClose={() => setEditing(false)} projectId={t.projectId} members={project.members} task={t} onDone={() => load()} />
      )}
      {assigningNext && project && (
        <TaskForm open onClose={() => setAssigningNext(false)} projectId={t.projectId} members={project.members} assigneeId={t.assigneeId}
          onDone={(taskId) => navigate(`${R.projectTask}/${taskId}`)} />
      )}
    </Page>
  );
}
