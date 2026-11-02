// Tab "Trò chuyện" của dự án: tin nhắn + tệp + trả lời + @nhắc tên (người được nhắc nhận thông báo).
// Không WebSocket: hỏi tin mới (?after=) 4 giây/lần khi tab đang mở & trang đang hiện; đọc tới đâu báo server tới đó.
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CornerDownRight, Loader2, MessagesSquare, Reply, SendHorizonal, Trash2, X } from "lucide-react";
import { cn, confirmDialog, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, FileGallery, UploadList, filesFromPaste, useAttachments } from "~/pagesRequest/shared/Attachments";
import { RichText } from "~/pagesRequest/shared/components";
import { UPLOAD_ENDPOINT, errorMessage, pjApi, silent } from "../shared/api";
import { refreshCounts, usePj } from "../shared/store";
import { fmtWhen } from "../shared/meta";
import { Avatar } from "../shared/components";
import MentionInput, { mentionIdsOf } from "../shared/MentionInput";

const POLL_MS = 4000;
const sameDay = (a, b) => a && b && a.slice(0, 10) === b.slice(0, 10);
const dayLabel = (s) => { const [y, m, d] = s.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };

function Message({ m, mine, names, onReply, onDelete }) {
  return (
    <li className={cn("group flex gap-2", mine && "flex-row-reverse")} data-msg={m.messageId}>
      {!mine && <Avatar name={m.fullName} src={m.avatar} size={30} className="mt-4" />}
      <div className={cn("flex min-w-0 max-w-[85%] flex-col sm:max-w-[70%]", mine && "items-end")}>
        <p className={cn("mb-0.5 px-1 text-[11px] text-slate-400", mine && "text-right")}>{mine ? "" : `${m.fullName} · `}{fmtWhen(m.createdAt).slice(-5)}</p>
        <div className={cn("rounded-2xl px-3 py-2 text-sm", m.isDeleted ? "bg-slate-50 italic text-slate-400 ring-1 ring-slate-200"
          : mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm bg-white text-slate-800 ring-1 ring-slate-200")}>
          {m.reply && (
            <p className={cn("mb-1 flex items-center gap-1 truncate border-l-2 pl-2 text-xs", mine ? "border-blue-300 text-blue-100" : "border-slate-300 text-slate-500")}>
              <CornerDownRight className="h-3 w-3 shrink-0" /> {m.reply.fullName}: {m.reply.body || "(đã thu hồi)"}
            </p>
          )}
          {m.isDeleted ? "Tin nhắn đã được thu hồi" : m.body && (
            <span className={cn(mine && "[&_a]:text-white [&_span.rounded]:bg-blue-500 [&_span.rounded]:text-white")}><RichText text={m.body} mentionNames={names} /></span>
          )}
        </div>
        {m.files.length > 0 && <div className="mt-1 w-full"><FileGallery files={m.files} size="sm" allowDownloadAll={false} /></div>}
        {!m.isDeleted && (
          <div className={cn("mt-0.5 flex gap-3 px-1 text-[11px] text-slate-400 opacity-100 transition lg:opacity-0 lg:group-hover:opacity-100", mine && "justify-end")}>
            <button type="button" onClick={() => onReply(m)} className="inline-flex items-center gap-1 hover:text-blue-700"><Reply className="h-3 w-3" /> Trả lời</button>
            {mine && <button type="button" onClick={() => onDelete(m)} className="inline-flex items-center gap-1 hover:text-red-600"><Trash2 className="h-3 w-3" /> Thu hồi</button>}
          </div>
        )}
      </div>
    </li>
  );
}

export default function ChatTab({ p, onRead }) {
  const me = usePj((s) => s.boot?.me);
  const boot = usePj((s) => s.boot);
  const [rows, setRows] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOld, setLoadingOld] = useState(false);
  const [text, setText] = useState("");
  const [picked, setPicked] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: boot?.files });
  const box = useRef(null);
  const inputRef = useRef(null);
  const lastId = useRef(0);
  const readId = useRef(0);
  const stick = useRef(true); // đang ở cuối → tin mới thì cuộn xuống
  const people = useMemo(() => (p.mentionable || []).filter((u) => u.id !== me?.userId), [p.mentionable, me]);
  const names = useMemo(() => (p.mentionable || []).map((u) => u.name), [p.mentionable]);

  const markRead = useCallback((id) => {
    if (!id || id <= readId.current || document.visibilityState !== "visible") return;
    readId.current = id;
    pjApi.readMessages(p.projectId, id).then(() => { refreshCounts(); onRead?.(); }).catch(() => {});
  }, [p.projectId, onRead]);

  const scrollBottom = () => requestAnimationFrame(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight; });

  // tải lần đầu
  useEffect(() => {
    let alive = true;
    pjApi.messages(p.projectId).then((r) => {
      if (!alive) return;
      setRows(r.rows); setHasMore(r.hasMore);
      lastId.current = r.rows.length ? r.rows[r.rows.length - 1].messageId : 0;
      readId.current = r.lastReadId;
      scrollBottom();
      markRead(lastId.current);
    }).catch((e) => { if (alive) { setRows([]); toast.error(errorMessage(e)); } });
    return () => { alive = false; };
  }, [p.projectId, markRead]);

  // hỏi tin mới
  useEffect(() => {
    if (rows === null) return undefined;
    let busy = false;
    const tick = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const r = await pjApi.messages(p.projectId, { after: lastId.current }, silent);
        if (r.rows.length) {
          setRows((xs) => { const seen = new Set(xs.map((x) => x.messageId)); return [...xs, ...r.rows.filter((x) => !seen.has(x.messageId))]; });
          lastId.current = Math.max(lastId.current, ...r.rows.map((x) => x.messageId));
          if (stick.current) scrollBottom();
          markRead(lastId.current);
        }
      } catch { /* thử lại lần sau */ } finally { busy = false; }
    };
    const timer = setInterval(tick, POLL_MS);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [rows === null, p.projectId, markRead]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOlder = async () => {
    if (!rows?.length) return;
    setLoadingOld(true);
    const el = box.current;
    const before = el ? el.scrollHeight : 0;
    try {
      const r = await pjApi.messages(p.projectId, { before: rows[0].messageId });
      setRows((xs) => [...r.rows, ...xs]);
      setHasMore(r.hasMore);
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - before; });
    } catch (e) { toast.error(errorMessage(e)); } finally { setLoadingOld(false); }
  };

  const send = async () => {
    if (sending || att.uploading) return;
    const body = text.trim();
    if (!body && !att.done.length) return;
    setSending(true);
    try {
      const m = await pjApi.sendMessage(p.projectId, { body, attachments: att.done, mentionIds: mentionIdsOf(body, picked), replyToId: replyTo?.messageId || null });
      setRows((xs) => (xs.some((x) => x.messageId === m.messageId) ? xs : [...xs, m]));
      lastId.current = Math.max(lastId.current, m.messageId);
      readId.current = Math.max(readId.current, m.messageId);
      setText(""); setPicked([]); setReplyTo(null); att.clear();
      if (inputRef.current) inputRef.current.style.height = "auto";
      stick.current = true;
      scrollBottom();
    } catch (e) { toast.error(errorMessage(e, "Gửi tin nhắn thất bại")); } finally { setSending(false); }
  };

  const remove = async (m) => {
    if (!(await confirmDialog({ title: "Thu hồi tin nhắn", message: "Thu hồi tin nhắn này? Mọi người sẽ thấy “Tin nhắn đã được thu hồi”.", confirmText: "Thu hồi", danger: true }))) return;
    try { await pjApi.deleteMessage(m.messageId); setRows((xs) => xs.map((x) => (x.messageId === m.messageId ? { ...x, isDeleted: true, body: null, files: [] } : x))); } catch (e) { toast.error(errorMessage(e)); }
  };

  return (
    <section className="flex h-[calc(100dvh-15rem)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50 lg:h-[calc(100dvh-14rem)]" data-chat>
      <div ref={box} className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        {rows === null ? (
          <div className="grid h-full place-items-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
            <MessagesSquare className="h-8 w-8" /> Chưa có tin nhắn. Trao đổi chung của dự án tại đây — gõ @ để nhắc tên thành viên.
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="mb-3 text-center">
                <button type="button" onClick={loadOlder} disabled={loadingOld} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100">
                  {loadingOld ? "Đang tải…" : "Xem tin cũ hơn"}
                </button>
              </div>
            )}
            <ul className="space-y-2">
              {rows.map((m, i) => (
                <Fragment key={m.messageId}>
                  {!sameDay(rows[i - 1]?.createdAt, m.createdAt) && (
                    <li className="py-1 text-center"><span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-slate-500 ring-1 ring-slate-200">{dayLabel(m.createdAt)}</span></li>
                  )}
                  <Message m={m} mine={m.userId === me?.userId} names={names} onDelete={remove}
                    onReply={(x) => { setReplyTo(x); inputRef.current?.focus(); }} />
                </Fragment>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="border-t border-slate-200 bg-white px-3 py-2">
        {replyTo && (
          <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">
            <Reply className="h-3 w-3" /> Trả lời <b className="text-slate-700">{replyTo.fullName}</b>
            <span className="truncate">{replyTo.body}</span>
            <button type="button" className="ml-auto rounded p-0.5 hover:bg-slate-200" onClick={() => setReplyTo(null)} aria-label="Bỏ trả lời"><X className="h-3 w-3" /></button>
          </div>
        )}
        <UploadList att={att} className="mb-2" />
        <div className="flex items-end gap-2">
          <AttachmentPicker att={att} compact />
          <div className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <MentionInput inputRef={inputRef} value={text} onChange={setText} people={people} rows={1} enterToSend
              onMention={(u) => setPicked((xs) => (xs.some((x) => x.id === u.id) ? xs : [...xs, u]))}
              onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
              onSubmit={send} disabled={sending} placeholder="Nhắn cho cả dự án… (gõ @ để nhắc tên)" />
          </div>
          <button type="button" onClick={send} disabled={sending || att.uploading || (!text.trim() && !att.done.length)} aria-label="Gửi tin nhắn"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-slate-300">
            {sending || att.uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </section>
  );
}
