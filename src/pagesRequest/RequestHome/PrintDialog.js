// In 1 đề xuất theo mẫu in của mẫu đề xuất: chọn mẫu (nếu có nhiều), xem trước đúng khổ, In / Lưu PDF, tải Word.
// 2 loại mẫu: thiết kế trên web (print.js → HTML) và tệp Word tải lên (docxTemplate.js → .docx đã điền dữ liệu).
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FileDown, Loader2, Printer, X } from "lucide-react";
import { Button, cn, toast } from "~/pagesForm/shared/ui";
import { errorMessage, rqApi } from "../shared/api";
import { userName } from "../shared/store";
import PrintPreview from "../shared/PrintPreview";
import DocxPreview, { useFilledDocx } from "../shared/DocxPreview";
import { downloadWord, printDocument, renderPrintHtml } from "../shared/print";
import { downloadBlob, printDocx } from "../shared/docxTemplate";

export default function PrintDialog({ request, onClose }) {
  const [templates, setTemplates] = useState(null);
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    let alive = true;
    rqApi.printTemplates(request.requestId)
      .then((d) => { if (!alive) return; setTemplates(d.templates); setSel((d.templates.find((t) => t.isDefault) || d.templates[0])?.id || null); })
      .catch((e) => { if (alive) setError(errorMessage(e, "Không tải được mẫu in")); });
    return () => { alive = false; };
  }, [request.requestId]);

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const tpl = templates?.find((t) => t.id === sel);
  const isWord = tpl?.kind === "docx";
  const word = useFilledDocx(isWord ? tpl : null, request);
  const html = (mode) => renderPrintHtml(tpl, request, { mode, userName: (id) => userName(id) });
  const fileName = `${request.typeName || "De xuat"} #${request.requestId}`;

  const doPrint = () => (isWord ? printDocx(word.blob, word.size, fileName).catch((e) => toast.error(e.message)) : printDocument(html("print")));
  const doWord = () => (isWord ? downloadBlob(word.blob, `${fileName}.docx`) : downloadWord(html("word"), fileName));

  return createPortal(
    <div className="fixed inset-0 z-[1100] flex flex-col bg-slate-900/60 sm:p-4" role="dialog" aria-label="In đề xuất" onMouseDown={onClose}>
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white sm:rounded-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
          <Printer className="h-5 w-5 text-slate-500" />
          <h3 className="flex-1 font-semibold text-slate-800">In đề xuất #{request.requestId}</h3>
          {tpl && (
            <>
              <Button icon={Printer} disabled={isWord && !word.blob} onClick={doPrint}>In / Lưu PDF</Button>
              <Button variant="secondary" icon={FileDown} disabled={isWord && !word.blob} onClick={doWord} title="Tải tệp Word để sửa tiếp">Tải Word</Button>
            </>
          )}
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Đóng"><X className="h-5 w-5" /></button>
        </div>
        {templates && templates.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2">
            {templates.map((t) => (
              <button key={t.id} type="button" onClick={() => setSel(t.id)}
                className={cn("rounded-full border px-3 py-1 text-sm", t.id === sel ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-slate-300 text-slate-600 hover:border-blue-400")}>
                {t.name} <span className="text-xs font-normal text-slate-400">{t.kind === "docx" ? "Word" : `${t.paper}${t.orientation === "landscape" ? " ngang" : ""}`}</span>
              </button>
            ))}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-2 sm:p-4">
          {error ? <p className="p-8 text-center text-sm text-red-600">{error}</p>
            : !templates ? <div className="flex h-full items-center justify-center text-slate-500"><Loader2 className="h-6 w-6 animate-spin" /></div>
              : !tpl ? <p className="p-8 text-center text-sm text-slate-500">Mẫu đề xuất này chưa có mẫu in — quản trị viên thêm ở Mẫu đề xuất → tab "Mẫu in".</p>
                : isWord ? <DocxPreview blob={word.blob} error={word.error} height="calc(100vh - 200px)" />
                  : <PrintPreview tpl={tpl} request={request} height="calc(100vh - 180px)" />}
        </div>
      </div>
    </div>,
    document.body
  );
}
