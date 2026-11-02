// Hộp "Giao việc" / "Sửa công việc" (người giao việc) — dùng ở chi tiết dự án + trang việc của 1 thành viên + chi tiết việc
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, Lock } from "lucide-react";
import config from "~/config";
import { Button, Field, Modal, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, useAttachments } from "~/pagesRequest/shared/Attachments";
import { UPLOAD_ENDPOINT, errorMessage, pjApi } from "./api";
import { usePj } from "./store";
import { TASK_STATUS } from "./meta";

const R = config.routes;

/**
 * @param members  thành viên dự án (chọn người nhận) [{ userId, name, role }]
 * @param task     có → sửa công việc này (không đổi người nhận)
 * @param assigneeId người nhận chọn sẵn
 * @param onDone   (taskId) sau khi lưu
 */
export default function TaskForm({ open, onClose, projectId, members = [], task, assigneeId, onDone }) {
  const files = usePj((s) => s.boot?.files);
  const today = usePj((s) => s.boot?.today);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: files });
  const [v, setV] = useState(() => ({
    assigneeId: task?.assigneeId || assigneeId || "",
    title: task?.title || "",
    description: task?.description || "",
    expectedDate: task?.expectedDate || "",
    priority: task?.priority || "normal",
  }));
  const [keep, setKeep] = useState(() => (task?.files || []).map((f) => f.fileId));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const people = useMemo(() => [...members].sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, "vi") : a.role === "assignee" ? -1 : 1)), [members]);
  // giao tuần tự: người nhận còn việc mình giao chưa xong → chưa giao tiếp được
  const blocked = !task ? people.find((m) => String(m.userId) === String(v.assigneeId))?.blockedBy : null;

  const save = async () => {
    if (!v.title.trim()) return toast.error("Nhập tên công việc");
    if (!task && !v.assigneeId) return toast.error("Chọn người nhận việc");
    if (blocked) return toast.error("Người này còn việc bạn giao chưa xong");
    if (!v.expectedDate) return toast.error("Chọn hạn hoàn thành mong muốn");
    if (!task && today && v.expectedDate < today) return toast.error("Hạn hoàn thành không được trước hôm nay");
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    setBusy(true);
    try {
      const body = { ...v, assigneeId: Number(v.assigneeId), attachments: att.done };
      let id = task?.taskId;
      if (task) await pjApi.updateTask(task.taskId, { ...body, keepFileIds: keep });
      else id = (await pjApi.createTask(projectId, body)).taskId;
      toast.success(task ? "Đã lưu công việc" : "Đã giao việc");
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
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Huỷ</Button><Button onClick={save} loading={busy} disabled={!!blocked}>{task ? "Lưu" : "Giao việc"}</Button></>}>
      <div className="space-y-4">
        {!task && (
          <Field label="Người nhận việc" required hint="Giao tuần tự: người nhận hoàn thành việc bạn giao trước thì mới giao được việc tiếp theo">
            <select className={inputCls} value={v.assigneeId} onChange={set("assigneeId")}>
              <option value="">— Chọn thành viên —</option>
              {people.map((m) => <option key={m.userId} value={m.userId}>{m.name}{m.role === "assigner" ? " (người giao việc)" : ""}{m.blockedBy ? " — đang có việc chưa xong" : ""}</option>)}
            </select>
          </Field>
        )}
        {blocked && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900" data-blocked>
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Người này còn việc <Link to={`${R.projectTask}/${blocked.taskId}`} onClick={onClose} className="font-semibold underline">{blocked.title}</Link>{" "}
              ({TASK_STATUS[blocked.status]?.label.toLowerCase()}) bạn giao chưa xong. Duyệt hoàn thành hoặc huỷ việc đó rồi mới giao việc tiếp theo.
            </p>
          </div>
        )}
        <Field label="Tên công việc" required>
          <input className={inputCls} value={v.title} onChange={set("title")} maxLength={300} placeholder="vd: Lập báo cáo tồn kho tháng 11" />
        </Field>
        <Field label="Mô tả / yêu cầu" hint="Viết rõ cần làm gì, kết quả mong muốn — người nhận đọc kỹ rồi xác nhận hoặc hỏi lại">
          <textarea className={cn(inputCls, "min-h-[120px] resize-y")} value={v.description} onChange={set("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hạn hoàn thành mong muốn" required hint="Mốc thời gian của việc — người nhận xác nhận lại hạn khi nhận việc">
            <input type="date" className={inputCls} value={v.expectedDate} min={task ? undefined : today} onChange={set("expectedDate")} />
          </Field>
          <Field label="Mức độ">
            <button type="button" onClick={() => setV((x) => ({ ...x, priority: x.priority === "high" ? "normal" : "high" }))}
              className={cn("flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition",
                v.priority === "high" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")}>
              <Flag className="h-4 w-4" /> {v.priority === "high" ? "Gấp" : "Bình thường — bấm để đánh dấu gấp"}
            </button>
          </Field>
        </div>
        {task?.files?.length > 0 && (
          <Field label="Tệp đã đính kèm">
            <ul className="space-y-1">
              {task.files.map((f) => (
                <li key={f.fileId} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={keep.includes(f.fileId)} onChange={(e) => setKeep((k) => (e.target.checked ? [...k, f.fileId] : k.filter((x) => x !== f.fileId)))} />
                  <span className={cn("truncate", !keep.includes(f.fileId) && "text-slate-400 line-through")}>{f.name}</span>
                </li>
              ))}
            </ul>
          </Field>
        )}
        <AttachmentPicker att={att} label="Đính kèm tài liệu (Excel, Word, PDF, ảnh…)" />
      </div>
    </Modal>
  );
}
