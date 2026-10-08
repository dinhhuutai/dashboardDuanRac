// Bình luận / thảo luận của 1 đề xuất: trả lời 1 cấp, @nhắc tên (thêm người đó vào theo dõi), đính kèm + dán ảnh
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CornerDownRight, Loader2, Reply, SendHorizonal, Trash2, X } from "lucide-react";
import { cn, confirmDialog, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { Avatar, RichText, UserAvatar, norm } from "../shared/components";
import { AttachmentPicker, FileGallery, UploadList, UploadWarning, filesFromPaste, useAttachments } from "../shared/Attachments";
import { useRq } from "../shared/store";
import { fmtDateTime, timeAgo } from "../shared/format";

/* ------------------------------ Ô soạn có @nhắc tên ------------------------------ */
export function MentionTextarea({ value, onChange, onMention, onPaste, onSubmit, placeholder, disabled, inputRef, className, minRows = 2 }) {
  const dir = useRq((s) => s.dir);
  const [query, setQuery] = useState(null); // { start, text }
  const [active, setActive] = useState(0);
  const local = useRef(null);
  const ref = inputRef || local;
  const caretRef = useRef(null);

  // Đặt con trỏ ngay khi nội dung mới vào DOM (trước phím kế tiếp). Trước đây dùng requestAnimationFrame:
  // gõ nhanh sau khi chọn tên thì ký tự bị chèn sai chỗ ("nhé" thành "hén").
  useLayoutEffect(() => {
    const el = ref.current;
    if (caretRef.current === null || !el) return;
    const pos = caretRef.current;
    caretRef.current = null;
    el.focus();
    el.setSelectionRange(pos, pos);
  }, [value, ref]);

  const suggestions = useMemo(() => {
    if (!query || !dir) return [];
    const q = norm(query.text);
    return dir.users.filter((u) => !q || norm(u.name).includes(q) || norm(u.msnv).includes(q)).slice(0, 7);
  }, [query, dir]);

  const detect = (text, caret) => {
    const before = text.slice(0, caret);
    const m = /(^|\s)@([^\s@]{0,30}(?:\s[^\s@]{0,20}){0,3})$/.exec(before);
    if (m) { setQuery({ start: caret - m[2].length - 1, text: m[2] }); setActive(0); }
    else setQuery(null);
  };

  const pick = (u) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const next = `${value.slice(0, query.start)}@${u.name} ${value.slice(caret)}`;
    caretRef.current = query.start + u.name.length + 2;
    onChange(next);
    onMention?.(u);
    setQuery(null);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        rows={minRows}
        placeholder={placeholder}
        onPaste={onPaste}
        onChange={(e) => { onChange(e.target.value); detect(e.target.value, e.target.selectionStart); }}
        onKeyDown={(e) => {
          if (query && suggestions.length) {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (i + 1) % suggestions.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(suggestions[active]); return; }
            if (e.key === "Escape") { setQuery(null); return; }
          }
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onSubmit?.(); }
        }}
        className={cn("block w-full resize-none border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400 focus:ring-0", className)}
        style={{ maxHeight: 220 }}
        onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(220, e.target.scrollHeight)}px`; }}
      />
      {query && suggestions.length > 0 && (
        <ul className="absolute bottom-full left-0 z-50 mb-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {suggestions.map((u, i) => (
            <li key={u.id}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); pick(u); }}
                className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm", i === active ? "bg-blue-50" : "hover:bg-slate-50")}>
                <Avatar user={u} size={24} /> <span className="truncate">{u.name}</span>
                <span className="ml-auto text-xs text-slate-400">{u.msnv}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------ Một bình luận ------------------------------ */
function CommentItem({ c, meId, isAdmin, onReply, onDeleted, parent, mentionNames }) {
  const [deleting, setDeleting] = useState(false);
  const remove = async () => {
    if (!(await confirmDialog({ title: "Xoá bình luận", message: "Xoá bình luận này?", confirmText: "Xoá", danger: true }))) return;
    setDeleting(true);
    try {
      await rqApi.deleteComment(c.commentId);
      onDeleted(c.commentId);
    } catch (e) {
      toast.error(errorMessage(e));
      setDeleting(false);
    }
  };
  return (
    <li className={cn("flex gap-2.5", deleting && "opacity-50")}>
      <UserAvatar id={c.userId} name={c.fullName} size={32} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">
          <p className="text-sm font-semibold text-slate-800">{c.fullName}</p>
          {parent && (
            <p className="mb-1 flex items-center gap-1 truncate border-l-2 border-slate-300 pl-2 text-xs text-slate-500">
              <CornerDownRight className="h-3 w-3 shrink-0" /> {parent.fullName}: {parent.isDeleted ? "(đã xoá)" : parent.body || "📎 tệp"}
            </p>
          )}
          {c.isDeleted ? <p className="text-sm italic text-slate-400">Bình luận đã bị xoá</p>
            : c.body && <p className="text-sm text-slate-700"><RichText text={c.body} mentionNames={mentionNames} /></p>}
        </div>
        {c.files?.length > 0 && <div className="mt-1.5"><FileGallery files={c.files} size="sm" allowDownloadAll={false} /></div>}
        <div className="mt-0.5 flex items-center gap-3 pl-2 text-xs text-slate-400">
          <span title={fmtDateTime(c.createdAt)}>{timeAgo(c.createdAt)}</span>
          {!c.isDeleted && <button type="button" onClick={() => onReply(c)} className="inline-flex items-center gap-1 font-medium hover:text-blue-700"><Reply className="h-3 w-3" /> Trả lời</button>}
          {!c.isDeleted && (c.userId === meId || isAdmin) && (
            <button type="button" disabled={deleting} onClick={remove} className="inline-flex items-center gap-1 font-medium hover:text-red-600">
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Xoá
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------ Khung bình luận ------------------------------ */
export default function Comments({ requestId, comments, onAdded, onDeleted, meId, isAdmin }) {
  const me = useRq((s) => s.boot?.me);
  const dir = useRq((s) => s.dir);
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const att = useAttachments();
  const inputRef = useRef(null);
  const byId = useMemo(() => new Map(comments.map((c) => [c.commentId, c])), [comments]);
  const mentionNames = useMemo(() => (dir ? dir.users.map((u) => u.name) : []), [dir]);

  const send = async () => {
    if (sending || att.uploading) return;
    const body = text.trim();
    if (!body && !att.done.length) return;
    // chỉ gửi người còn được nhắc trong nội dung
    const mentionIds = mentions.filter((u) => body.includes(`@${u.name}`)).map((u) => u.id);
    setSending(true);
    try {
      const c = await rqApi.comment(requestId, { body, parentId: replyTo?.commentId || null, attachments: att.done, mentionIds });
      onAdded(c);
      setText("");
      setMentions([]);
      setReplyTo(null);
      att.clear();
      if (inputRef.current) inputRef.current.style.height = "auto";
    } catch (e) {
      toast.error(errorMessage(e, "Gửi bình luận thất bại"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Chưa có bình luận. Trao đổi về đề xuất tại đây — gõ @ để nhắc tên.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <CommentItem key={c.commentId} c={c} meId={meId} isAdmin={isAdmin} parent={c.parentId ? byId.get(c.parentId) : null}
              mentionNames={mentionNames}
              onReply={(x) => { setReplyTo(x); inputRef.current?.focus(); }} onDeleted={onDeleted} />
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2.5">
        <Avatar user={{ name: me?.fullName, avatar: me?.avatar }} size={32} />
        <div className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          {replyTo && (
            <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-500">
              <Reply className="h-3 w-3" /> Trả lời <b className="text-slate-700">{replyTo.fullName}</b>
              <button type="button" className="ml-auto rounded p-0.5 hover:bg-slate-200" onClick={() => setReplyTo(null)}><X className="h-3 w-3" /></button>
            </div>
          )}
          <MentionTextarea
            inputRef={inputRef}
            value={text}
            onChange={setText}
            onMention={(u) => setMentions((xs) => (xs.some((x) => x.id === u.id) ? xs : [...xs, u]))}
            onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
            onSubmit={send}
            disabled={sending}
            placeholder="Viết bình luận… (gõ @ để nhắc tên, Ctrl+Enter để gửi)"
          />
          <UploadList att={att} />
          <UploadWarning att={att} />
          <div className="mt-1 flex items-center justify-between">
            <AttachmentPicker att={att} compact />
            <button type="button" onClick={send} disabled={sending || att.uploading || (!text.trim() && !att.done.length)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300">
              {sending || att.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              {att.uploading ? "Đang tải tệp…" : sending ? "Đang gửi…" : "Gửi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
