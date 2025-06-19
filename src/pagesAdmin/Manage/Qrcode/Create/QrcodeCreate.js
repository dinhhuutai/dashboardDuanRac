import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import logoImage from "~/assets/imgs/logoAdmin.png";

const ModernQR = () => {
  const qrRef = useRef(null);
  const canvasRef = useRef(null);
  const [qrCode, setQrCode] = useState(null);

  const [url, setUrl] = useState("");
  const urlQrRef = useRef(null);
  const urlCanvasRef = useRef(null);


  // Các trường nhập liệu
  const [id, setId] = useState("TR109");
  const [department, setDepartment] = useState("Tổ 4");
  const [unit, setUnit] = useState("Chuyền 14A");
  const [trashType, setTrashType] = useState("Giẻ lau có chứa thành phần nguy hại");

  const [labelTop, setLabelTop] = useState(id);
  const [labelBottom, setLabelBottom] = useState(trashType);
  const [data, setData] = useState("");

  const generateData = () => {
    const json = {
      id,
      d: department,
      u: unit,
      t: trashType,
    };
    const jsonString = JSON.stringify(json);
    setData(jsonString);
    setLabelTop(id);
    setLabelBottom(
      trashType === "Giẻ lau có chứa thành phần nguy hại"
        ? "Giẻ lau dính mực"
        : trashType === "Băng keo dính mực"
        ? "Băng keo"
        : trashType
    );
  };

  useEffect(() => {
    const qr = new QRCodeStyling({
      width: 300,
      height: 300,
      data: "",
      image: logoImage,
      qrOptions: {
        errorCorrectionLevel: "H",
      },
      dotsOptions: {
        color: "#000000",
        type: "rounded",
      },
      cornersDotOptions: {
        type: "dot",
        color: "#000000",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#000000",
      },
      backgroundOptions: {
        color: "#FFFFFF",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
        imageSize: 0.1,
      },
    });

    setQrCode(qr);
  }, []);

  useEffect(() => {
    if (qrCode && qrRef.current && data) {
      qrRef.current.innerHTML = "";
      qrCode.update({ data: encodeURIComponent(data), image: logoImage });
      qrCode.append(qrRef.current);
    }
  }, [qrCode, data]);

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const qrCanvas = document.querySelector("canvas");
    const qrImage = qrCanvas.toDataURL("image/png");

    const img = new Image();
    img.onload = () => {
      const width = 400;
      const height = 500;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#fff";
      ctx.fillRect(10, 20, width - 20, height - 30);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 10;
      const radius = 20;
      const x = 10,
        y = 20,
        w = width - 20,
        h = height - 30;

      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(30, 20);
      ctx.lineTo(width - 30, 20);
      ctx.quadraticCurveTo(width - 10, 20, width - 10, 40);
      ctx.lineTo(width - 10, 70);
      ctx.quadraticCurveTo(width - 10, 90, width - 30, 90);
      ctx.lineTo(30, 90);
      ctx.quadraticCurveTo(10, 90, 10, 70);
      ctx.lineTo(10, 40);
      ctx.quadraticCurveTo(10, 20, 30, 20);
      ctx.closePath();

      ctx.fillStyle = "black";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labelTop, width / 2, 65);

      ctx.drawImage(img, 20, 90, 360, 320);

      ctx.beginPath();
      ctx.moveTo(30, 420);
      ctx.lineTo(width - 30, 420);
      ctx.quadraticCurveTo(width - 10, 420, width - 10, 440);
      ctx.lineTo(width - 10, 470);
      ctx.quadraticCurveTo(width - 10, 490, width - 30, 490);
      ctx.lineTo(30, 490);
      ctx.quadraticCurveTo(10, 490, 10, 470);
      ctx.lineTo(10, 440);
      ctx.quadraticCurveTo(10, 420, 30, 420);
      ctx.closePath();

      ctx.fillStyle = "black";
      ctx.fill();
      ctx.fillStyle = "white";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(labelBottom, width / 2, 460);

      const link = document.createElement("a");
      link.download = `${labelTop}_qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = qrImage;
  };

  const generateUrlQR = () => {
  if (!url || !qrCode || !urlQrRef.current) return;

  urlQrRef.current.innerHTML = "";
  qrCode.update({ data: url });
  qrCode.append(urlQrRef.current);

  // Delay vẽ canvas 500ms sau khi render xong
  setTimeout(() => {
    const canvas = urlCanvasRef.current;
    const ctx = canvas.getContext("2d");

    const qrCanvas = urlQrRef.current.querySelector("canvas");
    if (!qrCanvas) return;

    const qrImage = qrCanvas.toDataURL("image/png");

    const img = new Image();
    img.onload = () => {
      const width = 400;
      const height = 450;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 20, 20, 360, 360);

      ctx.fillStyle = "#000";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(url, width / 2, 410);
    };
    img.src = qrImage;
  }, 500);
};

const downloadUrlQR = () => {
  const canvas = urlCanvasRef.current;
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "link_qr.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};



  return (
    <div className="pt-[2px]">
        <div className='m-[20px] p-[16px] bg-[#fff] rounded-[4px] box-shadow-admin-path'>
            <h2 className="text-[18px] font-[600] uppercase" style={{ textAlign: "center", marginBottom: 20 }}>Tạo Mã QR</h2>

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
                    <div className="flex justify-center flex-col items-center" style={{ textAlign: "center" }}>
                        <div style={{ color: "black", fontSize: "24px", fontWeight: 'normal' }}>{labelTop}</div>
                        <div ref={qrRef}></div>
                        <div style={{ color: "black", fontSize: "20px"}}>{labelBottom}</div>
                    </div>

                    <button className="text-[14px]" onClick={downloadImage} style={{ marginTop: 20, padding: "6px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 5, width: "100%" }}>
                        Tải QR PNG
                    </button>
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        </div>

        <div className='m-[20px] p-[16px] bg-[#fff] rounded-[4px] box-shadow-admin-path'>
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
              <button
                onClick={generateUrlQR}
                className="text-[14px] px-[12px] py-[6px] bg-[#007bff] text-white rounded-[6px]"
              >
                Tạo QR từ URL
              </button>
            </div>

            <div className="mt-[20px] flex justify-center">
              <div ref={urlQrRef}></div>
            </div>

            <div className="mt-[20px] flex flex-col items-center gap-3">
  <div ref={urlQrRef}></div>
  <button
    onClick={downloadUrlQR}
    className="text-[14px] px-[12px] py-[6px] bg-[#28a745] text-white rounded-[6px]"
  >
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
