import React, { Component, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BASE_URL, BASE_URL_SERVER_THLA } from "~/config";

/** Skip huge data: QR strings to avoid freezing low-end devices. */
const MAX_QR_DATA_URL_CHARS = 2_500_000;

const BORDER = {
  top: { style: "thin", color: { argb: "FFA3A3A3" } },
  left: { style: "thin", color: { argb: "FFA3A3A3" } },
  bottom: { style: "thin", color: { argb: "FFA3A3A3" } },
  right: { style: "thin", color: { argb: "FFA3A3A3" } },
};

function applyBorder(cell) {
  cell.border = BORDER;
}

/** Chiều ngang cột Excel A–D (đơn vị như hộp thoại Độ rộng cột Excel). */
const EXCEL_COL_WIDTHS = Object.freeze([33.22, 27.56, 57.22, 31.67]);

/** Chiều cao hàng Excel 1–15 (point). */
const EXCEL_ROW_HEIGHTS = Object.freeze([
  34.2, 27.6, 30.6, 99, 108.6, 82.8, 20.4, 30.5, 30.5, 30.5, 30.5, 22.2, 23.4,
  23.4, 23.4,
]);

/** Ảnh QR — giao diện web + in trình duyệt (inch). */
const QR_IMAGE_WEB_IN = Object.freeze({ w: 3.5, h: 3.75 });

/** Ảnh QR — xuất Excel (inch). */
const QR_IMAGE_EXCEL_IN = Object.freeze({ w: 4.3, h: 3.75 });

/** Lệch dọc neo ảnh (inch): web + Excel. */
const QR_ANCHOR_TOP_IN = 0.05;

/** 96 px/in — ExcelJS `ext` dùng pixel logic 96 DPI. */
const EXCEL_IMAGE_DPI = 96;

/** EMU / inch — DrawingML cho colOff / rowOff. */
const EMU_PER_INCH = 914400;

/** ~1 CSS px @96dpi → EMU (cùng quy ước ExcelJS ext-xform). */
const EMU_PER_CSS_PX = 9525;

/** Viền ô QR (px) — bù khi neo ảnh (Excel). */
const QR_CELL_BORDER_PX = 1;

/** Giao diện / in trình duyệt: cách viền trái ô QR (px). */
const QR_WEB_QR_INSET_LEFT_PX = 0;

/** Excel: cách viền trái (px @96dpi → EMU trong qrExcelAnchorOffsetsEmu). */
const QR_EXCEL_INSET_LEFT_PX = 2;

const EXCEL_COL_WIDTH_SUM = EXCEL_COL_WIDTHS.reduce((a, b) => a + b, 0);

function qrExcelAnchorOffsetsEmu() {
  const borderEmu = EMU_PER_CSS_PX * QR_CELL_BORDER_PX;
  return {
    nativeColOff: QR_EXCEL_INSET_LEFT_PX * EMU_PER_CSS_PX + borderEmu,
    nativeRowOff:
      Math.round(QR_ANCHOR_TOP_IN * EMU_PER_INCH) + borderEmu,
  };
}

const PRINT_PAGE_STYLE_ID = "the-san-xuat-ma-phan-print-page";

/** Injected print rules: khổ A5 ngang, bố cục khớp Excel. */
const PRINT_SHEET_CLASS = "the-san-xuat-ma-phan-a5-sheet";

/** Lề trang khi in (inch) — giống Excel pageSetup margins ~0.2. */
const PRINT_MARGIN_IN = 0.2;

/**
 * Zoom để khối thẻ vừa một trang A5 ngang (210×148 mm, trừ lề).
 */
function computeA5LandscapePrintZoom(sheetEl) {
  if (!sheetEl) return 1;
  const pageWIn = 210 / 25.4 - 2 * PRINT_MARGIN_IN;
  const pageHIn = 148 / 25.4 - 2 * PRINT_MARGIN_IN;
  const wPx = sheetEl.offsetWidth;
  const hPx = sheetEl.offsetHeight;
  if (wPx <= 0 || hPx <= 0) return 1;
  const wIn = wPx / 96;
  const hIn = hPx / 96;
  const raw = Math.min(pageWIn / wIn, pageHIn / hIn);
  // Thêm hệ số an toàn mạnh hơn để không tràn sang trang 2.
  const s = Math.min(raw * 0.84, 1);
  return Number.isFinite(s) && s > 0 ? s : 1;
}

function applyA5PrintStyles() {
  let el = document.getElementById(PRINT_PAGE_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = PRINT_PAGE_STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = `@media print {
  @page {
    size: A5 landscape;
    margin: ${PRINT_MARGIN_IN}in;
  }
  html, body {
    height: auto !important;
    overflow: visible !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .${PRINT_SHEET_CLASS} {
    box-sizing: border-box;
    width: 100% !important;
    max-width: none !important;
    margin-left: auto !important;
    margin-right: auto !important;
    font-size: ${EXCEL_PT_READ_VALUE}pt !important;
    line-height: 1.25 !important;
    color: #000 !important;
  }
  .${PRINT_SHEET_CLASS} table {
    font-size: inherit !important;
    color: #000 !important;
  }
  .${PRINT_SHEET_CLASS} h1 {
    font-size: ${EXCEL_PT_TITLE_MAIN}pt !important;
    line-height: 1.2 !important;
    padding: 0.5rem 0.75rem !important;
    color: #000 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-td {
    padding: 0.5rem !important;
    min-height: 0 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-readcell {
    min-height: 0 !important;
    gap: 0.25rem 0.5rem !important;
    padding-top: 0.25rem !important;
    padding-bottom: 0.25rem !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-readcell-label {
    font-size: ${EXCEL_PT_READ_LABEL}pt !important;
    color: #000 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-readcell-value {
    font-size: ${EXCEL_PT_READ_VALUE}pt !important;
    line-height: 1.25 !important;
    color: #000 !important;
    font-weight: 700 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-qr-cell {
    position: relative !important;
    overflow: visible !important;
    min-height: 0 !important;
    padding: 0 !important;
    vertical-align: top !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-qr-anchor {
    position: absolute !important;
    top: calc(${QR_ANCHOR_TOP_IN}in + ${QR_CELL_BORDER_PX}px) !important;
    left: ${QR_EXCEL_INSET_LEFT_PX}px !important;
    line-height: 0 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-qr-img {
    display: block !important;
    width: ${QR_IMAGE_EXCEL_IN.w}in !important;
    height: ${QR_IMAGE_EXCEL_IN.h}in !important;
    max-width: ${QR_IMAGE_EXCEL_IN.w}in !important;
    max-height: ${QR_IMAGE_EXCEL_IN.h}in !important;
    margin: 0 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-ready-hdr {
    padding: 0.4rem 0.5rem !important;
    font-size: ${EXCEL_PT_SECTION}pt !important;
    color: #000 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-warning {
    padding: 0.4rem 0.5rem !important;
    font-size: ${EXCEL_PT_TITLE_MAIN - 1}pt !important;
    color: #000 !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-check-row input {
    width: 0.75rem !important;
    height: 0.75rem !important;
  }
  .${PRINT_SHEET_CLASS} .a5-print-check-row span {
    font-size: ${EXCEL_PT_SECTION}pt !important;
    font-weight: 700 !important;
    color: #000 !important;
  }
}`;
}

function searchParamsToValues(searchParams) {
  const out = {};
  searchParams.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

/**
 * Normalize QR query param for <img src>. When building links use
 * `QR=${encodeURIComponent(imageUrl)}` so &, ?, + and base64 do not break parsing.
 */
function qrParamToImageSrc(raw) {
  try {
    if (raw == null) return "";
    let s = String(raw).trim();
    if (!s) return "";
    if (/^data:image\//i.test(s) && s.length > MAX_QR_DATA_URL_CHARS) {
      return "";
    }

    try {
      s = decodeURIComponent(s);
    } catch {
      /* keep raw string if decode fails */
    }

    if (/^data:image\/[^;]+;base64,/i.test(s)) {
      s = s.replace(/\s/g, "+");
    }

    let href;
    try {
      href = new URL(s, window.location.href).href;
    } catch {
      return "";
    }

    const proto = new URL(href).protocol.toLowerCase();
    if (
      proto !== "http:" &&
      proto !== "https:" &&
      proto !== "data:" &&
      proto !== "blob:"
    ) {
      return "";
    }
    return href;
  } catch {
    return "";
  }
}

/** Giá trị query được coi là ô đánh dấu được chọn (in / QR link). */
function isQueryTruthy(raw) {
  if (raw == null) return false;
  const s = String(raw).trim().toLowerCase();
  return (
    s === "1" ||
    s === "true" ||
    s === "x" ||
    s === "yes" ||
    s === "on" ||
    s === "c\u00f3"
  );
}

function excelCheckMark(val) {
  return isQueryTruthy(val) ? "\u2611" : "\u2610";
}

/**
 * Parse chuỗi số (thuần số, hoặc dạng VN 1.234 / 1.234,56).
 */
function parseLocaleNumberString(t) {
  const s = String(t).trim();
  if (!s) return NaN;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  const vn = s.match(/^(-?)(\d{1,3}(?:\.\d{3})*)(?:,(\d+))?$/);
  if (vn) {
    const neg = vn[1] === "-" ? -1 : 1;
    const intPart = vn[2].replace(/\./g, "");
    const frac = vn[3];
    const n = frac
      ? parseFloat(`${intPart}.${frac}`)
      : parseInt(intPart, 10);
    return neg * n;
  }
  if (/^-?\d+[.,]\d+$/.test(s)) {
    return parseFloat(s.replace(",", "."));
  }
  return NaN;
}

/**
 * Số hiển thị: dấu chấm ngăn cách hàng nghìn (vi-VN); không đổi chuỗi không phải số.
 */
function formatNumberThousandsDot(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const n = parseLocaleNumberString(s);
  if (!Number.isFinite(n)) return s;
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 10 }).format(n);
}

/** S\u1ed1 l\u01b0\u1ee3ng: th\xEAm \u201c PCS\u201d sau gi\xE1 tr\u1ecb (tr\xE1nh l\u1eb7p n\u1ebfu \u0111\xE3 c\xF3). */
function formatSlWithPcs(raw) {
  if (raw == null) return "";
  let s = String(raw).trim();
  if (!s) return "";
  const hasPcs = /\bpcs\s*$/i.test(s);
  if (hasPcs) {
    s = s.replace(/\s*pcs\s*$/i, "").trim();
  }
  const formatted = formatNumberThousandsDot(s);
  const out = hasPcs ? `${formatted} PCS` : formatted;
  return out || String(raw).trim();
}

/** Màu chữ Excel — đen thuần (ARGB). */
const EXCEL_FONT_BLACK = Object.freeze({ argb: "FF000000" });

/** Tiêu đề lớn (hàng 1). */
const EXCEL_PT_TITLE_MAIN = 22;
/** Nhãn ô đọc — đậm. */
const EXCEL_PT_READ_LABEL = 17;
/** Nội dung ô đọc — đậm, cùng cỡ tiêu đề chính. */
const EXCEL_PT_READ_VALUE = EXCEL_PT_TITLE_MAIN;
/** READY / dòng tick — đậm, cùng cỡ nội dung ô đọc. */
const EXCEL_PT_SECTION = EXCEL_PT_READ_VALUE;

function excelReadCellRich(label, valueText) {
  const val = valueText ?? "";
  return {
    richText: [
      {
        font: {
          bold: true,
          size: EXCEL_PT_READ_LABEL,
          name: "Calibri",
          color: EXCEL_FONT_BLACK,
        },
        text: `${label}: `,
      },
      {
        font: {
          bold: true,
          size: EXCEL_PT_READ_VALUE,
          name: "Calibri",
          color: EXCEL_FONT_BLACK,
        },
        text: val,
      },
    ],
  };
}

function uint8ToRawBase64(u8) {
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      u8.subarray(i, Math.min(i + chunk, u8.length)),
    );
  }
  return btoa(binary);
}

const QR_PROXY_PATH = "/api/public/proxy-image";

/** Same-origin API proxy (server fetches image — no browser CORS). */
function qrImageProxyFetchCandidates(href) {
  const list = [];
  const add = (u) => {
    if (typeof u === "string" && u.length > 0 && !list.includes(u)) list.push(u);
  };
  const rawBases = [
    BASE_URL,
    BASE_URL_SERVER_THLA,
    typeof window !== "undefined" ? window.location.origin : "",
  ];
  const bases = [
    ...new Set(
      rawBases
        .filter((b) => b != null && String(b).trim().length > 0)
        .map((b) => String(b).replace(/\/$/, "")),
    ),
  ];
  for (const base of bases) {
    add(`${base}${QR_PROXY_PATH}?url=${encodeURIComponent(href)}`);
  }
  return list;
}

/** Same image path on BASE_URL / BASE_URL_SERVER_THLA (helps when public API blocks CORS). */
function qrImageFetchCandidates(href) {
  const list = [];
  const add = (u) => {
    if (typeof u === "string" && u.length > 0 && !list.includes(u)) list.push(u);
  };
  add(href);
  try {
    const u = new URL(href);
    if (u.protocol !== "http:" && u.protocol !== "https:") return list;
    const pathQs = `${u.pathname}${u.search}`;
    const bases = [BASE_URL, BASE_URL_SERVER_THLA].filter(
      (b) => b != null && String(b).trim().length > 0,
    );
    for (const b of bases) {
      const base = String(b).replace(/\/$/, "");
      add(new URL(pathQs, `${base}/`).href);
    }
  } catch {
    /* ignore */
  }
  return list;
}

/** URLs to try for <img src>: proxy first (stable same-origin), then direct / alternate bases. */
function qrImageDisplaySrcCandidates(href) {
  if (!href) return [];
  if (href.startsWith("data:") || href.startsWith("blob:")) return [href];
  if (href.startsWith("http://") || href.startsWith("https://")) {
    const list = [];
    const add = (u) => {
      if (typeof u === "string" && u.length > 0 && !list.includes(u)) list.push(u);
    };
    for (const u of qrImageProxyFetchCandidates(href)) add(u);
    for (const u of qrImageFetchCandidates(href)) add(u);
    return list;
  }
  return [href];
}

async function tryFetchImageBytes(url) {
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    if (!ab.byteLength) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (ct.includes("webp")) return null;
    const finalUrl = (res.url || url).toLowerCase();
    let ext = "png";
    if (ct.includes("jpeg") || ct.includes("jpg")) ext = "jpeg";
    else if (ct.includes("gif")) ext = "gif";
    else if (ct.includes("png")) ext = "png";
    else {
      if (/\.jpe?g(\?|$)/.test(finalUrl)) ext = "jpeg";
      else if (/\.gif(\?|$)/.test(finalUrl)) ext = "gif";
      else if (/\.png(\?|$)/.test(finalUrl)) ext = "png";
    }
    return { buffer: new Uint8Array(ab), extension: ext };
  } catch {
    return null;
  }
}

async function captureImgElementToPng(imgEl) {
  if (!imgEl?.naturalWidth) return null;
  try {
    let w = imgEl.naturalWidth;
    let h = imgEl.naturalHeight;
    const maxSide = 1024;
    if (Math.max(w, h) > maxSide) {
      const s = maxSide / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(imgEl, 0, 0, w, h);
    return new Promise((resolve) => {
      canvas.toBlob(
        async (blob) => {
          if (!blob) return resolve(null);
          resolve(new Uint8Array(await blob.arrayBuffer()));
        },
        "image/png",
        0.95,
      );
    });
  } catch {
    return null;
  }
}

/**
 * PNG bytes (Uint8Array) for ExcelJS addImage({ buffer }).
 * Order: data URL, blob / http fetch (CORS), else canvas rasterize (needs CORS for cross-origin http).
 */
async function rasterizeImageSrcToPngBytes(src) {
  return new Promise((resolve) => {
    const img = new Image();
    if (src.startsWith("http://") || src.startsWith("https://")) {
      img.crossOrigin = "anonymous";
    }
    const done = (u8) => resolve(u8);
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (!w || !h) return done(null);
        const maxSide = 1024;
        if (Math.max(w, h) > maxSide) {
          const s = maxSide / Math.max(w, h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(null);
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          async (blob) => {
            if (!blob) return done(null);
            done(new Uint8Array(await blob.arrayBuffer()));
          },
          "image/png",
          0.95,
        );
      } catch {
        done(null);
      }
    };
    img.onerror = () => done(null);
    img.src = src;
  });
}

async function getQrImageBytesForExcel(href, imgEl) {
  if (!href) return null;
  try {
    if (href.startsWith("data:image/")) {
      const m = href.match(
        /^data:image\/(png|jpe?g|gif)(?:;[\w=.+\-]*)*;base64,([\s\S]+)$/i,
      );
      if (!m) return null;
      let ext = m[1].toLowerCase();
      if (ext === "jpg") ext = "jpeg";
      const b64 = m[2].replace(/\s/g, "");
      const bin = atob(b64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) u8[i] = bin.charCodeAt(i);
      return { buffer: u8, extension: ext };
    }
    if (href.startsWith("blob:")) {
      const res = await fetch(href);
      const blob = await res.blob();
      const ab = await blob.arrayBuffer();
      const u8 = new Uint8Array(ab);
      let ext = "png";
      if (blob.type.includes("jpeg")) ext = "jpeg";
      else if (blob.type.includes("gif")) ext = "gif";
      else if (blob.type.includes("png")) ext = "png";
      return { buffer: u8, extension: ext };
    }
    if (href.startsWith("http://") || href.startsWith("https://")) {
      for (const u of qrImageProxyFetchCandidates(href)) {
        const got = await tryFetchImageBytes(u);
        if (got?.buffer?.byteLength) return got;
      }
      for (const u of qrImageFetchCandidates(href)) {
        const got = await tryFetchImageBytes(u);
        if (got?.buffer?.byteLength) return got;
      }
      const fromDom = await captureImgElementToPng(imgEl);
      if (fromDom?.length) return { buffer: fromDom, extension: "png" };
      const png = await rasterizeImageSrcToPngBytes(href);
      if (png?.length) return { buffer: png, extension: "png" };
    }
  } catch {
    return null;
  }
  return null;
}

function ReadCell({ label, value, valueClassName = "" }) {
  const raw = value != null && String(value).length > 0 ? String(value) : "";
  return (
    <div className="a5-print-readcell flex min-h-0 min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5 py-1">
      <span className="a5-print-readcell-label shrink-0 text-sm font-bold leading-snug text-black">
        {label}:
      </span>
      <span
        className={`a5-print-readcell-value min-w-0 flex-1 whitespace-pre-wrap break-words text-base font-normal leading-snug text-black [overflow-wrap:anywhere] ${valueClassName}`}
      >
        {raw}
      </span>
    </div>
  );
}

async function exportTheSanXuatExcel(values, preferredQrSrc = "", qrImgEl = null) {
  const [{ default: ExcelJS }, fileSaverNs] = await Promise.all([
    import("exceljs"),
    import("file-saver"),
  ]);
  const saveAs = fileSaverNs.saveAs ?? fileSaverNs.default;
  if (typeof saveAs !== "function") {
    throw new Error("file-saver: saveAs not available");
  }
  const wb = new ExcelJS.Workbook();
  wb.creator = "THLA";
  const sheet = wb.addWorksheet("Th\u1ebb SX", {
    views: [{ showGridLines: true }],
  });
  const COL_LAST = 4;
  sheet.columns = EXCEL_COL_WIDTHS.map((width) => ({ width }));

  let row = 1;
  const v = (k) => (values[k] != null ? String(values[k]) : "");
  const dv = (k) => formatNumberThousandsDot(v(k));

  const borderRange = (r, c1, c2) => {
    for (let c = c1; c <= c2; c += 1) {
      applyBorder(sheet.getCell(r, c));
    }
  };

  const mergeTitle = (text, font, alignment = "center") => {
    sheet.mergeCells(row, 1, row, COL_LAST);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = font;
    cell.alignment = {
      vertical: "middle",
      horizontal: alignment,
      wrapText: true,
    };
    borderRange(row, 1, COL_LAST);
    row += 1;
  };

  mergeTitle("TH\u1EBA S\u1EA2N XU\u1EA4T \u2013 M\u00C3 PH\u1EA6N", {
    bold: true,
    size: EXCEL_PT_TITLE_MAIN,
    name: "Calibri",
    color: EXCEL_FONT_BLACK,
  });

  const rCty = row;
  sheet.getCell(rCty, 1).value = excelReadCellRich("CTY", dv("CTY"));
  sheet.getCell(rCty, 1).alignment = { vertical: "top", wrapText: true };
  borderRange(rCty, 1, 1);
  sheet.mergeCells(rCty, 2, rCty, 3);
  const poCell = sheet.getCell(rCty, 2);
  poCell.value = excelReadCellRich("PO", dv("PO"));
  poCell.alignment = { vertical: "top", wrapText: true };
  borderRange(rCty, 2, 3);
  sheet.getCell(rCty, 4).value = excelReadCellRich("SLDH", dv("SLDH"));
  sheet.getCell(rCty, 4).alignment = { vertical: "top", wrapText: true };
  applyBorder(sheet.getCell(rCty, 4));
  row += 1;

  sheet.mergeCells(row, 1, row, 3);
  const maCell = sheet.getCell(row, 1);
  maCell.value = excelReadCellRich(
    "M\u00C3 \u2013 PH\u1EA6N",
    dv("MA"),
  );
  maCell.alignment = { vertical: "top", wrapText: true };
  borderRange(row, 1, 3);
  sheet.getCell(row, 4).value = excelReadCellRich(
    "S\u1ed1 l\u01b0\u1ee3ng",
    formatSlWithPcs(v("SL")),
  );
  sheet.getCell(row, 4).alignment = { vertical: "top", wrapText: true };
  applyBorder(sheet.getCell(row, 4));
  row += 1;

  const qrBlockTop = row;
  sheet.mergeCells(qrBlockTop, 1, qrBlockTop + 2, 2);
  const qrCell = sheet.getCell(qrBlockTop, 1);
  qrCell.alignment = {
    vertical: "top",
    horizontal: "left",
    wrapText: true,
  };
  for (let r = qrBlockTop; r <= qrBlockTop + 2; r += 1) {
    for (let c = 1; c <= 2; c += 1) {
      applyBorder(sheet.getCell(r, c));
    }
  }

  const qrHref =
    (preferredQrSrc && String(preferredQrSrc).trim()) ||
    qrParamToImageSrc(v("QR"));
  let qrEmbedded = false;
  if (qrHref) {
    const imgData = await getQrImageBytesForExcel(qrHref, qrImgEl);
    if (imgData?.buffer?.byteLength) {
      const imageId = wb.addImage({
        base64: uint8ToRawBase64(imgData.buffer),
        extension: imgData.extension,
      });
      const { nativeColOff, nativeRowOff } = qrExcelAnchorOffsetsEmu();
      sheet.addImage(imageId, {
        tl: {
          nativeCol: 0,
          nativeRow: qrBlockTop - 1,
          nativeColOff,
          nativeRowOff,
        },
        ext: {
          width: QR_IMAGE_EXCEL_IN.w * EXCEL_IMAGE_DPI,
          height: QR_IMAGE_EXCEL_IN.h * EXCEL_IMAGE_DPI,
        },
        editAs: "oneCell",
      });
      qrEmbedded = true;
      qrCell.value = "";
    }
  }
  if (!qrEmbedded) {
    qrCell.value = excelReadCellRich(
      "QR",
      qrHref
        ? `${v("QR").slice(0, 400)}${v("QR").length > 400 ? "\u2026" : ""}`
        : "",
    );
  }

  const dataRow = (c3Label, c3Key, c4Label, c4Key) => {
    sheet.getCell(row, 3).value = excelReadCellRich(c3Label, dv(c3Key));
    sheet.getCell(row, 3).alignment = { vertical: "top", wrapText: true };
    applyBorder(sheet.getCell(row, 3));
    sheet.getCell(row, 4).value = excelReadCellRich(c4Label, dv(c4Key));
    sheet.getCell(row, 4).alignment = { vertical: "top", wrapText: true };
    applyBorder(sheet.getCell(row, 4));
    row += 1;
  };

  dataRow("M\u00C0U V\u1EA2I", "MAUVAI", "K\u00CDCH V\u1EA2I", "KICHVAI");
  dataRow("K\u00CDCH PHIM", "KICHPHIM", "SLNV", "SLNV");
  sheet.getCell(row, 3).value = excelReadCellRich(
    "Gi\u1edd b\u1eaft \u0111\u1ea7u",
    dv("GBD"),
  );
  sheet.getCell(row, 3).alignment = { vertical: "top", wrapText: true };
  applyBorder(sheet.getCell(row, 3));
  const gsxVal = formatNumberThousandsDot(v("GSX") || v("GKT"));
  sheet.getCell(row, 4).value = excelReadCellRich(
    "Gi\u1edd k\u1ebft th\u00fac",
    gsxVal,
  );
  sheet.getCell(row, 4).alignment = { vertical: "top", wrapText: true };
  applyBorder(sheet.getCell(row, 4));
  row += 1;

  sheet.mergeCells(row, 1, row, 2);
  const readyHdr = sheet.getCell(row, 1);
  readyHdr.value = "READY CHECK:";
  readyHdr.font = {
    bold: true,
    size: EXCEL_PT_SECTION,
    name: "Calibri",
    color: EXCEL_FONT_BLACK,
  };
  readyHdr.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E5E5" },
  };
  readyHdr.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  borderRange(row, 1, 2);
  sheet.mergeCells(row, 3, row, 4);
  const chuyenHdr = sheet.getCell(row, 3);
  chuyenHdr.value = excelReadCellRich("CHUYỀN", dv("CHUYEN"));
  chuyenHdr.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E5E5" },
  };
  chuyenHdr.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  borderRange(row, 3, 4);
  row += 1;

  const ready = [
    ["READY_VAI", "V\u1ea3i OK", "XACNHAN_1"],
    ["READY_KHUON", "Khu\xF4n OK", "XACNHAN_2"],
    ["READY_MUC", "M\u1EF1c OK", "XACNHAN_3"],
    ["READY_MAU", "M\u1EABu duy\u1EC7t OK", "XACNHAN_4"],
  ];
  ready.forEach(([chk, label, xnKey]) => {
    const left = sheet.getCell(row, 1);
    left.value = {
      richText: [
        {
          font: {
            bold: true,
            size: EXCEL_PT_SECTION,
            name: "Calibri",
            color: EXCEL_FONT_BLACK,
          },
          text: `${excelCheckMark(v(chk))} ${label}`,
        },
      ],
    };
    left.alignment = { vertical: "middle", wrapText: true };
    applyBorder(sheet.getCell(row, 1));
    sheet.mergeCells(row, 2, row, 4);
    const right = sheet.getCell(row, 2);
    right.value = excelReadCellRich(
      "X\u00C1C NH\u1EACN",
      dv(xnKey),
    );
    right.alignment = { vertical: "top", wrapText: true };
    borderRange(row, 2, 4);
    row += 1;
  });

  mergeTitle(
    "\u2794 Ch\u01B0a \u0111\u1EE7 4 = KH\u00D4NG \u0110\u01AF\u1EE2C IN",
    {
      bold: true,
      size: EXCEL_PT_TITLE_MAIN - 1,
      name: "Calibri",
      color: EXCEL_FONT_BLACK,
    },
    "left",
  );

  const fullReadRow = (labelKey, valueKey) => {
    sheet.mergeCells(row, 1, row, COL_LAST);
    const cell = sheet.getCell(row, 1);
    cell.value = excelReadCellRich(labelKey, dv(valueKey));
    cell.alignment = { vertical: "top", wrapText: true };
    borderRange(row, 1, COL_LAST);
    row += 1;
  };

  fullReadRow("GI\u1EDC NH\u1EACN", "GIONHAN");
  fullReadRow("QC K\u00DD", "QCKY");

  for (let i = 0; i < EXCEL_ROW_HEIGHTS.length; i += 1) {
    sheet.getRow(i + 1).height = EXCEL_ROW_HEIGHTS[i];
  }

  const lastPrintRow = row - 1;
  Object.assign(sheet.pageSetup, {
    paperSize: 11,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    horizontalCentered: true,
    verticalCentered: false,
    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.2,
      bottom: 0.2,
      header: 0.2,
      footer: 0.2,
    },
    printArea: `A1:D${lastPrintRow}`,
  });
  delete sheet.pageSetup.scale;

  const buf = await wb.xlsx.writeBuffer();
  const stamp = v("PO") || new Date().toISOString().slice(0, 10);
  saveAs(
    new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `TheSanXuatMaPhan_${stamp}.xlsx`,
  );
}

class TheSanXuatMaPhanErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    console.error("TheSanXuatMaPhan:", err, info?.componentStack);
  }

  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen bg-neutral-100 p-6 text-neutral-900">
          <div className="mx-auto max-w-lg rounded border border-neutral-300 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold">
              {"Kh\u00f4ng hi\u1ec3n th\u1ecb \u0111\u01b0\u1ee3c trang th\u1ebb"}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {
                "C\u00f3 th\u1ec3 do \u1ea3nh QR ho\u1eb7c tham s\u1ed1 URL. Th\u1eed t\u1ea3i l\u1ea1i, ho\u1eb7c m\u1edf trang kh\u00f4ng k\u00e8m tham s\u1ed1 QR."
              }
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded border border-neutral-400 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => window.location.reload()}
              >
                {"T\u1ea3i l\u1ea1i"}
              </button>
              <button
                type="button"
                className="rounded border border-neutral-400 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                onClick={() => {
                  try {
                    const u = new URL(window.location.href);
                    u.searchParams.delete("QR");
                    window.location.href = u.toString();
                  } catch {
                    window.location.reload();
                  }
                }}
              >
                {"M\u1edf kh\u00f4ng c\u00f3 QR"}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function TheSanXuatMaPhanInner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [qrImageBroken, setQrImageBroken] = useState(false);
  const [qrDisplaySrc, setQrDisplaySrc] = useState("");
  const [qrImgRetryKey, setQrImgRetryKey] = useState(0);
  const [queryValues, setQueryValues] = useState({});
  const qrDisplayCandidatesRef = useRef([]);
  const qrCandidateIdxRef = useRef(0);
  const qrImgRef = useRef(null);

  const q = (key) => queryValues[key] ?? "";
  const qf = (key) => formatNumberThousandsDot(q(key));
  const qrImageSrc = qrParamToImageSrc(q("QR"));
  const gsxDisplay = formatNumberThousandsDot(q("GSX") || q("GKT"));

  useEffect(() => {
    // Lấy toàn bộ query
    const values = searchParamsToValues(searchParams);

    // Lưu vào state
    setQueryValues(values);

    // Nếu có query thì xóa nó khỏi URL
    if (window.location.search) {
      navigate(window.location.pathname, { replace: true });
    }

  }, []);

  useEffect(() => {
    setQrImageBroken(false);
  }, [qrImageSrc]);

  useEffect(() => {
    if (!qrImageSrc || qrImageBroken) {
      qrDisplayCandidatesRef.current = [];
      qrCandidateIdxRef.current = 0;
      setQrDisplaySrc("");
      return;
    }
    const candidates = qrImageDisplaySrcCandidates(qrImageSrc);
    qrDisplayCandidatesRef.current = candidates;
    qrCandidateIdxRef.current = 0;
    setQrImgRetryKey((k) => k + 1);
    if (!candidates.length) {
      setQrDisplaySrc("");
      setQrImageBroken(true);
      return;
    }
    setQrDisplaySrc(candidates[0]);
  }, [qrImageSrc, qrImageBroken]);

  const handleQrImageError = () => {
    const list = qrDisplayCandidatesRef.current;
    const next = qrCandidateIdxRef.current + 1;
    qrCandidateIdxRef.current = next;
    if (next < list.length) {
      setQrImgRetryKey((k) => k + 1);
      setQrDisplaySrc(list[next]);
    } else {
      setQrImageBroken(true);
    }
  };

  const handleQrImageLoad = (e) => {
    if (!e.currentTarget.naturalWidth) handleQrImageError();
  };

  useEffect(() => {
    applyA5PrintStyles();
    return () => {
      document.getElementById(PRINT_PAGE_STYLE_ID)?.remove();
    };
  }, []);

  const handlePrintA5 = () => {
    applyA5PrintStyles();
    const sheet = document.querySelector(`.${PRINT_SHEET_CLASS}`);
    requestAnimationFrame(() => {
      let zoomApplied = false;
      if (sheet) {
        const z = computeA5LandscapePrintZoom(sheet);
        if (z < 1) {
          sheet.style.zoom = String(z);
          zoomApplied = true;
        }
      }
      const onAfterPrint = () => {
        if (zoomApplied && sheet) {
          sheet.style.zoom = "";
        }
        window.removeEventListener("afterprint", onAfterPrint);
      };
      window.addEventListener("afterprint", onAfterPrint);
      window.print();
    });
  };

  const handleExportExcel = async () => {
    try {
      // Dữ liệu nằm trong queryValues vì URL đã bị xóa sau mount; merge searchParams nếu còn.
      const valuesForExport = {
        ...searchParamsToValues(searchParams),
        ...queryValues,
      };
      await exportTheSanXuatExcel(
        valuesForExport,
        qrImageSrc,
        qrImgRef.current,
      );
    } catch (e) {
      console.error(e);
      window.alert("Kh\xf4ng xu\u1EA5t \u0111\u01B0\u1EE3c Excel. Th\u1EED l\u1EA1i sau.");
    }
  };

  const td =
    "a5-print-td box-border min-h-0 border-[1px] border-solid border-neutral-400 px-2 py-2 align-top";

  const rowPt = (idx) => ({ height: `${EXCEL_ROW_HEIGHTS[idx]}pt` });

  return (
    <div className="min-h-screen bg-neutral-100 p-4 text-black print:bg-white print:p-2">
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportExcel}
            className="box-border rounded border-[1px] border-solid border-neutral-400 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:border-neutral-500 hover:bg-neutral-50"
          >
            {"Xu\u1EA5t Excel"}
          </button>
          <button
            type="button"
            onClick={handlePrintA5}
            className="box-border rounded border-[1px] border-solid border-neutral-400 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:border-neutral-500 hover:bg-neutral-50"
          >
            {"In A5"}
          </button>
        </div>

        <div
          className={`${PRINT_SHEET_CLASS} box-border border-[1px] border-solid border-neutral-400 bg-white`}
        >
          <table className="box-border w-full table-fixed border-collapse text-base [border-spacing:0] text-black">
            <colgroup>
              {EXCEL_COL_WIDTHS.map((w, i) => (
                <col
                  key={i}
                  style={{
                    width: `${(w / EXCEL_COL_WIDTH_SUM) * 100}%`,
                  }}
                />
              ))}
            </colgroup>
            <tbody>
              <tr style={rowPt(0)}>
                <td
                  colSpan={4}
                  className="box-border border-[1px] border-solid border-neutral-400 px-4 py-2 text-center align-middle print:px-2 print:py-1"
                >
                  <h1 className="m-0 text-xl font-bold tracking-tight text-black md:text-2xl print:text-[13pt] print:leading-tight">
                    {"TH\u1EBA S\u1EA2N XU\u1EA4T \u2013 M\u00C3 PH\u1EA6N"}
                  </h1>
                </td>
              </tr>
              <tr className="[&>td]:border-t-0" style={rowPt(1)}>
                <td className={td}>
                  <ReadCell label="CTY" value={qf("CTY")} />
                </td>
                <td className={td} colSpan={2}>
                  <ReadCell label="PO" value={qf("PO")} />
                </td>
                <td className={td}>
                  <ReadCell label="SLDH" value={qf("SLDH")} />
                </td>
              </tr>

              <tr style={rowPt(2)}>
                <td className={td} colSpan={3}>
                  <ReadCell
                    label={"M\u00C3 \u2013 PH\u1EA6N"}
                    value={qf("MA")}
                  />
                </td>
                <td className={td}>
                  <ReadCell
                    label={"S\u1ed1 l\u01b0\u1ee3ng"}
                    value={formatSlWithPcs(q("SL"))}
                  />
                </td>
              </tr>

              <tr style={rowPt(3)}>
                <td
                  className="a5-print-qr-cell relative box-border border-[1px] border-solid border-neutral-400 p-0 align-top"
                  rowSpan={3}
                  colSpan={2}
                >
                  {qrImageSrc && !qrImageBroken ? (
                    qrDisplaySrc ? (
                      <div
                        className="a5-print-qr-anchor absolute leading-none"
                        style={{
                          top: `calc(${QR_ANCHOR_TOP_IN}in + ${QR_CELL_BORDER_PX}px)`,
                          left: QR_WEB_QR_INSET_LEFT_PX,
                        }}
                      >
                        <img
                          key={qrImgRetryKey}
                          ref={qrImgRef}
                          src={qrDisplaySrc}
                          alt={"M\u00e3 QR"}
                          loading="eager"
                          decoding="async"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="a5-print-qr-img m-0 block max-w-none"
                          style={{
                            width: `${QR_IMAGE_WEB_IN.w}in`,
                            height: `${QR_IMAGE_WEB_IN.h}in`,
                            objectFit: "contain",
                          }}
                          onLoad={handleQrImageLoad}
                          onError={handleQrImageError}
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-black">
                        {"\u0110ang t\u1ea3i QR\u2026"}
                      </span>
                    )
                  ) : (
                    <span className="text-sm text-black">QR</span>
                  )}
                </td>
                <td className={td}>
                  <ReadCell
                    label={"M\u00C0U V\u1EA2I"}
                    value={qf("MAUVAI")}
                  />
                </td>
                <td className={td}>
                  <ReadCell
                    label={"K\u00CDCH V\u1EA2I"}
                    value={qf("KICHVAI")}
                  />
                </td>
              </tr>
              <tr style={rowPt(4)}>
                <td className={td}>
                  <ReadCell
                    label={"K\u00CDCH PHIM"}
                    value={qf("KICHPHIM")}
                  />
                </td>
                <td className={td}>
                  <ReadCell label="SLNV" value={qf("SLNV")} />
                </td>
              </tr>
              <tr style={rowPt(5)}>
                <td className={td}>
                  <ReadCell
                    label={"Gi\u1edd b\u1eaft \u0111\u1ea7u"}
                    value={qf("GBD")}
                  />
                </td>
                <td className={td}>
                  <ReadCell
                    label={"Gi\u1edd k\u1ebft th\u00fac"}
                    value={gsxDisplay}
                  />
                </td>
              </tr>

              <tr style={rowPt(6)}>
                <td
                  className="a5-print-ready-hdr box-border border-[1px] border-solid border-neutral-400 bg-neutral-100 px-2 py-1.5 font-bold text-black"
                  colSpan={2}
                >
                  READY CHECK:
                </td>
                <td
                  className="box-border border-[1px] border-solid border-neutral-400 bg-neutral-100 px-2 py-1.5"
                  colSpan={2}
                >
                  <ReadCell label={"CHUY\u1EC0N"} value={qf("CHUYEN")} />
                </td>
              </tr>

              {[
                ["READY_VAI", "V\u1ea3i OK", "XACNHAN_1"],
                ["READY_KHUON", "Khu\xF4n OK", "XACNHAN_2"],
                ["READY_MUC", "M\u1EF1c OK", "XACNHAN_3"],
                ["READY_MAU", "M\u1EABu duy\u1EC7t OK", "XACNHAN_4"],
              ].map(([name, label, xn], readyIdx) => (
                <tr
                  key={name}
                  className="a5-print-check-row"
                  style={rowPt(7 + readyIdx)}
                >
                  <td className={`${td} align-middle`}>
                    <div className="flex min-h-[2.75rem] min-w-0 items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={isQueryTruthy(q(name))}
                        onChange={() => {}}
                        className="h-4 w-4 shrink-0 accent-neutral-900 print:accent-neutral-900"
                        aria-label={label}
                      />
                      <span className="text-base font-bold leading-snug text-black">
                        {label}
                      </span>
                    </div>
                  </td>
                  <td className={td} colSpan={3}>
                    <ReadCell
                      label={"X\u00C1C NH\u1EACN"}
                      value={qf(xn)}
                    />
                  </td>
                </tr>
              ))}

              <tr style={rowPt(11)}>
                <td
                  className="a5-print-warning box-border border-[1px] border-solid border-neutral-400 px-2 py-2 text-left text-lg font-bold text-black md:text-xl"
                  colSpan={4}
                >
                  {
                    "\u2794 Ch\u01B0a \u0111\u1EE7 4 = KH\u00D4NG \u0110\u01AF\u1EE2C IN"
                  }
                </td>
              </tr>

              <tr style={rowPt(12)}>
                <td className={td} colSpan={4}>
                  <ReadCell
                    label={"GI\u1EDC NH\u1EACN"}
                    value={qf("GIONHAN")}
                  />
                </td>
              </tr>
              <tr style={rowPt(13)}>
                <td className={td} colSpan={4}>
                  <ReadCell label={"QC K\u00DD"} value={qf("QCKY")} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TheSanXuatMaPhan() {
  return (
    <TheSanXuatMaPhanErrorBoundary>
      <TheSanXuatMaPhanInner />
    </TheSanXuatMaPhanErrorBoundary>
  );
}
