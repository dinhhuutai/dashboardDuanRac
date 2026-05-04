import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PRINT_PAGE_STYLE_ID = "a6-card-print-style";
const PRINT_ROOT_CLASS = "a6-card-print-root";
const PRINT_PAGE_CLASS = "a6-card-print-page";
const DOC_CLASS = "a6-card-doc";
const CB_CLASS = "a6-card-cb";

/** Ô chọn — giống Google Docs (không phụ thuộc font glyph ☐) */
function Cb() {
  return <span className={CB_CLASS} aria-hidden="true" />;
}

function applyPrintStyles() {
  let el = document.getElementById(PRINT_PAGE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = PRINT_PAGE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `
.${DOC_CLASS}, .${DOC_CLASS} * {
  font-family: Cambria, "Times New Roman", Times, "DejaVu Serif", serif !important;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
.${DOC_CLASS} .${CB_CLASS} {
  display: inline-block;
  width: 9px;
  height: 9px;
  border: 1px solid #000;
  margin-right: 4px;
  vertical-align: -2px;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-title {
  margin: 0 0 4px;
  font-size: 15pt;
  font-weight: 700;
  text-align: center;
}
.${DOC_CLASS} .a6-sub {
  margin: 0 0 12px;
  font-size: 11pt;
  text-align: center;
}
.${DOC_CLASS} .a6-hdr {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  font-size: 10pt;
}
.${DOC_CLASS} .a6-hdr td {
  padding: 3px 8px 5px 0;
  vertical-align: bottom;
  border: none;
  width: 33.33%;
}
.${DOC_CLASS} .a6-dots {
  border-bottom: 1px dotted #000;
  display: inline-block;
  min-width: 120px;
  margin-left: 4px;
  min-height: 1em;
}
.${DOC_CLASS} .a6-cp-title {
  text-align: left;
  font-weight: 700;
  font-size: 11pt;
  margin: 8px 0 6px;
}
.${DOC_CLASS} .a6-grid {
  width: 100%;
  border: 1px solid #000;
  border-collapse: collapse;
  margin-bottom: 12px;
  font-size: 8.5pt;
  table-layout: fixed;
}
.${DOC_CLASS} .a6-grid td {
  border: none;
  border-bottom: 1px solid #000;
  padding: 4px 6px;
  vertical-align: bottom;
}
.${DOC_CLASS} .a6-grid tr:last-child td {
  border-bottom: none;
}
/* Không tắt border ô READY rowspan — ô đó nối đoạn kẻ trái (hàng Kiểm tra không có td cột 1) */
.${DOC_CLASS} .a6-grid tr.a6-row-nb td:not(.a6-ready-stage),
.${DOC_CLASS} .a6-finish-all tr.a6-row-nb td {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-st {
  font-weight: 700;
  width: 9%;
  vertical-align: middle !important;
  font-size: 8.5pt;
}
.${DOC_CLASS} .a6-stop {
  font-weight: 700;
  text-align: center;
  vertical-align: middle !important;
  width: 4%;
  font-size: 8.5pt;
}
.${DOC_CLASS} .a6-lbl {
  font-size: 8.5pt;
}
.${DOC_CLASS} .a6-dots-cell {
  font-size: 10pt;
  letter-spacing: 0.5px;
  min-width: 4.5rem;
}
.${DOC_CLASS} .a6-gio {
  font-size: 7.5pt;
}
.${DOC_CLASS} .a6-ktra td {
  vertical-align: middle !important;
  font-size: 9.5pt;
}
.${DOC_CLASS} .a6-kq td {
  font-size: 9.5pt;
  vertical-align: middle !important;
}
.${DOC_CLASS} .a6-finish-all {
  width: 100%;
  border: 1px solid #000;
  border-collapse: collapse;
  margin: 10px 0 12px;
  font-size: 8.5pt;
  table-layout: fixed;
}
.${DOC_CLASS} .a6-finish-all td {
  border: none;
  border-bottom: 1px solid #000;
  padding: 6px 6px;
  vertical-align: bottom;
}
.${DOC_CLASS} .a6-finish-all tr:last-child td {
  border-bottom: none;
}
.${DOC_CLASS} .a6-fin-h {
  font-weight: 700;
  width: 8%;
  vertical-align: top !important;
}
.${DOC_CLASS} .a6-warn-row td {
  font-weight: 700;
  text-align: left;
  vertical-align: middle !important;
  font-size: 8.5pt;
}
.${DOC_CLASS} .a6-rules {
  margin-top: 8px;
  font-size: 11pt;
}
.${DOC_CLASS} .a6-rules-title {
  font-weight: 700;
  font-size: 11pt;
  margin-bottom: 6px;
}
.${DOC_CLASS} .a6-rules p {
  margin: 2px 0;
  line-height: 1.45;
}
@media print {
  @page { size: A4 portrait; margin: 0.4in; }
  html, body { margin: 0 !important; padding: 0 !important; }
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
    background: #fff !important;
  }
  .${PRINT_ROOT_CLASS} { background: #fff !important; padding: 0 !important; }
  .${PRINT_PAGE_CLASS} {
    box-sizing: border-box !important;
    width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-hidden { display: none !important; }
}
`;
}

function searchParamsToValues(searchParams) {
  const out = {};
  searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function normalizeValue(v) {
  return v != null ? String(v).trim() : "";
}

function formatNgayGiao(raw) {
  const s = normalizeValue(raw);
  if (!s) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return s;
}

function HdrCell({ label, value }) {
  const v = normalizeValue(value);
  return (
    <td>
      <span>{label}</span>
      {v ? (
        <span style={{ marginLeft: 6 }}>{v}</span>
      ) : (
        <span className="a6-dots">&nbsp;</span>
      )}
    </td>
  );
}

function DotsCell() {
  return (
    <td className="a6-dots-cell">&nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;</td>
  );
}

function exportA6CardWord(values) {
  const stamp = normalizeValue(values.PO) || new Date().toISOString().slice(0, 10);
  const chk =
    '<span style="display:inline-block;width:9px;height:9px;border:1px solid #000;margin-right:4px;vertical-align:-2px"></span>';
  const z = "&nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;";
  const po = normalizeValue(values.PO) || z;
  const ma = normalizeValue(values.MA) || z;
  const kh = normalizeValue(values.KH) || z;
  const mauVai = normalizeValue(values.MAUVAI) || z;
  const kichVai = normalizeValue(values.KICHVAI) || z;
  const kichPhim = normalizeValue(values.KICHPHIM) || z;
  const sl = normalizeValue(values.SL) || z;
  const ng = formatNgayGiao(values.NG) || z;

  const htmlRaw = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8" />
<style>
body{font-family:Cambria,"Times New Roman",serif;font-size:10pt;line-height:1.3;color:#000;margin:0.4in}
table{border-collapse:collapse;width:100%}
.a6g{border:1px solid #000}
.a6g td{border:none;border-bottom:1px solid #000;padding:4px 6px;vertical-align:bottom;font-size:8.5pt}
.a6lbl+td{min-width:4.5rem}
.a6g tr:last-child td{border-bottom:none}
.a6g tr.nb td:not(.a6-ready-stage){border-bottom:none!important}
.fin tr.nb td{border-bottom:none!important}
.a6st{font-weight:700;width:9%;vertical-align:middle!important}
.a6lbl{font-size:8.5pt}
.a6sp{font-weight:700;text-align:center;width:4%;vertical-align:middle!important;font-size:8.5pt}
.fin{border:1px solid #000;margin:10px 0;font-size:8.5pt}
.fin td{border:none;border-bottom:1px solid #000;padding:6px;vertical-align:bottom}
.fin tr:last-child td{border-bottom:none}
.w{font-weight:700;text-align:left}
</style></head><body>
<h1 style="text-align:center;font-size:15pt;margin:0 0 4px">THLA – A6 CARD (MÃ – PHẦN) – BẢN V3</h1>
<p style="text-align:center;margin:0 0 12px;font-size:11pt">(Chuẩn hóa checkpoint FINISH – Khóa Chất lượng + Số lượng + Trạng thái)</p>
<table style="margin-bottom:10px;font-size:10pt"><tr><td style="width:33%">PO: ${po}</td><td style="width:34%">Mã hàng: ${ma}</td><td>Phần: ${z}</td></tr>
<tr><td>Màu vải: ${mauVai}</td><td>Kích vải: ${kichVai}</td><td>Kích phim: ${kichPhim}</td></tr>
<tr><td>Khách hàng: ${kh}</td><td>Số lượng: ${sl}</td><td>Ngày giao: ${ng}</td></tr></table>

<p style="text-align:left;font-weight:700;margin:8px 0 6px;font-size:11pt">— CHECKPOINT —</p>
<table class="a6g">
<tr>
<td class="a6st">${chk} OPEN</td>
<td class="a6lbl">Sale ký</td><td>${z}</td>
<td class="a6lbl">KT ký</td><td>${z}</td>
<td class="a6sp">STOP</td>
<td class="a6lbl">KT ký</td><td>${z}</td>
<td class="a6lbl">PGĐ ký</td><td>${z}</td>
<td colspan="1"><span style="font-size:7.5pt">Giờ STOP:</span> ${z}</td>
</tr>
<tr class="nb">
<td class="a6st a6-ready-stage" rowspan="2">${chk} READY</td>
<td class="a6lbl">QA ký</td><td colspan="3">${z}</td>
<td class="a6sp">STOP</td>
<td class="a6lbl">QA ký</td><td colspan="3">${z}</td>
<td><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6ktra">
<td colspan="2">Kiểm tra: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${chk} Vải OK</td>
<td colspan="2">${chk} Khuôn OK</td>
<td colspan="2">${chk} Mực OK</td>
<td colspan="3">${chk} Mẫu duyệt Ok</td>
<td>${z}</td>
</tr>
<tr>
<td class="a6st">${chk} RELEASE 1</td>
<td class="a6lbl">KH ký</td><td>${z}</td><td></td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl">QA ký</td><td>${z}</td>
<td class="a6lbl">KH ký</td><td>${z}</td>
<td><span style="font-size:7.5pt">Giờ STOP:</span><br/>${z}</td>
</tr>
<tr class="nb">
<td class="a6st">${chk} TEST RUN</td>
<td class="a6lbl">QA ký</td><td>${z}</td><td></td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl">QA ký</td><td>${z}</td><td></td><td></td>
<td><span style="font-size:7.5pt">Giờ STOP::</span> ${z}</td>
</tr>
<tr class="a6kq">
<td></td>
<td colspan="2">Kết quả : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${chk} OK</td>
<td colspan="2">${chk} FAIL</td>
<td></td><td></td><td></td><td></td><td></td><td></td>
</tr>
<tr>
<td class="a6st">${chk} RELEASE 2</td>
<td class="a6lbl">KH ký</td><td>${z}</td>
<td class="a6lbl">Tổ ký</td><td>${z}</td>
<td class="a6sp">STOP</td>
<td class="a6lbl">QA ký</td><td>${z}</td>
<td class="a6lbl">KH ký</td><td>${z}</td>
<td><span style="font-size:7.5pt">Giờ STOP:</span> ${z}</td>
</tr>
<tr>
<td class="a6st">${chk} SX (đang chạy)</td>
<td class="a6lbl">Tổ trưởng ký</td><td>${z}</td><td></td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl">Tổ ký</td><td>${z}</td>
<td class="a6lbl">QA ký</td><td>${z}</td>
<td><span style="font-size:7.5pt">Giờ STOP:</span> ${z}</td>
</tr>
</table>

<p style="text-align:left;font-weight:700;margin:10px 0 6px;font-size:11pt">— FINISH —</p>
<table class="fin">
<tr class="nb">
<td class="a6st" style="width:8%;vertical-align:top">${chk} FINISH</td>
<td style="text-align:center">QA ký<br/>(Đạt chất lượng)</td>
<td colspan="2">${z}</td>
<td>Tổ trưởng ký (Đủ số lượng Mã – Phần):</td>
<td colspan="3">${z}</td>
<td colspan="2">Quản đốc xác nhận<br/>(Đã hoàn tất toàn bộ):</td>
<td>${z}</td>
</tr>
<tr class="w"><td colspan="11">=&gt; Thiếu 1 trong 3: KHÔNG ĐƯỢC FINISH</td></tr>
<tr>
<td style="font-weight:700;vertical-align:top">${chk} DONE</td>
<td style="text-align:center">Kho ký</td>
<td colspan="2">${z}</td>
<td style="text-align:center">QA ký</td>
<td colspan="3">${z}</td>
<td style="text-align:center">KT ký</td>
<td colspan="2">${z}</td>
</tr>
</table>

<p style="font-weight:700;margin-top:10px;font-size:11pt">— NGUYÊN TẮC —</p>
<p style="margin:4px 0;font-size:11pt">1. Không READY → không RELEASE</p>
<p style="margin:4px 0;font-size:11pt">2. TEST RUN FAIL → không chạy</p>
<p style="margin:4px 0;font-size:11pt">3. Không đạt chất lượng → không FINISH</p>
<p style="margin:4px 0;font-size:11pt">4. Không đủ số lượng → không FINISH</p>
<p style="margin:4px 0;font-size:11pt">5. Ai ký → người đó chịu trách nhiệm</p>
</body></html>`;

  const blob = new Blob([htmlRaw], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `THLA_A6Card_${stamp}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function A6Card() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [queryValues, setQueryValues] = useState({});
  const printTitleRef = useRef("");

  useEffect(() => {
    const vals = searchParamsToValues(searchParams);
    setQueryValues(vals);
    if (window.location.search) {
      navigate(window.location.pathname, { replace: true });
    }
  }, []);

  useEffect(() => {
    applyPrintStyles();
    return () => document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
  }, []);

  useEffect(() => {
    const onBeforePrint = () => {
      printTitleRef.current = document.title;
      document.title = "";
    };
    const onAfterPrint = () => {
      document.title = printTitleRef.current;
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const data = useMemo(
    () => ({
      PO: normalizeValue(queryValues.PO),
      MA: normalizeValue(queryValues.MA),
      KH: normalizeValue(queryValues.KH),
      MAUVAI: normalizeValue(queryValues.MAUVAI),
      KICHVAI: normalizeValue(queryValues.KICHVAI),
      KICHPHIM: normalizeValue(queryValues.KICHPHIM),
      SL: normalizeValue(queryValues.SL),
      NG: formatNgayGiao(queryValues.NG),
    }),
    [queryValues],
  );

  return (
    <div className={`${PRINT_ROOT_CLASS} min-h-screen bg-neutral-100 p-3`}>
      <div className="mx-auto max-w-5xl">
        <div className="print-hidden mb-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              applyPrintStyles();
              window.print();
            }}
            className="rounded border border-neutral-400 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50"
          >
            In A4
          </button>
          <button
            type="button"
            onClick={() => exportA6CardWord({ ...searchParamsToValues(searchParams), ...queryValues })}
            className="rounded border border-neutral-400 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50"
          >
            Xuất Word
          </button>
        </div>

        <div className={`${PRINT_PAGE_CLASS} ${DOC_CLASS} bg-white px-5 py-4 text-black shadow-sm`} lang="vi">
          <h1 className="a6-title">THLA – A6 CARD (MÃ – PHẦN) – BẢN V3</h1>
          <p className="a6-sub">
            (Chuẩn hóa checkpoint FINISH – Khóa Chất lượng + Số lượng + Trạng thái)
          </p>

          <table className="a6-hdr">
            <tbody>
              <tr>
                <HdrCell label="PO:" value={data.PO} />
                <HdrCell label="Mã hàng:" value={data.MA} />
                <HdrCell label="Phần:" value="" />
              </tr>
              <tr>
                <HdrCell label="Màu vải:" value={data.MAUVAI} />
                <HdrCell label="Kích vải:" value={data.KICHVAI} />
                <HdrCell label="Kích phim:" value={data.KICHPHIM} />
              </tr>
              <tr>
                <HdrCell label="Khách hàng:" value={data.KH} />
                <HdrCell label="Số lượng:" value={data.SL} />
                <HdrCell label="Ngày giao:" value={data.NG} />
              </tr>
            </tbody>
          </table>

          <p className="a6-cp-title">— CHECKPOINT —</p>

          <table className="a6-grid">
            <tbody>
              <tr>
                <td className="a6-st">
                  <Cb /> OPEN
                </td>
                <td className="a6-lbl">Sale ký</td>
                <DotsCell />
                <td className="a6-lbl">KT ký</td>
                <DotsCell />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">KT ký</td>
                <DotsCell />
                <td className="a6-lbl">PGĐ ký</td>
                <DotsCell />
                <td>
                  <span className="a6-gio">Giờ STOP:</span> &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
              </tr>
              <tr className="a6-row-nb">
                <td className="a6-st a6-ready-stage" rowSpan={2}>
                  <Cb /> READY
                </td>
                <td className="a6-lbl">QA ký</td>
                <td className="a6-dots-cell" colSpan={3}>
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">QA ký</td>
                <td className="a6-dots-cell" colSpan={3}>
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
                <td className="a6-gio">Giờ STOP:</td>
              </tr>
              <tr className="a6-ktra">
                <td colSpan={2}>
                  Kiểm tra: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <Cb /> Vải OK
                </td>
                <td colSpan={2}>
                  <Cb /> Khuôn OK
                </td>
                <td colSpan={2}>
                  <Cb /> Mực OK
                </td>
                <td colSpan={3}>
                  <Cb /> Mẫu duyệt Ok
                </td>
                <td className="a6-dots-cell">&nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;</td>
              </tr>
              <tr>
                <td className="a6-st">
                  <Cb /> RELEASE 1
                </td>
                <td className="a6-lbl">KH ký</td>
                <DotsCell />
                <td />
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">QA ký</td>
                <DotsCell />
                <td className="a6-lbl">KH ký</td>
                <DotsCell />
                <td>
                  <span className="a6-gio">Giờ STOP:</span>
                  <br />
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
              </tr>
              <tr className="a6-row-nb">
                <td className="a6-st">
                  <Cb /> TEST RUN
                </td>
                <td className="a6-lbl">QA ký</td>
                <DotsCell />
                <td />
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">QA ký</td>
                <DotsCell />
                <td />
                <td />
                <td>
                  <span className="a6-gio">Giờ STOP::</span> &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
              </tr>
              <tr className="a6-kq">
                <td />
                <td colSpan={2}>
                  Kết quả : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <Cb /> OK
                </td>
                <td colSpan={2}>
                  <Cb /> FAIL
                </td>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
              </tr>
              <tr>
                <td className="a6-st">
                  <Cb /> RELEASE 2
                </td>
                <td className="a6-lbl">KH ký</td>
                <DotsCell />
                <td className="a6-lbl">Tổ ký</td>
                <DotsCell />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">QA ký</td>
                <DotsCell />
                <td className="a6-lbl">KH ký</td>
                <DotsCell />
                <td>
                  <span className="a6-gio">Giờ STOP:</span> &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
              </tr>
              <tr>
                <td className="a6-st">
                  <Cb /> SX (đang chạy)
                </td>
                <td className="a6-lbl">Tổ trưởng ký</td>
                <DotsCell />
                <td />
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">Tổ ký</td>
                <DotsCell />
                <td className="a6-lbl">QA ký</td>
                <DotsCell />
                <td>
                  <span className="a6-gio">Giờ STOP:</span> &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
              </tr>
            </tbody>
          </table>

          <p className="a6-cp-title">— FINISH —</p>

          <table className="a6-finish-all">
            <tbody>
              <tr className="a6-row-nb">
                <td className="a6-fin-h">
                  <Cb /> FINISH
                </td>
                <td style={{ textAlign: "center" }}>
                  QA ký<br />
                  (Đạt chất lượng)
                </td>
                <td colSpan={2} className="a6-dots-cell">
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
                <td>Tổ trưởng ký (Đủ số lượng Mã – Phần):</td>
                <td colSpan={3} className="a6-dots-cell">
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
                <td colSpan={2}>
                  Quản đốc xác nhận
                  <br />
                  (Đã hoàn tất toàn bộ):
                </td>
                <td className="a6-dots-cell">&nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;</td>
              </tr>
              <tr className="a6-warn-row">
                <td colSpan={11}>=&gt; Thiếu 1 trong 3: KHÔNG ĐƯỢC FINISH</td>
              </tr>
              <tr>
                <td className="a6-fin-h">
                  <Cb /> DONE
                </td>
                <td style={{ textAlign: "center" }}>Kho ký</td>
                <td colSpan={2} className="a6-dots-cell">
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
                <td style={{ textAlign: "center" }}>QA ký</td>
                <td colSpan={3} className="a6-dots-cell">
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
                <td style={{ textAlign: "center" }}>KT ký</td>
                <td colSpan={2} className="a6-dots-cell">
                  &nbsp;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;
                </td>
              </tr>
            </tbody>
          </table>

          <p className="a6-rules-title">— NGUYÊN TẮC —</p>
          <div className="a6-rules">
            <p>1. Không READY → không RELEASE</p>
            <p>2. TEST RUN FAIL → không chạy</p>
            <p>3. Không đạt chất lượng → không FINISH</p>
            <p>4. Không đủ số lượng → không FINISH</p>
            <p>5. Ai ký → người đó chịu trách nhiệm</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default A6Card;
