// Chi tiết 1 đề xuất (khung phải): thông tin, tệp, quy trình duyệt, người theo dõi, bình luận, lịch sử.
// Mở lại đề xuất đã xem → hiện ngay bản đã nhớ rồi tải mới ngầm. Đang mở thì hỏi cập nhật mỗi 15 giây.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Ban, Check, Copy, CornerUpLeft, Flag, Forward, History, Link2, Loader2, MessagesSquare, Paperclip, Pencil, Plus, RefreshCw,
  Star, Trash2, X, Zap,
} from "lucide-react";
import config from "~/config";
import { Button, Modal, Skeleton, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { FileServerNotice, StatusBadge, UserAvatar, UserPicker } from "../shared/components";
import { FileGallery } from "../shared/Attachments";
import { FieldValues } from "../shared/FieldInput";
import { TypeIcon } from "../shared/typeIcons";
import { refreshCounts, rqEvents, useRq } from "../shared/store";
import { deadlineInfo, fmtDateTime, timeAgo } from "../shared/format";
import ApprovalFlow from "./ApprovalFlow";
import ActionDialog from "./ActionDialog";
import Comments from "./Comments";

const cache = new Map(); // requestId → chi tiết đã tải (mở lại hiện ngay)
const R = config.routes;

const ACTIVITY = {
  create: "đã gửi đề xuất",
  approve: "đã duyệt",
  reject: "đã từ chối",
  return: "đã trả lại để bổ sung",
  resubmit: "đã bổ sung và gửi lại",
  edit: "đã sửa đề xuất",
  cancel: "đã huỷ đề xuất",
  follow: "đã thêm người theo dõi",
  forward: "đã chuyển tiếp cho người khác duyệt",
  approve_forward: "đã duyệt và chuyển tiếp",
  delete: "đã xoá đề xuất",
};

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4 lg:p-6" role="status" aria-label="Đang tải đề xuất">
      <div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-4 w-1/3" /></div></div>
      <Skeleton className="h-9 w-64" />
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">{[0, 1].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
    </div>
  );
}

function Section({ title, icon: Icon, right, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <h3 className="flex-1 text-sm font-semibold text-slate-700">{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function RequestDetail({ id, onBack, onChanged }) {
  const navigate = useNavigate();
  const me = useRq((s) => s.boot?.me);
  const myTypes = useRq((s) => s.boot?.types);
  const unread = useRq((s) => s.counts.unreadNotifications);
  const [fwd, setFwd] = useState(null); // hộp chuyển tiếp: { to: [userId], note, approve, saving }
  const [data, setData] = useState(() => cache.get(id) || null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [action, setAction] = useState(null);
  const [tab, setTab] = useState("comments");
  const [followOpen, setFollowOpen] = useState(false);
  const [followIds, setFollowIds] = useState([]);
  const [savingFollow, setSavingFollow] = useState(false);
  const [busy, setBusy] = useState(null); // 'chat' | 'edit' | 'unfollow'
  const lastActivity = useRef(null);

  const load = useCallback(async (quiet) => {
    setError(null);
    if (!quiet) setRefreshing(true);
    try {
      const d = await rqApi.detail(id, quiet ? { silent: true } : undefined);
      cache.set(id, d);
      if (cache.size > 40) cache.delete(cache.keys().next().value);
      lastActivity.current = d.lastActivityAt;
      setData(d);
    } catch (e) {
      if (!quiet) setError(errorMessage(e, "Không tải được đề xuất"));
    } finally {
      if (!quiet) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    setData(cache.get(id) || null);
    setTab("comments");
    load();
  }, [id, load]);

  // đã mở đề xuất → đánh dấu đã đọc thông báo của đề xuất này
  useEffect(() => {
    if (unread > 0) rqApi.readNotifications({ requestId: Number(id) }).then(refreshCounts).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // hỏi cập nhật 15 giây / lần khi đang mở và tab đang hiện
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible" || !data) return;
      try {
        const lastId = data.comments.reduce((m, c) => Math.max(m, c.commentId), 0);
        const u = await rqApi.updates(id, lastId);
        if (u.status !== data.status) { load(true); return; } // có người duyệt/từ chối/huỷ
        if (u.comments.length) {
          lastActivity.current = u.lastActivityAt;
          setData((d) => {
            if (!d) return d;
            const have = new Set(d.comments.map((c) => c.commentId));
            const add = u.comments.filter((c) => !have.has(c.commentId));
            return add.length ? { ...d, comments: [...d.comments, ...add] } : d;
          });
        } else if (u.lastActivityAt !== lastActivity.current) {
          load(true); // duyệt 1 bước, thêm người theo dõi…
        }
      } catch { /* bỏ qua */ }
    };
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, [id, data, load]);

  const after = (msg) => {
    toast.success(msg);
    load(true);
    refreshCounts();
    onChanged?.();
    rqEvents.emit("changed", { requestId: Number(id) });
  };

  const doAction = async (note) => {
    try {
      if (action === "cancel") {
        await rqApi.cancel(id, note);
        after("Đã huỷ đề xuất");
      } else {
        const r = await rqApi.act(id, action, note);
        after(action === "approve" ? (r.result === "approved" ? "Đã duyệt — đề xuất hoàn tất" : "Đã duyệt") : action === "reject" ? "Đã từ chối đề xuất" : "Đã trả lại cho người gửi");
      }
      setAction(null);
    } catch (e) {
      toast.error(errorMessage(e));
      if (e?.response?.status === 409) { load(true); setAction(null); }
    }
  };

  const doForward = async () => {
    if (!fwd?.to?.length || fwd.saving) return;
    setFwd((f) => ({ ...f, saving: true }));
    try {
      await rqApi.forward(id, { userId: fwd.to[0], note: fwd.note.trim() || null, approve: !!fwd.approve });
      setFwd(null);
      after(fwd.approve ? "Đã duyệt và chuyển tiếp" : "Đã chuyển tiếp cho người khác duyệt");
    } catch (e) {
      toast.error(errorMessage(e));
      setFwd((f) => (f ? { ...f, saving: false } : f));
      if (e?.response?.status === 409) load(true);
    }
  };

  const doDelete = async () => {
    const ok = await confirmDialog({
      title: "Xoá đề xuất",
      message: `Xoá đề xuất #${id} "${data?.title || ""}"? Đề xuất sẽ không còn hiện với bất kỳ ai.`,
      confirmText: "Xoá đề xuất", danger: true,
    });
    if (!ok) return;
    setBusy("delete");
    try {
      await rqApi.remove(id);
      cache.delete(id);
      toast.success("Đã xoá đề xuất");
      refreshCounts();
      onChanged?.();
      rqEvents.emit("changed", { requestId: Number(id), deleted: true });
      onBack?.();
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  };

  const openChat = async () => {
    setBusy("chat");
    try {
      const r = await rqApi.openConversation({ kind: "request", requestId: Number(id) });
      navigate(`${R.requestChat}?c=${r.conversationId}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  };

  const addFollowers = async () => {
    if (!followIds.length) return;
    setSavingFollow(true);
    try {
      const r = await rqApi.addFollowers(id, followIds);
      toast.success(r.added.length ? `Đã thêm ${r.added.length} người theo dõi` : "Những người này đã theo dõi rồi");
      setFollowOpen(false);
      setFollowIds([]);
      load(true);
    } catch (e) { toast.error(errorMessage(e)); } finally { setSavingFollow(false); }
  };

  const unfollow = async (userId) => {
    setBusy(`unfollow-${userId}`);
    try {
      await rqApi.removeFollower(id, userId);
      load(true);
      if (userId === me?.userId) rqEvents.emit("changed", { requestId: Number(id) });
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(null); }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${R.request}?id=${id}`;
    try { await navigator.clipboard.writeText(url); toast.success("Đã sao chép liên kết"); } catch { toast.info(url); }
  };

  const filesByField = useMemo(() => {
    const m = {};
    for (const f of data?.files || []) if (f.fieldKey) (m[f.fieldKey] = m[f.fieldKey] || []).push(f);
    return m;
  }, [data]);
  const generalFiles = useMemo(() => (data?.files || []).filter((f) => !f.fieldKey), [data]);

  if (error && !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-slate-600">{error}</p>
        <div className="flex gap-2">
          {onBack && <Button variant="secondary" onClick={onBack}>Quay lại</Button>}
          <Button onClick={() => load()}>Thử lại</Button>
        </div>
      </div>
    );
  }
  if (!data) return <DetailSkeleton />;

  const p = data.permissions;
  const canCopy = !!myTypes?.some((t) => t.typeId === data.typeId); // mẫu còn dùng + mình được gửi
  const dl = deadlineInfo(data.deadline, data.status);
  const returnedNote = data.status === "returned" ? data.approvers.find((a) => a.status === "returned") : null;
  const rejectedNote = data.status === "rejected" ? data.approvers.find((a) => a.status === "rejected") : null;
  const activeComments = data.comments;

  return (
    <div className="h-full overflow-y-auto">
      {/* Thanh thao tác */}
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur lg:px-5">
        {onBack && <button type="button" onClick={onBack} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Quay lại"><ArrowLeft className="h-5 w-5" /></button>}
        <span className="text-sm font-medium text-slate-400">#{data.requestId}</span>
        <StatusBadge status={data.status} />
        {refreshing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
        <div className="ml-auto flex items-center gap-1">
          <button type="button" onClick={() => load()} title="Tải lại" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /></button>
          <button type="button" onClick={copyLink} title="Sao chép liên kết" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Link2 className="h-4 w-4" /></button>
          <button type="button" onClick={openChat} disabled={busy === "chat"} title="Chat nhóm với những người liên quan" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            {busy === "chat" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />} <span className="hidden sm:inline">Chat</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 p-3 pb-28 lg:p-5 lg:pb-10">
        {/* Tiêu đề */}
        <div className="flex items-start gap-3">
          <TypeIcon icon={data.icon} color={data.color || "#2563eb"} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold leading-snug text-slate-900 lg:text-xl">{data.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{data.typeName}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {data.priority === "high" && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 ring-1 ring-red-200"><Zap className="h-3 w-3" /> Gấp</span>}
              {dl && <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1", dl.tone === "red" ? "bg-red-50 text-red-700 ring-red-200" : dl.tone === "amber" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-50 text-slate-600 ring-slate-200")}><Flag className="h-3 w-3" /> {dl.text}</span>}
              {data.editCount > 0 && <span className="text-slate-400">đã sửa {data.editCount} lần</span>}
            </div>
          </div>
        </div>

        {/* Người gửi */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <UserAvatar id={data.requesterId} name={data.requesterName} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{data.requesterName}{data.msnv ? <span className="font-normal text-slate-400"> · {data.msnv}</span> : null}</p>
            <p className="truncate text-xs text-slate-500">{[data.departmentName, data.teamName, data.jobTitleName].filter(Boolean).join(" · ") || "Chưa có phòng ban"}</p>
          </div>
          <span className="shrink-0 text-right text-xs text-slate-400" title={fmtDateTime(data.createdAt)}>Gửi {timeAgo(data.createdAt)}<br />{fmtDateTime(data.createdAt).slice(0, 10)}</span>
        </div>

        {/* Lý do trả lại / từ chối */}
        {returnedNote && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
            <p className="font-semibold">↩️ {returnedNote.fullName} trả lại để bổ sung</p>
            {returnedNote.note && <p className="mt-1 whitespace-pre-wrap">“{returnedNote.note}”</p>}
            {p.edit && <Button size="sm" className="mt-2 !bg-violet-600 hover:!bg-violet-700" icon={Pencil} loading={busy === "edit"} onClick={() => { setBusy("edit"); navigate(`${R.requestEdit}/${id}`); }}>Sửa và gửi lại</Button>}
          </div>
        )}
        {rejectedNote && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
            <p className="font-semibold">❌ {rejectedNote.fullName} đã từ chối</p>
            {rejectedNote.note && <p className="mt-1 whitespace-pre-wrap">“{rejectedNote.note}”</p>}
          </div>
        )}

        {/* Thao tác chính */}
        {(p.approve || p.edit || p.cancel || p.delete || canCopy) && (
          <div className="flex flex-wrap gap-2">
            {p.approve && (
              <>
                <Button icon={Check} className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => setAction("approve")}>Duyệt</Button>
                <Button variant="secondary" icon={X} className="!text-red-600" onClick={() => setAction("reject")}>Từ chối</Button>
                <Button variant="secondary" icon={CornerUpLeft} className="!text-violet-700" onClick={() => setAction("return")}>Trả lại</Button>
              </>
            )}
            {p.forward && <Button variant="secondary" icon={Forward} className="!text-sky-700" onClick={() => setFwd({ to: [], note: "", approve: false, saving: false })}>Chuyển tiếp</Button>}
            {p.edit && !returnedNote && <Button variant="secondary" icon={Pencil} loading={busy === "edit"} onClick={() => { setBusy("edit"); navigate(`${R.requestEdit}/${id}`); }}>Sửa đề xuất</Button>}
            {canCopy && <Button variant="secondary" icon={Copy} onClick={() => navigate(`${R.requestNew}?copy=${id}`)} title="Tạo đề xuất mới với nội dung giống đề xuất này">Nhân bản</Button>}
            {p.cancel && <Button variant="ghost" icon={Ban} className="!text-slate-500" onClick={() => setAction("cancel")}>Huỷ đề xuất</Button>}
            {p.delete && <Button variant="ghost" icon={Trash2} className="!text-red-600" loading={busy === "delete"} onClick={doDelete}>Xoá</Button>}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4">
            {/* Nội dung */}
            <Section title="Nội dung đề xuất">
              {data.fields.length ? (
                <FieldValues fields={data.fields} values={data.values} filesByField={filesByField} renderFiles={(fs) => <FileGallery files={fs} size="sm" />} />
              ) : <p className="text-sm text-slate-400">Mẫu đề xuất không có trường thông tin.</p>}
            </Section>

            {generalFiles.length > 0 && (
              <Section title={`Tệp đính kèm (${generalFiles.length})`} icon={Paperclip}>
                <FileServerNotice className="mb-3" />
                <FileGallery files={generalFiles} />
              </Section>
            )}

            {/* Bình luận / lịch sử */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="flex gap-1 border-b border-slate-100 px-2 pt-2">
                {[["comments", `Bình luận (${activeComments.filter((c) => !c.isDeleted).length})`], ["history", "Lịch sử"]].map(([k, label]) => (
                  <button key={k} type="button" onClick={() => setTab(k)}
                    className={cn("rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium", tab === k ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700")}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                {tab === "comments" ? (
                  <Comments requestId={data.requestId} comments={activeComments} meId={me?.userId} isAdmin={me?.isAdmin}
                    onAdded={(c) => setData((d) => ({ ...d, comments: [...d.comments, c] }))}
                    onDeleted={(cid) => setData((d) => ({ ...d, comments: d.comments.map((c) => (c.commentId === cid ? { ...c, isDeleted: true, body: null, files: [] } : c)) }))} />
                ) : (
                  <ol className="space-y-3">
                    {data.activities.map((a) => (
                      <li key={a.activityId} className="flex gap-2.5 text-sm">
                        <History className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div>
                          <p className="text-slate-700"><b>{a.fullName || "Hệ thống"}</b> {ACTIVITY[a.action] || a.action}{a.stepNo ? ` (bước ${a.stepNo})` : ""}</p>
                          {a.note && <p className="text-xs text-slate-500">“{a.note}”</p>}
                          <p className="text-[11px] text-slate-400">{fmtDateTime(a.createdAt)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <Section title="Quy trình duyệt" icon={Check} right={data.stepCount > 0 && <span className="text-xs text-slate-400">{data.status === "pending" ? `Bước ${data.currentStep}/${data.stepCount}` : `${data.stepCount} bước`}</span>}>
              <ApprovalFlow request={data} meId={me?.userId} />
            </Section>

            <Section title={`Người theo dõi (${data.followers.length})`} icon={Star}
              right={p.addFollower && <button type="button" onClick={() => setFollowOpen(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"><Plus className="h-3.5 w-3.5" /> Thêm</button>}>
              {data.followers.length === 0 ? <p className="text-sm text-slate-400">Chưa có ai theo dõi</p> : (
                <ul className="space-y-1.5">
                  {data.followers.map((f) => (
                    <li key={f.userId} className="flex items-center gap-2">
                      <UserAvatar id={f.userId} name={f.fullName} size={26} />
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{f.fullName}</span>
                      {(f.userId === me?.userId || data.my.isRequester || me?.isAdmin) && (
                        <button type="button" onClick={() => unfollow(f.userId)} disabled={busy === `unfollow-${f.userId}`} title={f.userId === me?.userId ? "Bỏ theo dõi" : "Bỏ người này"}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600">
                          {busy === `unfollow-${f.userId}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </div>

      {/* Thanh duyệt dính đáy trên điện thoại */}
      {p.approve && (
        <div className="fixed inset-x-0 bottom-14 z-30 flex gap-2 border-t border-slate-200 bg-white p-2 lg:hidden">
          <Button className="flex-1 !bg-emerald-600" icon={Check} onClick={() => setAction("approve")}>Duyệt</Button>
          <Button variant="secondary" className="flex-1 !text-red-600" icon={X} onClick={() => setAction("reject")}>Từ chối</Button>
          <Button variant="secondary" className="!text-violet-700" icon={CornerUpLeft} onClick={() => setAction("return")} aria-label="Trả lại" />
          <Button variant="secondary" className="!text-sky-700" icon={Forward} onClick={() => setFwd({ to: [], note: "", approve: false, saving: false })} aria-label="Chuyển tiếp" />
        </div>
      )}

      {action && <ActionDialog action={action} onClose={() => setAction(null)} onConfirm={doAction} />}

      <Modal open={!!fwd} onClose={() => { if (!fwd?.saving) setFwd(null); }} title="Chuyển tiếp cho người khác duyệt" size="sm"
        footer={<><Button variant="secondary" disabled={fwd?.saving} onClick={() => setFwd(null)}>Đóng</Button><Button icon={Forward} loading={fwd?.saving} disabled={!fwd?.to?.length} onClick={doForward}>{fwd?.approve ? "Duyệt và chuyển tiếp" : "Chuyển tiếp"}</Button></>}>
        {fwd && (
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Người nhận <span className="text-red-500">*</span></p>
              <UserPicker value={fwd.to} max={1} autoFocus placeholder="Chọn người duyệt thay…"
                excludeIds={[me?.userId, data.requesterId, ...data.approvers.filter((a) => a.stepNo === data.currentStep && ["pending", "approved"].includes(a.status)).map((a) => a.userId)]}
                onChange={(v) => setFwd((f) => ({ ...f, to: v }))} />
            </div>
            <div className="space-y-1.5">
              {[[false, "Chuyển tiếp", "Người nhận duyệt THAY bạn ở bước này. Bạn vẫn theo dõi được đề xuất."],
                [true, "Duyệt và chuyển tiếp", "Bạn duyệt, đồng thời thêm người nhận cùng duyệt ở bước này."]].map(([v, l, h]) => (
                <label key={String(v)} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm", fwd.approve === v ? "border-sky-500 bg-sky-50/60" : "border-slate-200")}>
                  <input type="radio" className="mt-0.5" checked={fwd.approve === v} onChange={() => setFwd((f) => ({ ...f, approve: v }))} />
                  <span><span className="block font-medium text-slate-800">{l}</span><span className="block text-xs text-slate-500">{h}</span></span>
                </label>
              ))}
            </div>
            <textarea value={fwd.note} maxLength={800} placeholder="Lời nhắn cho người nhận (không bắt buộc)"
              onChange={(e) => setFwd((f) => ({ ...f, note: e.target.value }))} className={cn(inputCls, "min-h-[80px] resize-y")} />
          </div>
        )}
      </Modal>

      <Modal open={followOpen} onClose={() => setFollowOpen(false)} title="Thêm người theo dõi" size="sm"
        footer={<><Button variant="secondary" onClick={() => setFollowOpen(false)}>Huỷ</Button><Button loading={savingFollow} disabled={!followIds.length} onClick={addFollowers}>Thêm</Button></>}>
        <p className="mb-2 text-sm text-slate-500">Người theo dõi xem được đề xuất, nhận thông báo khi có bình luận và kết quả duyệt.</p>
        <UserPicker value={followIds} onChange={setFollowIds} excludeIds={[data.requesterId, ...data.followers.map((f) => f.userId)]} autoFocus />
      </Modal>
    </div>
  );
}
