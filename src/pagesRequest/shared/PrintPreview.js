// Xem trước trang in đúng khổ giấy (A4/A5, dọc/ngang) — tự thu nhỏ vừa khung, vạch xám = hết 1 trang.
import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { PAPER, renderPrintHtml } from "./print";
import { userName } from "./store";

const MM = 96 / 25.4; // px / mm

export default function PrintPreview({ tpl, request, markUnknown, className, height = "75vh" }) {
  const box = useRef(null);
  const [fit, setFit] = useState(1);
  const [scale, setScale] = useState(null); // null = vừa khung
  const [pw, ph] = PAPER[tpl?.paper] || PAPER.A4;
  const W = tpl?.orientation === "landscape" ? ph : pw;

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const measure = () => setFit(Math.min(1.5, Math.max(0.25, (el.clientWidth - 28) / (W * MM))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [W]);

  const zoom = scale ?? fit;
  const html = useMemo(
    () => (tpl && request ? renderPrintHtml(tpl, request, { mode: "screen", zoom, markUnknown, userName: (id) => userName(id) }) : ""),
    [tpl, request, zoom, markUnknown]
  );

  return (
    <div ref={box} className={className} data-print-preview>
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
        <iframe title="Xem trước trang in" srcDoc={html} className="block w-full bg-slate-200" style={{ height }} />
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-xs text-slate-600 shadow">
          <button type="button" className="rounded-full p-1 hover:bg-slate-100" title="Thu nhỏ" onClick={() => setScale(Math.max(0.25, Math.round((zoom - 0.1) * 10) / 10))}><Minus className="h-3.5 w-3.5" /></button>
          <button type="button" className="w-12 rounded-full py-0.5 hover:bg-slate-100" title="Vừa khung" onClick={() => setScale(null)}>{Math.round(zoom * 100)}%</button>
          <button type="button" className="rounded-full p-1 hover:bg-slate-100" title="Phóng to" onClick={() => setScale(Math.min(3, Math.round((zoom + 0.1) * 10) / 10))}><Plus className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
