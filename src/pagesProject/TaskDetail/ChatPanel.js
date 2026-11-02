// Khung chat của 1 công việc — nổi ở góc phải dưới (kiểu Messenger), mặc định thu gọn để người đọc tập trung vào nội dung việc.
// Gồm tin trao đổi (bình luận, hỏi lại, trả lời, lý do làm lại…) + các mốc thao tác dạng 1 dòng.
// Khi mở: hỏi dữ liệu mới 8 giây/lần (không dùng WebSocket).
import { useEffect, useRef, useState } from "react";
import { ExternalLink, MessageCircle, Send, X } from "lucide-react";
import { Button, cn, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, FileGallery, UploadList, filesFromPaste, useAttachments } from "~/pagesRequest/shared/Attachments";
import { RichText } from "~/pagesRequest/shared/components";
import { UPLOAD_ENDPOINT, errorMessage } from "../shared/api";
import { usePj } from "../shared/store";
import { EVENT_TEXT, fmtWhen, fmtYmd } from "../shared/meta";
import { Avatar } from "../shared/components";
import MentionInput, { mentionIdsOf } from "../shared/MentionInput";

const POLL_MS = 8000;
const seenKey = (taskId) => `pj_chat_seen_${taskId}`;
/** Sự kiện được tính là "tin" (người viết nội dung) */
const isMessage = (e) => !!(e.body || e.files.length || e.links.length) && e.kind !== "assign";

function Bubble({ e, mine, names }) {
  return (
    <li className={cn("flex gap-2", mine && "flex-row-reverse")} data-event={e.kind}>
      {!mine && <Avatar name={e.fullName} src={e.avatar} size={26} className="mt-4" />}
      <div className={cn("min-w-0 max-w-[80%]", mine && "text-right")}>
        <p className="mb-0.5 truncate text-[11px] text-slate-400">
          {!mine && <b className="font-medium text-slate-600">{e.fullName} · </b>}
          {e.kind !== "comment" && `${EVENT_TEXT[e.kind] || e.kind} · `}{fmtWhen(e.createdAt)}
        </p>
        <div className={cn("space-y-1.5 rounded-2xl px-3 py-2 text-left text-sm", mine ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800")}>
          {e.body && <p className="whitespace-pre-wrap break-words leading-relaxed"><RichText text={e.body} mentionNames={names} /></p>}
          {e.links.map((l) => (
            <a key={l} href={l} target="_blank" rel="noopener noreferrer" className={cn("flex items-center gap-1 text-xs underline", mine ? "text-white" : "text-blue-700")}>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{l}</span>
            </a>
          ))}
          {e.files.length > 0 && <FileGallery files={e.files} size="sm" allowDownloadAll={false} />}
        </div>
      </div>
    </li>
  );
}

const StepLine = ({ e }) => (
  <li className="text-center text-[11px] text-slate-400" data-event={e.kind}>
    {e.fullName} {EVENT_TEXT[e.kind] || e.kind}{e.dueDate ? ` · hạn ${fmtYmd(e.dueDate)}` : ""} · {fmtWhen(e.createdAt)}
  </li>
);

function Composer({ people, onSend }) {
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
      await onSend({ body: body.trim(), attachments: att.done, mentionIds: mentionIdsOf(body, picked) });
      setBody(""); setPicked([]); att.clear();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="border-t border-slate-200 p-2" data-comment-box>
      <UploadList att={att} className="mb-2" />
      <div className="flex items-end gap-1.5">
        <AttachmentPicker att={att} compact />
        <div className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-blue-400">
          <MentionInput value={body} onChange={setBody} people={people} rows={1} placeholder="Nhắn tin… (gõ @ để nhắc tên)" enterToSend
            onMention={(u) => setPicked((xs) => (xs.some((x) => x.id === u.id) ? xs : [...xs, u]))}
            onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
            onSubmit={send} disabled={busy} />
        </div>
        <Button onClick={send} loading={busy} disabled={!body.trim() && !att.done.length} icon={Send} aria-label="Gửi bình luận" className="px-3" />
      </div>
    </div>
  );
}

/**
 * @param t       chi tiết công việc (events, mentionable, actions)
 * @param me      userId người xem
 * @param act     (action, body, okText) → Promise
 * @param reload  tải lại chi tiết (không hiện thanh tiến trình)
 * @param open / setOpen trạng thái mở (trang cần biết để chừa chỗ trên máy tính)
 */
export default function ChatPanel({ t, me, act, reload, open, setOpen }) {
  const listRef = useRef(null);
  const events = t.events;
  const messages = events.filter(isMessage);
  const lastId = events.length ? events[events.length - 1].eventId : 0;
  const [seen, setSeen] = useState(() => Number(localStorage.getItem(seenKey(t.taskId))) || 0);
  const unread = messages.filter((e) => e.eventId > seen && e.userId !== me).length;

  useEffect(() => {
    if (!open) return undefined;
    localStorage.setItem(seenKey(t.taskId), String(lastId));
    setSeen(lastId);
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    return undefined;
  }, [open, lastId, t.taskId]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setInterval(() => { if (document.visibilityState === "visible") reload(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [open, reload]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} aria-label="Mở khung chat" data-chat-open
        className="fixed bottom-[4.25rem] right-3 z-30 inline-flex h-12 items-center gap-2 rounded-full bg-blue-600 pl-4 pr-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 lg:bottom-5 lg:right-5">
        <MessageCircle className="h-5 w-5" /> Trao đổi
        {(unread > 0 || messages.length > 0) && (
          <span className={cn("min-w-[20px] rounded-full px-1.5 text-center text-xs leading-5", unread > 0 ? "bg-red-500 text-white" : "bg-white/20")} data-chat-count>
            {unread > 0 ? unread : messages.length}
          </span>
        )}
      </button>
    );
  }
  const names = (t.mentionable || []).map((u) => u.name);
  return (
    <section data-chat-panel aria-label="Trao đổi"
      className="fixed inset-x-0 bottom-14 top-14 z-30 flex flex-col bg-white lg:inset-auto lg:bottom-5 lg:right-5 lg:h-[min(600px,calc(100dvh-6rem))] lg:w-[380px] lg:rounded-2xl lg:border lg:border-slate-200 lg:shadow-2xl">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        <h2 className="flex-1 font-semibold text-slate-800">Trao đổi</h2>
        <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Đóng khung chat"><X className="h-5 w-5" /></button>
      </header>
      <ol ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3" data-chat-list>
        {events.map((e) => (isMessage(e) ? <Bubble key={e.eventId} e={e} mine={e.userId === me} names={names} /> : <StepLine key={e.eventId} e={e} />))}
      </ol>
      {t.actions.includes("comment") && <Composer people={(t.mentionable || []).filter((u) => u.id !== me)} onSend={(x) => act("comment", x)} />}
    </section>
  );
}
