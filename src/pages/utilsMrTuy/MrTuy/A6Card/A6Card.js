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
  margin: 0 0 5px;
  font-size: 14.5pt;
  font-weight: 700;
  text-align: center;
}
.${DOC_CLASS} .a6-sub {
  margin: 0 0 9px;
  font-size: 9.5pt;
  text-align: center;
}
.${DOC_CLASS} .a6-hdr {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 6px;
  font-size: 9.5pt;
  table-layout: fixed;
}
.${DOC_CLASS} .a6-hdr col.a6-hdr-col-qr {
  width: 20%;
}
.${DOC_CLASS} .a6-hdr col.a6-hdr-col-data {
  width: 40%;
}
.${DOC_CLASS} .a6-hdr td {
  padding: 2px 8px 3px 0;
  vertical-align: top;
  border: none;
  min-width: 0;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-hdr td.a6-hdr-qr {
  padding-right: 10px;
  text-align: center;
  vertical-align: top;
}
.${DOC_CLASS} .a6-hdr-qr-img {
  display: block;
  max-width: 100%;
  width: 118px;
  height: auto;
  margin: 0 auto;
}
.${DOC_CLASS} .a6-hdr-qr-placeholder .a6-dots {
  min-width: 80px;
  margin-left: auto;
  margin-right: auto;
}
/* Một dòng: nhãn sát gạch chấm / giá trị (bố cục 3×3 giữ nguyên) */
.${DOC_CLASS} .a6-hdr-line {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
.${DOC_CLASS} .a6-hdr-line .a6-hdr-lbl {
  flex: 0 0 auto;
  white-space: nowrap;
  font-weight: 400;
}
.${DOC_CLASS} .a6-hdr-line .a6-hdr-val {
  flex: 0 1 auto;
  margin-left: 0;
  min-width: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-weight: 700;
}
.${DOC_CLASS} .a6-hdr-line .a6-dots {
  flex: 1 1 0;
  min-width: 0;
  margin-left: 0;
  width: auto;
  max-width: 100%;
  display: inline-block;
  vertical-align: baseline;
}
.${DOC_CLASS} .a6-hdr-sx-range {
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 3px;
  white-space: nowrap;
  font-size: 9pt;
}
.${DOC_CLASS} .a6-hdr-sx-td {
  min-width: 0;
  overflow: hidden;
}
.${DOC_CLASS} .a6-hdr-sx-range .a6-hdr-lbl {
  white-space: nowrap;
}
.${DOC_CLASS} .a6-hdr-sx-range .a6-dots-inline {
  flex: 0 0 52px;
  width: 52px;
  min-width: 44px !important;
  max-width: 56px;
}
.${DOC_CLASS} .a6-hdr-chuyen-cell .a6-hdr-line .a6-dots {
  flex: 0 0 56px;
  width: 56px;
  min-width: 48px !important;
  max-width: 64px;
}
.${DOC_CLASS} .a6-dots {
  border-bottom: 1px dotted #000;
  display: inline-block;
  min-width: 120px;
  margin-left: 4px;
  min-height: 1em;
  box-sizing: border-box;
}
/* Gạch chấm trong ô ký (full ô) — giống kiểu PO/Phần */
.${DOC_CLASS} .a6-dots-cell .a6-dots,
.${DOC_CLASS} .a6-finish-all td.a6-dots-cell .a6-dots {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  display: block;
}
/* Gạch cùng dòng sau nhãn (vd. Giờ STOP: ___) */
.${DOC_CLASS} .a6-dots-inline {
  min-width: 0;
  width: auto;
  max-width: 100%;
  margin-left: 4px;
  display: inline-block;
  vertical-align: baseline;
}
.${DOC_CLASS} .a6-grid td.a6-col-11:has(.a6-dots-inline) {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}
.${DOC_CLASS} .a6-grid td.a6-col-11:has(.a6-dots-inline) .a6-dots-inline {
  flex: 1 1 0;
  min-width: 0;
  margin-left: 0;
  max-width: 100%;
}
.${DOC_CLASS} .a6-cp-title {
  text-align: left;
  font-weight: 700;
  font-size: 10.5pt;
  margin: 7px 0 6px;
}
.${DOC_CLASS} .a6-grid {
  width: 100%;
  border: 1px solid #000;
  border-collapse: collapse;
  margin-bottom: 8px;
  font-size: 8.25pt;
  table-layout: fixed;
}
.${DOC_CLASS} .a6-grid td {
  border: none;
  border-bottom: 1px solid #000;
  padding: 4px 5px;
  vertical-align: bottom;
  min-width: 0;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-grid tr:last-child td {
  border-bottom: none;
}
/* Chỉ trong khung OPEN: bỏ kẻ giữa hàng nhãn và hàng chấm (không áp ô cột 1 đã rowspan) */
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:not(.a6-open-stage) {
  border-bottom: none !important;
}
/* Không tắt border ô READY rowspan — ô đó nối đoạn kẻ trái */
.${DOC_CLASS} .a6-grid tr.a6-row-nb td:not(.a6-ready-stage) {
  border-bottom: none !important;
}
/* FINISH hàng 1–2: bỏ kẻ giữa nhãn và hàng chấm; không kẻ ngăn hàng 2 ↔ hàng cảnh báo */
.${DOC_CLASS} .a6-finish-all tr.a6-fin-r1 td:not([rowspan]) {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-finish-all tr.a6-fin-r1 > td[rowspan] {
  vertical-align: middle !important;
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-finish-all tr.a6-fin-r2 td {
  vertical-align: bottom !important;
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-finish-all tr.a6-fin-r2 td.a6-rel1-dot-l {
  text-align: left;
}
/* DONE — 2 hàng (cột 1 rowspan 2) */
.${DOC_CLASS} .a6-finish-all tr.a6-done-r1 td:not([rowspan]) {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-finish-all tr.a6-done-r1 > td[rowspan] {
  vertical-align: middle !important;
  border-bottom: 1px solid #000 !important;
}
.${DOC_CLASS} .a6-finish-all tr.a6-done-r2 td {
  vertical-align: bottom !important;
}
.${DOC_CLASS} .a6-finish-all tr.a6-done-r1 td.a6-rel1-lbl-r {
  text-align: right;
}
.${DOC_CLASS} .a6-finish-all tr.a6-done-r2 td.a6-rel1-dot-l {
  text-align: left;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-blk td {
  font-size: 9pt;
  vertical-align: middle !important;
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-blk.a6-ready-dots td {
  vertical-align: bottom !important;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-blk.a6-ready-end td {
  border-bottom: 1px solid #000 !important;
}
/* READY — Vải (có cột 1 READY): 2+3,5–7,10 phải; 4+8 trái */
.${DOC_CLASS} .a6-grid tr.a6-ready-vai td:nth-child(2),
.${DOC_CLASS} .a6-grid tr.a6-ready-vai td:nth-child(4) {
  text-align: right;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-vai td:nth-child(3),
.${DOC_CLASS} .a6-grid tr.a6-ready-vai td:nth-child(5) {
  text-align: left;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-vai td:nth-child(7) {
  text-align: right;
}
/* READY — Mực (không cột 1): cùng lưới cột; hàng 3 cột 10 phải */
.${DOC_CLASS} .a6-grid tr.a6-ready-muc td:nth-child(1),
.${DOC_CLASS} .a6-grid tr.a6-ready-muc td:nth-child(3) {
  text-align: right;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-muc td:nth-child(2),
.${DOC_CLASS} .a6-grid tr.a6-ready-muc td:nth-child(4) {
  text-align: left;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-muc td:nth-child(6) {
  text-align: right;
}
.${DOC_CLASS} .a6-grid tr.a6-ready-stoprow td:nth-child(6) {
  text-align: right;
}
/* RELEASE 1 / TEST RUN / RELEASE 2 — nhãn phải / chấm trái */
.${DOC_CLASS} .a6-grid tr.a6-rel1-row1 td.a6-rel1-lbl-r,
.${DOC_CLASS} .a6-grid tr.a6-trun-row1 td.a6-rel1-lbl-r,
.${DOC_CLASS} .a6-grid tr.a6-rel2-row1 td.a6-rel1-lbl-r,
.${DOC_CLASS} .a6-grid tr.a6-sx-row1 td.a6-rel1-lbl-r {
  text-align: right;
}
.${DOC_CLASS} .a6-grid tr.a6-rel1-row2 td.a6-rel1-dot-l,
.${DOC_CLASS} .a6-grid tr.a6-trun-row2 td.a6-rel1-dot-l,
.${DOC_CLASS} .a6-grid tr.a6-rel2-row2 td.a6-rel1-dot-l,
.${DOC_CLASS} .a6-grid tr.a6-sx-row2 td.a6-rel1-dot-l {
  text-align: left;
}
/* Ô cột 1–2 rowspan 2 (RELEASE 1 / SX): căn giữa + kẻ đáy */
.${DOC_CLASS} .a6-grid tr.a6-rel1-row1 > td.a6-st[rowspan],
.${DOC_CLASS} .a6-grid tr.a6-sx-row1 > td.a6-st[rowspan] {
  vertical-align: middle !important;
  border-bottom: 1px solid #000 !important;
}
.${DOC_CLASS} .a6-grid tr.a6-rel1-row1 td:not([rowspan]),
.${DOC_CLASS} .a6-grid tr.a6-sx-row1 td:not([rowspan]) {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-grid tr.a6-rel1-row2 td,
.${DOC_CLASS} .a6-grid tr.a6-sx-row2 td {
  vertical-align: bottom !important;
}
/* TEST RUN — 3 hàng (ô cột 1–2 rowspan 3) */
.${DOC_CLASS} .a6-grid tr.a6-trun-row1 > td.a6-st[rowspan] {
  vertical-align: middle !important;
  border-bottom: 1px solid #000 !important;
}
.${DOC_CLASS} .a6-grid tr.a6-trun-row1 td:not([rowspan]) {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-grid tr.a6-trun-row2 td {
  vertical-align: bottom !important;
  border-bottom: none !important;
}
/* RELEASE 2 — 2 hàng (ô cột 1 rowspan 2) */
.${DOC_CLASS} .a6-grid tr.a6-rel2-row1 > td.a6-st[rowspan] {
  vertical-align: middle !important;
  border-bottom: 1px solid #000 !important;
}
.${DOC_CLASS} .a6-grid tr.a6-rel2-row1 td:not([rowspan]) {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-grid tr.a6-rel2-row2 td {
  vertical-align: bottom !important;
}
.${DOC_CLASS} .a6-st {
  font-weight: 700;
  width: calc(9% + 6px);
  box-sizing: border-box;
  vertical-align: middle !important;
  font-size: 8.25pt;
}
.${DOC_CLASS} .a6-grid td.a6-st.a6-ready-stage {
  padding-top: 9px;
  padding-bottom: 9px;
  /* Kẻ đáy khối READY gồm cột 1 — ô rowspan không nằm trên hàng a6-ready-end */
  border-bottom: 1px solid #000 !important;
}
.${DOC_CLASS} .a6-stop {
  font-weight: 700;
  text-align: center;
  vertical-align: middle !important;
  width: 4%;
  font-size: 8.25pt;
}
.${DOC_CLASS} .a6-lbl {
  font-size: 8.25pt;
}
.${DOC_CLASS} .a6-dots-cell {
  font-size: 9pt;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.${DOC_CLASS} .a6-gio {
  font-size: 7.5pt;
}
.${DOC_CLASS} .a6-grid tr.a6-open td {
  padding: 2.5px 2px;
}
.${DOC_CLASS} .a6-grid td.a6-st.a6-open-stage {
  vertical-align: middle !important;
}
.${DOC_CLASS} .a6-st-cb-line {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td {
  vertical-align: bottom !important;
}
.${DOC_CLASS} .a6-open-gio {
  text-align: center;
  vertical-align: bottom;
}
/* OPEN: cột nhãn 2,4,7,9 căn phải; cột 3,5,8,10 căn trái */
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(2),
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(4),
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(7),
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(9) {
  text-align: right;
}
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(3),
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(5),
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(8),
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(10) {
  text-align: left;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(1),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(3),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(6),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(8) {
  text-align: right;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(2),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(4),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(7),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(9) {
  text-align: left;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(5) {
  text-align: center;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(10) {
  text-align: center;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td .a6-dots {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  display: block;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(10) .a6-dots {
  max-width: min(6.5rem, 100%);
  margin-left: auto;
  margin-right: auto;
}
.${DOC_CLASS} .a6-grid td.a6-col-11 > .a6-dots:only-child {
  max-width: min(6.5rem, 100%);
  margin-left: auto;
  margin-right: auto;
}
/* Cột 11 (Giờ STOP / chấm): rộng hơn, lề ngang 4px (padding — margin td thường vô hiệu khi collapse) */
.${DOC_CLASS} .a6-grid td.a6-col-11 {
  padding: 4px 4px;
  min-width: 0;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-grid td.a6-cc {
  text-align: center;
}
.${DOC_CLASS} .a6-ktra td {
  vertical-align: middle !important;
  font-size: 9pt;
}
.${DOC_CLASS} .a6-kq td {
  font-size: 9pt;
  vertical-align: middle !important;
}
.${DOC_CLASS} .a6-finish-all {
  width: 100%;
  border: 1px solid #000;
  border-collapse: collapse;
  margin: 5px 0 8px;
  font-size: 8.25pt;
  table-layout: fixed;
}
.${DOC_CLASS} .a6-finish-all td {
  border: none;
  border-bottom: 1px solid #000;
  padding: 4px 5px;
  vertical-align: bottom;
  min-width: 0;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-finish-all tr:last-child td {
  border-bottom: none;
}
.${DOC_CLASS} .a6-fin-h {
  font-weight: 700;
  width: calc(8% + 6px);
  box-sizing: border-box;
  vertical-align: top !important;
}
.${DOC_CLASS} .a6-fin-lbl-line {
  white-space: nowrap;
}
.${DOC_CLASS} .a6-fin-qa {
  text-align: center;
  min-width: 11em;
  vertical-align: middle !important;
}
.${DOC_CLASS} .a6-fin-to-truong {
  max-width: 28%;
  padding-right: 10px;
  box-sizing: border-box;
  vertical-align: middle !important;
}
.${DOC_CLASS} .a6-fin-quan {
  vertical-align: middle !important;
  text-align: center;
  padding: 4px 6px;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-fin-dots-tt {
  padding-left: 18px;
  text-align: right;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-warn-row td {
  font-weight: 700;
  text-align: left;
  vertical-align: middle !important;
  font-size: 8.25pt;
}
.${DOC_CLASS} .a6-rules {
  margin-top: 8px;
  font-size: 10.5pt;
  font-weight: 700;
}
.${DOC_CLASS} .a6-rules-title {
  font-weight: 700;
  font-size: 10.5pt;
  margin-bottom: 8px;
}
.${DOC_CLASS} .a6-rules p {
  margin: 0 0 4px;
  line-height: 1.42;
  font-weight: 700 !important;
}
.${DOC_CLASS} .a6-rules p:last-child {
  margin-bottom: 0;
}
.${DOC_CLASS} .a6-rules strong {
  font-weight: 700 !important;
}
.${DOC_CLASS} .a6-print-meta {
  display: none;
}
@media print {
  @page { size: A4 portrait; margin: 0.28in; }
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
    box-shadow: none !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .print-hidden { display: none !important; }
  .${DOC_CLASS} .a6-print-meta {
    display: grid !important;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    font-size: 9pt;
    margin: 0 0 8px;
    font-family: Cambria, "Times New Roman", Times, serif;
  }
  .${DOC_CLASS} .a6-print-id {
    text-align: left;
    font-weight: 400;
    min-width: 0;
  }
  .${DOC_CLASS} .a6-print-time {
    text-align: right;
    white-space: nowrap;
  }
  .${DOC_CLASS} .a6-stop {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
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

/** Số lượng: phân tách hàng nghìn bằng dấu . (locale vi-VN) */
function formatSoLuongDisplay(raw) {
  const s = normalizeValue(raw);
  if (!s) return "";
  const t = s.replace(/\s/g, "");
  let n;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) {
    n = Number(t.replace(/\./g, "").replace(",", "."));
  } else if (/^\d+,\d+$/.test(t)) {
    n = Number(t.replace(",", "."));
  } else if (/^\d{1,3}(\.\d{3})*$/.test(t)) {
    n = Number(t.replace(/\./g, ""));
  } else {
    n = Number(t);
  }
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString("vi-VN");
}

function escapeHtmlAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Hàng in: ID (trái) + giờ (phải) */
function fillA6PrintMeta(root, idRaw) {
  if (!root) return;
  const idEl = root.querySelector(".a6-print-id");
  const timeEl = root.querySelector(".a6-print-time");
  if (timeEl) timeEl.textContent = formatA6PrintStampText();
  if (idEl) {
    const id = normalizeValue(idRaw);
    idEl.textContent = id || "";
  }
}

function clearA6PrintMeta(root) {
  if (!root) return;
  const idEl = root.querySelector(".a6-print-id");
  const timeEl = root.querySelector(".a6-print-time");
  if (idEl) idEl.textContent = "";
  if (timeEl) timeEl.textContent = "";
}

/** Giờ + ngày khi in (chỉ số, không thêm chữ mở đầu) */
function formatA6PrintStampText() {
  const d = new Date();
  const t = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${t} - ${date}`;
}

function HdrCell({ label, value, tdClassName }) {
  const v = normalizeValue(value);
  return (
    <td className={tdClassName || undefined}>
      <span className="a6-hdr-line">
        <span className="a6-hdr-lbl">{label}</span>
        {v ? (
          <span className="a6-hdr-val">{v}</span>
        ) : (
          <span className="a6-dots">&nbsp;</span>
        )}
      </span>
    </td>
  );
}

function DotsCell({ className }) {
  return (
    <td className={["a6-dots-cell", className].filter(Boolean).join(" ")}>
      <span className="a6-dots">&nbsp;</span>
    </td>
  );
}

function exportA6CardWord(values) {
  const stamp = normalizeValue(values.PO) || new Date().toISOString().slice(0, 10);
  const chk =
    '<span style="display:inline-block;width:9px;height:9px;border:1px solid #000;margin-right:4px;vertical-align:-2px"></span>';
  const z = '<span class="a6-dots">&nbsp;</span>';
  const zi = '<span class="a6-dots a6-dots-inline">&nbsp;</span>';
  const po = normalizeValue(values.PO) || z;
  const ma = normalizeValue(values.MA) || z;
  const kh = normalizeValue(values.KH) || z;
  const mauVai = normalizeValue(values.MAUVAI) || z;
  const kichVai = normalizeValue(values.KICHVAI) || z;
  const kichPhim = normalizeValue(values.KICHPHIM) || z;
  const sl = formatSoLuongDisplay(values.SL) || z;
  const ng = formatNgayGiao(values.NG) || z;
  const qrUrl = normalizeValue(values.QR);
  const qrBlock = qrUrl
    ? `<img src="${escapeHtmlAttr(qrUrl)}" alt="" width="118" style="max-width:118px;height:auto;display:block;margin:0 auto"/>`
    : `${z}`;
  const chuyen = normalizeValue(values.CHUYEN);
  const sxtu = normalizeValue(values.SXTU);
  const sxden = normalizeValue(values.SXDEN);
  const chuyenHtml = chuyen
    ? `<span class="a6-hdr-val">${escapeHtmlText(chuyen)}</span>`
    : z;
  const sxTuHtml = sxtu
    ? `<span class="a6-hdr-val">${escapeHtmlText(sxtu)}</span>`
    : '<span class="a6-dots a6-dots-inline">&nbsp;</span>';
  const sxDenHtml = sxden
    ? `<span class="a6-hdr-val">${escapeHtmlText(sxden)}</span>`
    : '<span class="a6-dots a6-dots-inline">&nbsp;</span>';

  const idWord = normalizeValue(values.ID);
  const wordMetaTop = idWord
    ? `<div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;font-size:9pt;margin:0 0 6px;font-weight:400;font-family:Cambria,'Times New Roman',serif"><span>${escapeHtmlText(idWord)}</span><span></span></div>`
    : "";

  const htmlRaw = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8" />
<style>
body{font-family:Cambria,"Times New Roman",serif;font-size:10pt;line-height:1.25;color:#000;margin:0.28in}
table{border-collapse:collapse;width:100%}
.a6g{border:1px solid #000}
.a6g td{border:none;border-bottom:1px solid #000;padding:4px 5px;vertical-align:bottom;font-size:8.25pt;min-width:0;box-sizing:border-box}
.a6g tr.a6-open:not(.a6-open-dots) td:not(.a6-open-stage){border-bottom:none!important}
.a6-open-stage{vertical-align:middle!important}
.a6-st-cb-line{display:inline-flex;align-items:center;white-space:nowrap}
.a6g tr:last-child td{border-bottom:none}
.a6g tr.nb td:not(.a6-ready-stage){border-bottom:none!important}
.a6-ready-blk td{font-size:9pt;border-bottom:none!important;vertical-align:middle!important}
.a6-ready-blk td.a6-ready-stage{border-bottom:1px solid #000!important}
.a6-ready-blk.a6-ready-dots td{vertical-align:bottom!important}
.a6-ready-end td{border-bottom:1px solid #000!important}
.a6g tr.a6-ready-vai td:nth-child(2),.a6g tr.a6-ready-vai td:nth-child(4){text-align:right!important}
.a6g tr.a6-ready-vai td:nth-child(3),.a6g tr.a6-ready-vai td:nth-child(5){text-align:left!important}
.a6g tr.a6-ready-vai td:nth-child(7){text-align:right!important}
.a6g tr.a6-ready-muc td:nth-child(1),.a6g tr.a6-ready-muc td:nth-child(3){text-align:right!important}
.a6g tr.a6-ready-muc td:nth-child(2),.a6g tr.a6-ready-muc td:nth-child(4){text-align:left!important}
.a6g tr.a6-ready-muc td:nth-child(6){text-align:right!important}
.a6g tr.a6-ready-stoprow td:nth-child(6){text-align:right!important}
.a6g tr.a6-rel1-row1 td.a6-rel1-lbl-r,.a6g tr.a6-trun-row1 td.a6-rel1-lbl-r,.a6g tr.a6-rel2-row1 td.a6-rel1-lbl-r,.a6g tr.a6-sx-row1 td.a6-rel1-lbl-r{text-align:right!important}
.a6g tr.a6-rel1-row2 td.a6-rel1-dot-l,.a6g tr.a6-trun-row2 td.a6-rel1-dot-l,.a6g tr.a6-rel2-row2 td.a6-rel1-dot-l,.a6g tr.a6-sx-row2 td.a6-rel1-dot-l{text-align:left!important}
.a6g tr.a6-rel1-row1 td:not([rowspan]),.a6g tr.a6-trun-row1 td:not([rowspan]),.a6g tr.a6-rel2-row1 td:not([rowspan]),.a6g tr.a6-sx-row1 td:not([rowspan]){border-bottom:none!important}
.a6g tr.a6-rel1-row1 td[rowspan],.a6g tr.a6-trun-row1 td[rowspan],.a6g tr.a6-rel2-row1 td[rowspan],.a6g tr.a6-sx-row1 td[rowspan]{border-bottom:1px solid #000!important;vertical-align:middle!important}
.a6g tr.a6-rel1-row2 td,.a6g tr.a6-rel2-row2 td,.a6g tr.a6-sx-row2 td{vertical-align:bottom!important}
.a6g tr.a6-trun-row2 td{vertical-align:bottom!important;border-bottom:none!important}
.fin tr.a6-fin-r1 td:not([rowspan]){border-bottom:none!important}
.fin tr.a6-fin-r1 td[rowspan]{border-bottom:none!important;vertical-align:middle!important}
.fin tr.a6-fin-r2 td{vertical-align:bottom!important;border-bottom:none!important}
.fin tr.a6-fin-r2 td.a6-rel1-dot-l{text-align:left!important}
.fin tr.a6-done-r1 td:not([rowspan]){border-bottom:none!important}
.fin tr.a6-done-r1 td[rowspan]{border-bottom:1px solid #000!important;vertical-align:middle!important}
.fin tr.a6-done-r2 td{vertical-align:bottom!important}
.fin tr.a6-done-r1 td.a6-rel1-lbl-r{text-align:right!important}
.fin tr.a6-done-r2 td.a6-rel1-dot-l{text-align:left!important}
.a6g tr.a6-open td{padding:2.5px 2px}
.a6g tr.a6-open-dots td{vertical-align:bottom!important}
.a6-open-gio{text-align:center;vertical-align:bottom}
.a6-dots{border-bottom:1px dotted #000;display:inline-block;min-width:120px;margin-left:4px;min-height:1em;box-sizing:border-box}
.a6-dots-cell .a6-dots,.fin td.a6-dots-cell .a6-dots,.a6g td.a6-dots-cell .a6-dots{min-width:0;width:100%;max-width:100%;margin-left:0;display:block}
.a6-dots-inline{min-width:0;max-width:100%;margin-left:4px;display:inline-block;vertical-align:baseline;box-sizing:border-box}
.a6g tr.a6-open-dots td .a6-dots{min-width:0;width:100%;max-width:100%;margin-left:0;display:block;box-sizing:border-box}
.a6g tr.a6-open-dots td:nth-child(10) .a6-dots,.a6g td.a6-col-11>.a6-dots:only-child{max-width:100%;margin-left:auto;margin-right:auto}
.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(2),.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(4),.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(7),.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(9){text-align:right}
.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(3),.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(5),.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(8),.a6g tr.a6-open:not(.a6-open-dots) td:nth-child(10){text-align:left}
.a6g tr.a6-open-dots td:nth-child(1),.a6g tr.a6-open-dots td:nth-child(3),.a6g tr.a6-open-dots td:nth-child(6),.a6g tr.a6-open-dots td:nth-child(8){text-align:right}
.a6g tr.a6-open-dots td:nth-child(2),.a6g tr.a6-open-dots td:nth-child(4),.a6g tr.a6-open-dots td:nth-child(7),.a6g tr.a6-open-dots td:nth-child(9){text-align:left}
.a6g tr.a6-open-dots td:nth-child(5),.a6g tr.a6-open-dots td:nth-child(10){text-align:center}
.a6lbl+td{min-width:0;max-width:100%;box-sizing:border-box}
.a6-col-11{padding:4px 4px!important;min-width:0;box-sizing:border-box}
.a6-cc{text-align:center}
.a6st{font-weight:700;width:calc(9% + 6px);box-sizing:border-box;vertical-align:middle!important}
.a6-ready-stage{padding-top:8px!important;padding-bottom:8px!important}
.a6lbl{font-size:8.25pt}
.a6sp{font-weight:700;text-align:center;width:4%;vertical-align:middle!important;font-size:8.25pt}
.fin{border:1px solid #000;margin:5px 0 8px;font-size:8.25pt}
.fin td{border:none;border-bottom:1px solid #000;padding:4px 5px;vertical-align:bottom;min-width:0;box-sizing:border-box}
.fin tr:last-child td{border-bottom:none}
.fin-qa{text-align:center;min-width:11em;vertical-align:middle!important}
.fin-tt{max-width:28%;padding-right:10px;box-sizing:border-box;vertical-align:middle!important}
.a6-fin-quan{vertical-align:middle!important;text-align:center;padding:4px 6px;box-sizing:border-box}
.fin-dots-tt{padding-left:18px!important;text-align:right!important;box-sizing:border-box}
.fin-line{white-space:nowrap}
.w{font-weight:700;text-align:left}
.a6-hdr{width:100%;border-collapse:collapse;margin-bottom:6px;font-size:9.5pt;table-layout:fixed}
.a6-hdr col.a6-hdr-col-qr{width:20%}
.a6-hdr col.a6-hdr-col-data{width:40%}
.a6-hdr td{padding:2px 8px 3px 0;vertical-align:top;border:none;box-sizing:border-box}
.a6-hdr td.a6-hdr-qr{padding-right:10px;text-align:center;vertical-align:top}
.a6-hdr-line{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:3px;min-width:0;word-wrap:break-word;overflow-wrap:break-word}
.a6-hdr-line .a6-hdr-lbl{flex:0 0 auto;white-space:nowrap;font-weight:400}
.a6-hdr-line .a6-hdr-val{flex:0 1 auto;margin-left:0;min-width:0;word-wrap:break-word;overflow-wrap:break-word;font-weight:700}
.a6-hdr-line .a6-dots{flex:1 1 0;min-width:0;margin-left:0;width:auto;max-width:100%;display:inline-block;vertical-align:baseline;box-sizing:border-box}
.a6-hdr-chuyen-cell .a6-hdr-line .a6-dots{flex:0 0 56px!important;width:56px!important;min-width:48px!important;max-width:64px!important}
.a6-hdr-sx-td{min-width:0;overflow:hidden}
.a6-hdr-sx-range{flex-wrap:nowrap!important;align-items:baseline!important;gap:3px;white-space:nowrap;font-size:9pt}
.a6-hdr-sx-range .a6-hdr-lbl{white-space:nowrap}
.a6-hdr-sx-range .a6-dots-inline{flex:0 0 52px!important;width:52px!important;min-width:44px!important;max-width:56px!important}
</style></head><body>${wordMetaTop}
<h1 style="text-align:center;font-size:14.5pt;margin:0 0 5px">THLA – A6 CARD (MÃ – PHẦN) – BẢN V3</h1>
<p style="text-align:center;margin:0 0 9px;font-size:9.5pt">(Chuẩn hóa checkpoint FINISH – Khóa Chất lượng + Số lượng + Trạng thái)</p>
<table class="a6-hdr"><colgroup><col class="a6-hdr-col-qr"/><col class="a6-hdr-col-data"/><col class="a6-hdr-col-data"/></colgroup>
<tr><td class="a6-hdr-qr" rowspan="5">${qrBlock}</td><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">PO:</span><span class="a6-hdr-val">${po}</span></span></td><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Mã hàng:</span><span class="a6-hdr-val">${ma}</span></span></td></tr>
<tr><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Màu vải:</span><span class="a6-hdr-val">${mauVai}</span></span></td><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Kích vải:</span><span class="a6-hdr-val">${kichVai}</span></span></td></tr>
<tr><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Kích phim:</span><span class="a6-hdr-val">${kichPhim}</span></span></td><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Số lượng:</span><span class="a6-hdr-val">${sl}</span></span></td></tr>
<tr><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Khách hàng:</span><span class="a6-hdr-val">${kh}</span></span></td><td><span class="a6-hdr-line"><span class="a6-hdr-lbl">Ngày giao:</span><span class="a6-hdr-val">${ng}</span></span></td></tr>
<tr><td class="a6-hdr-chuyen-cell"><span class="a6-hdr-line"><span class="a6-hdr-lbl">Chuyền:</span>${chuyenHtml}</span></td><td class="a6-hdr-sx-td"><span class="a6-hdr-line a6-hdr-sx-range"><span class="a6-hdr-lbl">Thời gian dự kiến SX: Từ</span>${sxTuHtml}<span class="a6-hdr-lbl"> đến </span>${sxDenHtml}</span></td></tr></table>

<p style="text-align:left;font-weight:700;margin:7px 0 6px;font-size:10.5pt">— CHECKPOINT —</p>
<table class="a6g">
<tr class="a6-open">
<td class="a6st a6-open-stage" rowspan="2"><span class="a6-st-cb-line">${chk} OPEN</span></td>
<td class="a6lbl">Sale ký</td><td></td>
<td class="a6lbl">KT ký</td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl">KT ký</td><td></td>
<td class="a6lbl">PGĐ ký</td><td></td>
<td class="a6-open-gio a6-col-11"><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6-open a6-open-dots">
<td></td><td><span class="a6-dots">&nbsp;</span></td><td></td><td><span class="a6-dots">&nbsp;</span></td><td></td><td></td><td><span class="a6-dots">&nbsp;</span></td><td></td><td><span class="a6-dots">&nbsp;</span></td><td class="a6-col-11"><span class="a6-dots">&nbsp;</span></td>
</tr>
<tr class="a6-ready-blk a6-ready-vai">
<td class="a6st a6-ready-stage" rowspan="6"><span class="a6-st-cb-line">${chk} READY</span></td>
<td class="a6lbl a6-cc" colspan="2">${chk} Vải OK &nbsp; Ký:</td>
<td class="a6-cc"></td>
<td class="a6lbl a6-cc" colspan="3">${chk} Khuôn OK &nbsp; Ký:</td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
<td class="a6lbl a6-cc">QA ký</td>
<td class="a6-cc"></td>
</tr>
<tr class="a6-ready-blk a6-ready-dots">
<td class="a6-cc" colspan="2"></td>
<td class="a6-dots-cell">${z}</td>
<td class="a6-cc" colspan="3"></td>
<td class="a6-dots-cell">${z}</td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
<td class="a6-dots-cell">${z}</td>
</tr>
<tr class="a6-ready-blk a6-ready-muc">
<td class="a6lbl a6-cc" colspan="2">${chk} Mực OK &nbsp; Ký:</td>
<td class="a6-cc"></td>
<td class="a6lbl" colspan="3">${chk} Mẫu duyệt OK &nbsp; Ký:</td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
</tr>
<tr class="a6-ready-blk a6-ready-dots">
<td class="a6-cc" colspan="2"></td>
<td class="a6-dots-cell">${z}</td>
<td class="a6-cc" colspan="3"></td>
<td class="a6-dots-cell">${z}</td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
<td class="a6-cc"></td>
</tr>
<tr class="a6-ready-blk a6-ready-stoprow">
<td></td><td></td><td></td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl a6-cc">QA ký</td>
<td></td><td></td><td></td>
<td class="a6-open-gio a6-col-11"><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6-ready-blk a6-ready-dots a6-ready-end">
<td></td><td></td><td></td><td></td><td></td><td></td>
<td class="a6-dots-cell">${z}</td>
<td></td><td></td>
<td class="a6-dots-cell a6-col-11">${z}</td>
</tr>
<tr class="a6-rel1-row1">
<td class="a6st" colspan="2" rowspan="2"><span class="a6-st-cb-line">${chk} RELEASE 1</span></td>
<td class="a6lbl a6-rel1-lbl-r">KH ký</td>
<td></td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl a6-rel1-lbl-r">QA ký</td>
<td></td><td></td><td></td>
<td class="a6-col-11 a6-open-gio"><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6-rel1-row2">
<td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td><td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td>
<td class="a6-dots-cell a6-col-11">${z}</td>
</tr>
<tr class="a6-trun-row1">
<td class="a6st" colspan="2" rowspan="3"><span class="a6-st-cb-line">${chk} TEST RUN</span></td>
<td class="a6lbl a6-rel1-lbl-r">QA ký</td>
<td></td><td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl a6-rel1-lbl-r">QA ký</td>
<td></td><td></td><td></td>
<td class="a6-col-11 a6-open-gio"><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6-trun-row2">
<td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td><td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td>
<td class="a6-dots-cell a6-col-11">${z}</td>
</tr>
<tr class="a6-trun-row3 a6kq">
<td class="a6lbl">Kết quả:</td>
<td class="a6-cc">${chk} OK</td>
<td class="a6-cc">${chk} FAIL</td>
<td></td><td></td><td></td><td></td><td></td><td></td>
</tr>
<tr class="a6-rel2-row1">
<td class="a6st" rowspan="2"><span class="a6-st-cb-line">${chk} RELEASE 2</span></td>
<td class="a6lbl a6-rel1-lbl-r">KH ký</td>
<td></td>
<td class="a6lbl a6-rel1-lbl-r">Tổ ký</td>
<td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl a6-rel1-lbl-r">QA ký</td>
<td></td><td></td><td></td>
<td class="a6-col-11 a6-open-gio"><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6-rel2-row2">
<td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td>
<td class="a6-dots-cell a6-col-11">${z}</td>
</tr>
<tr class="a6-sx-row1">
<td class="a6st" colspan="2" rowspan="2"><span class="a6-st-cb-line">${chk} SX (đang chạy)</span></td>
<td class="a6lbl a6-rel1-lbl-r" colspan="2">Tổ trưởng ký</td>
<td></td>
<td class="a6sp">STOP</td>
<td class="a6lbl a6-rel1-lbl-r">Tổ ký</td>
<td></td>
<td class="a6lbl a6-rel1-lbl-r">QA ký</td>
<td></td>
<td class="a6-col-11 a6-open-gio"><span style="font-size:7.5pt">Giờ STOP:</span></td>
</tr>
<tr class="a6-sx-row2">
<td colspan="2"></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td><td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td class="a6-dots-cell a6-col-11">${z}</td>
</tr>
</table>

<p style="text-align:left;font-weight:700;margin:7px 0 6px;font-size:10.5pt">— FINISH —</p>
<table class="fin">
<tr class="a6-fin-r1">
<td class="a6st" rowspan="2" style="width:calc(8% + 6px);box-sizing:border-box"><span class="a6-st-cb-line">${chk} FINISH</span></td>
<td class="fin-qa" colspan="2" rowspan="2"><span class="fin-line">QA ký</span><br/><span class="fin-line">(Đạt chất lượng)</span></td>
<td></td>
<td class="fin-tt" colspan="2" rowspan="2"><span class="fin-line">Tổ trưởng ký</span><br/><span class="fin-line">(Đủ số lượng Mã – Phần):</span></td>
<td></td>
<td colspan="2" class="a6-fin-quan" rowspan="2">Quản đốc xác nhận<br/>(Đã hoàn tất toàn bộ):</td>
<td></td><td></td>
</tr>
<tr class="a6-fin-r2">
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td>
</tr>
<tr class="w"><td colspan="11">=&gt; Thiếu 1 trong 3: KHÔNG ĐƯỢC FINISH</td></tr>
<tr class="a6-done-r1">
<td class="a6st" rowspan="2" style="width:calc(8% + 6px);box-sizing:border-box;font-weight:700"><span class="a6-st-cb-line">${chk} DONE</span></td>
<td class="a6lbl a6-rel1-lbl-r">Kho ký</td>
<td colspan="2"></td>
<td class="a6lbl a6-rel1-lbl-r">QA ký</td>
<td colspan="2"></td>
<td class="a6lbl a6-rel1-lbl-r">KT ký</td>
<td colspan="2"></td>
<td></td>
</tr>
<tr class="a6-done-r2">
<td></td>
<td colspan="2" class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td>
<td colspan="2" class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td>
<td colspan="2" class="a6-dots-cell a6-rel1-dot-l">${z}</td>
<td></td>
</tr>
</table>

<p style="font-weight:700;margin:8px 0 8px;font-size:10.5pt">— NGUYÊN TẮC —</p>
<p style="margin:0 0 4px;font-size:10.5pt;font-weight:bold;line-height:1.42"><strong>1. Không READY → không RELEASE</strong></p>
<p style="margin:0 0 4px;font-size:10.5pt;font-weight:bold;line-height:1.42"><strong>2. TEST RUN FAIL → không chạy</strong></p>
<p style="margin:0 0 4px;font-size:10.5pt;font-weight:bold;line-height:1.42"><strong>3. Không đạt chất lượng → không FINISH</strong></p>
<p style="margin:0 0 4px;font-size:10.5pt;font-weight:bold;line-height:1.42"><strong>4. Không đủ số lượng → không FINISH</strong></p>
<p style="margin:0;font-size:10.5pt;font-weight:bold;line-height:1.42"><strong>5. Ai ký → người đó chịu trách nhiệm</strong></p>
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
  const printStampElRef = useRef(null);

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
      fillA6PrintMeta(printStampElRef.current, queryValues.ID);
    };
    const onAfterPrint = () => {
      document.title = printTitleRef.current;
      clearA6PrintMeta(printStampElRef.current);
    };
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [queryValues.ID]);

  const data = useMemo(
    () => ({
      PO: normalizeValue(queryValues.PO),
      MA: normalizeValue(queryValues.MA),
      KH: normalizeValue(queryValues.KH),
      MAUVAI: normalizeValue(queryValues.MAUVAI),
      KICHVAI: normalizeValue(queryValues.KICHVAI),
      KICHPHIM: normalizeValue(queryValues.KICHPHIM),
      SL: formatSoLuongDisplay(queryValues.SL),
      NG: formatNgayGiao(queryValues.NG),
      QR: normalizeValue(queryValues.QR),
      ID: normalizeValue(queryValues.ID),
      CHUYEN: normalizeValue(queryValues.CHUYEN),
      SXTU: normalizeValue(queryValues.SXTU),
      SXDEN: normalizeValue(queryValues.SXDEN),
    }),
    [queryValues],
  );

  return (
    <div className={`${PRINT_ROOT_CLASS} min-h-screen bg-neutral-100 p-3`}>
      <div className="mx-auto max-w-6xl">
        <div className="print-hidden mb-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              applyPrintStyles();
              fillA6PrintMeta(printStampElRef.current, queryValues.ID);
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

        <div className={`${PRINT_PAGE_CLASS} ${DOC_CLASS} bg-white px-5 py-3 text-black shadow-sm`} lang="vi">
          <div ref={printStampElRef} className="a6-print-meta" aria-hidden="true">
            <span className="a6-print-id" />
            <span className="a6-print-time" />
          </div>
          <h1 className="a6-title">THLA – A6 CARD (MÃ – PHẦN) – BẢN V3</h1>
          <p className="a6-sub">
            (Chuẩn hóa checkpoint FINISH – Khóa Chất lượng + Số lượng + Trạng thái)
          </p>

          <table className="a6-hdr">
            <colgroup>
              <col className="a6-hdr-col-qr" />
              <col className="a6-hdr-col-data" />
              <col className="a6-hdr-col-data" />
            </colgroup>
            <tbody>
              <tr>
                <td className="a6-hdr-qr" rowSpan={5}>
                  {data.QR ? (
                    <img className="a6-hdr-qr-img" src={data.QR} alt="Mã QR" />
                  ) : (
                    <span className="a6-hdr-qr-placeholder">
                      <span className="a6-dots">&nbsp;</span>
                    </span>
                  )}
                </td>
                <HdrCell label="PO:" value={data.PO} />
                <HdrCell label="Mã hàng:" value={data.MA} />
              </tr>
              <tr>
                <HdrCell label="Màu vải:" value={data.MAUVAI} />
                <HdrCell label="Kích vải:" value={data.KICHVAI} />
              </tr>
              <tr>
                <HdrCell label="Kích phim:" value={data.KICHPHIM} />
                <HdrCell label="Số lượng:" value={data.SL} />
              </tr>
              <tr>
                <HdrCell label="Khách hàng:" value={data.KH} />
                <HdrCell label="Ngày giao:" value={data.NG} />
              </tr>
              <tr>
                <HdrCell label="Chuyền:" value={data.CHUYEN} tdClassName="a6-hdr-chuyen-cell" />
                <td className="a6-hdr-sx-td">
                  <span className="a6-hdr-line a6-hdr-sx-range">
                    <span className="a6-hdr-lbl">Thời gian dự kiến SX: Từ</span>
                    {data.SXTU ? (
                      <span className="a6-hdr-val">{data.SXTU}</span>
                    ) : (
                      <span className="a6-dots a6-dots-inline">&nbsp;</span>
                    )}
                    <span className="a6-hdr-lbl"> đến </span>
                    {data.SXDEN ? (
                      <span className="a6-hdr-val">{data.SXDEN}</span>
                    ) : (
                      <span className="a6-dots a6-dots-inline">&nbsp;</span>
                    )}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <p className="a6-cp-title">— CHECKPOINT —</p>

          <table className="a6-grid">
            <tbody>
              <tr className="a6-open">
                <td className="a6-st a6-open-stage" rowSpan={2}>
                  <span className="a6-st-cb-line">
                    <Cb /> OPEN
                  </span>
                </td>
                <td className="a6-lbl">Sale ký</td>
                <td />
                <td className="a6-lbl">KT ký</td>
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl">KT ký</td>
                <td />
                <td className="a6-lbl">PGĐ ký</td>
                <td />
                <td className="a6-open-gio a6-col-11">
                  <span className="a6-gio">Giờ STOP:</span>
                </td>
              </tr>
              <tr className="a6-open a6-open-dots">
                <td />
                <td>
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td />
                <td>
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td />
                <td />
                <td>
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td />
                <td>
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td className="a6-col-11">
                  <span className="a6-dots">&nbsp;</span>
                </td>
              </tr>
              <tr className="a6-ready-blk a6-ready-vai">
                <td className="a6-st a6-ready-stage" rowSpan={6}>
                  <span className="a6-st-cb-line">
                    <Cb /> READY
                  </span>
                </td>
                <td className="a6-lbl a6-cc" colSpan={2}>
                  <Cb /> Vải OK &nbsp; Ký:
                </td>
                <td className="a6-cc" />
                <td className="a6-lbl a6-cc" colSpan={3}>
                  <Cb /> Khuôn OK &nbsp; Ký:
                </td>
                <td className="a6-cc" />
                <td className="a6-cc" />
                <td className="a6-lbl a6-cc">QA ký</td>
                <td className="a6-cc" />
              </tr>
              <tr className="a6-ready-blk a6-ready-dots">
                <td className="a6-cc" colSpan={2} />
                <td className="a6-dots-cell">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td className="a6-cc" colSpan={3} />
                <td className="a6-dots-cell">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td className="a6-cc" />
                <td className="a6-cc" />
                <td className="a6-dots-cell">
                  <span className="a6-dots">&nbsp;</span>
                </td>
              </tr>
              <tr className="a6-ready-blk a6-ready-muc">
                <td className="a6-lbl a6-cc" colSpan={2}>
                  <Cb /> Mực OK &nbsp; Ký:
                </td>
                <td className="a6-cc" />
                <td className="a6-lbl" colSpan={3}>
                  <Cb /> Mẫu duyệt OK &nbsp; Ký:
                </td>
                <td className="a6-cc" />
                <td className="a6-cc" />
                <td className="a6-cc" />
                <td className="a6-cc" />
              </tr>
              <tr className="a6-ready-blk a6-ready-dots">
                <td className="a6-cc" colSpan={2} />
                <td className="a6-dots-cell">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td className="a6-cc" colSpan={3} />
                <td className="a6-dots-cell">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td className="a6-cc" />
                <td className="a6-cc" />
                <td className="a6-cc" />
              </tr>
              <tr className="a6-ready-blk a6-ready-stoprow">
                <td />
                <td />
                <td />
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl a6-cc">QA ký</td>
                <td />
                <td />
                <td />
                <td className="a6-open-gio a6-col-11">
                  <span className="a6-gio">Giờ STOP:</span>
                </td>
              </tr>
              <tr className="a6-ready-blk a6-ready-dots a6-ready-end">
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
                <DotsCell />
                <td />
                <td />
                <DotsCell className="a6-col-11" />
              </tr>
              <tr className="a6-rel1-row1">
                <td className="a6-st" colSpan={2} rowSpan={2}>
                  <span className="a6-st-cb-line">
                    <Cb /> RELEASE 1
                  </span>
                </td>
                <td className="a6-lbl a6-rel1-lbl-r">KH ký</td>
                <td />
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl a6-rel1-lbl-r">QA ký</td>
                <td />
                <td />
                <td />
                <td className="a6-col-11 a6-open-gio">
                  <span className="a6-gio">Giờ STOP:</span>
                </td>
              </tr>
              <tr className="a6-rel1-row2">
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <DotsCell className="a6-col-11" />
              </tr>
              <tr className="a6-trun-row1">
                <td className="a6-st" colSpan={2} rowSpan={3}>
                  <span className="a6-st-cb-line">
                    <Cb /> TEST RUN
                  </span>
                </td>
                <td className="a6-lbl a6-rel1-lbl-r">QA ký</td>
                <td />
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl a6-rel1-lbl-r">QA ký</td>
                <td />
                <td />
                <td />
                <td className="a6-col-11 a6-open-gio">
                  <span className="a6-gio">Giờ STOP:</span>
                </td>
              </tr>
              <tr className="a6-trun-row2">
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <DotsCell className="a6-col-11" />
              </tr>
              <tr className="a6-trun-row3 a6-kq">
                <td className="a6-lbl">Kết quả:</td>
                <td className="a6-cc">
                  <Cb /> OK
                </td>
                <td className="a6-cc">
                  <Cb /> FAIL
                </td>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
              </tr>
              <tr className="a6-rel2-row1">
                <td className="a6-st" rowSpan={2}>
                  <span className="a6-st-cb-line">
                    <Cb /> RELEASE 2
                  </span>
                </td>
                <td className="a6-lbl a6-rel1-lbl-r">KH ký</td>
                <td />
                <td className="a6-lbl a6-rel1-lbl-r">Tổ ký</td>
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl a6-rel1-lbl-r">QA ký</td>
                <td />
                <td />
                <td />
                <td className="a6-col-11 a6-open-gio">
                  <span className="a6-gio">Giờ STOP:</span>
                </td>
              </tr>
              <tr className="a6-rel2-row2">
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <DotsCell className="a6-col-11" />
              </tr>
              <tr className="a6-sx-row1">
                <td className="a6-st" colSpan={2} rowSpan={2}>
                  <span className="a6-st-cb-line">
                    <Cb /> SX (đang chạy)
                  </span>
                </td>
                <td className="a6-lbl a6-rel1-lbl-r" colSpan={2}>
                  Tổ trưởng ký
                </td>
                <td />
                <td className="a6-stop">STOP</td>
                <td className="a6-lbl a6-rel1-lbl-r">Tổ ký</td>
                <td />
                <td className="a6-lbl a6-rel1-lbl-r">QA ký</td>
                <td />
                <td className="a6-col-11 a6-open-gio">
                  <span className="a6-gio">Giờ STOP:</span>
                </td>
              </tr>
              <tr className="a6-sx-row2">
                <td colSpan={2} />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
                <DotsCell className="a6-rel1-dot-l" />
                <DotsCell className="a6-col-11" />
              </tr>
            </tbody>
          </table>

          <p className="a6-cp-title">— FINISH —</p>

          <table className="a6-finish-all">
            <tbody>
              <tr className="a6-fin-r1">
                <td className="a6-fin-h" rowSpan={2}>
                  <span className="a6-st-cb-line">
                    <Cb /> FINISH
                  </span>
                </td>
                <td className="a6-fin-qa" colSpan={2} rowSpan={2}>
                  <span className="a6-fin-lbl-line">QA ký</span>
                  <br />
                  <span className="a6-fin-lbl-line">(Đạt chất lượng)</span>
                </td>
                <td />
                <td className="a6-fin-to-truong" colSpan={2} rowSpan={2}>
                  <span className="a6-fin-lbl-line">Tổ trưởng ký</span>
                  <br />
                  <span className="a6-fin-lbl-line">(Đủ số lượng Mã – Phần):</span>
                </td>
                <td />
                <td className="a6-fin-quan" colSpan={2} rowSpan={2}>
                  Quản đốc xác nhận
                  <br />
                  (Đã hoàn tất toàn bộ):
                </td>
                <td />
                <td />
              </tr>
              <tr className="a6-fin-r2">
                <DotsCell className="a6-rel1-dot-l" />
                <DotsCell className="a6-rel1-dot-l" />
                <DotsCell className="a6-rel1-dot-l" />
                <td />
              </tr>
              <tr className="a6-warn-row">
                <td colSpan={11}>=&gt; Thiếu 1 trong 3: KHÔNG ĐƯỢC FINISH</td>
              </tr>
              <tr className="a6-done-r1">
                <td className="a6-fin-h" rowSpan={2}>
                  <span className="a6-st-cb-line">
                    <Cb /> DONE
                  </span>
                </td>
                <td className="a6-lbl a6-rel1-lbl-r">Kho ký</td>
                <td colSpan={2} />
                <td className="a6-lbl a6-rel1-lbl-r">QA ký</td>
                <td colSpan={2} />
                <td className="a6-lbl a6-rel1-lbl-r">KT ký</td>
                <td colSpan={2} />
                <td />
              </tr>
              <tr className="a6-done-r2">
                <td />
                <td colSpan={2} className="a6-dots-cell a6-rel1-dot-l">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td />
                <td colSpan={2} className="a6-dots-cell a6-rel1-dot-l">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td />
                <td colSpan={2} className="a6-dots-cell a6-rel1-dot-l">
                  <span className="a6-dots">&nbsp;</span>
                </td>
                <td />
              </tr>
            </tbody>
          </table>

          <p className="a6-rules-title">— NGUYÊN TẮC —</p>
          <div className="a6-rules">
            <p>
              <strong>1. Không READY → không RELEASE</strong>
            </p>
            <p>
              <strong>2. TEST RUN FAIL → không chạy</strong>
            </p>
            <p>
              <strong>3. Không đạt chất lượng → không FINISH</strong>
            </p>
            <p>
              <strong>4. Không đủ số lượng → không FINISH</strong>
            </p>
            <p>
              <strong>5. Ai ký → người đó chịu trách nhiệm</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default A6Card;
