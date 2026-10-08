// Tin nhắn của module 18: 1-1, nhóm, nhóm chat gắn với đề xuất.
// Không dùng WebSocket (server yếu): đang mở hội thoại thì hỏi tin mới 3 giây/lần, danh sách hội thoại 12 giây/lần,
// dừng khi ẩn tab. Gửi tin hiện ngay (đang gửi…) rồi thay bằng tin thật.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Check, CheckCheck, FileText, Loader2, LogOut, MessageCirclePlus, MessagesSquare, RotateCcw, Search,
  SendHorizonal, Trash2, UserPlus, Users,
} from "lucide-react";
import config from "~/config";
import { Button, Field, Modal, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { AvatarStack, CountBadge, RichText, StatusBadge, UserAvatar, UserPicker, norm } from "../shared/components";
import { AttachmentPicker, FileGallery, UploadList, filesFromPaste, useAttachments } from "../shared/Attachments";
import { refreshCounts, rqEvents, useRq, userName } from "../shared/store";
import { dayLabel, hm, timeAgo } from "../shared/format";

const R = config.routes;
let tempSeq = 0;

function convTitle(c, meId, dir) {
  if (c.kind === "direct") {
    const other = c.memberIds.find((id) => id !== meId);
    return dir?.userById.get(other)?.name || userName(other, "Hội thoại");
  }
  if (c.kind === "request") return c.requestTitle || c.title || `Đề xuất #${c.requestId}`;
  return c.title || "Nhóm chat";
}

function ConvAvatar({ c, meId, size = 40 }) {
  if (c.kind === "direct") return <UserAvatar id={c.memberIds.find((id) => id !== meId)} size={size} />;
  if (c.kind === "request") {
    return <span className="flex shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700" style={{ width: size, height: size }}><FileText className="h-5 w-5" /></span>;
  }
  return <span className="flex shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700" style={{ width: size, height: size }}><Users className="h-5 w-5" /></span>;
}

/* ------------------------------ Danh sách hội thoại ------------------------------ */
function ConversationList({ convs, activeId, onOpen, onNew, onNewGroup }) {
  const me = useRq((s) => s.boot?.me);
  const dir = useRq((s) => s.dir);
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return (convs || []).filter((c) => !nq || norm(convTitle(c, me?.userId, dir)).includes(nq));
  }, [convs, q, me, dir]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="space-y-2 border-b border-slate-200 p-3">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-base font-bold text-slate-800">Tin nhắn</h2>
          <button type="button" onClick={onNewGroup} title="Tạo nhóm chat" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><Users className="h-5 w-5" /></button>
          <button type="button" onClick={onNew} title="Tin nhắn mới" className="rounded-lg p-1.5 text-blue-700 hover:bg-blue-50"><MessageCirclePlus className="h-5 w-5" /></button>
        </div>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm hội thoại" className="h-8 w-full rounded-lg border-0 bg-slate-100 pl-8 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!convs && <div className="space-y-3 p-3">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="flex gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-4/5" /></div></div>)}</div>}
        {convs?.length === 0 && (
          <div className="px-6 py-14 text-center text-sm text-slate-400">
            <MessagesSquare className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            Chưa có hội thoại.<br />
            <button type="button" onClick={onNew} className="mt-2 font-medium text-blue-700 hover:underline">Nhắn tin cho đồng nghiệp</button>
          </div>
        )}
        <ul>
          {shown.map((c) => (
            <li key={c.conversationId}>
              <button type="button" onClick={() => onOpen(c.conversationId)}
                className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition", String(activeId) === String(c.conversationId) ? "bg-blue-50" : "hover:bg-slate-50")}>
                <ConvAvatar c={c} meId={me?.userId} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("min-w-0 flex-1 truncate text-sm", c.unread ? "font-bold text-slate-900" : "font-medium text-slate-800")}>{convTitle(c, me?.userId, dir)}</span>
                    <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(c.lastAt)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={cn("min-w-0 flex-1 truncate text-xs", c.unread ? "font-medium text-slate-700" : "text-slate-500")}>
                      {c.lastBody ? `${c.lastUserId === me?.userId ? "Bạn: " : c.kind !== "direct" && c.lastUserId ? `${userName(c.lastUserId).split(" ").pop()}: ` : ""}${c.lastBody}` : c.kind === "request" ? "Nhóm trao đổi về đề xuất" : "Chưa có tin nhắn"}
                    </span>
                    <CountBadge n={c.unread} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------ Một hội thoại ------------------------------ */
function MessageBubble({ m, mine, showName, showAvatar, onDelete, onRetry, mentionNames }) {
  const [hover, setHover] = useState(false);
  return (
    <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {!mine && <span className="w-7 shrink-0">{showAvatar && <UserAvatar id={m.userId} size={28} />}</span>}
      <div className={cn("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
        {showName && !mine && <span className="mb-0.5 ml-1 text-[11px] text-slate-500">{userName(m.userId)}</span>}
        <div className="flex items-center gap-1">
          {mine && hover && !m.isDeleted && !m.temp && (
            <button type="button" onClick={() => onDelete(m)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Thu hồi"><Trash2 className="h-3.5 w-3.5" /></button>
          )}
          <div className={cn("rounded-2xl px-3 py-2 text-sm",
            m.isDeleted ? "bg-transparent italic text-slate-400 ring-1 ring-slate-200"
              : mine ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200",
            m.failed && "bg-red-500")}>
            {m.isDeleted ? "Tin nhắn đã thu hồi" : (
              <>
                {m.refRequestId && (
                  <Link to={`${R.request}?id=${m.refRequestId}`} className={cn("mb-1 block rounded-lg px-2 py-1.5 text-xs", mine ? "bg-white/15 text-white" : "bg-slate-50 text-slate-700 ring-1 ring-slate-200")}>
                    <span className="flex items-center gap-1 font-semibold"><FileText className="h-3.5 w-3.5" /> #{m.refRequestId} {m.refTitle}</span>
                    {m.refStatus && <StatusBadge status={m.refStatus} className="mt-1" />}
                  </Link>
                )}
                {m.body && <RichText text={m.body} mentionNames={mentionNames} />}
              </>
            )}
          </div>
        </div>
        {!m.isDeleted && m.files?.length > 0 && <div className="mt-1"><FileGallery files={m.files} size="sm" allowDownloadAll={false} /></div>}
        {m.pendingFiles > 0 && <span className="mt-1 text-[11px] text-slate-400">📎 {m.pendingFiles} tệp</span>}
        <span className="mt-0.5 flex items-center gap-1 px-1 text-[10px] text-slate-400">
          {hm(m.createdAt)}
          {m.temp && !m.failed && <Loader2 className="h-3 w-3 animate-spin" />}
          {m.failed && <button type="button" onClick={() => onRetry(m)} className="inline-flex items-center gap-0.5 font-medium text-red-600"><RotateCcw className="h-3 w-3" /> Gửi lại</button>}
        </span>
      </div>
    </div>
  );
}

function Conversation({ cid, conv, onBack, onSent }) {
  const me = useRq((s) => s.boot?.me);
  const dir = useRq((s) => s.dir);
  const [msgs, setMsgs] = useState(null);
  const [reads, setReads] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOld, setLoadingOld] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [addIds, setAddIds] = useState([]);
  const [busy, setBusy] = useState(null);
  const att = useAttachments();
  const scroller = useRef(null);
  const stick = useRef(true); // đang ở cuối → tin mới thì cuộn xuống
  const lastId = useRef(0);
  const readSent = useRef(0);
  const inputRef = useRef(null);
  const mentionNames = useMemo(() => (dir ? dir.users.map((u) => u.name) : []), [dir]);

  const markRead = useCallback((id) => {
    if (!id || id <= readSent.current || document.visibilityState !== "visible") return;
    readSent.current = id;
    rqApi.readConversation(cid, id).then(() => { refreshCounts(); rqEvents.emit("chat-read", { cid }); }).catch(() => {});
  }, [cid]);

  const merge = useCallback((list) => {
    setMsgs((xs) => {
      const cur = xs || [];
      const have = new Set(cur.filter((x) => !x.temp).map((x) => x.messageId));
      const add = list.filter((m) => !have.has(m.messageId));
      if (!add.length) return cur;
      return [...cur.filter((x) => !x.temp), ...add, ...cur.filter((x) => x.temp)].sort((a, b) => (a.temp ? 1 : 0) - (b.temp ? 1 : 0) || a.messageId - b.messageId);
    });
  }, []);

  // tải lần đầu
  useEffect(() => {
    let alive = true;
    setMsgs(null); setError(null); lastId.current = 0; readSent.current = 0; stick.current = true;
    rqApi.messages(cid).then((d) => {
      if (!alive) return;
      setMsgs(d.messages);
      setReads(d.reads);
      setHasMore(d.hasMore);
      lastId.current = d.messages.length ? d.messages[d.messages.length - 1].messageId : 0;
      markRead(lastId.current);
    }).catch((e) => alive && setError(errorMessage(e, "Không tải được hội thoại")));
    return () => { alive = false; };
  }, [cid, markRead]);

  // hỏi tin mới 3 giây / lần
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.visibilityState !== "visible" || msgs === null) return;
      try {
        const d = await rqApi.messages(cid, { afterId: lastId.current || undefined }, { silent: true });
        setReads(d.reads);
        if (d.messages.length) {
          lastId.current = d.messages[d.messages.length - 1].messageId;
          merge(d.messages);
          markRead(lastId.current);
        }
      } catch { /* bỏ qua lượt này */ }
    }, 3000);
    return () => clearInterval(t);
  }, [cid, msgs, merge, markRead]);

  // giữ cuộn ở cuối khi có tin mới
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  const loadOlder = async () => {
    if (loadingOld || !hasMore || !msgs?.length) return;
    setLoadingOld(true);
    const el = scroller.current;
    const before = el.scrollHeight;
    try {
      const firstReal = msgs.find((m) => !m.temp);
      const d = await rqApi.messages(cid, { beforeId: firstReal?.messageId });
      stick.current = false;
      setMsgs((xs) => [...d.messages, ...xs]);
      setHasMore(d.hasMore);
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight - before; });
    } catch (e) { toast.error(errorMessage(e)); } finally { setLoadingOld(false); }
  };

  const onScroll = (e) => {
    const el = e.currentTarget;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (el.scrollTop < 60) loadOlder();
  };

  const doSend = async (temp) => {
    try {
      const m = await rqApi.sendMessage(cid, { body: temp.body, attachments: temp.attachments });
      setMsgs((xs) => [...(xs || []).filter((x) => x.messageId !== temp.messageId && x.messageId !== m.messageId), m]
        .sort((a, b) => (a.temp ? 1 : 0) - (b.temp ? 1 : 0) || a.messageId - b.messageId));
      lastId.current = Math.max(lastId.current, m.messageId);
      readSent.current = Math.max(readSent.current, m.messageId);
      onSent?.();
    } catch (e) {
      setMsgs((xs) => xs.map((x) => (x.messageId === temp.messageId ? { ...x, failed: true } : x)));
      toast.error(errorMessage(e, "Gửi tin nhắn thất bại"));
    }
  };

  const send = () => {
    const body = text.trim();
    if (att.uploading) return toast.info("Đợi tải tệp xong");
    if (!body && !att.done.length) return;
    const temp = {
      messageId: `t${++tempSeq}`, temp: true, userId: me?.userId, body, attachments: att.done, pendingFiles: att.done.length,
      createdAt: new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 19), files: [],
    };
    stick.current = true;
    setMsgs((xs) => [...(xs || []), temp]);
    setText("");
    att.clear();
    if (inputRef.current) inputRef.current.style.height = "auto";
    doSend(temp);
  };

  const retry = (m) => {
    setMsgs((xs) => xs.map((x) => (x.messageId === m.messageId ? { ...x, failed: false } : x)));
    doSend(m);
  };

  const remove = async (m) => {
    if (!(await confirmDialog({ title: "Thu hồi tin nhắn", message: "Thu hồi tin nhắn này với mọi người?", confirmText: "Thu hồi", danger: true }))) return;
    try {
      await rqApi.deleteMessage(m.messageId);
      setMsgs((xs) => xs.map((x) => (x.messageId === m.messageId ? { ...x, isDeleted: true, body: null, files: [] } : x)));
    } catch (e) { toast.error(errorMessage(e)); }
  };

  const addMembers = async () => {
    setBusy("add");
    try {
      await rqApi.addMembers(cid, addIds);
      toast.success("Đã thêm thành viên");
      setAddOpen(false); setAddIds([]); onSent?.();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  };
  const leave = async () => {
    if (!(await confirmDialog({ title: "Rời nhóm", message: "Rời khỏi nhóm chat này?", confirmText: "Rời nhóm", danger: true }))) return;
    setBusy("leave");
    try { await rqApi.leaveConversation(cid); onSent?.(); onBack(true); } catch (e) { toast.error(errorMessage(e)); setBusy(null); }
  };

  const others = (conv?.memberIds || []).filter((id) => id !== me?.userId);
  const otherRead = conv?.kind === "direct" ? reads.find((r) => r.userId !== me?.userId)?.lastReadMessageId || 0 : 0;
  const lastMine = [...(msgs || [])].reverse().find((m) => m.userId === me?.userId && !m.temp);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <button type="button" onClick={() => onBack()} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Quay lại"><ArrowLeft className="h-5 w-5" /></button>
        {conv && <ConvAvatar c={conv} meId={me?.userId} size={36} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-800">{conv ? convTitle(conv, me?.userId, dir) : "…"}</p>
          <p className="truncate text-xs text-slate-500">
            {conv?.kind === "direct" ? [dir?.deptById.get(dir?.userById.get(others[0])?.d)?.name, dir?.userById.get(others[0])?.j].filter(Boolean).join(" · ")
              : conv ? `${conv.memberIds.length} thành viên` : ""}
          </p>
        </div>
        {conv?.kind === "request" && <Link to={`${R.request}?id=${conv.requestId}`} className="rounded-lg px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">Xem đề xuất</Link>}
        {conv && conv.kind !== "direct" && <span className="hidden sm:block"><AvatarStack ids={conv.memberIds} max={4} /></span>}
        {conv?.kind === "group" && (
          <>
            <button type="button" onClick={() => setAddOpen(true)} title="Thêm thành viên" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"><UserPlus className="h-4 w-4" /></button>
            <button type="button" onClick={leave} disabled={busy === "leave"} title="Rời nhóm" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">{busy === "leave" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}</button>
          </>
        )}
      </div>

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
        {error && <div className="flex flex-col items-center gap-2 py-10 text-sm text-red-600"><AlertTriangle className="h-6 w-6" />{error}</div>}
        {!msgs && !error && <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className={cn("flex", i % 2 ? "justify-end" : "")}><Skeleton className="h-10 w-48 rounded-2xl" /></div>)}</div>}
        {hasMore && <div className="py-1 text-center">{loadingOld ? <Loader2 className="mx-auto h-4 w-4 animate-spin text-slate-400" /> : <button type="button" onClick={loadOlder} className="text-xs font-medium text-blue-700">Xem tin cũ hơn</button>}</div>}
        {msgs?.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Chưa có tin nhắn — gửi lời chào 👋</p>}
        {msgs?.map((m, i) => {
          const prev = msgs[i - 1];
          const next = msgs[i + 1];
          const mine = m.userId === me?.userId;
          const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
          return (
            <div key={m.messageId}>
              {newDay && <div className="my-3 text-center"><span className="rounded-full bg-slate-200/70 px-2.5 py-0.5 text-[11px] text-slate-500">{dayLabel(m.createdAt)}</span></div>}
              <MessageBubble m={m} mine={mine} mentionNames={mentionNames}
                showName={conv?.kind !== "direct" && (!prev || prev.userId !== m.userId || newDay)}
                showAvatar={!next || next.userId !== m.userId}
                onDelete={remove} onRetry={retry} />
              {conv?.kind === "direct" && lastMine && m.messageId === lastMine.messageId && (
                <p className="mt-0.5 flex items-center justify-end gap-0.5 pr-1 text-[10px] text-slate-400">
                  {otherRead >= m.messageId ? <><CheckCheck className="h-3 w-3 text-blue-600" /> Đã xem</> : <><Check className="h-3 w-3" /> Đã gửi</>}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-2">
        <UploadList att={att} className="mb-2 mt-0" />
        <div className="flex items-end gap-1">
          <AttachmentPicker att={att} compact />
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(140, e.target.scrollHeight)}px`; }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }}
            placeholder="Nhập tin nhắn… (Enter gửi, Shift+Enter xuống dòng)"
            className="max-h-36 min-h-[38px] flex-1 resize-none rounded-2xl border-0 bg-slate-100 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-200"
          />
          <button type="button" onClick={send} disabled={(!text.trim() && !att.done.length) || att.uploading}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:bg-slate-300" title="Gửi">
            {att.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm thành viên" size="sm"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Huỷ</Button><Button loading={busy === "add"} disabled={!addIds.length} onClick={addMembers}>Thêm</Button></>}>
        <UserPicker value={addIds} onChange={setAddIds} excludeIds={conv?.memberIds || []} autoFocus />
      </Modal>
    </div>
  );
}

/* ------------------------------ Trang ------------------------------ */
export default function Chat() {
  const [params, setParams] = useSearchParams();
  const me = useRq((s) => s.boot?.me);
  const cid = params.get("c");
  const [convs, setConvs] = useState(null);
  const [newOpen, setNewOpen] = useState(null); // 'direct' | 'group'
  const [newUser, setNewUser] = useState(null);
  const [groupIds, setGroupIds] = useState([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const loadConvs = useCallback(async (quiet) => {
    try { setConvs(await rqApi.conversations(quiet ? { silent: true } : undefined)); } catch (e) { if (!quiet) toast.error(errorMessage(e)); }
  }, []);
  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") loadConvs(true); }, 12000);
    const offs = [rqEvents.on("chat", () => loadConvs(true)), rqEvents.on("chat-read", () => loadConvs(true))];
    return () => { clearInterval(t); offs.forEach((f) => f()); };
  }, [loadConvs]);

  const open = (id) => setParams({ c: String(id) });
  const back = (reload) => { setParams({}); if (reload) loadConvs(true); };

  const create = async () => {
    setCreating(true);
    try {
      const body = newOpen === "direct" ? { kind: "direct", userId: newUser } : { kind: "group", title: groupTitle.trim(), userIds: groupIds };
      const r = await rqApi.openConversation(body);
      setNewOpen(null); setNewUser(null); setGroupIds([]); setGroupTitle("");
      await loadConvs(true);
      open(r.conversationId);
    } catch (e) { toast.error(errorMessage(e)); } finally { setCreating(false); }
  };

  const active = convs?.find((c) => String(c.conversationId) === String(cid));

  return (
    <div className="flex h-full">
      <div className={cn("h-full w-full shrink-0 border-r border-slate-200 lg:w-[340px]", cid && "hidden lg:block")}>
        <ConversationList convs={convs} activeId={cid} onOpen={open} onNew={() => setNewOpen("direct")} onNewGroup={() => setNewOpen("group")} />
      </div>
      <div className={cn("h-full min-w-0 flex-1", !cid && "hidden lg:block")}>
        {cid ? (
          <Conversation key={cid} cid={cid} conv={active} onBack={back} onSent={() => loadConvs(true)} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-50 p-8 text-center text-slate-400">
            <MessagesSquare className="h-12 w-12 text-slate-300" />
            <p className="text-sm">Chọn hội thoại hoặc <button type="button" className="font-medium text-blue-700 hover:underline" onClick={() => setNewOpen("direct")}>nhắn tin mới</button></p>
          </div>
        )}
      </div>

      <Modal open={!!newOpen} onClose={() => setNewOpen(null)} title={newOpen === "group" ? "Tạo nhóm chat" : "Tin nhắn mới"} size="sm"
        footer={<><Button variant="secondary" onClick={() => setNewOpen(null)}>Huỷ</Button>
          <Button loading={creating} disabled={newOpen === "direct" ? !newUser : !groupIds.length || !groupTitle.trim()} onClick={create}>{newOpen === "group" ? "Tạo nhóm" : "Nhắn tin"}</Button></>}>
        {newOpen === "direct" ? (
          <UserPicker multiple={false} value={newUser} onChange={setNewUser} excludeIds={[me?.userId]} autoFocus placeholder="Tìm đồng nghiệp…" />
        ) : (
          <div className="space-y-3">
            <Field label="Tên nhóm" required><input className={inputCls} value={groupTitle} maxLength={200} onChange={(e) => setGroupTitle(e.target.value)} placeholder="VD: Tổ in 1 - ca sáng" autoFocus /></Field>
            <Field label="Thành viên" required><UserPicker value={groupIds} onChange={setGroupIds} excludeIds={[me?.userId]} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
