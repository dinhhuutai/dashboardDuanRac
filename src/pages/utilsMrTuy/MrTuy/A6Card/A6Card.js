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
.${DOC_CLASS} .a6-hdr-pdf-wrap {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 6px;
}
.${DOC_CLASS} .a6-hdr-pdf {
  flex: 1 1 0;
  min-width: 0;
  table-layout: fixed;
}
.${DOC_CLASS} .a6-hdr-pdf td {
  width: 20%;
  vertical-align: top;
}
.${DOC_CLASS} .a6-hdr-pdf-qr {
  flex: 0 0 auto;
  text-align: center;
  max-width: 100px;
}
.${DOC_CLASS} .a6-hdr-pdf-qr .a6-hdr-qr-img {
  width: 88px;
  max-width: 88px;
}
.${DOC_CLASS} .a6-rules-tbl {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 10.5pt;
  font-weight: 700;
}
.${DOC_CLASS} .a6-rules-tbl td {
  border: none;
  padding: 2px 6px 3px 0;
  vertical-align: top;
  line-height: 1.35;
}
.${DOC_CLASS} .a6-rules-tbl td.a6-rules-tbl-h {
  white-space: nowrap;
  padding-right: 10px;
}
.${DOC_CLASS} .a6-grid col.a6-grid-col-st {
  width: 9%;
}
.${DOC_CLASS} .a6-grid col.a6-grid-col-d {
  width: 11.375%;
}
.${DOC_CLASS} .a6-pdf-lbl-r {
  text-align: right;
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
/* RELEASE 1 / 2 / SX — một hàng (mẫu PDF) */
.${DOC_CLASS} .a6-grid tr.a6-rel1-row1 > td.a6-st,
.${DOC_CLASS} .a6-grid tr.a6-rel2-row1 > td.a6-st,
.${DOC_CLASS} .a6-grid tr.a6-sx-row1 > td.a6-st {
  vertical-align: middle !important;
}
.${DOC_CLASS} .a6-grid tr.a6-rel1-row1 td.a6-rel1-lbl-r,
.${DOC_CLASS} .a6-grid tr.a6-trun-row1 td.a6-rel1-lbl-r,
.${DOC_CLASS} .a6-grid tr.a6-rel2-row1 td.a6-rel1-lbl-r,
.${DOC_CLASS} .a6-grid tr.a6-sx-row1 td.a6-rel1-lbl-r {
  text-align: right;
}
.${DOC_CLASS} .a6-grid td.a6-dots-cell.a6-rel1-dot-l {
  text-align: left;
}
/* TEST RUN — 2 hàng (cột stage rowspan 2 + Kết quả) */
.${DOC_CLASS} .a6-grid tr.a6-trun-row1 > td.a6-st[rowspan] {
  vertical-align: middle !important;
  border-bottom: 1px solid #000 !important;
}
.${DOC_CLASS} .a6-grid tr.a6-trun-row1 td:not([rowspan]) {
  border-bottom: none !important;
}
.${DOC_CLASS} .a6-grid tr.a6-trun-row3.a6-kq td {
  vertical-align: middle !important;
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
/* OPEN: nhãn dùng .a6-pdf-lbl-r; STOP giữa */
.${DOC_CLASS} .a6-grid tr.a6-open:not(.a6-open-dots) td:nth-child(6) {
  text-align: center;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(2),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(4),
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(7) {
  text-align: left;
}
.${DOC_CLASS} .a6-grid tr.a6-open-dots td:nth-child(5) {
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
.${DOC_CLASS} .a6-fin-k {
  text-align: center;
  vertical-align: middle !important;
  font-size: 8.25pt;
  font-weight: 700;
  padding: 4px 6px;
  box-sizing: border-box;
}
.${DOC_CLASS} .a6-rules-tbl strong {
  font-weight: 700 !important;
}
/* Bảng master 8 cột × 17 hàng (in một mặt A5 ngang) */
.${DOC_CLASS} .a6-master {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 8.75pt;
  margin: 0;
}
.${DOC_CLASS} .a6-master td {
  border: 1px solid #000;
  padding: 2px 4px;
  vertical-align: top;
  box-sizing: border-box;
}
/* Hàng 6, 8–12: chiều cao thấp (OPEN, Mẫu duyệt, RELEASE 1/2, TEST RUN, SX) */
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact td {
  padding-top: 0;
  padding-bottom: 0;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-st {
  line-height: 1.1;
  vertical-align: middle;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-sign.a6-m-sign-dotsb,
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-stopqa {
  padding: 1px 3px 0;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb-inner {
  gap: 0;
  min-height: 1.48em;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb-inner .a6-dots {
  min-height: 0.8em;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-stopqa .a6-m-sign-dotsb-inner {
  min-height: 1.38em;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-stopqa-stop {
  margin-bottom: 0;
}
/* Hàng 7 READY (Vải/Khuôn/Mực): cao hơn chút */
.${DOC_CLASS} .a6-master tr.a6-m-tr-ready-a td {
  padding-top: 5px;
  padding-bottom: 5px;
}
.${DOC_CLASS} .a6-master tr.a6-m-tr-ready-a .a6-m-sign-dotsb-inner,
.${DOC_CLASS} .a6-master tr.a6-m-tr-ready-a .a6-m-stopqa .a6-m-sign-dotsb-inner {
  min-height: 3.05em;
}
.${DOC_CLASS} .a6-master .a6-m-qr {
  text-align: center;
  vertical-align: middle;
  padding: 3px;
}
.${DOC_CLASS} .a6-master .a6-m-qr-img {
  display: block;
  max-width: 100%;
  width: 88px;
  height: auto;
  margin: 0 auto;
}
.${DOC_CLASS} .a6-master .a6-m-title {
  text-align: center;
  font-weight: 700;
  font-size: 11.5pt;
  vertical-align: middle;
  line-height: 1.2;
  padding: 3px 5px;
}
.${DOC_CLASS} .a6-master .a6-m-sub {
  text-align: center;
  font-size: 8.25pt;
  vertical-align: middle;
  line-height: 1.25;
  padding: 2px 5px;
}
.${DOC_CLASS} .a6-master .a6-m-st {
  font-weight: 700;
  vertical-align: middle;
  font-size: 8.5pt;
}
.${DOC_CLASS} .a6-master .a6-m-rules td {
  font-weight: 700;
  font-size: 8.25pt;
  vertical-align: top;
  line-height: 1.28;
}
/* Khối NGUYÊN TẮC: không kẻ ô giữa 2 cột và giữa các hàng */
.${DOC_CLASS} .a6-master tr.a6-m-rules td:first-child {
  border-right: none;
}
.${DOC_CLASS} .a6-master tr.a6-m-rules td:last-child {
  border-left: none;
}
.${DOC_CLASS} .a6-master tr.a6-m-rules ~ tr.a6-m-rules td {
  border-top: none;
}
.${DOC_CLASS} .a6-master tr.a6-m-rules:not(:last-child) td {
  border-bottom: none;
}
.${DOC_CLASS} .a6-master .a6-m-sign .a6-hdr-line .a6-dots,
.${DOC_CLASS} .a6-master .a6-m-stopqa .a6-hdr-line .a6-dots,
.${DOC_CLASS} .a6-master .a6-m-sign-dotsb-inner .a6-dots {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  display: block;
}
/* Nhãn trên, gạch chấm ký phía dưới */
.${DOC_CLASS} .a6-master .a6-m-sign.a6-m-sign-dotsb {
  vertical-align: bottom;
  padding: 3px 4px 2px;
}
.${DOC_CLASS} .a6-master .a6-m-sign-dotsb-inner {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 2.65em;
  gap: 2px;
}
.${DOC_CLASS} .a6-master .a6-m-sign-dotsb-lbl {
  flex: 0 0 auto;
  font-weight: 400;
  font-size: inherit;
  white-space: nowrap;
  line-height: 1.12;
}
.${DOC_CLASS} .a6-master .a6-m-sign-dotsb-inner .a6-dots {
  flex: 0 0 auto;
  min-height: 1em;
}
.${DOC_CLASS} .a6-master .a6-m-stopqa {
  vertical-align: bottom;
  padding: 3px 4px 2px;
}
.${DOC_CLASS} .a6-master .a6-m-stopqa .a6-m-sign-dotsb-inner {
  min-height: 2em;
}
.${DOC_CLASS} .a6-master .a6-m-stopqa-stop {
  text-align: center;
  margin-bottom: 1px;
}
.${DOC_CLASS} .a6-master .a6-m-field {
  font-size: 8.5pt;
}
.${DOC_CLASS} .a6-master .a6-m-sx-wrap {
  min-width: 0;
  overflow: hidden;
}
.${DOC_CLASS} .a6-master .a6-m-chuyen-cell {
  min-width: 0;
  vertical-align: middle;
}
.${DOC_CLASS} .a6-master .a6-m-chuyen-cell .a6-hdr-line {
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
}
.${DOC_CLASS} .a6-master .a6-m-chuyen-cell .a6-hdr-line .a6-dots {
  flex: 1 1 auto;
  min-width: 0;
}
.${DOC_CLASS} .a6-print-meta {
  display: none;
}
@media print {
  /* ~148×210 mm landscape; margin nhỏ để vừa 1 mặt */
  @page { size: A5 landscape; margin: 6mm; }
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
    max-width: 100% !important;
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
    gap: 4px;
    font-size: 7.25pt;
    margin: 0 0 2px;
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
  /* Nén nhẹ cho vừa khổ A5 ngang */
  .${DOC_CLASS} .a6-title {
    font-size: 12.5pt !important;
    margin: 0 0 3px !important;
  }
  .${DOC_CLASS} .a6-sub {
    font-size: 8.5pt !important;
    margin: 0 0 5px !important;
    line-height: 1.25 !important;
  }
  .${DOC_CLASS} .a6-hdr {
    margin-bottom: 4px !important;
    font-size: 8.75pt !important;
  }
  .${DOC_CLASS} .a6-hdr td {
    padding: 1px 5px 2px 0 !important;
  }
  .${DOC_CLASS} .a6-hdr-qr-img {
    width: 92px !important;
    max-width: 92px !important;
  }
  .${DOC_CLASS} .a6-cp-title {
    font-size: 9.25pt !important;
    margin: 3px 0 3px !important;
  }
  .${DOC_CLASS} .a6-grid {
    margin-bottom: 5px !important;
    font-size: 7.5pt !important;
  }
  .${DOC_CLASS} .a6-grid td {
    padding: 2px 3px !important;
  }
  .${DOC_CLASS} .a6-grid tr.a6-open td {
    padding: 2px 2px !important;
  }
  .${DOC_CLASS} .a6-grid td.a6-st.a6-ready-stage {
    padding-top: 5px !important;
    padding-bottom: 5px !important;
  }
  .${DOC_CLASS} .a6-st,
  .${DOC_CLASS} .a6-stop,
  .${DOC_CLASS} .a6-lbl {
    font-size: 7.5pt !important;
  }
  .${DOC_CLASS} .a6-grid tr.a6-ready-blk td {
    font-size: 8.25pt !important;
  }
  .${DOC_CLASS} .a6-dots-cell {
    font-size: 8pt !important;
  }
  .${DOC_CLASS} .a6-ktra td,
  .${DOC_CLASS} .a6-kq td {
    font-size: 8.25pt !important;
  }
  .${DOC_CLASS} .a6-finish-all {
    margin: 3px 0 5px !important;
    font-size: 7.5pt !important;
  }
  .${DOC_CLASS} .a6-finish-all td {
    padding: 2px 3px !important;
  }
  .${DOC_CLASS} .a6-rules-tbl {
    margin-top: 4px !important;
    font-size: 9pt !important;
  }
  .${DOC_CLASS} .a6-rules-tbl td {
    padding: 2px 6px 2px 0 !important;
    line-height: 1.32 !important;
  }
  .${DOC_CLASS} .a6-hdr-sx-range {
    font-size: 7pt !important;
    line-height: 1.15 !important;
  }
  .${DOC_CLASS} .a6-master {
    font-size: 7.1pt !important;
  }
  .${DOC_CLASS} .a6-master td {
    padding: 2px 2px !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-title {
    font-size: 9.25pt !important;
    padding: 3px 4px !important;
    line-height: 1.18 !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-sub {
    font-size: 7pt !important;
    padding: 2px 4px !important;
    line-height: 1.2 !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-st {
    font-size: 7.25pt !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-field,
  .${DOC_CLASS} .a6-master .a6-m-rules td {
    font-size: 7.25pt !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-qr {
    padding: 3px !important;
    vertical-align: middle !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-qr-img {
    width: 66px !important;
    max-width: 66px !important;
    max-height: 66px !important;
    object-fit: contain !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-sign.a6-m-sign-dotsb,
  .${DOC_CLASS} .a6-master .a6-m-stopqa {
    padding: 3px 2px 2px !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-sign-dotsb-inner,
  .${DOC_CLASS} .a6-master .a6-m-stopqa .a6-m-sign-dotsb-inner {
    min-height: 2.28em !important;
    gap: 0 !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-sign-dotsb-inner .a6-dots,
  .${DOC_CLASS} .a6-master .a6-m-stopqa .a6-m-sign-dotsb-inner .a6-dots {
    min-height: 1em !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-stopqa .a6-m-sign-dotsb-inner {
    min-height: 2.05em !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-stopqa-stop {
    margin-bottom: 0 !important;
    line-height: 1 !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact td {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-st {
    line-height: 1.1 !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb-inner {
    min-height: 1.48em !important;
    gap: 0 !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb-inner .a6-dots {
    min-height: 0.8em !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-stopqa .a6-m-sign-dotsb-inner {
    min-height: 1.42em !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-sign.a6-m-sign-dotsb,
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-stopqa {
    padding: 2px 2px 1px !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-compact .a6-m-stopqa-stop {
    margin-bottom: 0 !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-ready-a td {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }
  .${DOC_CLASS} .a6-master tr.a6-m-tr-ready-a .a6-m-sign-dotsb-inner,
  .${DOC_CLASS} .a6-master tr.a6-m-tr-ready-a .a6-m-stopqa .a6-m-sign-dotsb-inner {
    min-height: 2.65em !important;
  }
  .${DOC_CLASS} .a6-master .a6-m-rules td {
    font-size: 6.85pt !important;
    line-height: 1.26 !important;
    padding: 2px 2px !important;
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

/** Ô dữ liệu master (colspan + nhãn/giá trị hoặc children) */
function MasterLineTd({ colSpan = 1, label, value, children, className }) {
  const v = normalizeValue(value);
  return (
    <td colSpan={colSpan} className={["a6-m-field", className].filter(Boolean).join(" ")}>
      {children ?? (
        <span className="a6-hdr-line">
          <span className="a6-hdr-lbl">{label}</span>
          {v ? <span className="a6-hdr-val">{v}</span> : <span className="a6-dots">&nbsp;</span>}
        </span>
      )}
    </td>
  );
}

function MasterSignTd({ colSpan = 2, label, dotsBelow = false }) {
  if (dotsBelow) {
    return (
      <td colSpan={colSpan} className="a6-m-sign a6-m-sign-dotsb">
        <div className="a6-m-sign-dotsb-inner">
          <span className="a6-m-sign-dotsb-lbl">{label}</span>
          <span className="a6-dots">&nbsp;</span>
        </div>
      </td>
    );
  }
  return (
    <td colSpan={colSpan} className="a6-m-sign">
      <span className="a6-hdr-line">
        <span className="a6-hdr-lbl">{label}</span>
        <span className="a6-dots">&nbsp;</span>
      </span>
    </td>
  );
}

function MasterStopQaTd({ colSpan = 2 }) {
  return (
    <td colSpan={colSpan} className="a6-m-stopqa">
      <div className="a6-m-stopqa-stop">
        <span className="a6-stop">STOP</span>
      </div>
      <div className="a6-m-sign-dotsb-inner">
        <span className="a6-m-sign-dotsb-lbl">QA ký</span>
        <span className="a6-dots">&nbsp;</span>
      </div>
    </td>
  );
}

function exportA6CardWord(values) {
  const stamp = normalizeValue(values.PO) || new Date().toISOString().slice(0, 10);
  const chk =
    '<span style="display:inline-block;width:9px;height:9px;border:1px solid #000;margin-right:4px;vertical-align:-2px"></span>';
  const z = '<span class="a6-dots">&nbsp;</span>';
  const qrUrl = normalizeValue(values.QR);
  const qrBlock = qrUrl
    ? `<img src="${escapeHtmlAttr(qrUrl)}" alt="" width="66" style="max-width:66px;max-height:66px;height:auto;object-fit:contain;display:block;margin:0 auto"/>`
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
    ? `<div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px;font-size:7.25pt;margin:0 0 2px;font-weight:400;font-family:Cambria,'Times New Roman',serif"><span>${escapeHtmlText(idWord)}</span><span></span></div>`
    : "";

  const valSpan = (v) => (normalizeValue(v) ? `<span class="a6-hdr-val">${escapeHtmlText(String(v))}</span>` : z);
  const line2 = (lbl, v) =>
    `<span class="a6-hdr-line"><span class="a6-hdr-lbl">${lbl}</span>${valSpan(v)}</span>`;
  const signDotsBelow = (cs, lbl) =>
    `<td colspan="${cs}" class="a6-m-sign a6-m-sign-dotsb"><div class="a6-m-sign-dotsb-inner"><span class="a6-m-sign-dotsb-lbl">${escapeHtmlText(lbl)}</span>${z}</div></td>`;
  const stopQa = (cs) =>
    `<td colspan="${cs}" class="a6-m-stopqa"><div class="a6-m-stopqa-stop" style="text-align:center;margin-bottom:1px"><span class="a6-stop">STOP</span></div><div class="a6-m-sign-dotsb-inner"><span class="a6-m-sign-dotsb-lbl">QA ký</span>${z}</div></td>`;

  const htmlRaw = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8" />
<style>
body{font-family:Cambria,"Times New Roman",serif;font-size:7.1pt;line-height:1.18;color:#000;margin:6mm}
@page{size:A5 landscape;margin:6mm}
table{border-collapse:collapse;width:100%}
.a6-master{table-layout:fixed;border-collapse:collapse;width:100%;font-size:7.1pt}
.a6-master td{border:1px solid #000;padding:2px 2px;vertical-align:top;box-sizing:border-box}
.a6-m-qr{text-align:center;vertical-align:middle;padding:3px}
.a6-m-title{text-align:center;font-weight:700;font-size:9.25pt;vertical-align:middle;line-height:1.18;padding:3px 4px}
.a6-m-sub{text-align:center;font-size:7pt;vertical-align:middle;line-height:1.2;padding:2px 4px}
.a6-m-st{font-weight:700;vertical-align:middle;font-size:7.25pt}
.a6-m-rules td{font-weight:700;font-size:6.85pt;line-height:1.26;padding:2px 2px}
.a6-master tr.a6-m-rules td:first-child{border-right:none}
.a6-master tr.a6-m-rules td:last-child{border-left:none}
.a6-master tr.a6-m-rules~tr.a6-m-rules td{border-top:none}
.a6-master tr.a6-m-rules:not(:last-child) td{border-bottom:none}
.a6-m-stopqa-stop{text-align:center;margin-bottom:1px}
.a6-st-cb-line{display:inline-flex;align-items:center;white-space:nowrap}
.a6-stop{font-weight:700;text-align:center}
.a6-hdr-line{display:flex;flex-wrap:nowrap;align-items:flex-start;gap:3px;min-width:0}
.a6-hdr-line .a6-hdr-lbl{flex:0 0 auto;white-space:nowrap;font-weight:400}
.a6-hdr-line .a6-hdr-val{flex:0 1 auto;font-weight:700;min-width:0;word-wrap:break-word}
.a6-hdr-line .a6-dots{flex:1 1 0;min-width:0;margin-left:0;max-width:100%}
.a6-hdr-sx-range{flex-wrap:nowrap;align-items:baseline;gap:3px;white-space:nowrap;font-size:7pt;line-height:1.15}
.a6-m-sign .a6-hdr-line .a6-dots,.a6-m-stopqa .a6-hdr-line .a6-dots,.a6-m-sign-dotsb-inner .a6-dots{min-width:0;width:100%;max-width:100%;margin-left:0;display:block}
.a6-dots{border-bottom:1px dotted #000;display:inline-block;min-width:48px;margin-left:2px;min-height:1em;box-sizing:border-box}
.a6-dots-inline{min-width:36px;max-width:100%;margin-left:2px;display:inline-block}
.a6-m-sx-wrap{min-width:0;overflow:hidden}
.a6-m-chuyen-cell{min-width:0;vertical-align:middle}
.a6-m-chuyen-cell .a6-hdr-line{flex-wrap:wrap;align-items:center;gap:2px}
.a6-m-chuyen-cell .a6-hdr-line .a6-dots{flex:1 1 auto;min-width:0}
.a6-m-sign-dotsb{vertical-align:bottom;padding:3px 2px 2px!important}
.a6-m-sign-dotsb-inner{display:flex;flex-direction:column;justify-content:flex-end;min-height:2.28em;gap:0}
.a6-m-sign-dotsb-lbl{font-weight:400;white-space:nowrap;font-size:7.25pt;line-height:1.1}
.a6-m-sign-dotsb-inner .a6-dots{margin-left:0!important;min-width:0!important;width:100%!important;display:block!important;flex:0 0 auto;min-height:1em}
.a6-m-stopqa{vertical-align:bottom;padding:3px 2px 2px!important}
.a6-m-stopqa .a6-m-sign-dotsb-inner{min-height:2.05em}
.a6-master tr.a6-m-tr-compact td{padding-top:0!important;padding-bottom:0!important}
.a6-master tr.a6-m-tr-compact .a6-m-st{line-height:1.1;vertical-align:middle}
.a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb-inner{min-height:1.48em!important;gap:0!important}
.a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb-inner .a6-dots{min-height:0.8em!important}
.a6-master tr.a6-m-tr-compact .a6-m-stopqa .a6-m-sign-dotsb-inner{min-height:1.42em!important}
.a6-master tr.a6-m-tr-compact .a6-m-sign-dotsb,.a6-master tr.a6-m-tr-compact .a6-m-stopqa{padding:2px 2px 1px!important}
.a6-master tr.a6-m-tr-compact .a6-m-stopqa-stop{margin-bottom:0!important}
.a6-master tr.a6-m-tr-ready-a td{padding-top:4px!important;padding-bottom:4px!important}
.a6-master tr.a6-m-tr-ready-a .a6-m-sign-dotsb-inner,.a6-master tr.a6-m-tr-ready-a .a6-m-stopqa .a6-m-sign-dotsb-inner{min-height:2.65em!important}
</style></head><body>${wordMetaTop}
<table class="a6-master">
<tr><td rowspan="4" colspan="2" class="a6-m-qr">${qrBlock}</td><td colspan="6" class="a6-m-title">THLA – A6 CARD (MÃ – PHẦN) – BẢN V3</td></tr>
<tr><td colspan="6" class="a6-m-sub">(Chuẩn hóa checkpoint FINISH – Khóa Chất lượng + Số lượng + Trạng thái)</td></tr>
<tr><td colspan="2" class="a6-m-field">${line2("PO:", values.PO)}</td><td colspan="2" class="a6-m-field">${line2("Mã hàng:", values.MA)}</td><td colspan="2" class="a6-m-field">${line2("Khách hàng:", values.KH)}</td></tr>
<tr><td colspan="2" class="a6-m-field">${line2("Màu vải:", values.MAUVAI)}</td><td colspan="2" class="a6-m-field">${line2("Kích vải:", values.KICHVAI)}</td><td colspan="2" class="a6-m-field">${line2("Kích phim:", values.KICHPHIM)}</td></tr>
<tr><td colspan="2" class="a6-m-field">${line2("Số lượng:", formatSoLuongDisplay(values.SL))}</td><td colspan="2" class="a6-m-field">${line2("Ngày giao:", formatNgayGiao(values.NG))}</td><td colspan="1" class="a6-m-field a6-m-chuyen-cell"><span class="a6-hdr-line"><span class="a6-hdr-lbl">Chuyền:</span>${chuyenHtml}</span></td><td colspan="3" class="a6-m-field a6-m-sx-wrap"><span class="a6-hdr-line a6-hdr-sx-range"><span class="a6-hdr-lbl">Thời gian dự kiến SX: Từ</span>${sxTuHtml}<span class="a6-hdr-lbl"> đến </span>${sxDenHtml}</span></td></tr>
<tr class="a6-m-tr-open a6-m-tr-compact"><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} OPEN</span></td>${signDotsBelow(2, "Sale ký")}${signDotsBelow(2, "Tài chính ký")}${stopQa(2)}</tr>
<tr class="a6-m-tr-ready-a"><td rowspan="2" colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} READY</span></td>${signDotsBelow(2, "Vải ký")}${signDotsBelow(2, "Khuôn ký")}${signDotsBelow(2, "Mực ký")}</tr>
<tr class="a6-m-tr-ready-b a6-m-tr-compact">${signDotsBelow(2, "Mẫu duyệt ký")}${signDotsBelow(2, "QA ký")}${stopQa(2)}</tr>
<tr class="a6-m-tr-compact"><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} RELEASE 1</span></td>${signDotsBelow(3, "Kế hoạch ký")}${stopQa(3)}</tr>
<tr class="a6-m-tr-compact"><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} TEST RUN</span></td>${signDotsBelow(2, "CNSP ký")}${signDotsBelow(2, "QA ký")}${stopQa(2)}</tr>
<tr class="a6-m-tr-compact"><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} RELEASE 2</span></td>${signDotsBelow(3, "Kế hoạch ký")}${stopQa(3)}</tr>
<tr class="a6-m-tr-compact"><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} SX</span></td>${signDotsBelow(3, "Tổ trưởng ký")}${stopQa(3)}</tr>
<tr><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} FINISH</span></td>${signDotsBelow(2, "QA ký")}${signDotsBelow(2, "Tổ trưởng ký")}${signDotsBelow(2, "Quản đốc ký")}</tr>
<tr><td colspan="2" class="a6-m-st"><span class="a6-st-cb-line">${chk} DONE</span></td>${signDotsBelow(2, "Kho ký")}${signDotsBelow(2, "Sale ký")}${signDotsBelow(2, "Kế toán ký")}</tr>
<tr class="a6-m-rules"><td colspan="4">NGUYÊN TẮC</td><td colspan="4"><strong>3. Không đạt chất lượng → không FINISH</strong></td></tr>
<tr class="a6-m-rules"><td colspan="4"><strong>1. Không READY → không RELEASE</strong></td><td colspan="4"><strong>4. Không đủ số lượng → không FINISH</strong></td></tr>
<tr class="a6-m-rules"><td colspan="4"><strong>2. TEST RUN FAIL → không chạy</strong></td><td colspan="4"><strong>5. Ai ký → người đó chịu trách nhiệm</strong></td></tr>
</table>
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
      <div className="mx-auto w-full max-w-[210mm]">
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
            In A5 ngang
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
          <table className="a6-master" lang="vi">
            <tbody>
              <tr>
                <td rowSpan={4} colSpan={2} className="a6-m-qr">
                  {data.QR ? (
                    <img className="a6-m-qr-img" src={data.QR} alt="" />
                  ) : (
                    <span className="a6-dots">&nbsp;</span>
                  )}
                </td>
                <td colSpan={6} className="a6-m-title">
                  THLA – A6 CARD (MÃ – PHẦN) – BẢN V3
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="a6-m-sub">
                  (Chuẩn hóa checkpoint FINISH – Khóa Chất lượng + Số lượng + Trạng thái)
                </td>
              </tr>
              <tr>
                <MasterLineTd colSpan={2} label="PO:" value={data.PO} />
                <MasterLineTd colSpan={2} label="Mã hàng:" value={data.MA} />
                <MasterLineTd colSpan={2} label="Khách hàng:" value={data.KH} />
              </tr>
              <tr>
                <MasterLineTd colSpan={2} label="Màu vải:" value={data.MAUVAI} />
                <MasterLineTd colSpan={2} label="Kích vải:" value={data.KICHVAI} />
                <MasterLineTd colSpan={2} label="Kích phim:" value={data.KICHPHIM} />
              </tr>
              <tr>
                <MasterLineTd colSpan={2} label="Số lượng:" value={data.SL} />
                <MasterLineTd colSpan={2} label="Ngày giao:" value={data.NG} />
                <MasterLineTd colSpan={1} className="a6-m-chuyen-cell" label="Chuyền:" value={data.CHUYEN} />
                <td colSpan={3} className="a6-m-field a6-m-sx-wrap">
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
              <tr className="a6-m-tr-open a6-m-tr-compact">
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> OPEN
                  </span>
                </td>
                <MasterSignTd label="Sale ký" dotsBelow />
                <MasterSignTd label="Tài chính ký" dotsBelow />
                <MasterStopQaTd />
              </tr>
              <tr className="a6-m-tr-ready-a">
                <td rowSpan={2} colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> READY
                  </span>
                </td>
                <MasterSignTd label="Vải ký" dotsBelow />
                <MasterSignTd label="Khuôn ký" dotsBelow />
                <MasterSignTd label="Mực ký" dotsBelow />
              </tr>
              <tr className="a6-m-tr-ready-b a6-m-tr-compact">
                <MasterSignTd colSpan={2} label="Mẫu duyệt ký" dotsBelow />
                <MasterSignTd colSpan={2} label="QA ký" dotsBelow />
                <MasterStopQaTd colSpan={2} />
              </tr>
              <tr className="a6-m-tr-compact">
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> RELEASE 1
                  </span>
                </td>
                <MasterSignTd colSpan={3} label="Kế hoạch ký" dotsBelow />
                <MasterStopQaTd colSpan={3} />
              </tr>
              <tr className="a6-m-tr-compact">
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> TEST RUN
                  </span>
                </td>
                <MasterSignTd label="CNSP ký" dotsBelow />
                <MasterSignTd label="QA ký" dotsBelow />
                <MasterStopQaTd />
              </tr>
              <tr className="a6-m-tr-compact">
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> RELEASE 2
                  </span>
                </td>
                <MasterSignTd colSpan={3} label="Kế hoạch ký" dotsBelow />
                <MasterStopQaTd colSpan={3} />
              </tr>
              <tr className="a6-m-tr-compact">
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> SX
                  </span>
                </td>
                <MasterSignTd colSpan={3} label="Tổ trưởng ký" dotsBelow />
                <MasterStopQaTd colSpan={3} />
              </tr>
              <tr>
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> FINISH
                  </span>
                </td>
                <MasterSignTd label="QA ký" dotsBelow />
                <MasterSignTd label="Tổ trưởng ký" dotsBelow />
                <MasterSignTd label="Quản đốc ký" dotsBelow />
              </tr>
              <tr>
                <td colSpan={2} className="a6-m-st">
                  <span className="a6-st-cb-line">
                    <Cb /> DONE
                  </span>
                </td>
                <MasterSignTd label="Kho ký" dotsBelow />
                <MasterSignTd label="Sale ký" dotsBelow />
                <MasterSignTd label="Kế toán ký" dotsBelow />
              </tr>
              <tr className="a6-m-rules">
                <td colSpan={4}>NGUYÊN TẮC</td>
                <td colSpan={4}>
                  <strong>3. Không đạt chất lượng → không FINISH</strong>
                </td>
              </tr>
              <tr className="a6-m-rules">
                <td colSpan={4}>
                  <strong>1. Không READY → không RELEASE</strong>
                </td>
                <td colSpan={4}>
                  <strong>4. Không đủ số lượng → không FINISH</strong>
                </td>
              </tr>
              <tr className="a6-m-rules">
                <td colSpan={4}>
                  <strong>2. TEST RUN FAIL → không chạy</strong>
                </td>
                <td colSpan={4}>
                  <strong>5. Ai ký → người đó chịu trách nhiệm</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default A6Card;
