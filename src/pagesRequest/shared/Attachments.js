// Đính kèm tệp / ảnh (module 18) — lưu ở máy chủ tệp nội bộ, tải lên / xem qua API (dùng được ở mọi mạng).
//   const att = useAttachments();           // trạng thái tải lên
//   <AttachmentPicker att={att} />           // nút chọn + kéo thả + danh sách đang tải
//   att.addFiles(files)                      // vd. dán ảnh (Ctrl+V) vào ô bình luận
//   att.done → mảng gửi lên API; att.uploading → còn tệp đang tải (khoá nút gửi)
//   <FileGallery files={detail.files} />     // hiển thị: lưới ảnh thu nhỏ + danh sách tệp + xem ảnh lớn
//                                            // + XEM TRƯỚC ngay trong trang: PDF, video, âm thanh, văn bản, Excel/CSV, Word (.docx)
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, ChevronLeft, ChevronRight, Download, ExternalLink, Eye, File, FileArchive, FileAudio, FileImage, FileSpreadsheet,
  FileText, FileVideo, ImageOff, Loader2, Lock, Paperclip, RotateCcw, UploadCloud, X,
} from "lucide-react";
import { cn } from "~/pagesForm/shared/ui";
import { useRq } from "./store";
import { extOf, fileHref, fmtSize, uploadFile, validateFile } from "./files";

/* ================================ TẢI LÊN ================================ */
let seq = 0;

export function useAttachments(initial = []) {
  const [items, setItems] = useState(initial);
  const jobs = useRef(new Map());

  useEffect(() => () => {
    // rời trang → huỷ tệp đang tải dở + giải phóng ảnh xem trước
    jobs.current.forEach((j) => j.cancel());
  }, []);

  const patch = (id, p) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const start = useCallback((id, file) => {
    const job = uploadFile(file, { onProgress: (p) => patch(id, { progress: p }) });
    jobs.current.set(id, job);
    job.promise
      .then((result) => patch(id, { status: "done", progress: 1, result }))
      .catch((e) => { if (!e.aborted) patch(id, { status: "error", error: e.message }); })
      .finally(() => jobs.current.delete(id));
  }, []);

  const addFiles = useCallback((fileList, extra = {}) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    const add = files.map((file) => {
      const id = `a${++seq}`;
      const err = validateFile(file);
      const isImg = /^image\//.test(file.type || "");
      return {
        id, file, name: file.name || "anh-dan.png", size: file.size, mime: file.type, ...extra,
        preview: isImg ? URL.createObjectURL(file) : null,
        status: err ? "error" : "uploading", progress: 0, error: err,
      };
    });
    setItems((xs) => [...xs, ...add]);
    add.filter((a) => a.status === "uploading").forEach((a) => start(a.id, a.file));
  }, [start]);

  const remove = useCallback((id) => {
    jobs.current.get(id)?.cancel();
    setItems((xs) => {
      const it = xs.find((x) => x.id === id);
      if (it?.preview) URL.revokeObjectURL(it.preview);
      return xs.filter((x) => x.id !== id);
    });
  }, []);

  const retry = useCallback((id) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: "uploading", progress: 0, error: null } : x)));
    const it = items.find((x) => x.id === id);
    if (it?.file) start(id, it.file);
  }, [items, start]);

  const clear = useCallback(() => {
    jobs.current.forEach((j) => j.cancel());
    setItems((xs) => { xs.forEach((x) => x.preview && URL.revokeObjectURL(x.preview)); return []; });
  }, []);

  return useMemo(() => ({
    items,
    addFiles,
    remove,
    retry,
    clear,
    uploading: items.some((x) => x.status === "uploading"),
    failed: items.filter((x) => x.status === "error").length,
    // gửi lên API: { key, name, size, mime, sig, hasThumb, width, height, fieldKey }
    done: items.filter((x) => x.status === "done").map((x) => ({ ...x.result, name: x.name, fieldKey: x.fieldKey || null })),
  }), [items, addFiles, remove, retry, clear]);
}

/** Lấy tệp từ sự kiện dán (Ctrl+V ảnh chụp màn hình) */
export function filesFromPaste(e) {
  const out = [];
  for (const it of e.clipboardData?.items || []) {
    if (it.kind === "file") {
      const f = it.getAsFile();
      if (f) {
        const ext = (f.type.split("/")[1] || "png").replace("jpeg", "jpg");
        out.push(f.name && f.name !== "image.png" ? f : new window.File([f], `anh-dan-${Date.now()}.${ext}`, { type: f.type }));
      }
    }
  }
  return out;
}

export function FileTypeIcon({ name, mime, className = "h-5 w-5" }) {
  const ext = extOf(name);
  if (/^image\//.test(mime || "")) return <FileImage className={cn(className, "text-sky-600")} />;
  if (/^video\//.test(mime || "")) return <FileVideo className={cn(className, "text-purple-600")} />;
  if (/^audio\//.test(mime || "")) return <FileAudio className={cn(className, "text-pink-600")} />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className={cn(className, "text-emerald-600")} />;
  if (["zip", "rar", "7z"].includes(ext)) return <FileArchive className={cn(className, "text-amber-600")} />;
  if (["pdf", "doc", "docx", "txt", "ppt", "pptx"].includes(ext)) return <FileText className={cn(className, ext === "pdf" ? "text-red-600" : "text-blue-600")} />;
  return <File className={cn(className, "text-slate-500")} />;
}

/** Nút chọn tệp + vùng kéo thả + danh sách tệp đang/đã tải */
export function AttachmentPicker({ att, fieldKey, label = "Đính kèm tệp / ảnh", hint, max = 20, compact, accept }) {
  const blocked = useRq((s) => s.fileState) === "disabled";
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const mine = att.items.filter((x) => (x.fieldKey || null) === (fieldKey || null));

  const pick = (files) => {
    if (blocked) return;
    const room = Math.max(0, max - mine.length);
    att.addFiles(Array.from(files).slice(0, room), fieldKey ? { fieldKey } : {});
  };

  return (
    <div>
      {!compact && (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!blocked) setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
          onClick={() => !blocked && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !blocked && inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition",
            blocked ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
              : drag ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-300 bg-white text-slate-500 hover:border-blue-400 hover:bg-blue-50/40"
          )}
        >
          {blocked ? <Lock className="h-6 w-6" /> : <UploadCloud className="h-6 w-6" />}
          <span className="text-sm font-medium">{blocked ? "Chưa cấu hình máy chủ tệp nội bộ" : label}</span>
          {!blocked && <span className="text-xs">{hint || "Bấm để chọn, kéo thả vào đây, hoặc dán ảnh (Ctrl+V)"}</span>}
        </div>
      )}
      {compact && (
        <button type="button" disabled={blocked} onClick={() => inputRef.current?.click()} title={blocked ? "Chưa cấu hình máy chủ tệp nội bộ" : "Đính kèm tệp / ảnh"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40">
          <Paperclip className="h-5 w-5" />
        </button>
      )}
      <input ref={inputRef} type="file" multiple hidden accept={accept} onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
      {!compact && <UploadList att={att} fieldKey={fieldKey} />}
    </div>
  );
}

/** Danh sách tệp đang tải / đã tải xong (có ảnh xem trước, %, thử lại, bỏ) */
export function UploadList({ att, fieldKey, className }) {
  const mine = att.items.filter((x) => (fieldKey === undefined ? true : (x.fieldKey || null) === (fieldKey || null)));
  if (!mine.length) return null;
  return (
    <ul className={cn("mt-2 grid gap-2 sm:grid-cols-2", className)}>
      {mine.map((x) => (
        <li key={x.id} className={cn("relative flex items-center gap-2 overflow-hidden rounded-lg border bg-white p-2", x.status === "error" ? "border-red-200 bg-red-50" : "border-slate-200")}>
          {x.preview ? <img src={x.preview} alt="" className="h-10 w-10 shrink-0 rounded object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100"><FileTypeIcon name={x.name} mime={x.mime} /></span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-slate-800">{x.name}</span>
            <span className={cn("block truncate text-xs", x.status === "error" ? "text-red-600" : "text-slate-400")}>
              {x.status === "error" ? x.error : x.status === "uploading" ? `Đang tải ${Math.round((x.progress || 0) * 100)}% · ${fmtSize(x.size)}` : `Đã tải · ${fmtSize(x.size)}`}
            </span>
          </span>
          {x.status === "uploading" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />}
          {x.status === "error" && x.file && (
            <button type="button" onClick={() => att.retry(x.id)} className="rounded p-1 text-red-600 hover:bg-red-100" title="Thử lại"><RotateCcw className="h-4 w-4" /></button>
          )}
          <button type="button" onClick={() => att.remove(x.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Bỏ tệp"><X className="h-4 w-4" /></button>
          {x.status === "uploading" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-100"><span className="block h-full bg-blue-600 transition-all" style={{ width: `${Math.round((x.progress || 0) * 100)}%` }} /></span>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ================================ HIỂN THỊ ================================ */

function NoServerTile({ className, small }) {
  return (
    <span className={cn("flex flex-col items-center justify-center gap-1 bg-slate-100 text-center text-slate-400", className)}>
      <Lock className={small ? "h-4 w-4" : "h-5 w-5"} />
      {!small && <span className="px-1 text-[10px] leading-tight">Chưa có máy chủ tệp</span>}
    </span>
  );
}

function Thumb({ f, onOpen, size = "h-24 w-24" }) {
  const [state, setState] = useState("loading");
  if (!f.thumbUrl) return <NoServerTile className={cn(size, "rounded-lg")} />;
  return (
    <button type="button" onClick={onOpen} className={cn("group relative overflow-hidden rounded-lg bg-slate-100", size)} title={f.name}>
      {state === "error" ? (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400"><ImageOff className="h-5 w-5" /><span className="text-[10px]">Không tải được</span></span>
      ) : (
        <img src={fileHref(f.thumbUrl)} alt={f.name} loading="lazy" decoding="async" onLoad={() => setState("ok")}
          onError={() => setState("error")}
          className={cn("h-full w-full object-cover transition group-hover:scale-105", state === "loading" && "animate-pulse")} />
      )}
    </button>
  );
}

/** Tải lần lượt nhiều tệp (trình duyệt có thể hỏi "cho phép tải nhiều tệp" 1 lần) */
function downloadAll(files) {
  files.forEach((f, i) => setTimeout(() => {
    const a = document.createElement("a");
    a.href = fileHref(f.downloadUrl);
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, i * 400));
}

/* ================================ XEM TRƯỚC TỆP ================================ */
const PREVIEW_MAX_BYTES = 20 * 1024 * 1024; // Excel/Word/văn bản phải tải về trình duyệt để dựng → giới hạn
const SHEET_MAX_ROWS = 500;
const SHEET_MAX_COLS = 40;

/** Tệp xem trước được kiểu gì: pdf | video | audio | sheet | docx | text | null (chỉ tải về) */
export function previewKind(f) {
  const ext = extOf(f.name);
  const m = f.mime || "";
  if (m === "application/pdf" || ext === "pdf") return "pdf";
  if (/^video\/(mp4|webm|ogg)/.test(m)) return "video";
  if (/^audio\//.test(m)) return "audio";
  if (["xlsx", "xls", "xlsm", "csv"].includes(ext)) return "sheet";
  if (ext === "docx") return "docx";
  if (m === "text/plain" || ext === "txt") return "text";
  return null;
}

function SheetView({ book }) {
  const [tab, setTab] = useState(0);
  const sheet = book.sheets[tab];
  return (
    <div className="flex h-full flex-col bg-white">
      {book.sheets.length > 1 && (
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 pt-2">
          {book.sheets.map((s, i) => (
            <button key={s.name} type="button" onClick={() => setTab(i)}
              className={cn("shrink-0 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium", i === tab ? "border-slate-200 bg-white text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-800")}>{s.name}</button>
          ))}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">
        {sheet.rows.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">Trang tính trống</p> : (
          <table className="border-collapse text-xs">
            <tbody>
              {sheet.rows.map((r, i) => (
                <tr key={i}>
                  <td className="sticky left-0 border border-slate-200 bg-slate-50 px-1.5 py-1 text-center text-[10px] text-slate-400">{i + 1}</td>
                  {Array.from({ length: sheet.cols }, (_, c) => (
                    <td key={c} className="max-w-[320px] whitespace-pre-wrap break-words border border-slate-200 px-2 py-1 align-top text-slate-800">{r[c] ?? ""}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {sheet.cut && <p className="px-3 py-2 text-xs text-amber-700">Chỉ hiện {SHEET_MAX_ROWS} dòng × {SHEET_MAX_COLS} cột đầu — tải tệp về để xem đủ.</p>}
      </div>
    </div>
  );
}

/** Xem trước 1 tệp ngay trong trang (không rời đề xuất). Không xem được loại nào → nút tải về. */
export function FilePreview({ file: f, onClose }) {
  const kind = previewKind(f);
  const needFetch = kind === "sheet" || kind === "docx" || kind === "text";
  const [state, setState] = useState(needFetch ? { status: "loading" } : { status: "ready" });
  const docxRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  useEffect(() => {
    if (!needFetch) return undefined;
    let alive = true;
    (async () => {
      try {
        if (f.size > PREVIEW_MAX_BYTES) throw new Error("Tệp lớn hơn 20 MB — hãy tải về để xem");
        const r = await fetch(fileHref(f.url));
        if (!r.ok) throw new Error(r.status === 403 ? "Đường dẫn đã hết hạn — tải lại trang" : "Không tải được tệp");
        const buf = await r.arrayBuffer();
        if (!alive) return;
        if (kind === "text") {
          setState({ status: "ready", text: new TextDecoder("utf-8").decode(buf).slice(0, 500000) });
        } else if (kind === "sheet") {
          const XLSX = await import("xlsx-js-style");
          const wb = XLSX.read(buf, { type: "array" });
          const sheets = wb.SheetNames.map((name) => {
            const all = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "", blankrows: false });
            const rows = all.slice(0, SHEET_MAX_ROWS).map((x) => x.slice(0, SHEET_MAX_COLS));
            const cols = rows.reduce((mx, x) => Math.max(mx, x.length), 0);
            return { name, rows, cols, cut: all.length > SHEET_MAX_ROWS || all.some((x) => x.length > SHEET_MAX_COLS) };
          });
          if (alive) setState({ status: "ready", book: { sheets: sheets.length ? sheets : [{ name: "Sheet1", rows: [], cols: 0 }] } });
        } else {
          setState({ status: "ready", docxBuf: buf }); // dựng ở effect bên dưới, sau khi khung hiển thị đã gắn vào trang
        }
      } catch (e) {
        if (alive) setState({ status: "error", message: e.message || "Không xem trước được tệp" });
      }
    })();
    return () => { alive = false; };
  }, [f, kind, needFetch]);

  // Word (.docx): dựng bằng docx-preview (tải lười) vào khung docxRef
  useEffect(() => {
    if (state.status !== "ready" || !state.docxBuf || !docxRef.current) return undefined;
    let alive = true;
    import("docx-preview")
      .then(({ renderAsync }) => renderAsync(state.docxBuf, docxRef.current, null, { inWrapper: true, breakPages: true, ignoreLastRenderedPageBreak: true }))
      .catch(() => { if (alive) setState({ status: "error", message: "Không dựng được tệp Word này — hãy tải về để xem" }); });
    return () => { alive = false; };
  }, [state]);

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex flex-col bg-slate-900/95" role="dialog" aria-label={`Xem trước ${f.name}`} onClick={onClose}>
      <div className="flex shrink-0 items-center gap-2 px-3 py-2 text-white" onClick={(e) => e.stopPropagation()}>
        <FileTypeIcon name={f.name} mime={f.mime} className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-sm">{f.name} <span className="text-white/50">· {fmtSize(f.size)}</span></span>
        <a href={fileHref(f.downloadUrl)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm hover:bg-white/10" title="Tải về"><Download className="h-4 w-4" /> <span className="hidden sm:inline">Tải về</span></a>
        {(kind === "pdf" || kind === "video" || kind === "audio" || kind === "text") && (
          <a href={fileHref(f.url)} target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-white/10" title="Mở tab mới"><ExternalLink className="h-5 w-5" /></a>
        )}
        <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" title="Đóng (Esc)"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-hidden sm:px-3 sm:pb-3" onClick={(e) => e.stopPropagation()}>
        {state.status === "loading" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-white/80"><Loader2 className="h-8 w-8 animate-spin" /><span className="text-sm">Đang mở tệp…</span></div>
        )}
        {state.status === "error" && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <p className="text-sm">{state.message}</p>
            <a href={fileHref(f.downloadUrl)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-800"><Download className="h-4 w-4" /> Tải về</a>
          </div>
        )}
        {state.status === "ready" && kind === "pdf" && <iframe title={f.name} src={fileHref(f.url)} className="h-full w-full bg-white sm:rounded-lg" />}
        {state.status === "ready" && kind === "video" && <div className="flex h-full items-center justify-center"><video controls autoPlay src={fileHref(f.url)} className="max-h-full max-w-full" /></div>}
        {state.status === "ready" && kind === "audio" && <div className="flex h-full items-center justify-center p-6"><audio controls autoPlay src={fileHref(f.url)} className="w-full max-w-xl" /></div>}
        {state.status === "ready" && kind === "text" && <pre className="h-full overflow-auto whitespace-pre-wrap break-words bg-white p-4 text-sm text-slate-800 sm:rounded-lg">{state.text}</pre>}
        {state.status === "ready" && kind === "sheet" && <div className="h-full overflow-hidden sm:rounded-lg"><SheetView book={state.book} /></div>}
        {state.status === "ready" && kind === "docx" && <div ref={docxRef} className="h-full overflow-auto bg-slate-200 sm:rounded-lg" data-docx-preview />}
      </div>
    </div>,
    document.body
  );
}

/** Lưới ảnh + danh sách tệp. files: kết quả fileOut() của backend */
export function FileGallery({ files, size = "md", allowDownloadAll = true }) {
  const [view, setView] = useState(null); // index ảnh đang xem
  const [preview, setPreview] = useState(null); // tệp (không phải ảnh) đang xem trước
  const images = useMemo(() => (files || []).filter((f) => f.isImage), [files]);
  const others = useMemo(() => (files || []).filter((f) => !f.isImage), [files]);
  // API chưa cấu hình máy chủ tệp → backend không ký đường dẫn (url = null)
  const noServer = (files || []).some((f) => !f.downloadUrl);
  if (!files?.length) return null;
  const tile = size === "sm" ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28";

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((f, i) => <Thumb key={f.fileId} f={f} size={tile} onOpen={() => setView(i)} />)}
        </div>
      )}
      {others.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {others.map((f) => {
            const viewable = !!f.url && !!previewKind(f);
            const info = (
              <>
                <FileTypeIcon name={f.name} mime={f.mime} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-sm text-slate-800", viewable && "group-hover:text-blue-700 group-hover:underline")}>{f.name}</span>
                  <span className="block text-xs text-slate-400">{fmtSize(f.size)}{viewable ? " · bấm để xem trước" : ""}</span>
                </span>
              </>
            );
            return (
              <li key={f.fileId} className="flex items-center gap-2.5 px-3 py-2">
                {viewable ? (
                  <button type="button" onClick={() => setPreview(f)} className="group flex min-w-0 flex-1 items-center gap-2.5 text-left" title="Xem trước">{info}</button>
                ) : info}
                {!f.downloadUrl ? (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3.5 w-3.5" /> Chưa có máy chủ tệp</span>
                ) : (
                  <>
                    {viewable && <button type="button" onClick={() => setPreview(f)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700" title="Xem trước" aria-label={`Xem trước ${f.name}`}><Eye className="h-4 w-4" /></button>}
                    <a href={fileHref(f.downloadUrl)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700" title="Tải về"><Download className="h-4 w-4" /></a>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {allowDownloadAll && files.length > 1 && !noServer && (
        <button type="button" onClick={() => downloadAll(files)} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 hover:underline">
          <Download className="h-3.5 w-3.5" /> Tải tất cả ({files.length} tệp)
        </button>
      )}
      {view !== null && <Lightbox images={images} index={view} onIndex={setView} onClose={() => setView(null)} />}
      {preview && <FilePreview file={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** Xem ảnh lớn: ← → chuyển ảnh, Esc đóng, nút tải ảnh gốc */
export function Lightbox({ images, index, onIndex, onClose }) {
  const f = images[index];
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [index]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index < images.length - 1) onIndex(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [index, images.length, onIndex, onClose]);
  if (!f) return null;
  return createPortal(
    <div className="fixed inset-0 z-[1200] flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center gap-2 px-3 py-2 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="min-w-0 flex-1 truncate text-sm">{f.name} <span className="text-white/50">· {index + 1}/{images.length} · {fmtSize(f.size)}</span></span>
        <a href={fileHref(f.downloadUrl)} className="rounded-lg p-2 hover:bg-white/10" title="Tải ảnh gốc"><Download className="h-5 w-5" /></a>
        <a href={fileHref(f.url)} target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-white/10" title="Mở tab mới"><ExternalLink className="h-5 w-5" /></a>
        <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10" title="Đóng (Esc)"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
        {!loaded && (
          <>
            {f.thumbUrl && <img src={fileHref(f.thumbUrl)} alt="" className="absolute max-h-full max-w-full scale-100 object-contain opacity-60 blur-sm" />}
            <Loader2 className="absolute h-8 w-8 animate-spin text-white" />
          </>
        )}
        <img src={fileHref(f.url)} alt={f.name} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)}
          className={cn("max-h-full max-w-full object-contain transition-opacity", loaded ? "opacity-100" : "opacity-0")} />
        {index > 0 && (
          <button type="button" onClick={() => onIndex(index - 1)} className="absolute left-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70" title="Ảnh trước"><ChevronLeft className="h-6 w-6" /></button>
        )}
        {index < images.length - 1 && (
          <button type="button" onClick={() => onIndex(index + 1)} className="absolute right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70" title="Ảnh sau"><ChevronRight className="h-6 w-6" /></button>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Báo số tệp tải lên lỗi */
export function UploadWarning({ att }) {
  if (!att.failed) return null;
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
      <AlertTriangle className="h-3.5 w-3.5" /> {att.failed} tệp tải lên lỗi — bấm thử lại hoặc bỏ tệp đó trước khi gửi.
    </p>
  );
}
