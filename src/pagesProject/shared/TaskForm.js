// Hộp "Giao việc" / "Sửa công việc" (người giao việc) — dùng ở trang Công việc, chi tiết dự án, việc của 1 thành viên, chi tiết việc.
// Trường: Người phụ trách · Nội dung · Kết quả đầu ra · Hạn hoàn thành · Ghi chú. Bật AI thì dán đoạn văn để điền sẵn.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, Lock, Sparkles } from "lucide-react";
import config from "~/config";
import { Button, Field, Modal, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, UploadList, useAttachments } from "~/pagesRequest/shared/Attachments";
import { UPLOAD_ENDPOINT, errorMessage, pjApi } from "./api";
import { usePj } from "./store";
import { TASK_STATUS } from "./meta";

const R = config.routes;
const LAST_PROJECT = "pj_last_project";

/** Dán đoạn văn → AI tách ra các trường, người giao xem lại rồi mới bấm giao */
function AiBox({ projectId, onResult }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (!text.trim()) return toast.error("Dán nội dung công việc trước");
    if (!projectId) return toast.error("Chọn dự án trước");
    setBusy(true);
    try { onResult(await pjApi.aiExtract(projectId, text)); } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="rounded-lg bg-blue-50 p-2.5" data-ai-box>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Dán nội dung giao việc — AI tự điền các ô bên dưới"
        className={cn(inputCls, "resize-y bg-white")} aria-label="Nội dung để AI điền" />
      <div className="mt-2 flex justify-end">
        <Button size="sm" onClick={run} loading={busy} icon={Sparkles} disabled={!text.trim()}>AI điền</Button>
      </div>
    </div>
  );
}

/**
 * @param projectId  dự án cố định; không có thì chọn trong `projects`
 * @param projects   dự án giao được [{ projectId, name }] (khi mở từ trang Công việc)
 * @param members    thành viên dự án [{ userId, name, role, blockedBy }] (không truyền → tự tải theo dự án)
 * @param task       có → sửa công việc này (không đổi người nhận)
 * @param assigneeId người nhận chọn sẵn
 * @param onDone     (taskId) sau khi lưu
 */
export default function TaskForm({ open, onClose, projectId: fixedProject, projects, members: givenMembers, task, assigneeId, onDone }) {
  const files = usePj((s) => s.boot?.files);
  const today = usePj((s) => s.boot?.today);
  const aiOn = usePj((s) => s.boot?.ai) && !task;
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: files });
  const [pid, setPid] = useState(() => {
    if (fixedProject) return String(fixedProject);
    const last = localStorage.getItem(LAST_PROJECT);
    if (projects?.some((p) => String(p.projectId) === last)) return last;
    return projects?.length === 1 ? String(projects[0].projectId) : "";
  });
  const [loaded, setLoaded] = useState(null); // thành viên tải theo dự án đang chọn
  const members = givenMembers || loaded;
  const [v, setV] = useState(() => ({
    assigneeId: task?.assigneeId || assigneeId || "",
    title: task?.title || "",
    expectedOutput: task?.expectedOutput || "",
    description: task?.description || "",
    expectedDate: task?.expectedDate || "",
    priority: task?.priority || "normal",
  }));
  const [keep, setKeep] = useState(() => (task?.files || []).map((f) => f.fileId));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  useEffect(() => {
    if (givenMembers || !pid) { setLoaded(null); return undefined; }
    let alive = true;
    pjApi.project(pid).then((p) => { if (alive) setLoaded(p.members); }).catch((e) => { if (alive) toast.error(errorMessage(e)); });
    return () => { alive = false; };
  }, [pid, givenMembers]);

  const people = useMemo(() => [...(members || [])].sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, "vi") : a.role === "assignee" ? -1 : 1)), [members]);
  // giao tuần tự: người nhận còn việc mình giao chưa xong → chưa giao tiếp được
  const blocked = !task ? people.find((m) => String(m.userId) === String(v.assigneeId))?.blockedBy : null;

  const applyAi = (r) => {
    setV((x) => ({
      ...x,
      title: r.title || x.title,
      expectedOutput: r.expectedOutput || x.expectedOutput,
      description: r.note || x.description,
      expectedDate: r.expectedDate || x.expectedDate,
      assigneeId: r.assigneeId || x.assigneeId,
      priority: r.priority === "high" ? "high" : x.priority,
    }));
    if (r.assigneeMention && !r.assigneeId) toast.error(`"${r.assigneeMention}" không có trong dự án — chọn người phụ trách`);
    else toast.success("Đã điền — kiểm tra lại rồi bấm Giao việc");
  };

  const save = async () => {
    if (!task && !pid) return toast.error("Chọn dự án");
    if (!task && !v.assigneeId) return toast.error("Chọn người phụ trách");
    if (!v.title.trim()) return toast.error("Nhập nội dung công việc");
    if (blocked) return toast.error("Người này còn việc bạn giao chưa xong");
    if (!v.expectedDate) return toast.error("Chọn hạn hoàn thành");
    if (!task && today && v.expectedDate < today) return toast.error("Hạn hoàn thành không được trước hôm nay");
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    setBusy(true);
    try {
      const body = { ...v, assigneeId: Number(v.assigneeId), attachments: att.done };
      let id = task?.taskId;
      if (task) await pjApi.updateTask(task.taskId, { ...body, keepFileIds: keep });
      else {
        id = (await pjApi.createTask(pid, body)).taskId;
        if (!fixedProject) localStorage.setItem(LAST_PROJECT, pid);
      }
      toast.success(task ? "Đã lưu" : "Đã giao việc");
      onDone?.(id);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} size="lg" title={task ? "Sửa công việc" : "Giao việc"}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Huỷ</Button>
          <Button onClick={save} loading={busy} disabled={!!blocked}>{task ? "Lưu" : "Giao việc"}</Button>
        </>
      )}>
      <div className="space-y-3">
        {!task && !fixedProject && projects?.length > 1 && (
          <Field label="Dự án" required>
            <select className={inputCls} value={pid} onChange={(e) => { setPid(e.target.value); setV((x) => ({ ...x, assigneeId: "" })); }} data-field="project">
              <option value="">— Chọn dự án —</option>
              {projects.map((p) => <option key={p.projectId} value={p.projectId}>{p.name}</option>)}
            </select>
          </Field>
        )}
        {aiOn && <AiBox projectId={pid} onResult={applyAi} />}
        {!task && (
          <Field label="Người phụ trách" required>
            <select className={inputCls} value={v.assigneeId} onChange={set("assigneeId")} data-field="assignee">
              <option value="">{pid ? "— Chọn người —" : "Chọn dự án trước"}</option>
              {people.map((m) => <option key={m.userId} value={m.userId}>{m.name}{m.blockedBy ? " (đang có việc chưa xong)" : ""}</option>)}
            </select>
          </Field>
        )}
        {blocked && (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900" data-blocked>
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Còn việc <Link to={`${R.projectTask}/${blocked.taskId}`} onClick={onClose} className="font-semibold underline">{blocked.title}</Link>{" "}
              ({TASK_STATUS[blocked.status]?.label.toLowerCase()}) chưa xong — xong việc đó mới giao tiếp được.
            </span>
          </p>
        )}
        <Field label="Nội dung" required>
          <textarea className={cn(inputCls, "resize-y")} rows={2} value={v.title} onChange={set("title")} maxLength={300} placeholder="Việc cần làm" data-field="title" />
        </Field>
        <Field label="Kết quả đầu ra">
          <input className={inputCls} value={v.expectedOutput} onChange={set("expectedOutput")} maxLength={2000} placeholder="vd: Báo cáo Excel theo mẫu" data-field="output" />
        </Field>
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <Field label="Hạn hoàn thành" required>
            <input type="date" className={inputCls} value={v.expectedDate} min={task ? undefined : today} onChange={set("expectedDate")} />
          </Field>
          <button type="button" onClick={() => setV((x) => ({ ...x, priority: x.priority === "high" ? "normal" : "high" }))} aria-pressed={v.priority === "high"} data-field="priority"
            className={cn("mb-px inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition",
              v.priority === "high" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-300 bg-white text-slate-500 hover:bg-slate-50")}>
            <Flag className="h-4 w-4" /> Gấp
          </button>
        </div>
        <Field label="Ghi chú">
          <textarea className={cn(inputCls, "resize-y")} rows={2} value={v.description} onChange={set("description")} data-field="note" />
        </Field>
        {task?.files?.length > 0 && (
          <ul className="space-y-1">
            {task.files.map((f) => (
              <li key={f.fileId} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={keep.includes(f.fileId)} onChange={(e) => setKeep((k) => (e.target.checked ? [...k, f.fileId] : k.filter((x) => x !== f.fileId)))} />
                <span className={cn("truncate", !keep.includes(f.fileId) && "text-slate-400 line-through")}>{f.name}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <AttachmentPicker att={att} compact /> Đính kèm tệp
        </div>
        <UploadList att={att} />
      </div>
    </Modal>
  );
}
