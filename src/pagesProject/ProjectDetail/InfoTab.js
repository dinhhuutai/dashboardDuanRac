// Tab "Thông tin chung" của dự án: đặc tả + mục tiêu + tệp đặc tả (admin sửa ở "Sửa dự án")
// và các bài thông tin thành viên đăng thêm (tiêu đề / nội dung / tệp). Người giao việc ghim được bài quan trọng lên đầu.
import { useCallback, useEffect, useState } from "react";
import { FilePlus2, Pencil, Pin, PinOff, Target, Trash2 } from "lucide-react";
import { Button, CardListSkeleton, EmptyState, ErrorBox, cn, confirmDialog, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, FileGallery, filesFromPaste, useAttachments } from "~/pagesRequest/shared/Attachments";
import { RichText } from "~/pagesRequest/shared/components";
import { UPLOAD_ENDPOINT, errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { fmtWhen } from "../shared/meta";
import { Avatar } from "../shared/components";

function Spec({ p }) {
  if (!p.description && !p.goals && !p.files?.length) {
    return <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-400">Dự án chưa có đặc tả / mục tiêu.{p.permissions.manage ? " Bấm “Sửa dự án” để thêm." : ""}</p>;
  }
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      {p.description && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Đặc tả</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{p.description}</p>
        </div>
      )}
      {p.goals && (
        <div>
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-400"><Target className="h-3.5 w-3.5" /> Mục tiêu</p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{p.goals}</p>
        </div>
      )}
      {p.files?.length > 0 && <FileGallery files={p.files} size="sm" />}
    </section>
  );
}

/** Soạn / sửa 1 bài thông tin */
function PostEditor({ post, canPin, onSave, onCancel }) {
  const boot = usePj((s) => s.boot);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: boot?.files });
  const [title, setTitle] = useState(post?.title || "");
  const [body, setBody] = useState(post?.body || "");
  const [pinned, setPinned] = useState(!!post?.isPinned);
  const [keep, setKeep] = useState(() => (post?.files || []).map((f) => f.fileId));
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    if (!title.trim() && !body.trim() && !att.done.length && !keep.length) return toast.error("Nhập nội dung hoặc đính kèm tệp");
    setBusy(true);
    try {
      await onSave({ title: title.trim(), body: body.trim(), attachments: att.done, keepFileIds: keep, isPinned: pinned });
      att.clear();
    } catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3" data-post-editor>
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} placeholder="Tiêu đề (không bắt buộc) — vd: Mẫu báo cáo dùng chung" className={inputCls} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Nội dung: thông tin, quy định, ghi chú… (đường dẫn tự thành liên kết)"
        onPaste={(e) => { const fs = filesFromPaste(e); if (fs.length) { e.preventDefault(); att.addFiles(fs); } }} className={cn(inputCls, "resize-y")} />
      {post?.files?.length > 0 && (
        <ul className="space-y-1">
          {post.files.map((f) => (
            <li key={f.fileId} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={keep.includes(f.fileId)} onChange={(e) => setKeep((k) => (e.target.checked ? [...k, f.fileId] : k.filter((x) => x !== f.fileId)))} />
              <span className={cn("truncate", !keep.includes(f.fileId) && "text-slate-400 line-through")}>{f.name}</span>
            </li>
          ))}
        </ul>
      )}
      <AttachmentPicker att={att} label="Đính kèm tệp: Word, Excel, PDF, ảnh…" />
      <div className="flex flex-wrap items-center gap-2">
        {canPin && (
          <label className="mr-auto inline-flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Ghim lên đầu
          </label>
        )}
        <div className="ml-auto flex gap-2">
          {onCancel && <Button variant="secondary" onClick={onCancel} disabled={busy}>Huỷ</Button>}
          <Button onClick={save} loading={busy} icon={FilePlus2}>{post ? "Lưu" : "Đăng thông tin"}</Button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, canPin, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const remove = async () => {
    if (!(await confirmDialog({ title: "Xoá thông tin", message: "Xoá bài thông tin này (cả tệp đính kèm)?", confirmText: "Xoá", danger: true }))) return;
    try { await pjApi.deletePost(post.postId); onDeleted(post.postId); toast.success("Đã xoá"); } catch (e) { toast.error(errorMessage(e)); }
  };
  const togglePin = async () => {
    try { onChanged(await pjApi.updatePost(post.postId, { title: post.title, body: post.body, keepFileIds: post.files.map((f) => f.fileId), isPinned: !post.isPinned })); } catch (e) { toast.error(errorMessage(e)); }
  };
  if (editing) {
    return <PostEditor post={post} canPin={canPin} onCancel={() => setEditing(false)}
      onSave={async (b) => { onChanged(await pjApi.updatePost(post.postId, b)); setEditing(false); toast.success("Đã lưu"); }} />;
  }
  return (
    <article className={cn("rounded-xl border bg-white p-4", post.isPinned ? "border-amber-300" : "border-slate-200")} data-post={post.postId}>
      <header className="flex items-start gap-2.5">
        <Avatar name={post.fullName} src={post.avatar} size={34} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">{post.fullName}</p>
          <p className="text-xs text-slate-400">{fmtWhen(post.createdAt)}{post.updatedAt ? " · đã sửa" : ""}</p>
        </div>
        {post.isPinned && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200"><Pin className="h-3 w-3" /> Ghim</span>}
        {post.canEdit && (
          <div className="flex shrink-0 gap-0.5">
            {canPin && <button type="button" onClick={togglePin} title={post.isPinned ? "Bỏ ghim" : "Ghim lên đầu"} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{post.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</button>}
            <button type="button" onClick={() => setEditing(true)} title="Sửa" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
            <button type="button" onClick={remove} title="Xoá" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </header>
      {post.title && <h3 className="mt-3 font-semibold text-slate-900">{post.title}</h3>}
      {post.body && <p className="mt-1.5 text-sm leading-relaxed text-slate-700"><RichText text={post.body} /></p>}
      {post.files.length > 0 && <div className="mt-3"><FileGallery files={post.files} size="sm" /></div>}
    </article>
  );
}

export default function InfoTab({ p }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [composing, setComposing] = useState(false);
  const canPin = p.permissions.assign;
  const load = useCallback(async () => {
    try { setRows((await pjApi.posts(p.projectId)).rows); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [p.projectId]);
  useEffect(() => { load(); }, [load]);
  const sortRows = (xs) => [...xs].sort((a, b) => (b.isPinned - a.isPinned) || (b.postId - a.postId));

  return (
    <div className="space-y-4">
      <Spec p={p} />
      <section>
        <div className="mb-2 flex items-center gap-2">
          <h2 className="flex-1 font-semibold text-slate-800">Thông tin thêm <span className="text-sm font-normal text-slate-400">{rows?.length || ""}</span></h2>
          {!composing && <Button size="sm" icon={FilePlus2} onClick={() => setComposing(true)}>Thêm thông tin</Button>}
        </div>
        {composing && (
          <div className="mb-3">
            <PostEditor canPin={canPin} onCancel={() => setComposing(false)}
              onSave={async (b) => { const x = await pjApi.createPost(p.projectId, b); setRows((xs) => sortRows([x, ...(xs || [])])); setComposing(false); toast.success("Đã đăng thông tin"); }} />
          </div>
        )}
        {error && !rows ? <ErrorBox message={error} onRetry={load} /> : !rows ? <CardListSkeleton rows={2} /> : rows.length ? (
          <div className="space-y-3">
            {rows.map((x) => (
              <PostCard key={x.postId} post={x} canPin={canPin}
                onChanged={(n) => setRows((xs) => sortRows(xs.map((y) => (y.postId === n.postId ? n : y))))}
                onDeleted={(id) => setRows((xs) => xs.filter((y) => y.postId !== id))} />
            ))}
          </div>
        ) : (
          !composing && <EmptyState icon={FilePlus2} title="Chưa có thông tin thêm">Thành viên đăng tài liệu, quy định, ghi chú dùng chung của dự án tại đây.</EmptyState>
        )}
      </section>
    </div>
  );
}
