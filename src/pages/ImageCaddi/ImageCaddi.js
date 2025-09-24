import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { BASE_URL_SERVER_THLA } from "~/config";

/* ---------- Utils ---------- */
function useDebouncedValue(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}
function formatSize(bytes) {
  if (bytes == null) return "--";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}
function isPdfItem(it) {
  if (it?.type) return it.type === "pdf";
  if (it?.ext) return it.ext.toLowerCase() === ".pdf";
  return typeof it?.name === "string" && /\.pdf$/i.test(it.name);
}
function highlight(text, query) {
  if (!query?.trim()) return text;
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return text;
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${tokens.map(esc).join("|")})`, "ig");
  const parts = text.split(re);
  return parts.map((p, i) =>
    re.test(p) ? <mark key={i} className="rounded bg-yellow-200/70 px-0.5">{p}</mark> : p
  );
}

/* ---------- PDF thumb (pdf.js + fallback <embed>) ---------- */
function PDFThumb({ url }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);
  const [useEmbed, setUseEmbed] = useState(false); // fallback

  const renderThumb = useCallback(async () => {
    if (!canvasRef.current || rendered || useEmbed) return;
    try {
      // ESM entry (đúng cho Vite)
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
      // Worker đúng kiểu Vite: ?url -> string URL
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.js?url")).default;
      GlobalWorkerOptions.workerSrc = workerUrl;

      const loadingTask = getDocument({ url, withCredentials: false });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const cssWidth = canvas.parentElement?.getBoundingClientRect()?.width || 512;

      const viewport1 = page.getViewport({ scale: 1 });
      const scale = cssWidth / viewport1.width;
      const viewport = page.getViewport({ scale });

      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));

      await page.render({ canvasContext: ctx, viewport }).promise;
      setRendered(true);
    } catch (e) {
      console.error("pdf.js failed, fallback to <embed>:", e);
      setUseEmbed(true);
      setRendered(true);
    }
  }, [url, rendered, useEmbed]);

  useEffect(() => { setRendered(false); setUseEmbed(false); }, [url]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let obs;
    if ("IntersectionObserver" in window) {
      obs = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          renderThumb();
          obs.disconnect();
        }
      }, { rootMargin: "200px" });
      obs.observe(el);
    } else {
      renderThumb();
    }
    return () => obs?.disconnect();
  }, [renderThumb]);

  return (
    <div className="relative h-full w-full">
      {!useEmbed ? (
        <>
          <canvas ref={canvasRef} className="h-full w-full object-cover" />
          {!rendered && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">PDF</div>
          )}
        </>
      ) : (
        // ✅ Fallback: hiển thị trực tiếp PDF bằng <embed>
        <embed
          src={`${url}#page=1&view=FitH`}
          type="application/pdf"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

/* ---------- Card ---------- */
function FileCard({ it, query }) {
  const fileUrl = `${BASE_URL_SERVER_THLA}${it.url}`;
  const pdf = isPdfItem(it);

  const onCopy = async () => { try { await navigator.clipboard.writeText(fileUrl); } catch {} };
  const onOpen = () => window.open(fileUrl, "_blank", "noopener,noreferrer");

  return (
    <figure className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" title={it.name}>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
        {pdf ? (
          <PDFThumb url={fileUrl} />
        ) : (
          <img
            src={fileUrl}
            alt={it.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
          <div className="absolute -left-1/2 -top-1/2 h-[220%] w-24 rotate-[25deg] bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shine_1.8s_linear_infinite]" />
        </div>

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {pdf && <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">PDF</span>}
          <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white backdrop-blur">
            {formatSize(it.size)}
          </span>
        </div>
      </div>

      <figcaption className="flex items-center justify-between gap-2 border-t border-slate-100 p-3">
        <span className="block truncate text-xs text-slate-700" title={it.name}>
          {highlight(it.name, query)}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onCopy} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50">
            Sao chép
          </button>
          <button onClick={onOpen} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50">
            Mở
          </button>
        </div>
      </figcaption>
    </figure>
  );
}

/* ---------- Skeleton & Empty ---------- */
function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-square animate-pulse bg-slate-100" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
function EmptyState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white/60">
      <div className="text-2xl">🔍</div>
      <p className="text-sm text-slate-600">Không tìm thấy tệp phù hợp. Thử từ khóa khác nhé.</p>
    </div>
  );
}

/* ---------- Page ---------- */
export default function CaddiImages() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const [page, setPage] = useState(1);
  const pageSize = 60;

  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
  const ctrl = new AbortController();

  const q = debouncedQ.trim();
  const base = `${BASE_URL_SERVER_THLA}/api/caddi/images`;
  // Nếu có từ khóa -> dùng path param; nếu rỗng -> gọi endpoint gốc để trả tất cả
  const url = new URL(q ? `${base}/${encodeURIComponent(q)}` : base);
  url.searchParams.set("page", page);
  url.searchParams.set("pageSize", pageSize);

  setLoading(true);
  fetch(url.toString(), { signal: ctrl.signal })
    .then(r => r.json())
    .then(d => {
      setItems(d.items || []);
      setTotal(d.total || 0);
    })
    .catch(() => {})
    .finally(() => setLoading(false));

  return () => ctrl.abort();
}, [debouncedQ, page]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/50 p-4 md:p-6">
      {/* Toolbar */}
      <div className="mx-auto mb-4 flex max-w-7xl flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Nhập tên hoặc nhiều từ (vd: valve gasket 2024-09)"
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 pr-11 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow disabled:opacity-50 disabled:hover:translate-y-0"
          >
            ◀ Trước
          </button>
          <span className="text-sm text-slate-600">
            Trang <b>{page}</b>/<b>{totalPages}</b>
          </span>
          <button
            disabled={!canNext}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow disabled:opacity-50 disabled:hover:translate-y-0"
          >
            Sau ▶
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl">
        {loading ? (
          <SkeletonGrid />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {items.map((it) => (
              <FileCard key={it.url} it={it} query={debouncedQ} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shine {
          0%   { transform: rotate(25deg) translateX(-200%); opacity: 0; }
          50%  { opacity: 1; }
          100% { transform: rotate(25deg) translateX(250%); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
