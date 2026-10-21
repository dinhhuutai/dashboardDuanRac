// Xem trước tệp Word (.docx) đã điền dữ liệu — docx-preview dựng từng trang đúng khổ giấy của tệp; tự thu nhỏ vừa khung.
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, Minus, Plus } from "lucide-react";
import { fillDocx, loadDocx, pageSizeOf, renderDocx } from "./docxTemplate";
import { userName } from "./store";

/** Mẫu in Word + dữ liệu 1 đề xuất → { blob (.docx đã điền), size (khổ giấy), error } — tính lại khi đổi dữ liệu / bảng khớp biến */
export function useFilledDocx(tpl, data) {
  const [out, setOut] = useState({ blob: null, size: null, error: null });
  const file = tpl?.file;
  const map = tpl?.map;
  useEffect(() => {
    if (!file?.key || !data) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const buf = await loadDocx(file);
        const [blob, size] = await Promise.all([fillDocx(buf, { map }, data, (id) => userName(id)), pageSizeOf(buf)]);
        if (alive) setOut({ blob, size, error: null });
      } catch (e) {
        if (alive) setOut((o) => ({ ...o, error: e?.message || "Không điền được tệp Word" }));
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [file, map, data]);
  return out;
}

export default function DocxPreview({ blob, error, height = "75vh", className }) {
  const box = useRef(null);
  const page = useRef(null);
  const [state, setState] = useState("loading");
  const [fit, setFit] = useState(1);
  const [scale, setScale] = useState(null);

  useEffect(() => {
    if (!blob || !page.current) return undefined;
    let alive = true;
    setState("loading");
    renderDocx(blob, page.current)
      .then(() => {
        if (!alive) return;
        const sec = page.current.querySelector("section.docx");
        if (sec && box.current) setFit(Math.min(1.5, Math.max(0.25, (box.current.clientWidth - 40) / sec.offsetWidth)));
        setState("ready");
      })
      .catch((e) => { if (alive) setState(e?.message || "Không dựng được tệp Word"); });
    return () => { alive = false; };
  }, [blob]);

  const zoom = scale ?? fit;
  const msg = error || (state !== "loading" && state !== "ready" ? state : null);
  return (
    <div ref={box} className={className} data-docx-preview>
      <div className="relative overflow-auto rounded-xl border border-slate-200 bg-slate-200" style={{ height }}>
        {msg && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-center text-sm text-red-600"><AlertTriangle className="h-6 w-6" />{msg}</div>}
        {!msg && (state === "loading" || !blob) && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200/70"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>}
        <div ref={page} style={{ zoom }} />
      </div>
      {!msg && (
        <div className="mt-1 flex justify-end">
          <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 text-xs text-slate-600 shadow ring-1 ring-slate-200">
            <button type="button" className="rounded-full p-1 hover:bg-slate-100" title="Thu nhỏ" onClick={() => setScale(Math.max(0.25, Math.round((zoom - 0.1) * 10) / 10))}><Minus className="h-3.5 w-3.5" /></button>
            <button type="button" className="w-12 rounded-full py-0.5 hover:bg-slate-100" title="Vừa khung" onClick={() => setScale(null)}>{Math.round(zoom * 100)}%</button>
            <button type="button" className="rounded-full p-1 hover:bg-slate-100" title="Phóng to" onClick={() => setScale(Math.min(3, Math.round((zoom + 0.1) * 10) / 10))}><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
