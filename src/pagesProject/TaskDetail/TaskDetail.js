// Chi tiết công việc — khung "việc cần làm tiếp" ở trên (theo vai trò + trạng thái), dòng thời gian, bình luận.
//   Người nhận: chưa hiểu → Hỏi lại · hiểu rồi → Xác nhận + hạn hoàn thành · đang làm → Nộp kết quả (chữ, tệp, đường dẫn)
//   Người giao: trả lời câu hỏi · Duyệt hoàn thành / Yêu cầu làm lại · sửa / huỷ / mở lại
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CalendarCheck, CheckCircle2, ExternalLink, Flag, HelpCircle, Link2, MessageCircleQuestion, Pencil, Plus, RotateCcw,
  Send, Undo2, X, XCircle,
} from "lucide-react";
import config from "~/config";
import { Button, ErrorBox, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, FileGallery, UploadList, filesFromPaste, useAttachments } from "~/pagesRequest/shared/Attachments";
import { UPLOAD_ENDPOINT, errorMessage, pjApi } from "../shared/api";
import { refreshCounts, usePj } from "../shared/store";
import { EVENT_TEXT, TASK_STATUS, addDays, fmtWhen, fmtYmd } from "../shared/meta";
import { Avatar, DueBadge, Page, StatusChip } from "../shared/components";
import { RichText } from "~/pagesRequest/shared/components";
import TaskForm from "../shared/TaskForm";
import TaskFlow from "../shared/TaskFlow";
import MentionInput, { mentionIdsOf } from "../shared/MentionInput";

const R = config.routes;

/** Ô nhập đường dẫn (nộp kết quả): thêm từng đường dẫn, bấm × để bỏ */
function LinksInput({ links, setLinks }) {
  const [v, setV] = useState("");
  const add = () => {
    const s = v.trim();
    if (!s) return;
    if (!links.includes(s)) setLinks([...links, s]);
    setV("");
  };
  return (
    <div>
      <div className="flex gap-2">
        <label className="relative block flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder="Dán đường dẫn (Google Drive, OneDrive, web…)" className={cn(inputCls, "pl-9")} inputMode="url" />
        </label>
        <Button variant="secondary" onClick={add} disabled={!v.trim()} icon={Plus}>Thêm</Button>
      </div>
      {links.length > 0 && (
        <ul className="mt-2 space-y-1">
          {links.map((l) => (
            <li key={l} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm">
              <Link2 className="h-4 w-4 shrink-0 text-blue-600" />
              <span className="min-w-0 flex-1 truncate text-slate-700">{l}</span>
              <button type="button" onClick={() => setLinks(links.filter((x) => x !== l))} className="rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Bỏ"><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Khung soạn: chữ + tệp (+ đường dẫn / + hạn). onSubmit({ body, attachments, links, dueDate }) → Promise.
 */
function Composer({ placeholder, submitLabel, submitIcon, onSubmit, withLinks, withDate, defaultDate, minDate, tone = "blue", autoFocus, onCancel, rows = 3 }) {
  const files = usePj((s) => s.boot?.files);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: files });
  const [body, setBody] = useState("");
  const [links, setLinks] = useState([]);
  const [due, setDue] = useState(defaultDate || "");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    setBusy(true);
    try {
      await onSubmit({ body: body.trim(), attachments: att.done, links, dueDate: due });
      setBody(""); setLinks([]); att.clear();
    } catch (e) {
      toast.error(errorMessage(e, e.message));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3">
      {withDate && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Hạn hoàn thành <span className="text-red-500">*</span></span>
          <input type="date" value={due} min={minDate} onChange={(e) => setDue(e.target.value)} className={cn(inputCls, "sm:w-60")} />
        </label>
      )}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} autoFocus={autoFocus} rows={rows} placeholder={placeholder}
        onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
        className={cn(inputCls, "resize-y")} />
      {withLinks && <LinksInput links={links} setLinks={setLinks} />}
      <AttachmentPicker att={att} label="Đính kèm tệp: Excel, Word, PDF, ảnh…" hint="Bấm để chọn, kéo thả, hoặc dán ảnh (Ctrl+V)" />
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel && <Button variant="secondary" onClick={onCancel} disabled={busy}>Huỷ</Button>}
        <Button onClick={send} loading={busy} icon={submitIcon} variant={tone === "red" ? "danger" : "primary"} className="flex-1 sm:flex-none">{submitLabel}</Button>
      </div>
    </div>
  );
}

/** Ô bình luận gọn ở cuối trang — gõ @ để nhắc tên (người được nhắc nhận thông báo) */
function CommentBox({ onSubmit, people }) {
  const files = usePj((s) => s.boot?.files);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: files });
  const [body, setBody] = useState("");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!body.trim() && !att.done.length) return;
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    setBusy(true);
    try {
      await onSubmit({ body: body.trim(), attachments: att.done, mentionIds: mentionIdsOf(body, picked) });
      setBody(""); setPicked([]); att.clear();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3" data-comment-box>
      <div className="flex items-end gap-2">
        <AttachmentPicker att={att} compact />
        <div className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <MentionInput value={body} onChange={setBody} people={people} rows={1} placeholder="Viết bình luận… (gõ @ để nhắc tên)"
            onMention={(u) => setPicked((xs) => (xs.some((x) => x.id === u.id) ? xs : [...xs, u]))}
            onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
            onSubmit={send} disabled={busy} />
        </div>
        <Button onClick={send} loading={busy} disabled={!body.trim() && !att.done.length} icon={Send} aria-label="Gửi bình luận" className="px-3"><span className="hidden sm:inline">Gửi</span></Button>
      </div>
      <UploadList att={att} />
    </div>
  );
}

const EVENT_STYLE = {
  question: "border-orange-200 bg-orange-50/60",
  answer: "border-blue-200 bg-blue-50/50",
  submit: "border-violet-300 bg-violet-50/60",
  approve: "border-emerald-200 bg-emerald-50/60",
  revise: "border-rose-200 bg-rose-50/60",
  accept: "border-emerald-200 bg-white",
};

function Timeline({ events, names }) {
  return (
    <ol className="space-y-3">
      {events.map((e) => {
        const card = e.body || e.links.length || e.files.length || e.dueDate;
        return (
          <li key={e.eventId} className="flex gap-3">
            <Avatar name={e.fullName} src={e.avatar} size={32} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-700">
                <b className="text-slate-900">{e.fullName || "Hệ thống"}</b> {EVENT_TEXT[e.kind] || e.kind}
                <span className="ml-2 text-xs text-slate-400">{fmtWhen(e.createdAt)}</span>
              </p>
              {card && (
                <div className={cn("mt-1.5 space-y-2 rounded-xl border p-3", EVENT_STYLE[e.kind] || "border-slate-200 bg-white")}>
                  {e.dueDate && <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CalendarCheck className="h-4 w-4" /> Hạn hoàn thành: {fmtYmd(e.dueDate)}</p>}
                  {e.body && <p className="text-sm leading-relaxed text-slate-800"><RichText text={e.body} mentionNames={names} /></p>}
                  {e.links.length > 0 && (
                    <ul className="space-y-1">
                      {e.links.map((l) => (
                        <li key={l}><a href={l} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1.5 text-sm text-blue-700 hover:underline">
                          <ExternalLink className="h-4 w-4 shrink-0" /><span className="truncate">{l}</span></a></li>
                      ))}
                    </ul>
                  )}
                  {e.files.length > 0 && <FileGallery files={e.files} size="sm" />}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Khung "việc cần làm tiếp" theo vai trò + trạng thái */
function NextStep({ t, act, me }) {
  const [mode, setMode] = useState(null); // accept | question | revise
  const a = new Set(t.actions);
  const lastOf = (kind) => [...t.events].reverse().find((e) => e.kind === kind);
  const isAssignee = t.assigneeId === me;
  const minDate = t.today;
  const defaultDue = t.expectedDate && t.expectedDate >= t.today ? t.expectedDate : addDays(t.today, 3);

  if (a.has("accept")) {
    const q = t.status === "clarify";
    return (
      <section className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
        <p className="flex items-start gap-2 font-semibold text-amber-900">
          <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" />
          {q ? "Bạn đã hỏi lại — chờ người giao trả lời. Rõ rồi thì có thể xác nhận ngay." : "Bạn được giao việc này. Đọc kỹ yêu cầu bên dưới rồi xác nhận."}
        </p>
        {!mode && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button onClick={() => setMode("accept")} icon={CheckCircle2} className="h-12">Đã hiểu – xác nhận</Button>
            <Button variant="secondary" onClick={() => setMode("question")} icon={MessageCircleQuestion} className="h-12">Chưa hiểu – hỏi lại</Button>
          </div>
        )}
        {mode === "accept" && (
          <div className="mt-3 rounded-lg bg-white p-3">
            <Composer withDate defaultDate={defaultDue} minDate={minDate} rows={2} placeholder="Ghi chú cho người giao (không bắt buộc)"
              submitLabel="Xác nhận và nhận việc" submitIcon={CheckCircle2} onCancel={() => setMode(null)}
              onSubmit={(x) => act("accept", x, "Đã xác nhận công việc")} />
          </div>
        )}
        {mode === "question" && (
          <div className="mt-3 rounded-lg bg-white p-3">
            <Composer autoFocus placeholder="Bạn chưa rõ điều gì? (vd: cần báo cáo theo mẫu nào, số liệu tháng mấy…)"
              submitLabel="Gửi câu hỏi" submitIcon={Send} onCancel={() => setMode(null)} onSubmit={(x) => act("question", x, "Đã gửi câu hỏi cho người giao việc")} />
          </div>
        )}
      </section>
    );
  }

  if (a.has("submit")) {
    const rv = t.status === "revise" ? lastOf("revise") : null;
    return (
      <section className="rounded-xl border-2 border-blue-300 bg-blue-50/60 p-4">
        {rv && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            <p className="flex items-center gap-1.5 font-semibold"><Undo2 className="h-4 w-4" /> {rv.fullName} yêu cầu làm lại:</p>
            <p className="mt-1 whitespace-pre-wrap">{rv.body}</p>
          </div>
        )}
        <p className="mb-3 font-semibold text-blue-900">Nộp kết quả — viết nội dung, đính kèm tệp (Excel, Word, PDF, ảnh) hoặc dán đường dẫn</p>
        <Composer withLinks rows={4} placeholder="Nội dung kết quả / ghi chú cho người giao việc" submitLabel={rv ? "Nộp lại kết quả" : "Nộp kết quả"} submitIcon={Send}
          onSubmit={(x) => act("submit", x, "Đã nộp kết quả")} />
      </section>
    );
  }

  if (a.has("answer")) {
    const q = lastOf("question");
    return (
      <section className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
        <p className="flex items-center gap-1.5 font-semibold text-orange-900"><MessageCircleQuestion className="h-5 w-5" /> {q?.fullName || "Người nhận"} hỏi lại</p>
        {q?.body && <p className="mt-1 whitespace-pre-wrap text-sm text-orange-900">{q.body}</p>}
        {q?.files?.length > 0 && <div className="mt-2"><FileGallery files={q.files} size="sm" /></div>}
        <div className="mt-3 rounded-lg bg-white p-3">
          <Composer placeholder="Trả lời để người nhận hiểu rõ và xác nhận" submitLabel="Gửi trả lời" submitIcon={Send} onSubmit={(x) => act("answer", x, "Đã trả lời")} />
        </div>
      </section>
    );
  }

  if (a.has("approve")) {
    return (
      <section className="rounded-xl border-2 border-violet-300 bg-violet-50/70 p-4">
        <p className="font-semibold text-violet-900">Kết quả đã nộp — xem ở dòng thời gian bên dưới rồi duyệt</p>
        {mode !== "revise" ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button icon={CheckCircle2} className="h-12 bg-emerald-600 hover:bg-emerald-700"
              onClick={async () => { if (await confirmDialog({ title: "Duyệt hoàn thành", message: `Xác nhận công việc "${t.title}" đã hoàn thành?`, confirmText: "Duyệt hoàn thành" })) act("approve", {}, "Đã duyệt hoàn thành").catch((e) => toast.error(errorMessage(e))); }}>
              Duyệt hoàn thành
            </Button>
            <Button variant="secondary" icon={Undo2} className="h-12" onClick={() => setMode("revise")}>Yêu cầu làm lại</Button>
          </div>
        ) : (
          <div className="mt-3 rounded-lg bg-white p-3">
            <Composer autoFocus tone="red" placeholder="Cần làm lại / bổ sung gì? (bắt buộc)" submitLabel="Gửi yêu cầu làm lại" submitIcon={Undo2}
              onCancel={() => setMode(null)} onSubmit={(x) => act("revise", x, "Đã yêu cầu làm lại")} />
          </div>
        )}
      </section>
    );
  }

  // không có việc phải làm ngay — chỉ báo trạng thái
  const msg = {
    new: "Chờ người nhận đọc và xác nhận.",
    clarify: "Người nhận đã hỏi lại — chờ người giao trả lời.",
    doing: isAssignee ? "" : "Người nhận đang làm.",
    submitted: isAssignee ? "Đã nộp — chờ người giao duyệt." : "Đã nộp — chờ người giao việc duyệt.",
    revise: "Đã yêu cầu làm lại — chờ người nhận nộp lại.",
    done: "Công việc đã hoàn thành.",
    cancelled: "Công việc đã huỷ.",
  }[t.status];
  if (!msg) return null;
  return <p className={cn("rounded-xl px-4 py-3 text-sm font-medium", t.status === "done" ? "bg-emerald-50 text-emerald-800" : t.status === "cancelled" ? "bg-slate-100 text-slate-600" : "bg-white text-slate-600 ring-1 ring-slate-200")}>{msg}</p>;
}

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = usePj((s) => s.boot?.me?.userId);
  const [t, setT] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [project, setProject] = useState(null);

  const load = useCallback(async () => {
    try { setT(await pjApi.task(id)); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [id]);
  useEffect(() => {
    setT(null);
    load();
    pjApi.readNotifications({ taskId: Number(id) }).then(refreshCounts).catch(() => {});
  }, [id, load]);
  // quay lại tab → tải lại (người kia có thể vừa trả lời / duyệt)
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  const act = useCallback(async (action, x, okText) => {
    await pjApi.act(id, action, { body: x.body, attachments: x.attachments, links: x.links, dueDate: x.dueDate, mentionIds: x.mentionIds });
    toast.success(okText);
    await load();
    refreshCounts();
  }, [id, load]);

  const [assigningNext, setAssigningNext] = useState(false);
  const loadProject = async () => { const x = project || (await pjApi.project(t.projectId)); setProject(x); return x; };
  const openEdit = async () => {
    try { await loadProject(); setEditing(true); } catch (e) { toast.error(errorMessage(e)); }
  };
  const openNext = async () => {
    try { setProject(await pjApi.project(t.projectId)); setAssigningNext(true); } catch (e) { toast.error(errorMessage(e)); } // tải lại: trạng thái "đang chặn" mới nhất
  };
  const simple = async (action, title, message, okText, danger) => {
    if (!(await confirmDialog({ title, message, confirmText: title, danger }))) return;
    try { await act(action, {}, okText); } catch (e) { toast.error(errorMessage(e)); }
  };

  const assignEvent = useMemo(() => t?.events.find((e) => e.kind === "assign"), [t]);

  if (error && !t) return <Page><ErrorBox message={error} onRetry={load} /></Page>;
  if (!t) return <Page><Skeleton className="h-40 w-full rounded-xl" /><Skeleton className="mt-4 h-24 w-full rounded-xl" /></Page>;

  const canAssign = t.role === "admin" || t.role === "assigner";
  const back = canAssign ? `${R.projectView}/${t.projectId}/member/${t.assigneeId}` : `${R.projectView}/${t.projectId}`;
  const a = new Set(t.actions);

  return (
    <Page>
      <Link to={back} className="mb-3 inline-flex max-w-full items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4 shrink-0" /> <span className="truncate">{t.projectName}</span>
      </Link>
      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={t.status} />
            {t.priority === "high" && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200"><Flag className="h-3 w-3" /> Gấp</span>}
            <DueBadge task={t} today={t.today} />
          </div>
          <h1 className="mt-2 text-lg font-bold leading-snug text-slate-900 sm:text-xl">{t.title}</h1>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-slate-500">Người giao</dt><dd className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-800"><Avatar name={t.assignerName} size={20} /><span className="truncate">{t.assignerName}</span></dd></div>
            <div><dt className="text-xs text-slate-500">Người nhận</dt><dd className="mt-0.5 flex items-center gap-1.5 font-medium text-slate-800"><Avatar name={t.assigneeName} size={20} /><span className="truncate">{t.assigneeName}</span></dd></div>
            <div><dt className="text-xs text-slate-500">Hạn mong muốn</dt><dd className="mt-0.5 font-medium text-slate-800">{fmtYmd(t.expectedDate) || "—"}</dd></div>
            <div><dt className="text-xs text-slate-500">Hạn hoàn thành</dt><dd className={cn("mt-0.5 font-semibold", t.overdue ? "text-red-600" : "text-slate-800")}>{fmtYmd(t.dueDate) || "Chưa xác nhận"}</dd></div>
          </dl>
          {canAssign && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {a.has("edit") && <Button size="sm" variant="secondary" icon={Pencil} onClick={openEdit}>Sửa</Button>}
              {a.has("cancel") && <Button size="sm" variant="secondary" icon={XCircle} onClick={() => simple("cancel", "Huỷ công việc", `Huỷ công việc "${t.title}"? Người nhận sẽ được báo.`, "Đã huỷ công việc", true)}>Huỷ việc</Button>}
              {a.has("reopen") && <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => simple("reopen", "Mở lại", `Mở lại công việc "${t.title}"?`, "Đã mở lại công việc")}>Mở lại</Button>}
            </div>
          )}
        </section>

        <NextStep t={t} act={act} me={me} />

        {/* giao tuần tự: việc đã xong / huỷ → người giao giao tiếp việc mới cho cùng người nhận */}
        {t.next && !["new", "clarify", "doing", "submitted", "revise"].includes(t.status) && (
          t.next.canAssign ? (
            <button type="button" onClick={openNext} data-next
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              <Plus className="h-4 w-4" /> Giao việc tiếp theo cho {t.assigneeName}
            </button>
          ) : t.next.blockedBy && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
              {t.assigneeName} đang có việc <Link to={`${R.projectTask}/${t.next.blockedBy.taskId}`} className="font-semibold underline">{t.next.blockedBy.title}</Link>{" "}
              ({TASK_STATUS[t.next.blockedBy.status]?.label.toLowerCase()}) bạn giao chưa xong — xong việc đó mới giao tiếp được.
            </p>
          )
        )}

        {(t.description || t.files.length > 0) && (
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">Yêu cầu công việc</p>
            {t.description ? <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-800">{t.description}</p> : <p className="text-sm text-slate-400">Không có mô tả</p>}
            {t.files.length > 0 && <div className="mt-3"><FileGallery files={t.files} size="sm" /></div>}
            {assignEvent && <p className="mt-3 text-xs text-slate-400">Giao lúc {fmtWhen(assignEvent.createdAt)}</p>}
          </section>
        )}

        <TaskFlow t={t} />

        <section>
          <h2 className="mb-3 font-semibold text-slate-800">Trao đổi & lịch sử</h2>
          <Timeline events={t.events} names={(t.mentionable || []).map((u) => u.name)} />
        </section>

        {a.has("comment") && <CommentBox people={(t.mentionable || []).filter((u) => u.id !== me)} onSubmit={(x) => act("comment", x, "Đã gửi bình luận")} />}
      </div>

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
