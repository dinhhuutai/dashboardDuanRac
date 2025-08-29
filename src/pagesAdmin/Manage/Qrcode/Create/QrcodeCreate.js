import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import logoImage from "~/assets/imgs/logoAdmin.png";

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
    setUrlQrCode(new QRCodeStyling(commonOptions));
  }, []);

  useEffect(() => {
    if (mainQrCode && qrRef.current && data) {
      qrRef.current.innerHTML = "";
      mainQrCode.update({ data, image: logoImage });
      mainQrCode.append(qrRef.current);
    }
  }, [mainQrCode, data]);

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
    ctx.fillStyle = "#ffffff";
    ctx.fill();
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
    ctx.fillStyle = accentColor;
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
    if (!url || !urlQrCode || !urlQrRef.current) return;
    await ensureFontsReady();

    urlQrRef.current.innerHTML = "";
    urlQrCode.update({ data: url });
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

    const headerH = 100;
    const footerH = 140;
    const footerY = innerY + innerH - footerH;

    // Header
    ctx.save();
    roundedRectPath(ctx, innerX, innerY, innerW, headerH, 16);
    ctx.fillStyle = accentColor;
    ctx.fill();
    const title = "QR từ đường link";
    const titleFont = fitTextSize(ctx, title, innerW - 32, 38, 20, "800", fontFamilyUI);
    ctx.font = `800 ${titleFont}px "${fontFamilyUI}", sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, innerX + innerW / 2, innerY + headerH / 2);
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

    const quiet = 28;
    const qrMaxW = innerW - quiet * 2 - railW * 2;
    const qrMaxH = innerH - headerH - footerH - quiet * 2;
    const qrSize = Math.min(qrMaxW, qrMaxH);
    const qrX = innerX + (innerW - qrSize) / 2;
    const qrY = innerY + headerH + (innerH - headerH - footerH - qrSize) / 2;

    ctx.fillStyle = "#ffffff";
    roundedRectPath(ctx, qrX - quiet, qrY - quiet, qrSize + quiet * 2, qrSize + quiet * 2, 12);
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

    // Footer (URL)
    ctx.save();
    roundedRectPath(ctx, innerX, footerY, innerW, footerH, 16);
    ctx.fillStyle = accentColor;
    ctx.fill();

    const textMaxW = innerW - 40;
    const urlFontPx = fitTextSize(ctx, url, textMaxW, 28, 14, "700", fontFamilyMono);
    ctx.font = `700 ${urlFontPx}px "${fontFamilyMono}", monospace`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const urlLines = wrapTextTwoLines(ctx, url, textMaxW);
    const gap = 8;
    if (urlLines.length === 1) {
      ctx.fillText(urlLines[0], innerX + innerW / 2, footerY + footerH / 2);
    } else {
      const mid = footerY + footerH / 2;
      ctx.fillText(urlLines[0], innerX + innerW / 2, mid - (urlFontPx / 2 + gap / 2));
      ctx.fillText(urlLines[1], innerX + innerW / 2, mid + (urlFontPx / 2 + gap / 2));
    }
    ctx.restore();
  };

  const downloadUrlQR = () => {
    const canvas = urlCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "link_qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="pt-[2px]">
      {/* QR 1 */}
      <div className="m-[20px] p-[16px] bg-[#fff] rounded-[4px] box-shadow-admin-path">
        <h2 className="text-[18px] font-[600] uppercase text-center mb-5">Tạo Mã QR</h2>

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
              <div ref={qrRef}></div>
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

          <div className="flex md:flex-row flex-col gap-[10px] justify-between">
            <input
              type="text"
              className="flex-1 outline-none px-[8px] py-[4px] border-[1px] border-[#333] rounded-[6px] text-[14px]"
              placeholder="Nhập đường dẫn (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button onClick={generateUrlQR} className="text-[14px] px-[12px] py-[6px] bg-[#007bff] text-white rounded-[6px]">
              Tạo QR từ URL
            </button>
          </div>

          <div className="mt-[20px] flex flex-col items-center gap-3">
            <div ref={urlQrRef}></div>
            <button onClick={downloadUrlQR} className="text-[14px] px-[12px] py-[6px] bg-[#28a745] text-white rounded-[6px]">
              Tải QR PNG
            </button>
          </div>

          <canvas ref={urlCanvasRef} style={{ display: "none" }}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ModernQR;
