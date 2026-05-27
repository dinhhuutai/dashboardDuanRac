import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import logoImage from "~/assets/imgs/logoAdmin.png";

/** Google Form: đổi giá trị entry (SCAN001 …) ở cuối URL */
const GOOGLE_FORM_MP_ENTRY_BASE =
  "https://docs.google.com/forms/d/e/1FAIpQLSdctVQ4wK953xjpNbMpLnwWkqVebyt8w0YOktgRY6H5Z2Pktw/viewform?usp=pp_url&entry.218182079=";

const ModernQR = () => {
  // =========================
  // Cấu hình giao diện
  // =========================
  const accentColor = "#111111";                 // màu header/footer + rails
  const fontFamilyUI = "Be Vietnam Pro";        // font UI tiếng Việt
  const fontFamilyMono = "Noto Sans Mono";      // monospace tiếng Việt

  // Nạp Google Fonts (1 lần)
  useEffect(() => {
    const id = "qr-google-fonts";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@600;700;800&family=Noto+Sans+Mono:wght@400;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Đợi font sẵn sàng trước khi vẽ
  const ensureFontsReady = async () => {
    try {
      if (document?.fonts?.load) {
        await Promise.all([
          document.fonts.load(`700 24px "${fontFamilyUI}"`),
          document.fonts.load(`800 36px "${fontFamilyUI}"`),
          document.fonts.load(`700 20px "${fontFamilyMono}"`)
        ]);
        await document.fonts.ready;
      }
    } catch {}
  };

  // =========================
  // Helpers
  // =========================
  const roundedRectPath = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  };

  const fitTextSize = (ctx, text, maxWidth, startPx = 44, minPx = 16, fontWeight = "800", fontFamily = "sans-serif") => {
    let size = startPx;
    while (size >= minPx) {
      ctx.font = `${fontWeight} ${size}px "${fontFamily}", sans-serif`;
      if (ctx.measureText(text || "").width <= maxWidth) break;
      size -= 1;
    }
    return size;
  };

  const wrapTextTwoLines = (ctx, text, maxWidth) => {
    const words = String(text || "").split(" ");
    const lines = [];
    let line = "";
    for (let i = 0; i < words.length; i++) {
      const test = line ? `${line} ${words[i]}` : words[i];
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
      } else {
        lines.push(line);
        line = words[i];
        if (lines.length === 1) break;
      }
    }
    if (line) lines.push(line);
    if (lines.length > 2) {
      let second = lines[1];
      while (ctx.measureText(second + "…").width > maxWidth && second.length) {
        second = second.slice(0, -1);
      }
      lines[1] = second + "…";
    }
    return lines.slice(0, 2);
  };

  const renderQRToDataURL = async (qrInstance, targetSize, originalContainer, originalSize = 300) => {
    const tmp = document.createElement("div");
    tmp.style.position = "fixed";
    tmp.style.left = "-99999px";
    tmp.style.top = "-99999px";
    document.body.appendChild(tmp);

    qrInstance.update({ width: targetSize, height: targetSize });
    tmp.innerHTML = "";
    qrInstance.append(tmp);

    await new Promise((r) => setTimeout(r, 60));
    const bigCanvas = tmp.querySelector("canvas");
    const dataUrl = bigCanvas?.toDataURL("image/png");

    document.body.removeChild(tmp);
    qrInstance.update({ width: originalSize, height: originalSize });
    if (originalContainer) {
      originalContainer.innerHTML = "";
      qrInstance.append(originalContainer);
    }
    return dataUrl;
  };

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  /** Xuất PNG (data URL) QR + logo giữa; không đụng preview — dùng qrInstance tạm, reset 300px sau. */
  const exportPlainQrWithLogoDataUrl = async (qrInstance, dataStr, exportSize = 1024) => {
    const trimmed = String(dataStr || "").trim();
    if (!trimmed) throw new Error("Thiếu dữ liệu QR");

    const tmp = document.createElement("div");
    tmp.style.position = "fixed";
    tmp.style.left = "-99999px";
    tmp.style.top = "-99999px";
    document.body.appendChild(tmp);

    qrInstance.update({ width: exportSize, height: exportSize, data: trimmed, image: "" });
    tmp.innerHTML = "";
    qrInstance.append(tmp);

    await new Promise((r) => setTimeout(r, 80));
    const bigCanvas = tmp.querySelector("canvas");
    const qrDataUrl = bigCanvas?.toDataURL("image/png");
    document.body.removeChild(tmp);
    qrInstance.update({ width: 300, height: 300, data: trimmed, image: "" });

    const qrImg = new Image();
    await new Promise((r) => {
      qrImg.onload = r;
      qrImg.onerror = r;
      qrImg.src = qrDataUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, exportSize, exportSize);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImg, 0, 0, exportSize, exportSize);

    try {
      const logo = await loadImage(logoImage);
      const logoSize = Math.max(54, Math.floor(exportSize * 0.16));
      const lx = (exportSize - logoSize) / 2;
      const ly = (exportSize - logoSize) / 2;
      ctx.save();
      roundedRectPath(ctx, lx - 8, ly - 8, logoSize + 16, logoSize + 16, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
      ctx.drawImage(logo, lx, ly, logoSize, logoSize);
    } catch (e) {
      console.warn("Không tải được logo (QR chỉ ảnh):", e);
    }

    return canvas.toDataURL("image/png");
  };

  // =========================
  // State & refs
  // =========================
  const qrRef = useRef(null);
  const canvasRef = useRef(null);
  const [mainQrCode, setMainQrCode] = useState(null);

  const [url, setUrl] = useState("");
  const urlQrRef = useRef(null);
  const urlCanvasRef = useRef(null);
  const [urlQrCode, setUrlQrCode] = useState(null);
  const [urlTitle, setUrlTitle] = useState("QR từ đường link");
  const [urlSubtitle, setUrlSubtitle] = useState("");
  const [urlDescription, setUrlDescription] = useState("");

  /** QR 3: chỉ ảnh QR + logo giữa, không tiêu đề / thiệp */
  const [plainUrl, setPlainUrl] = useState("");
  const plainUrlQrRef = useRef(null);
  const [plainUrlQrCode, setPlainUrlQrCode] = useState(null);
  const [batchPlainQrCode, setBatchPlainQrCode] = useState(null);
  const [batchMpRunning, setBatchMpRunning] = useState(false);
  const [batchMpAt, setBatchMpAt] = useState(0);

  const [id, setId] = useState("TR109");
  const [department, setDepartment] = useState("Tổ 4");
  const [unit, setUnit] = useState("Chuyền 14A");
  const [trashType, setTrashType] = useState("Giẻ lau có chứa thành phần nguy hại");

  const [labelTop, setLabelTop] = useState(unit);
  const [labelBottom, setLabelBottom] = useState(trashType);
  const [data, setData] = useState("");

  const generateData = () => {
    const jsonString = JSON.stringify({ id }); // chỉ ID theo nhu cầu
    setData(jsonString);
    setLabelTop(unit);
    setLabelBottom(trashType);
  };

  useEffect(() => {
    const commonOptions = {
      width: 300,
      height: 300,
      data: "",
      image: logoImage,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { color: "#000000", type: "rounded" },
      cornersDotOptions: { type: "dot", color: "#000000" },
      cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
      backgroundOptions: { color: "#FFFFFF" },
      imageOptions: { crossOrigin: "anonymous", margin: 4, imageSize: 0.1 },
    };
    setMainQrCode(new QRCodeStyling(commonOptions));
    // QR từ link: render lõi QR trước, logo sẽ được đè thủ công khi export
    // để tránh lỗi canvas trắng/mất QR khi toDataURL.
    setUrlQrCode(
      new QRCodeStyling({
        ...commonOptions,
        image: "",
      })
    );
    setPlainUrlQrCode(
      new QRCodeStyling({
        ...commonOptions,
        image: "",
      })
    );
    setBatchPlainQrCode(
      new QRCodeStyling({
        ...commonOptions,
        image: "",
      })
    );
  }, []);

  useEffect(() => {
    if (mainQrCode && qrRef.current && data) {
      qrRef.current.innerHTML = "";
      mainQrCode.update({ data, image: logoImage });
      mainQrCode.append(qrRef.current);
    }
  }, [mainQrCode, data]);

  // Cập nhật QR đường link trên preview (lõi QR không gắn image trong lib — logo vẽ overlay + khi export)
  useEffect(() => {
    const trimmed = (url || "").trim();
    if (!urlQrCode || !urlQrRef.current) return;
    urlQrRef.current.innerHTML = "";
    if (!trimmed) return;
    urlQrCode.update({ data: trimmed, image: "" });
    urlQrCode.append(urlQrRef.current);
  }, [urlQrCode, url]);

  useEffect(() => {
    const trimmed = (plainUrl || "").trim();
    if (!plainUrlQrCode || !plainUrlQrRef.current) return;
    plainUrlQrRef.current.innerHTML = "";
    if (!trimmed) return;
    plainUrlQrCode.update({ data: trimmed, image: "" });
    plainUrlQrCode.append(plainUrlQrRef.current);
  }, [plainUrlQrCode, plainUrl]);

  // =========================
  // Tải PNG cho QR 1 — rails dính header/footer
  // =========================
  const downloadImage = async () => {
    if (!data) return;
    await ensureFontsReady();

    const cardW = 700;
    const cardH = 900;
    const dpr = Math.max(2, Math.floor(window.devicePixelRatio || 1));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = cardW * dpr;
    canvas.height = cardH * dpr;
    canvas.style.width = `${cardW}px`;
    canvas.style.height = `${cardH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cardW, cardH);

    // Card + bóng
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    roundedRectPath(ctx, 24, 24, cardW - 48, cardH - 48, 28);
    const bgGradient = ctx.createLinearGradient(0, 24, 0, cardH - 24);
    bgGradient.addColorStop(0, "#FFFFFF");
    bgGradient.addColorStop(1, "#F7F8FA");
    ctx.fillStyle = bgGradient;
    ctx.fill();
    ctx.restore();

    // Viền card ngoài
    ctx.save();
    roundedRectPath(ctx, 24, 24, cardW - 48, cardH - 48, 28);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#E2E8F0";
    ctx.stroke();
    ctx.restore();

    // Lề & khu vực trong
    const padding = 40;
    const innerX = 24 + padding;
    const innerY = 24 + padding;
    const innerW = cardW - (24 + padding) * 2;
    const innerH = cardH - (24 + padding) * 2;

    const headerH = 110;
    const footerH = 130;
    const footerY = innerY + innerH - footerH;

    // Header
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, headerH, 16);
    const headerGradient = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + headerH);
    headerGradient.addColorStop(0, "#111111");
    headerGradient.addColorStop(1, "#2F2F2F");
    ctx.fillStyle = headerGradient;
    ctx.fill();
    ctx.restore();

    // ===== Rails 2 bên — dính liền header/footer bằng overlap =====
    const railW = 12;
    const overlap = 8; // chồng vào header/footer để không hở khe
    const railY = innerY + headerH - overlap;
    const railH = innerH - headerH - footerH + overlap * 2;

    ctx.fillStyle = accentColor;
    // trái
    ctx.fillRect(innerX, railY, railW, railH);
    // phải
    ctx.fillRect(innerX + innerW - railW, railY, railW, railH);
    // =============================================================

    // Label top
    const topMaxWidth = innerW - 32;
    const topFontPx = fitTextSize(ctx, labelTop || "", topMaxWidth, 44, 20, "800", fontFamilyUI);
    ctx.font = `800 ${topFontPx}px "${fontFamilyUI}", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelTop || "", innerX + innerW / 2, innerY + headerH / 2);

    // QR nét
    const qrDataUrl = await renderQRToDataURL(mainQrCode, 900, qrRef.current, 300);
    const qrImg = new Image();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.src = qrDataUrl;
    });

    const quiet = 28;
    const qrMaxW = innerW - quiet * 2 - railW * 2; // chừa rails
    const qrMaxH = innerH - headerH - footerH - quiet * 2;
    const qrSize = Math.min(qrMaxW, qrMaxH);
    const qrX = innerX + (innerW - qrSize) / 2;
    const qrY = innerY + headerH + (innerH - headerH - footerH - qrSize) / 2;

    ctx.fillStyle = "#ffffff";
    roundedRectPath(ctx, qrX - quiet, qrY - quiet, qrSize + quiet * 2, qrSize + quiet * 2, 12);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

    // Footer
    ctx.save();
    roundedRectPath(ctx, innerX, footerY, innerW, footerH, 16);
    ctx.fillStyle = accentColor;
    ctx.fill();

    const bottomMaxW = innerW - 40;
    const bottomFontPx = fitTextSize(ctx, labelBottom || "", bottomMaxW, 36, 18, "800", fontFamilyUI);
    ctx.font = `800 ${bottomFontPx}px "${fontFamilyUI}", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = wrapTextTwoLines(ctx, labelBottom || "", bottomMaxW);
    const gap = 8;
    if (lines.length === 1) {
      ctx.fillText(lines[0], innerX + innerW / 2, footerY + footerH / 2);
    } else {
      const mid = footerY + footerH / 2;
      ctx.fillText(lines[0], innerX + innerW / 2, mid - (bottomFontPx / 2 + gap / 2));
      ctx.fillText(lines[1], innerX + innerW / 2, mid + (bottomFontPx / 2 + gap / 2));
    }
    ctx.restore();

    // Xuất file
    const link = document.createElement("a");
    link.download = `${(id + ' ' + labelTop + ' ' + labelBottom || "qr").replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // =========================
  // QR 2: URL — rails dính, font Mono
  // =========================
  const generateUrlQR = async () => {
    const trimmed = (url || "").trim();
    if (!trimmed || !urlQrCode || !urlQrRef.current) return;
    await ensureFontsReady();

    urlQrRef.current.innerHTML = "";
    urlQrCode.update({ data: trimmed });
    urlQrCode.append(urlQrRef.current);

    const canvas = urlCanvasRef.current;
    const ctx = canvas.getContext("2d");

    const cardW = 700;
    const cardH = 820;
    const dpr = Math.max(2, Math.floor(window.devicePixelRatio || 1));

    canvas.width = cardW * dpr;
    canvas.height = cardH * dpr;
    canvas.style.width = `${cardW}px`;
    canvas.style.height = `${cardH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cardW, cardH);

    // Card + bóng
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 10;
    roundedRectPath(ctx, 24, 24, cardW - 48, cardH - 48, 28);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.restore();

    const padding = 40;
    const innerX = 24 + padding;
    const innerY = 24 + padding;
    const innerW = cardW - (24 + padding) * 2;
    const innerH = cardH - (24 + padding) * 2;

    const headerH = 120;
    const footerH = 140;
    const footerY = innerY + innerH - footerH;

    // Header
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, headerH, 16);
    ctx.fillStyle = accentColor;
    ctx.fill();
    const headerText = (urlTitle || "QR từ đường link").trim();
    const subHeaderText = (urlSubtitle || "").trim();
    const titleFont = fitTextSize(ctx, headerText, innerW - 32, 38, 18, "800", fontFamilyUI);
    const subFont = fitTextSize(ctx, subHeaderText, innerW - 32, 26, 14, "700", fontFamilyUI);
    ctx.font = `800 ${titleFont}px "${fontFamilyUI}", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (subHeaderText) {
      const mid = innerY + headerH / 2;
      ctx.fillText(headerText, innerX + innerW / 2, mid - 18);
      ctx.font = `700 ${subFont}px "${fontFamilyUI}", sans-serif`;
      ctx.fillText(subHeaderText, innerX + innerW / 2, mid + 20);
    } else {
      ctx.fillText(headerText, innerX + innerW / 2, innerY + headerH / 2);
    }
    ctx.restore();

    // Rails dọc — dính liền
    const railW = 12;
    const overlap = 8;
    const railY = innerY + headerH - overlap;
    const railH = innerH - headerH - footerH + overlap * 2;
    ctx.fillStyle = accentColor;
    ctx.fillRect(innerX, railY, railW, railH);                             // trái
    ctx.fillRect(innerX + innerW - railW, railY, railW, railH);            // phải

    // QR sắc nét
    const qrDataUrl = await renderQRToDataURL(urlQrCode, 900, urlQrRef.current, 300);
    const img = new Image();
    await new Promise((r) => {
      img.onload = r;
      img.src = qrDataUrl;
    });

    // Đẩy QR sát khung hơn
    const quiet = 10;
    const qrMaxW = innerW - quiet * 2 - railW * 2;
    const qrMaxH = innerH - headerH - footerH - quiet * 2;
    const qrSize = Math.min(qrMaxW, qrMaxH);
    const qrX = innerX + (innerW - qrSize) / 2;
    const qrY = innerY + headerH + (innerH - headerH - footerH - qrSize) / 2;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

    // Đè logo trung tâm sau khi vẽ QR để vừa có logo vừa export ổn định.
    try {
      const logo = await loadImage(logoImage);
      const logoSize = Math.max(54, Math.floor(qrSize * 0.16));
      const lx = qrX + (qrSize - logoSize) / 2;
      const ly = qrY + (qrSize - logoSize) / 2;

      ctx.save();
      roundedRectPath(ctx, lx - 8, ly - 8, logoSize + 16, logoSize + 16, 12);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();

      ctx.drawImage(logo, lx, ly, logoSize, logoSize);
    } catch (e) {
      // Không chặn xuất ảnh nếu logo lỗi.
      console.warn("Không tải được logo trung tâm:", e);
    }

    // Footer (mô tả)
    ctx.save();
    roundedRectPath(ctx, innerX, footerY, innerW, footerH, 16);
    const footerGradient = ctx.createLinearGradient(innerX, footerY, innerX + innerW, footerY + footerH);
    footerGradient.addColorStop(0, "#202020");
    footerGradient.addColorStop(1, "#111111");
    ctx.fillStyle = footerGradient;
    ctx.fill();

    const footerText = (urlDescription || "").trim();
    const textMaxW = innerW - 40;
    const descFontPx = fitTextSize(ctx, footerText || " ", textMaxW, 28, 14, "700", fontFamilyUI);
    ctx.font = `700 ${descFontPx}px "${fontFamilyUI}", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const urlLines = wrapTextTwoLines(ctx, footerText, textMaxW);
    const gap = 8;
    if (urlLines.length === 1) {
      ctx.fillText(urlLines[0], innerX + innerW / 2, footerY + footerH / 2);
    } else {
      const mid = footerY + footerH / 2;
      ctx.fillText(urlLines[0], innerX + innerW / 2, mid - (descFontPx / 2 + gap / 2));
      ctx.fillText(urlLines[1], innerX + innerW / 2, mid + (descFontPx / 2 + gap / 2));
    }
    ctx.restore();

    // Chân trang phụ hiển thị đường link nhỏ để truy vết
    const tinyUrl = trimmed;
    if (tinyUrl) {
      ctx.save();
      ctx.font = `500 14px "${fontFamilyMono}", monospace`;
      ctx.fillStyle = "#64748B";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const maxSmall = cardW - 120;
      let small = tinyUrl;
      while (ctx.measureText(small).width > maxSmall && small.length > 3) {
        small = `${small.slice(0, -2)}…`;
      }
      ctx.fillText(small, cardW / 2, cardH - 36);
      ctx.restore();
    }
  };

  const downloadUrlQR = async () => {
    const trimmed = (url || "").trim();
    if (!trimmed) return;
    await generateUrlQR();
    const canvas = urlCanvasRef.current;
    if (!canvas) return;
    const safeTitle = (urlTitle || "qr_link").replace(/[^\w\u00C0-\u024F]+/g, "_").replace(/_+/g, "_").slice(0, 80);
    const link = document.createElement("a");
    link.download = `${safeTitle || "link_qr"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // =========================
  // QR 3: link — chỉ file ảnh QR + logo (không thiệp / chữ)
  // =========================
  const restorePlainUrlPreview = () => {
    const trimmed = (plainUrl || "").trim();
    if (!plainUrlQrCode || !plainUrlQrRef.current) return;
    plainUrlQrRef.current.innerHTML = "";
    if (!trimmed) return;
    plainUrlQrCode.update({ data: trimmed, image: "" });
    plainUrlQrCode.append(plainUrlQrRef.current);
  };

  const downloadPlainUrlOnlyPng = async () => {
    const trimmed = (plainUrl || "").trim();
    if (!trimmed || !plainUrlQrCode) return;

    try {
      const pngDataUrl = await exportPlainQrWithLogoDataUrl(plainUrlQrCode, trimmed);
      let safeName = "qr_link_only";
      try {
        const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
        safeName = (u.hostname || "qr").replace(/[^\w.-]+/g, "_").slice(0, 48) || "qr_link_only";
      } catch {
        safeName = "qr_link_only";
      }
      const link = document.createElement("a");
      link.download = `${safeName}.png`;
      link.href = pngDataUrl;
      link.click();
    } finally {
      restorePlainUrlPreview();
    }
  };

  const downloadBatchMp001To150 = async () => {
    if (!batchPlainQrCode || batchMpRunning) return;
    setBatchMpRunning(true);
    setBatchMpAt(0);
    try {
      for (let n = 1501; n <= 3000; n++) {
        setBatchMpAt(n);
        const code = `SCAN${String(n).padStart(3, "0")}`;
        const linkUrl = `${GOOGLE_FORM_MP_ENTRY_BASE}${code}`;
        const pngDataUrl = await exportPlainQrWithLogoDataUrl(batchPlainQrCode, linkUrl);
        const link = document.createElement("a");
        link.download = `${code}.png`;
        link.href = pngDataUrl;
        link.click();
        await new Promise((r) => setTimeout(r, 130));
      }
    } catch (e) {
      console.error(e);
      window.alert(`Lỗi khi tạo/tải batch QR: ${e?.message || e}`);
    } finally {
      setBatchMpRunning(false);
      setBatchMpAt(0);
      restorePlainUrlPreview();
    }
  };

  // =========================
  // UI
  // =========================
  const urlTrim = (url || "").trim();
  const plainUrlTrim = (plainUrl || "").trim();

  return (
    <div className="pt-[2px]">
      {/* QR 1 */}
      <div className="m-[20px] p-[16px] bg-[#fff] rounded-[4px] box-shadow-admin-path">
        <h2 className="text-[18px] font-[600] uppercase text-center mb-5">Tạo Mã QR</h2>
        <p className="text-center text-[13px] text-[#64748B] -mt-3 mb-2">
          Đường dẫn trang: <span className="font-mono text-[#0f172a]">/admin/manage/qrcode/create</span> (menu Quản lý cân rác → Tạo mới QR).
        </p>

        <div className="flex md:flex-row flex-col gap-[20px] justify-between mt-[50px]">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <input className="outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]" placeholder="Mã ID" value={id} onChange={(e) => setId(e.target.value)} />
            <input className="outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]" placeholder="Bộ phận" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <input className="outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]" placeholder="Đơn vị" value={unit} onChange={(e) => setUnit(e.target.value)} />
            <input className="outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]" placeholder="Loại rác" value={trashType} onChange={(e) => setTrashType(e.target.value)} />
            <button className="text-[14px] mt-[10px]" onClick={generateData} style={{ padding: "6px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: 5 }}>
              Tạo mã QR
            </button>
          </div>

          <div className="flex-1">
            <div className="flex justify-center flex-col items-center text-center">
              <div style={{ color: "black", fontSize: "24px", fontWeight: "normal" }}>{labelTop}</div>
              <div className="relative mt-2 flex min-h-[300px] min-w-[300px] max-w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC]">
                {!data ? (
                  <p className="absolute inset-0 z-0 flex items-center justify-center px-4 text-[13px] leading-snug text-[#64748B]">
                    Chưa có mã — nhấn <span className="mx-1 font-[600] text-[#0f172a]">Tạo mã QR</span> bên trái để hiển thị ô vuông mã tại đây.
                  </p>
                ) : null}
                <div ref={qrRef} className="relative z-[1]" />
              </div>
              <div style={{ color: "black", fontSize: "20px" }}>{labelBottom}</div>
            </div>

            <button className="text-[14px]" onClick={downloadImage} style={{ marginTop: 20, padding: "6px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 5, width: "100%" }}>
              Tải QR PNG
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
      </div>

      {/* QR 2: URL */}
      <div className="m-[20px] p-[16px] bg-[#fff] rounded-[4px] box-shadow-admin-path">
        <div className="mt-[40px] p-[16px] rounded-[4px]">
          <h3 className="text-[16px] font-[600] mb-[10px] text-center">Tạo QR từ đường link</h3>
          <p className="mb-3 text-center text-[13px] text-[#64748B]">
            Ô mã bên dưới chỉ hiện sau khi bạn nhập link — trước đó sẽ thấy dòng chữ gợi ý trong khung xám (không phải lỗi trắng tinh).
          </p>

          <div className="flex md:flex-row flex-col gap-[10px] justify-between">
            <input
              type="text"
              className="flex-1 outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]"
              placeholder="Nhập đường dẫn (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              onClick={generateUrlQR}
              disabled={!urlTrim}
              className="text-[14px] px-[12px] py-[6px] bg-[#007bff] text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tạo QR từ URL
            </button>
          </div>

          <div className="mt-[12px] grid md:grid-cols-3 grid-cols-1 gap-[10px]">
            <input
              type="text"
              className="outline-none px-[8px] py-[6px] border-[1px] border-[#333] rounded-[6px] text-[14px]"
              placeholder="Tiêu đề (trên QR)"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
            />
            <input
              type="text"
              className="outline-none px-[8px] py-[6px] border-[1px] border-[#333] rounded-[6px] text-[14px]"
              placeholder="Sub tiêu đề (trên QR)"
              value={urlSubtitle}
              onChange={(e) => setUrlSubtitle(e.target.value)}
            />
            <input
              type="text"
              className="outline-none px-[8px] py-[6px] border-[1px] border-[#333] rounded-[6px] text-[14px]"
              placeholder="Mô tả (dưới QR)"
              value={urlDescription}
              onChange={(e) => setUrlDescription(e.target.value)}
            />
          </div>

          <div className="mt-[20px] flex justify-center">
            <div className="w-full max-w-[420px] rounded-[20px] border border-[#E2E8F0] bg-gradient-to-b from-white to-[#F8FAFC] shadow-[0_10px_30px_rgba(15,23,42,0.08)] p-[16px]">
              <div className="rounded-[14px] bg-[#111111] text-white text-center px-[12px] py-[10px]">
                <div className="text-[20px] font-[700] leading-tight">{urlTitle || "QR từ đường link"}</div>
                {urlSubtitle ? <div className="text-[14px] text-[#E2E8F0] leading-tight mt-[2px]">{urlSubtitle}</div> : null}
              </div>

              <div className="mt-[12px] flex min-h-[300px] justify-center rounded-[14px] border border-[#CBD5E1] bg-white p-[6px]">
                <div className="relative inline-flex min-h-[288px] min-w-[288px] max-w-full items-center justify-center leading-none">
                  {!urlTrim ? (
                    <p className="absolute inset-0 z-0 flex items-center justify-center px-3 text-center text-[13px] leading-snug text-[#64748B]">
                      Nhập đường link (https://…) ở ô phía trên — mã QR và logo giữa mã sẽ hiện trong khung này.
                    </p>
                  ) : null}
                  <div ref={urlQrRef} className="relative z-[1]" />
                  {urlTrim ? (
                    <div
                      className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
                      aria-hidden
                    >
                      <div
                        className="rounded-[12px] bg-white p-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                        style={{ width: "22%", maxWidth: 72, aspectRatio: "1" }}
                      >
                        <img src={logoImage} alt="" className="h-full w-full object-contain" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {urlDescription ? (
                <div className="mt-[12px] rounded-[12px] bg-[#111111] text-white text-center text-[14px] px-[10px] py-[8px]">
                  {urlDescription}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-[12px] flex flex-col items-center gap-2 text-center">
            <p className="text-[13px] text-[#64748B] max-w-[520px]">
              File tải về là ảnh thiệp đầy đủ (tiêu đề, QR có logo ở giữa, mô tả và dòng link), không chỉ riêng khối mã QR.
            </p>
            <button
              type="button"
              onClick={downloadUrlQR}
              disabled={!urlTrim}
              className="text-[14px] px-[12px] py-[6px] bg-[#28a745] text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tải ảnh PNG (thiệp QR + logo)
            </button>
          </div>

          <canvas ref={urlCanvasRef} style={{ display: "none" }}></canvas>
        </div>
      </div>

      {/* QR 3: link — chỉ ảnh QR + logo, không tiêu đề / mô tả */}
      <div className="m-[20px] p-[16px] bg-[#fff] rounded-[4px] box-shadow-admin-path">
        <h3 className="text-[16px] font-[600] mb-[6px] text-center">QR từ link — chỉ hình ảnh</h3>
        <p className="mb-4 text-center text-[13px] text-[#64748B]">
          Một file PNG duy nhất: mã QR và logo ở giữa, không kèm tiêu đề hay nội dung khác.
        </p>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            className="flex-1 outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]"
            placeholder="Nhập đường dẫn (https://...)"
            value={plainUrl}
            onChange={(e) => setPlainUrl(e.target.value)}
          />
          <button
            type="button"
            onClick={downloadPlainUrlOnlyPng}
            disabled={!plainUrlTrim}
            className="shrink-0 text-[14px] px-[12px] py-[6px] bg-[#28a745] text-white rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tải PNG (chỉ QR + logo)
          </button>
        </div>

        <div className="mt-5 flex justify-center">
          <div className="flex min-h-[300px] w-full max-w-[320px] justify-center rounded-[12px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-[8px]">
            <div className="relative inline-flex min-h-[288px] min-w-[288px] max-w-full items-center justify-center leading-none">
              {!plainUrlTrim ? (
                <p className="absolute inset-0 z-0 flex items-center justify-center px-3 text-center text-[13px] leading-snug text-[#64748B]">
                  Nhập link phía trên — preview chỉ là QR và logo giữa mã.
                </p>
              ) : null}
              <div ref={plainUrlQrRef} className="relative z-[1]" />
              {plainUrlTrim ? (
                <div
                  className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
                  aria-hidden
                >
                  <div
                    className="rounded-[12px] bg-white p-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    style={{ width: "22%", maxWidth: 72, aspectRatio: "1" }}
                  >
                    <img src={logoImage} alt="" className="h-full w-full object-contain" />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E2E8F0] pt-6">
          <h4 className="text-[15px] font-[600] mb-2 text-center">Tải hàng loạt Google Form (SCAN1501 → SCAN3000)</h4>
          <p className="mb-3 text-center text-[13px] text-[#64748B] leading-relaxed">
            Tự tạo QR (cùng định dạng ảnh “chỉ QR + logo”) cho từng link, chỉ đổi mã{" "}
            <span className="font-mono text-[#0f172a]">SCAN1501 … SCAN3000</span> trong tham số{" "}
            <span className="font-mono text-[12px]">entry.218182079</span>. Mỗi file tên{" "}
            <span className="font-mono">SCAN1501.png</span> … <span className="font-mono">SCAN3000.png</span>.
            Trình duyệt có thể hỏi cho phép tải nhiều file — hãy chọn Cho phép.
          </p>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={downloadBatchMp001To150}
              disabled={batchMpRunning}
              className="text-[14px] px-[16px] py-[8px] bg-[#0f172a] text-white rounded-[6px] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {batchMpRunning
                ? `Đang tải… ${batchMpAt}/3000 (giữ tab này mở)`
                : "Tạo & tải SCAN1501.png … SCAN3000.png"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernQR;
