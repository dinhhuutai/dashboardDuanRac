// Tab "Tệp" của dự án: mọi tệp ở 1 chỗ — đặc tả, bài thông tin, trò chuyện, công việc (lúc giao / lần nộp / bình luận).
// Lọc theo nguồn, loại tệp, người tải, tìm theo tên; bấm để xem trước ngay (PDF, Word, Excel, ảnh…); tải tệp mới lên = 1 bài "Thông tin chung".
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Search, UploadCloud } from "lucide-react";
import config from "~/config";
import { Button, EmptyState, ErrorBox, TableSkeleton, cn, inputCls, toast } from "~/pagesForm/shared/ui";
import { AttachmentPicker, FilePreview, FileTypeIcon, useAttachments } from "~/pagesRequest/shared/Attachments";
import { extOf, fileHref, fmtSize } from "~/pagesRequest/shared/files";
import { UPLOAD_ENDPOINT, errorMessage, pjApi } from "../shared/api";
import { usePj } from "../shared/store";
import { EVENT_TEXT, fmtWhen, norm } from "../shared/meta";
import { Pills } from "../shared/components";

const R = config.routes;
const SOURCES = [["all", "Tất cả"], ["task", "Công việc"], ["chat", "Trò chuyện"], ["post", "Thông tin chung"], ["info", "Đặc tả dự án"]];
const KINDS = {
  image: (f) => f.isImage,
  pdf: (f) => extOf(f.name) === "pdf",
  word: (f) => ["doc", "docx"].includes(extOf(f.name)),
  excel: (f) => ["xls", "xlsx", "xlsm", "csv"].includes(extOf(f.name)),
  other: (f) => !f.isImage && !["pdf", "doc", "docx", "xls", "xlsx", "xlsm", "csv"].includes(extOf(f.name)),
};

function SourceLink({ f, projectId }) {
  if (f.source === "task") {
    return <Link to={`${R.projectTask}/${f.taskId}`} className="truncate text-blue-700 hover:underline">{f.taskTitle}<span className="text-slate-400"> · {EVENT_TEXT[f.eventKind] || "giao việc"}</span></Link>;
  }
  if (f.source === "chat") return <Link to={`${R.projectView}/${projectId}?tab=chat`} className="text-blue-700 hover:underline">Trò chuyện</Link>;
  if (f.source === "post") return <Link to={`${R.projectView}/${projectId}?tab=info`} className="truncate text-blue-700 hover:underline">{f.postTitle || "Thông tin chung"}</Link>;
  return <span className="text-slate-500">Đặc tả dự án</span>;
}

function Uploader({ projectId, onDone, onCancel }) {
  const boot = usePj((s) => s.boot);
  const att = useAttachments([], { endpoint: UPLOAD_ENDPOINT, config: boot?.files });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (att.uploading) return toast.error("Đợi tệp tải lên xong");
    if (!att.done.length) return toast.error("Chọn tệp để tải lên");
    setBusy(true);
    try { await pjApi.createPost(projectId, { title: note.trim() || null, attachments: att.done }); toast.success("Đã tải tệp lên"); onDone(); }
    catch (e) { toast.error(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
      <AttachmentPicker att={att} label="Chọn tệp tải lên dự án (Word, Excel, PDF, ảnh…)" />
      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Ghi chú cho tệp (không bắt buộc)" className={inputCls} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>Huỷ</Button>
        <Button onClick={save} loading={busy} icon={UploadCloud}>Tải lên</Button>
      </div>
    </div>
  );
}

export default function FilesTab({ p }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("all");
  const [kind, setKind] = useState("");
  const [who, setWho] = useState("");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const load = useCallback(async () => {
    try { setRows((await pjApi.projectFiles(p.projectId)).rows); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [p.projectId]);
  useEffect(() => { load(); }, [load]);

  const uploaders = useMemo(() => [...new Map((rows || []).map((f) => [f.uploadedBy, f.uploaderName])).entries()].sort((a, b) => String(a[1]).localeCompare(String(b[1]), "vi")), [rows]);
  const counts = useMemo(() => Object.fromEntries(SOURCES.map(([k]) => [k, (rows || []).filter((f) => k === "all" || f.source === k).length])), [rows]);
  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return (rows || []).filter((f) => (source === "all" || f.source === source) && (!kind || KINDS[kind](f))
      && (!who || String(f.uploadedBy) === who) && (!nq || norm(`${f.name} ${f.taskTitle || ""} ${f.postTitle || ""}`).includes(nq)));
  }, [rows, source, kind, who, q]);
  const totalSize = shown.reduce((a, f) => a + (f.size || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1"><Pills value={source} onChange={setSource} items={SOURCES.map(([k, l]) => [k, l, counts[k]])} /></div>
        {!uploading && <Button size="sm" icon={UploadCloud} onClick={() => setUploading(true)}>Tải tệp lên</Button>}
      </div>
      {uploading && <Uploader projectId={p.projectId} onCancel={() => setUploading(false)} onDone={() => { setUploading(false); load(); }} />}
      <div className="grid gap-2 sm:grid-cols-[1fr_160px_200px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên tệp / công việc" className={cn(inputCls, "pl-9")} />
        </label>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputCls} aria-label="Loại tệp">
          <option value="">Mọi loại tệp</option><option value="image">Ảnh</option><option value="pdf">PDF</option>
          <option value="word">Word</option><option value="excel">Excel</option><option value="other">Khác</option>
        </select>
        <select value={who} onChange={(e) => setWho(e.target.value)} className={inputCls} aria-label="Người tải lên">
          <option value="">Mọi người tải lên</option>
          {uploaders.map(([id, name]) => <option key={id} value={String(id)}>{name}</option>)}
        </select>
      </div>
      {error && !rows ? <ErrorBox message={error} onRetry={load} /> : !rows ? <TableSkeleton rows={5} cols={4} /> : !shown.length ? (
        <EmptyState icon={UploadCloud} title={rows.length ? "Không có tệp nào khớp" : "Dự án chưa có tệp"}>Tệp đính kèm ở công việc, trò chuyện và thông tin chung đều hiện ở đây.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">{shown.length} tệp · {fmtSize(totalSize)}</p>
          <ul className="divide-y divide-slate-100" data-files>
            {shown.map((f) => (
              <li key={f.fileId} className="flex items-center gap-3 px-3 py-2.5">
                {f.isImage && f.thumbUrl
                  ? <img src={fileHref(f.thumbUrl)} alt="" className="h-10 w-10 shrink-0 rounded object-cover" loading="lazy" />
                  : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100"><FileTypeIcon name={f.name} mime={f.mime} /></span>}
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => setPreview(f)} className="block max-w-full truncate text-left text-sm font-medium text-slate-800 hover:text-blue-700 hover:underline">{f.name}</button>
                  <p className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span>{fmtSize(f.size)}</span><span>·</span><span>{f.uploaderName}</span><span>·</span><span>{fmtWhen(f.createdAt)}</span>
                  </p>
                  <p className="min-w-0 truncate text-xs"><SourceLink f={f} projectId={p.projectId} /></p>
                </div>
                <a href={fileHref(f.downloadUrl)} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Tải về" aria-label={`Tải ${f.name}`}><Download className="h-4 w-4" /></a>
              </li>
            ))}
          </ul>
        </div>
      )}
      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
