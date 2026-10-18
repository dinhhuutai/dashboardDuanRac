// Chi tiết 1 đề xuất — TOÀN MÀN HÌNH, bố cục kiểu request.base.vn:
//   thanh trên (quay lại danh sách, mã, trạng thái, thao tác) → đầu trang (mẫu, tiêu đề, người gửi, phòng ban, ngày gửi,
//   tiến độ — in đậm) + tiến trình duyệt nằm ngang → khung "đang chờ bạn duyệt" → nội dung (nhãn trái, giá trị đậm phải)
//   → tệp → bình luận / lịch sử; cột phải: quy trình duyệt chi tiết, người theo dõi, thông tin khác.
// Mở lại đề xuất đã xem → hiện ngay bản đã nhớ rồi tải mới ngầm. Đang mở thì hỏi cập nhật mỗi 15 giây.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, Ban, CalendarClock, Check, CheckCircle2, Clock, Copy, CornerUpLeft, Flag, Forward, History, Link2, Loader2, Lock,
  MessagesSquare, Paperclip, Pencil, Plus, RefreshCw, Star, Trash2, X, XCircle, Zap,
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
import ApprovalFlow, { FlowStepper } from "./ApprovalFlow";
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

function DetailSkeleton({ onBack }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-white px-3 lg:px-5">
        {onBack && <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /> Danh sách</button>}
      </div>
      <div className="mx-auto max-w-[1600px] space-y-4 p-3 lg:p-6" role="status" aria-label="Đang tải đề xuất">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"><Skeleton className="h-4 w-40" /><Skeleton className="h-8 w-2/3" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div></div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, right, children, bodyClass = "p-4" }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <h3 className="flex-1 text-[15px] font-bold text-slate-800">{title}</h3>
        {right}
      </div>
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

/** 1 ô thông tin chính ở đầu trang: nhãn nhỏ xám + giá trị in đậm */
function Fact({ label, children, sub, className, wrap }) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className={cn("mt-0.5 text-sm font-bold text-slate-900", wrap ? "break-words" : "truncate")}>{children}</div>
      {sub && <p className="truncate text-xs text-slate-500">{sub}</p>}
    </div>
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
  if (!data) return <DetailSkeleton onBack={onBack} />;

  const p = data.permissions;
  const canCopy = !!myTypes?.some((t) => t.typeId === data.typeId); // mẫu còn dùng + mình được gửi
  const dl = deadlineInfo(data.deadline, data.status);
  const returnedNote = data.status === "returned" ? data.approvers.find((a) => a.status === "returned") : null;
  const rejectedNote = data.status === "rejected" ? data.approvers.find((a) => a.status === "rejected") : null;
  const activeComments = data.comments;
  const accent = data.color || "#2563eb";
  const waiting = data.approvers.filter((a) => a.status === "pending");
  const myStep = p.approve ? data.approvers.find((a) => a.userId === me?.userId && a.status === "pending") : null;
  const progress = data.status === "pending"
    ? (data.stepCount ? <>Bước {data.currentStep}/{data.stepCount} · <span className="text-amber-600">chờ {waiting.map((a) => a.fullName).join(", ") || "—"}</span></> : "Chờ duyệt")
    : data.status === "approved" ? <span className="text-emerald-600">Đã duyệt xong</span>
      : data.status === "rejected" ? <span className="text-red-600">Bị từ chối</span>
        : data.status === "returned" ? <span className="text-violet-600">Trả lại để bổ sung</span> : <span className="text-slate-500">Đã huỷ</span>;
  const editBtn = (label) => <Button variant="secondary" size="sm" icon={Pencil} loading={busy === "edit"} onClick={() => { setBusy("edit"); navigate(`${R.requestEdit}/${id}`); }}>{label}</Button>;

  return (
    <div className="h-full overflow-y-auto">
      {/* Thanh thao tác */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 lg:px-6">
          {onBack && (
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100" aria-label="Quay lại danh sách">
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Danh sách</span>
            </button>
          )}
          <span className="text-sm font-semibold text-slate-400">#{data.requestId}</span>
          <StatusBadge status={data.status} />
          {refreshing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-1">
            {p.edit && !returnedNote && <span className="hidden sm:inline">{editBtn("Sửa đề xuất")}</span>}
            {canCopy && <Button variant="ghost" size="sm" icon={Copy} onClick={() => navigate(`${R.requestNew}?copy=${id}`)} title="Tạo đề xuất mới với nội dung giống đề xuất này">Nhân bản</Button>}
            {p.cancel && <Button variant="ghost" size="sm" icon={Ban} className="!text-slate-500" onClick={() => setAction("cancel")}>Huỷ đề xuất</Button>}
            {p.delete && <Button variant="ghost" size="sm" icon={Trash2} className="!text-red-600" loading={busy === "delete"} onClick={doDelete}>Xoá</Button>}
            {!p.delete && p.deleteBlocked && <span className="hidden items-center gap-1 px-2 text-xs text-slate-400 lg:inline-flex" title="Đề xuất đã có người duyệt — không xoá được (chỉ huỷ được khi còn chờ duyệt)"><Lock className="h-3.5 w-3.5" /> Đã duyệt · không xoá được</span>}
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
            <button type="button" onClick={() => load()} title="Tải lại" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /></button>
            <button type="button" onClick={copyLink} title="Sao chép liên kết" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Link2 className="h-4 w-4" /></button>
            <button type="button" onClick={openChat} disabled={busy === "chat"} title="Chat nhóm với những người liên quan" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
              {busy === "chat" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessagesSquare className="h-4 w-4" />} <span className="hidden sm:inline">Chat</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-4 p-3 pb-28 lg:p-6 lg:pb-10">
        {/* Đầu trang: mẫu, tiêu đề, thông tin chính (in đậm), tiến trình duyệt */}
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5" style={{ background: accent }} />
          <div className="p-4 lg:p-6">
            <div className="flex items-start gap-3">
              <TypeIcon icon={data.icon} color={accent} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{data.typeName}</p>
                <h1 className="mt-0.5 text-xl font-bold leading-snug text-slate-900 lg:text-2xl">{data.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {data.priority === "high" && <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700 ring-1 ring-red-200"><Zap className="h-3 w-3" /> Gấp</span>}
                  {dl && <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1", dl.tone === "red" ? "bg-red-50 text-red-700 ring-red-200" : dl.tone === "amber" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-50 text-slate-600 ring-slate-200")}><Flag className="h-3 w-3" /> {dl.text}</span>}
                  {data.editCount > 0 && <span className="text-slate-400">đã sửa {data.editCount} lần</span>}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 lg:grid-cols-4">
              <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1">
                <UserAvatar id={data.requesterId} name={data.requesterName} size={40} />
                <Fact label="Người đề xuất" sub={[data.msnv, data.jobTitleName].filter(Boolean).join(" · ")}>{data.requesterName}</Fact>
              </div>
              <Fact label="Phòng ban" sub={data.teamName}>{data.departmentName || <span className="font-normal text-slate-400">Chưa có phòng ban</span>}</Fact>
              <Fact label="Ngày gửi" sub={timeAgo(data.createdAt)}>{fmtDateTime(data.createdAt)}</Fact>
              <Fact label="Tiến độ" wrap className="col-span-2 lg:col-span-1" sub={data.finishedAt && data.status !== "pending" ? `lúc ${fmtDateTime(data.finishedAt)}` : null}>{progress}</Fact>
            </div>

            {data.stepCount > 0 && <div className="mt-5 border-t border-slate-100 pt-4"><FlowStepper request={data} /></div>}
          </div>
        </header>

        {/* Đến lượt mình duyệt */}
        {myStep && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4" data-my-turn>
            <Clock className="h-6 w-6 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-900">Đề xuất đang chờ bạn duyệt</p>
              <p className="text-sm text-amber-800">Bước {myStep.stepNo}: {myStep.stepName}{waiting.length > 1 ? ` · ${myStep.stepMode === "any" ? "1 người duyệt là đủ" : "tất cả cùng duyệt"}` : ""}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={Check} className="!bg-emerald-600 hover:!bg-emerald-700" onClick={() => setAction("approve")}>Duyệt</Button>
              <Button variant="secondary" icon={X} className="!text-red-600" onClick={() => setAction("reject")}>Từ chối</Button>
              <Button variant="secondary" icon={CornerUpLeft} className="!text-violet-700" onClick={() => setAction("return")}>Trả lại</Button>
              {p.forward && <Button variant="secondary" icon={Forward} className="!text-sky-700" onClick={() => setFwd({ to: [], note: "", approve: false, saving: false })}>Chuyển tiếp</Button>}
            </div>
          </div>
        )}

        {/* Kết quả / lý do trả lại, từ chối */}
        {returnedNote && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <p className="font-bold">↩️ {returnedNote.fullName} trả lại để bổ sung</p>
            {returnedNote.note && <p className="mt-1 whitespace-pre-wrap">“{returnedNote.note}”</p>}
            {p.edit && <Button size="sm" className="mt-2 !bg-violet-600 hover:!bg-violet-700" icon={Pencil} loading={busy === "edit"} onClick={() => { setBusy("edit"); navigate(`${R.requestEdit}/${id}`); }}>Sửa và gửi lại</Button>}
          </div>
        )}
        {rejectedNote && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div><p className="font-bold">{rejectedNote.fullName} đã từ chối</p>{rejectedNote.note && <p className="mt-1 whitespace-pre-wrap">“{rejectedNote.note}”</p>}</div>
          </div>
        )}
        {data.status === "approved" && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <p><b>Đề xuất đã được duyệt hoàn tất</b>{data.finishedAt ? ` lúc ${fmtDateTime(data.finishedAt)}` : ""}.</p>
          </div>
        )}
        {p.edit && !returnedNote && <div className="sm:hidden">{editBtn("Sửa đề xuất")}</div>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-5">
            {/* Nội dung */}
            <Section title="Nội dung đề xuất" bodyClass="">
              {data.fields.length ? (
                <FieldValues fields={data.fields} values={data.values} filesByField={filesByField} accent={accent} renderFiles={(fs) => <FileGallery files={fs} size="sm" />} />
              ) : <p className="p-4 text-sm text-slate-400">Mẫu đề xuất không có trường thông tin.</p>}
            </Section>

            {generalFiles.length > 0 && (
              <Section title={`Tệp đính kèm (${generalFiles.length})`} icon={Paperclip}>
                <FileServerNotice className="mb-3" />
                <FileGallery files={generalFiles} />
              </Section>
            )}

            {/* Bình luận / lịch sử */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
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

          <div className="space-y-5">
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
                      {f.isFixed && <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500" title="Người theo dõi cố định theo mẫu đề xuất — chỉ quản trị viên bỏ được"><Lock className="h-3 w-3" /> cố định</span>}
                      {(me?.isAdmin || (!f.isFixed && (f.userId === me?.userId || data.my.isRequester))) && (
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

            <Section title="Thông tin khác" icon={CalendarClock}>
              <dl className="space-y-2 text-sm">
                {[
                  ["Mã đề xuất", `#${data.requestId}`],
                  ["Mẫu đề xuất", data.typeName],
                  ["Mức độ", data.priority === "high" ? "Gấp" : "Bình thường"],
                  ["Hạn xử lý", data.deadline ? dl?.text?.replace(/^Hạn /, "") : null],
                  ["Cập nhật", fmtDateTime(data.lastActivityAt)],
                  ["Số lần sửa", data.editCount || null],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3"><dt className="text-slate-500">{k}</dt><dd className="text-right font-semibold text-slate-800">{v}</dd></div>
                ))}
              </dl>
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
