// import React, { useMemo, useRef, useState } from "react";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";
// import { motion } from "framer-motion";
// import { FaUpload, FaFilePdf, FaArrowRight, FaRedo, FaBolt } from "react-icons/fa";

// export default function InkCovPerOnFilm() {
//   const inputRef = useRef(null);

//   const [file, setFile] = useState(null);
//   const [busy, setBusy] = useState(false);
//   const [err, setErr] = useState("");
//   const [percent, setPercent] = useState(null);
//   const [bbox, setBbox] = useState("");
//   const [imgUrl, setImgUrl] = useState("");

//   const canRun = !!file && !busy;

//   const prettySize = useMemo(() => {
//     if (!file?.size) return "";
//     const kb = file.size / 1024;
//     if (kb < 1024) return `${Math.round(kb)} KB`;
//     return `${(kb / 1024).toFixed(2)} MB`;
//   }, [file]);

//   function clearResultOnly() {
//     setErr("");
//     setPercent(null);
//     setBbox("");
//     if (imgUrl) URL.revokeObjectURL(imgUrl);
//     setImgUrl("");
//   }

//   function resetAll() {
//     clearResultOnly();
//     setFile(null);
//     if (inputRef.current) inputRef.current.value = "";
//   }

//   function onPick(f) {
//     clearResultOnly();
//     if (!f) return;

//     const ok =
//       f.type === "application/pdf" || (f.name || "").toLowerCase().endsWith(".pdf");
//     if (!ok) {
//       setFile(null);
//       setErr("Chỉ hỗ trợ file PDF.");
//       return;
//     }
//     setFile(f);
//   }

//   async function onRun() {
//     if (!file || busy) return;

//     setBusy(true);
//     clearResultOnly();

//     try {
//       const fd = new FormData();
//       fd.append("file", file);

//       // optional params (nếu backend hỗ trợ)
//       fd.append("page_index", "0");
//       fd.append("dpi", "300");
//       // fd.append("show_mask_overlay", "false");

//       const url = `${BASE_URL}/api/ink-coverage/calc-image`;

//       // axios: nhận binary ảnh
//       const res = await http.post(url, fd, {
//         responseType: "blob",
//         // Không set Content-Type ở đây — axios tự set multipart boundary
//         // headers: { ... } (nếu cần custom header)
//       });

//       // Header trong axios thường lowercase
//       const p = res.headers?.["x-ink-percent"];
//       const b = res.headers?.["x-ink-bbox"];

//       setPercent(p != null ? Number(p).toFixed(2) : null);
//       setBbox(b || "");

//       const blob = res.data; // Blob (image/png)
//       const objectUrl = URL.createObjectURL(blob);
//       setImgUrl(objectUrl);
//     } catch (e) {
//       // axios error message
//       const msg =
//         e?.response?.data?.message ||
//         e?.response?.data?.detail ||
//         e?.message ||
//         "Có lỗi xảy ra khi xử lý.";
//       setErr(typeof msg === "string" ? msg : "Có lỗi xảy ra khi xử lý.");
//     } finally {
//       setBusy(false);
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <div className="mb-5">
//           <div className="flex items-center gap-3">
//             <div
//               className="w-10 h-10 rounded-2xl grid place-items-center bg-emerald-50 border border-emerald-200
//                          shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
//             >
//               <FaFilePdf className="text-emerald-700" />
//             </div>
//             <div>
//               <div className="text-[20px] font-extrabold text-slate-800">
//                 Tính % Tỷ Lệ Hình In Trên Kích Phim Bằng File PDF
//               </div>
//               <div className="text-[12.5px] text-slate-500">
//                 Tải lên file PDF phim → tính % độ phủ → trả về ảnh PNG đã vẽ khung + phần trăm.
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main layout */}
//         <div className="grid grid-cols-1 lg:grid-cols-[1fr_120px_1fr] gap-6 items-stretch">
//           {/* LEFT: Upload */}
//           <div
//             className="card relative rounded-3xl bg-gray-100 p-4 overflow-hidden
//                        shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
//           >
//             <div className="shine" />

//             <div className="flex items-center justify-between mb-3">
//               <div className="font-extrabold text-slate-700">Tải lên file PDF phim</div>

//               <div className="relative inline-flex bg-white/70 backdrop-blur rounded-xl p-1 border border-slate-200 shadow-sm">
//                 {["PDF"].map((k) => (
//                   <button
//                     key={k}
//                     className="relative z-10 px-4 py-2 text-sm rounded-lg transition text-emerald-800 font-semibold"
//                     style={{ minWidth: 90 }}
//                     type="button"
//                   >
//                     {k}
//                     <motion.span
//                       layoutId="pill-ink-type"
//                       className="absolute inset-0 -z-10 rounded-lg bg-white shadow"
//                       transition={{ type: "spring", stiffness: 400, damping: 30 }}
//                     />
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Dropzone */}
//             <div
//               className="rounded-3xl bg-gray-100 p-4 border border-slate-200
//                          shadow-[inset_6px_6px_14px_#d1d9e6,inset_-6px_-6px_14px_#ffffff]
//                          hover:shadow-[inset_4px_4px_10px_#d1d9e6,inset_-4px_-4px_10px_#ffffff]
//                          transition cursor-pointer"
//               onClick={() => inputRef.current?.click()}
//               onDragOver={(e) => e.preventDefault()}
//               onDrop={(e) => {
//                 e.preventDefault();
//                 onPick(e.dataTransfer.files?.[0]);
//               }}
//               title="Bấm để chọn PDF hoặc kéo thả PDF vào đây"
//               role="button"
//               tabIndex={0}
//               onKeyDown={(e) => {
//                 if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
//               }}
//             >
//               <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
//                 <div
//                   className="w-14 h-14 rounded-2xl grid place-items-center bg-emerald-50 border border-emerald-200
//                              shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
//                 >
//                   <FaUpload className="text-emerald-700 text-[18px]" />
//                 </div>
//                 <div className="text-slate-700 font-extrabold">Chọn file PDF phim</div>
//                 <div className="text-[12.5px] text-slate-500 leading-relaxed">
//                   Kéo thả hoặc bấm để chọn file.
//                   <br />
//                   Giới hạn đề xuất ≤ 20MB.
//                 </div>
//               </div>
//             </div>

//             <input
//               ref={inputRef}
//               type="file"
//               accept="application/pdf,.pdf"
//               className="hidden"
//               onChange={(e) => onPick(e.target.files?.[0])}
//             />

//             {/* File row */}
//             <div
//               className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/70 backdrop-blur
//                          border border-slate-200 px-4 py-3 shadow-sm"
//             >
//               <div className="min-w-0">
//                 <div className="text-[13px] font-extrabold text-slate-700 truncate">
//                   {file ? file.name : "Chưa chọn file"}
//                 </div>
//                 <div className="text-[12px] text-slate-500">
//                   {file ? prettySize : "Chỉ chấp nhận .pdf"}
//                 </div>
//               </div>

//               <span
//                 className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full
//                            bg-emerald-50 text-emerald-700 border border-emerald-200"
//               >
//                 <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
//                 {file ? "Sẵn sàng" : "PDF"}
//               </span>
//             </div>

//             {/* Buttons */}
//             <div className="mt-4 flex flex-wrap items-center gap-3">
//               <button
//                 type="button"
//                 onClick={resetAll}
//                 className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-slate-700
//                            bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition"
//               >
//                 <FaRedo className="text-[13px]" />
//                 Đặt lại
//               </button>

//               <button
//                 type="button"
//                 onClick={onRun}
//                 disabled={!canRun}
//                 className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold
//                   border shadow-sm transition
//                   ${
//                     canRun
//                       ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
//                       : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
//                   }`}
//                 title={!file ? "Chọn file PDF trước" : "Gọi API tính %"}
//               >
//                 {busy ? (
//                   <span className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
//                 ) : (
//                   <FaBolt className="text-[13px]" />
//                 )}
//                 {busy ? "Đang xử lý..." : "Tính %"}
//               </button>

//               {err ? (
//                 <div className="w-full mt-1 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 font-semibold text-[13px]">
//                   ⚠️ {err}
//                 </div>
//               ) : null}
//             </div>
//           </div>

//           {/* MIDDLE */}
//           <div className="flex items-center justify-center">
//             <div className="w-full h-full flex flex-col items-center justify-center gap-3">
//               <div
//                 className="w-14 h-14 rounded-full grid place-items-center bg-white/70 backdrop-blur border border-slate-200
//                            shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
//               >
//                 <FaArrowRight className="text-slate-700" />
//               </div>
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div
//             className="card relative rounded-3xl bg-gray-100 p-4 overflow-hidden
//                        shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
//           >
//             <div className="shine" />

//             <div className="flex items-center justify-between mb-3">
//               <div className="font-extrabold text-slate-700">Kết quả</div>

//               <div
//                 className={`px-3 py-2 rounded-full border text-[12px] font-extrabold
//                   ${
//                     percent == null
//                       ? "bg-white/70 border-slate-200 text-slate-500"
//                       : "bg-emerald-50 border-emerald-200 text-emerald-700"
//                   }`}
//                 title="X-Ink-Percent"
//               >
//                 {percent == null ? "Chưa có %" : `Độ phủ: ${percent}%`}
//               </div>
//             </div>

//             <div
//               className="rounded-3xl bg-gray-100 p-3 border border-slate-200
//                          shadow-[inset_6px_6px_14px_#d1d9e6,inset_-6px_-6px_14px_#ffffff]"
//             >
//               {!busy && !imgUrl && (
//                 <div className="h-[360px] flex items-center justify-center text-center text-slate-500 font-semibold">
//                   📷 Ảnh kết quả sẽ hiển thị ở đây
//                 </div>
//               )}

//               {busy && (
//                 <div className="grid grid-cols-1 gap-3">
//                   <div className="animate-pulse rounded-3xl bg-slate-100 h-[240px]" />
//                   <div className="animate-pulse rounded-2xl bg-slate-100 h-10" />
//                 </div>
//               )}

//               {!!imgUrl && (
//                 <img
//                   src={imgUrl}
//                   alt="Kết quả độ phủ mực"
//                   className="w-full rounded-3xl border border-slate-200 bg-white
//                              shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff]"
//                 />
//               )}
//             </div>

//             <div className="mt-4 flex items-center justify-between gap-3">
//               <div className="text-[12px] text-slate-500">
//                 {file ? (
//                   <>
//                     File: <span className="text-slate-700 font-semibold">{file.name}</span>
//                   </>
//                 ) : (
//                   "Chưa có file"
//                 )}
//               </div>

//               <button
//                 type="button"
//                 disabled={!imgUrl}
//                 onClick={() => {
//                   if (!imgUrl) return;
//                   const a = document.createElement("a");
//                   a.href = imgUrl;
//                   a.download = "ink_result.png";
//                   a.click();
//                 }}
//                 className={`px-4 py-2 rounded-2xl font-extrabold border shadow-sm transition
//                   ${
//                     imgUrl
//                       ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
//                       : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
//                   }`}
//               >
//                 ⬇️ Tải ảnh
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* CSS shimmer giống mẫu của bạn */}
//       <style>{`
//         .card { position: relative; overflow: hidden; }
//         .card .shine {
//           position: absolute;
//           top: -60%;
//           left: -60%;
//           height: 220%;
//           width: 120px;
//           transform: rotate(25deg) translateX(-200%);
//           background: linear-gradient(
//             90deg,
//             rgba(255,255,255,0) 0%,
//             rgba(255,255,255,0.5) 50%,
//             rgba(255,255,255,0) 100%
//           );
//           pointer-events: none;
//           animation: shine 3s ease-in-out infinite;
//         }
//         @keyframes shine {
//           0%   { transform: rotate(25deg) translateX(-200%); opacity: 0; }
//           10%  { opacity: 1; }
//           60%  { opacity: 1; }
//           100% { transform: rotate(25deg) translateX(250%); opacity: 0; }
//         }
//       `}</style>
//     </div>
//   );
// }




import React, { useMemo, useRef, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { motion } from "framer-motion";
import { FaUpload, FaFilePdf, FaArrowRight, FaRedo, FaBolt } from "react-icons/fa";

// ✅ NEW: mobile UI
import MobileInkCovPerOnFilm from "./sections/MobileInkCovPerOnFilm";
import { useNavigate } from "react-router-dom";

export default function InkCovPerOnFilm() {
  // ===================== MOBILE =====================
  // Mobile sẽ tự handle toàn bộ state bên trong nó (đơn giản, tách UI).
  // Desktop giữ UI như bạn đang có.
  // Nếu bạn muốn share state giữa mobile & desktop thì mình sẽ refactor tiếp (nhưng hiện tại tách là nhanh nhất).
  // ==================================================
  const navigate = useNavigate()
  
  return (
    <>
      {/* MOBILE */}
      <MobileInkCovPerOnFilm navigate={navigate} />

      {/* DESKTOP */}
      <DesktopInkCovPerOnFilm />
    </>
  );
}

/* ===================== DESKTOP (GIỮ UI CŨ) ===================== */
function DesktopInkCovPerOnFilm() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [percent, setPercent] = useState(null);
  const [bbox, setBbox] = useState("");
  const [imgUrl, setImgUrl] = useState("");

  const canRun = !!file && !busy;

  const prettySize = useMemo(() => {
    if (!file?.size) return "";
    const kb = file.size / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }, [file]);

  function clearResultOnly() {
    setErr("");
    setPercent(null);
    setBbox("");
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    setImgUrl("");
  }

  function resetAll() {
    clearResultOnly();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(f) {
    clearResultOnly();
    if (!f) return;

    const ok = f.type === "application/pdf" || (f.name || "").toLowerCase().endsWith(".pdf");
    if (!ok) {
      setFile(null);
      setErr("Chỉ hỗ trợ file PDF.");
      return;
    }
    setFile(f);
  }

  async function onRun() {
    if (!file || busy) return;

    setBusy(true);
    clearResultOnly();

    try {
      const fd = new FormData();
      fd.append("file", file);

      fd.append("page_index", "0");
      fd.append("dpi", "300");

      const url = `${BASE_URL}/api/ink-coverage/calc-image`;

      const res = await http.post(url, fd, {
        responseType: "blob",
      });

      const p = res.headers?.["x-ink-percent"];
      const b = res.headers?.["x-ink-bbox"];

      setPercent(p != null ? Number(p).toFixed(2) : null);
      setBbox(b || "");

      const blob = res.data;
      const objectUrl = URL.createObjectURL(blob);
      setImgUrl(objectUrl);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        e?.message ||
        "Có lỗi xảy ra khi xử lý.";
      setErr(typeof msg === "string" ? msg : "Có lỗi xảy ra khi xử lý.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hidden md:block min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl grid place-items-center bg-emerald-50 border border-emerald-200
                         shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
            >
              <FaFilePdf className="text-emerald-700" />
            </div>
            <div>
              <div className="text-[20px] font-extrabold text-slate-800">
                Tính % Tỷ Lệ Hình In Trên Kích Phim Bằng File PDF
              </div>
              <div className="text-[12.5px] text-slate-500">
                Tải lên file PDF phim → tính % độ phủ → trả về ảnh PNG đã vẽ khung + phần trăm.
              </div>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_120px_1fr] gap-6 items-stretch">
          {/* LEFT: Upload */}
          <div
            className="card relative rounded-3xl bg-gray-100 p-4 overflow-hidden
                       shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
          >
            <div className="shine" />

            <div className="flex items-center justify-between mb-3">
              <div className="font-extrabold text-slate-700">Tải lên file PDF phim</div>

              <div className="relative inline-flex bg-white/70 backdrop-blur rounded-xl p-1 border border-slate-200 shadow-sm">
                {["PDF"].map((k) => (
                  <button
                    key={k}
                    className="relative z-10 px-4 py-2 text-sm rounded-lg transition text-emerald-800 font-semibold"
                    style={{ minWidth: 90 }}
                    type="button"
                  >
                    {k}
                    <motion.span
                      layoutId="pill-ink-type"
                      className="absolute inset-0 -z-10 rounded-lg bg-white shadow"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone */}
            <div
              className="rounded-3xl bg-gray-100 p-4 border border-slate-200
                         shadow-[inset_6px_6px_14px_#d1d9e6,inset_-6px_-6px_14px_#ffffff]
                         hover:shadow-[inset_4px_4px_10px_#d1d9e6,inset_-4px_-4px_10px_#ffffff]
                         transition cursor-pointer"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPick(e.dataTransfer.files?.[0]);
              }}
              title="Bấm để chọn PDF hoặc kéo thả PDF vào đây"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
            >
              <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                <div
                  className="w-14 h-14 rounded-2xl grid place-items-center bg-emerald-50 border border-emerald-200
                             shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
                >
                  <FaUpload className="text-emerald-700 text-[18px]" />
                </div>
                <div className="text-slate-700 font-extrabold">Chọn file PDF phim</div>
                <div className="text-[12.5px] text-slate-500 leading-relaxed">
                  Kéo thả hoặc bấm để chọn file.
                  <br />
                  Giới hạn đề xuất ≤ 20MB.
                </div>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />

            {/* File row */}
            <div
              className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/70 backdrop-blur
                         border border-slate-200 px-4 py-3 shadow-sm"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold text-slate-700 truncate">
                  {file ? file.name : "Chưa chọn file"}
                </div>
                <div className="text-[12px] text-slate-500">
                  {file ? prettySize : "Chỉ chấp nhận .pdf"}
                </div>
              </div>

              <span
                className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full
                           bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
                {file ? "Sẵn sàng" : "PDF"}
              </span>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold text-slate-700
                           bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition"
              >
                <FaRedo className="text-[13px]" />
                Đặt lại
              </button>

              <button
                type="button"
                onClick={onRun}
                disabled={!canRun}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-extrabold
                  border shadow-sm transition
                  ${
                    canRun
                      ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                      : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
                  }`}
                title={!file ? "Chọn file PDF trước" : "Gọi API tính %"}
              >
                {busy ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                ) : (
                  <FaBolt className="text-[13px]" />
                )}
                {busy ? "Đang xử lý..." : "Tính %"}
              </button>

              {err ? (
                <div className="w-full mt-1 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-red-700 font-semibold text-[13px]">
                  ⚠️ {err}
                </div>
              ) : null}
            </div>
          </div>

          {/* MIDDLE */}
          <div className="flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div
                className="w-14 h-14 rounded-full grid place-items-center bg-white/70 backdrop-blur border border-slate-200
                           shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
              >
                <FaArrowRight className="text-slate-700" />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div
            className="card relative rounded-3xl bg-gray-100 p-4 overflow-hidden
                       shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]"
          >
            <div className="shine" />

            <div className="flex items-center justify-between mb-3">
              <div className="font-extrabold text-slate-700">Kết quả</div>

              <div
                className={`px-3 py-2 rounded-full border text-[12px] font-extrabold
                  ${
                    percent == null
                      ? "bg-white/70 border-slate-200 text-slate-500"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}
                title="X-Ink-Percent"
              >
                {percent == null ? "Chưa có %" : `Độ phủ: ${percent}%`}
              </div>
            </div>

            <div
              className="rounded-3xl bg-gray-100 p-3 border border-slate-200
                         shadow-[inset_6px_6px_14px_#d1d9e6,inset_-6px_-6px_14px_#ffffff]"
            >
              {!busy && !imgUrl && (
                <div className="h-[360px] flex items-center justify-center text-center text-slate-500 font-semibold">
                  📷 Ảnh kết quả sẽ hiển thị ở đây
                </div>
              )}

              {busy && (
                <div className="grid grid-cols-1 gap-3">
                  <div className="animate-pulse rounded-3xl bg-slate-100 h-[240px]" />
                  <div className="animate-pulse rounded-2xl bg-slate-100 h-10" />
                </div>
              )}

              {!!imgUrl && (
                <img
                  src={imgUrl}
                  alt="Kết quả độ phủ mực"
                  className="w-full rounded-3xl border border-slate-200 bg-white
                             shadow-[6px_6px_12px_#d1d9e6,-6px_-6px_12px_#ffffff]"
                />
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="text-[12px] text-slate-500">
                {file ? (
                  <>
                    File: <span className="text-slate-700 font-semibold">{file.name}</span>
                  </>
                ) : (
                  "Chưa có file"
                )}
              </div>

              <button
                type="button"
                disabled={!imgUrl}
                onClick={() => {
                  if (!imgUrl) return;
                  const a = document.createElement("a");
                  a.href = imgUrl;
                  a.download = "ink_result.png";
                  a.click();
                }}
                className={`px-4 py-2 rounded-2xl font-extrabold border shadow-sm transition
                  ${
                    imgUrl
                      ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      : "bg-slate-200 text-slate-500 border-slate-200 cursor-not-allowed"
                  }`}
              >
                ⬇️ Tải ảnh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS shimmer */}
      <style>{`
        .card { position: relative; overflow: hidden; }
        .card .shine {
          position: absolute;
          top: -60%;
          left: -60%;
          height: 220%;
          width: 120px;
          transform: rotate(25deg) translateX(-200%);
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.5) 50%,
            rgba(255,255,255,0) 100%
          );
          pointer-events: none;
          animation: shine 3s ease-in-out infinite;
        }
        @keyframes shine {
          0%   { transform: rotate(25deg) translateX(-200%); opacity: 0; }
          10%  { opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: rotate(25deg) translateX(250%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
