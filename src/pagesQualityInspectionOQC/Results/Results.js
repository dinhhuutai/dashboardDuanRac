// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { BrowserMultiFormatReader } from "@zxing/browser";
// import { BarcodeFormat, DecodeHintType } from "@zxing/library";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   FaQrcode,
//   FaBarcode,
//   FaCheckCircle,
//   FaTimesCircle,
//   FaSpinner,
//   FaArrowLeft,
//   FaPowerOff,
//   FaCamera,
// } from "react-icons/fa";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";

// const AUTO_SLEEP_MS = 30000;
// const DUPLICATE_BLOCK_MS = 1200;

// function Result() {
//   const navigate = useNavigate();

//   const videoRef = useRef(null);
//   const codeReaderRef = useRef(null);
//   const controlsRef = useRef(null);
//   const streamRef = useRef(null);
//   const sleepTimerRef = useRef(null);
//   const toastTimerRef = useRef(null);
//   const audioCtxRef = useRef(null);

//   const isStartingRef = useRef(false);
//   const isProcessingRef = useRef(false);
//   const lastScannedRef = useRef("");
//   const lastScanAtRef = useRef(0);

//   const [scanMode, setScanMode] = useState("BARCODE");
//   const [qrData, setQrData] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [result, setResult] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);
//   const [cameraOn, setCameraOn] = useState(false);
//   const [cameraSleeping, setCameraSleeping] = useState(false);

//   /* ================= VALIDATE ================= */
//   const isValidCode = useCallback((value) => {
//     const text = String(value || "").trim();
//     return text.startsWith("15");
//   }, []);

//   /* ================= TOAST ================= */
//   const clearToastTimer = useCallback(() => {
//     if (toastTimerRef.current) {
//       clearTimeout(toastTimerRef.current);
//       toastTimerRef.current = null;
//     }
//   }, []);

//   const showToast = useCallback(
//     (type, message, duration = 1800) => {
//       clearToastTimer();
//       setToast({ type, message });

//       if (duration > 0) {
//         toastTimerRef.current = setTimeout(() => {
//           setToast(null);
//         }, duration);
//       }
//     },
//     [clearToastTimer]
//   );

//   const showErrorToast = useCallback(
//     (message) => showToast("error", message, 1500),
//     [showToast]
//   );

//   /* ================= BEEP ================= */
//   const playBeep = useCallback(() => {
//     try {
//       const AudioCtx = window.AudioContext || window.webkitAudioContext;
//       if (!AudioCtx) return;

//       if (!audioCtxRef.current) {
//         audioCtxRef.current = new AudioCtx();
//       }

//       const ctx = audioCtxRef.current;

//       if (ctx.state === "suspended") {
//         ctx.resume().catch(() => {});
//       }

//       const oscillator = ctx.createOscillator();
//       const gainNode = ctx.createGain();

//       oscillator.type = "sine";
//       oscillator.frequency.setValueAtTime(1200, ctx.currentTime);

//       gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
//       gainNode.gain.exponentialRampToValueAtTime(
//         0.00001,
//         ctx.currentTime + 0.12
//       );

//       oscillator.connect(gainNode);
//       gainNode.connect(ctx.destination);

//       oscillator.start(ctx.currentTime);
//       oscillator.stop(ctx.currentTime + 0.12);
//     } catch (err) {
//       console.log("playBeep error:", err);
//     }
//   }, []);

//   /* ================= TIMER ================= */
//   const clearSleepTimer = useCallback(() => {
//     if (sleepTimerRef.current) {
//       clearTimeout(sleepTimerRef.current);
//       sleepTimerRef.current = null;
//     }
//   }, []);

//   const stopTracks = useCallback(() => {
//     try {
//       const stream = streamRef.current || videoRef.current?.srcObject;
//       if (stream?.getTracks) {
//         stream.getTracks().forEach((track) => {
//           try {
//             track.stop();
//           } catch {}
//         });
//       }
//     } catch {}

//     streamRef.current = null;

//     if (videoRef.current) {
//       try {
//         videoRef.current.srcObject = null;
//       } catch {}
//     }
//   }, []);

//   const stopScanner = useCallback(() => {
//     clearSleepTimer();

//     try {
//       controlsRef.current?.stop();
//     } catch {}

//     controlsRef.current = null;
//     stopTracks();
//     setCameraOn(false);
//     isStartingRef.current = false;
//   }, [clearSleepTimer, stopTracks]);

//   const sleepCamera = useCallback(() => {
//     stopScanner();
//     setCameraSleeping(true);
//   }, [stopScanner]);

//   const resetSleepTimer = useCallback(() => {
//     clearSleepTimer();
//     sleepTimerRef.current = setTimeout(() => {
//       sleepCamera();
//     }, AUTO_SLEEP_MS);
//   }, [clearSleepTimer, sleepCamera]);

//   /* ================= INIT READER ================= */
//   const initReader = useCallback(() => {
//     const hints = new Map();

//     if (scanMode === "QRCODE") {
//       hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
//     } else {
//       hints.set(DecodeHintType.POSSIBLE_FORMATS, [
//         BarcodeFormat.CODE_128,
//         BarcodeFormat.CODE_39,
//         BarcodeFormat.EAN_13,
//         BarcodeFormat.EAN_8,
//         BarcodeFormat.ITF,
//         BarcodeFormat.CODABAR,
//       ]);
//     }

//     hints.set(DecodeHintType.TRY_HARDER, true);
//     codeReaderRef.current = new BrowserMultiFormatReader(hints);
//   }, [scanMode]);

//   /* ================= CAMERA CAPABILITIES ================= */
//   const applyTrackAdvancedSettings = useCallback(async () => {
//     try {
//       const stream = videoRef.current?.srcObject;
//       const track = stream?.getVideoTracks?.()[0];
//       if (!track) return;

//       const capabilities = track.getCapabilities?.() || {};
//       const advanced = {};

//       if (
//         Array.isArray(capabilities.focusMode) &&
//         capabilities.focusMode.includes("continuous")
//       ) {
//         advanced.focusMode = "continuous";
//       }

//       if (capabilities.zoom) {
//         const min = capabilities.zoom.min ?? 1;
//         const max = capabilities.zoom.max ?? 1;
//         advanced.zoom = Math.min(Math.max(1.3, min), max);
//       }

//       if (Object.keys(advanced).length > 0) {
//         await track.applyConstraints({ advanced: [advanced] });
//       }
//     } catch (err) {
//       console.log("applyTrackAdvancedSettings error:", err);
//     }
//   }, []);

//   /* ================= START SCANNER ================= */
//   const startScanner = useCallback(async () => {
//     if (!videoRef.current || !codeReaderRef.current) return;
//     if (isStartingRef.current) return;
//     if (loading || showModal) return;

//     isStartingRef.current = true;
//     isProcessingRef.current = false;

//     try {
//       stopScanner();
//       setCameraSleeping(false);

//       controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
//         {
//           audio: false,
//           video: {
//             facingMode: { ideal: "environment" },
//             width: { ideal: 1280 },
//             height: { ideal: 720 },
//             frameRate: { ideal: 15, max: 18 },
//           },
//         },
//         videoRef.current,
//         (resultObj) => {
//           if (!resultObj) return;
//           if (isProcessingRef.current) return;

//           const text = String(resultObj.getText?.() || "").trim();
//           if (!text) return;

//           const now = Date.now();

//           if (
//             text === lastScannedRef.current &&
//             now - lastScanAtRef.current < DUPLICATE_BLOCK_MS
//           ) {
//             return;
//           }

//           lastScannedRef.current = text;
//           lastScanAtRef.current = now;

//           resetSleepTimer();

//           if (scanMode === "BARCODE" && !/^[0-9A-Za-z\-]+$/.test(text)) {
//             return;
//           }

//           if (!isValidCode(text)) {
//             navigator.vibrate?.(180);
//             showErrorToast("❌ Vui lòng quét mã 15");
//             return;
//           }

//           isProcessingRef.current = true;

//           playBeep();
//           navigator.vibrate?.(80);

//           stopScanner();
//           setQrData(text);
//           setShowModal(true);
//         }
//       );

//       const stream = videoRef.current?.srcObject;
//       streamRef.current = stream || null;

//       await applyTrackAdvancedSettings();

//       setCameraOn(true);
//       resetSleepTimer();
//     } catch (err) {
//       console.error("Camera error:", err);
//       setCameraOn(false);
//       showErrorToast("❌ Không mở được camera");
//     } finally {
//       isStartingRef.current = false;
//     }
//   }, [
//     applyTrackAdvancedSettings,
//     isValidCode,
//     loading,
//     playBeep,
//     resetSleepTimer,
//     scanMode,
//     showErrorToast,
//     showModal,
//     stopScanner,
//   ]);

//   /* ================= EFFECT ================= */
//   useEffect(() => {
//     initReader();
//   }, [initReader]);

//   useEffect(() => {
//     if (!showModal) {
//       startScanner();
//     }

//     return () => {
//       stopScanner();
//     };
//   }, [startScanner, stopScanner, scanMode, showModal]);

//   useEffect(() => {
//     return () => {
//       clearSleepTimer();
//       clearToastTimer();

//       try {
//         audioCtxRef.current?.close?.();
//       } catch {}
//     };
//   }, [clearSleepTimer, clearToastTimer]);

//   /* ================= RESTART ================= */
//   const restartScanner = useCallback(async () => {
//     setShowModal(false);
//     setQrData(null);
//     setResult(1);
//     isProcessingRef.current = false;
//     await startScanner();
//   }, [startScanner]);

//   const handleWakeCamera = async () => {
//     await startScanner();
//   };

//   /* ================= CONFIRM ================= */
//   const handleConfirm = async () => {
//     const finalCode = String(qrData || "").trim();

//     if (!finalCode) {
//       showToast("error", "❌ Mã không hợp lệ");
//       return;
//     }

//     if (!isValidCode(finalCode)) {
//       showToast("error", "❌ Vui lòng quét mã 15");
//       return;
//     }

//     setLoading(true);

//     try {
//       await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
//         qrCode: finalCode,
//         result,
//         inspectionType: "OQC",
//         scanType: scanMode,
//         inputType: "SCAN",
//       });

//       showToast("success", "✅ Lưu kết quả thành công");

//       setShowModal(false);
//       setQrData(null);
//       setResult(1);
//       isProcessingRef.current = false;

//       await startScanner();
//     } catch (err) {
//       console.error(err);
//       showToast("error", "❌ Không thể lưu kết quả");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = async () => {
//     await restartScanner();
//   };

//   const handleToggleMode = async () => {
//     stopScanner();
//     setCameraSleeping(false);
//     setShowModal(false);
//     setQrData(null);
//     setResult(1);
//     isProcessingRef.current = false;
//     setScanMode((prev) => (prev === "BARCODE" ? "QRCODE" : "BARCODE"));
//   };

//   /* ================= UI ================= */
//   return (

    
//     <div className="fixed inset-0 bg-black overflow-hidden">

//       <style>{`
//   .scan-line {
//     will-change: transform;
//     transform: translate3d(0, 0, 0);
//     animation: scanY 2.2s linear infinite;
//   }

//   @keyframes scanY {
//     0% {
//       transform: translate3d(0, 0, 0);
//     }
//     50% {
//       transform: translate3d(0, 165px, 0);
//     }
//     100% {
//       transform: translate3d(0, 0, 0);
//     }
//   }

//   @media (min-width: 640px) {
//     @keyframes scanY {
//       0% {
//         transform: translate3d(0, 0, 0);
//       }
//       50% {
//         transform: translate3d(0, 188px, 0);
//       }
//       100% {
//         transform: translate3d(0, 0, 0);
//       }
//     }
//   }
// `}</style>

//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         className="absolute inset-0 w-full h-full object-cover"
//       />

//       <div className="absolute inset-0 bg-black/10 pointer-events-none" />

//       <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
//         <button
//           onClick={() => {
//             stopScanner();
//             navigate(-1);
//           }}
//           className="bg-white/25 backdrop-blur-md text-white p-3 rounded-full active:scale-95 transition"
//         >
//           <FaArrowLeft />
//         </button>

//         <div className="text-center">
//           <h1 className="text-white font-semibold text-sm sm:text-base">
//             {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
//           </h1>
//           <div className="text-white/70 text-[11px] mt-1">
//             {cameraOn ? "Camera đang hoạt động" : "Camera đang tạm dừng"}
//           </div>
//         </div>

//         <button
//           onClick={handleToggleMode}
//           className="bg-white/25 backdrop-blur-md text-white px-3 py-2 rounded-full text-xs flex items-center gap-2 active:scale-95 transition"
//         >
//           {scanMode === "BARCODE" ? (
//             <>
//               <FaQrcode /> QR
//             </>
//           ) : (
//             <>
//               <FaBarcode /> Barcode
//             </>
//           )}
//         </button>
//       </div>

//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
//         <div className="relative w-full max-w-[320px] h-[250px] sm:max-w-[360px] sm:h-[280px] flex items-center justify-center">
//           <div className="absolute inset-0 rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />

//           <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-emerald-400/80" />

//           <div className="absolute -top-10 left-0 right-0 text-center text-white/90 text-sm font-medium">
//             Đưa mã vào giữa khung để quét nhanh hơn
//           </div>

//           <div className="absolute inset-0 flex items-center justify-center">
//             {scanMode === "BARCODE" ? (
//               <FaBarcode className="text-white text-[180px] sm:text-[220px] opacity-10" />
//             ) : (
//               <FaQrcode className="text-white text-[180px] sm:text-[220px] opacity-10" />
//             )}
//           </div>

          
//     {cameraOn && !cameraSleeping && !showModal && (
//   <div className="absolute left-4 right-4 top-[15%] h-[2px]">
//     <div className="scan-line h-[2px] w-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
//   </div>
// )}
//         </div>
//       </div>

//       <AnimatePresence>
//         {cameraSleeping && !showModal && (
//           <motion.button
//             type="button"
//             onClick={handleWakeCamera}
//             className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-5"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-6 text-white text-center shadow-2xl">
//               <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
//                 <FaPowerOff className="text-2xl" />
//               </div>

//               <div className="text-lg font-semibold">
//                 Camera đã tạm tắt sau 30 giây
//               </div>

//               <div className="mt-2 text-sm text-white/75 leading-6">
//                 Để giảm nóng máy và đỡ hao pin khi không quét được mã.
//               </div>

//               <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium">
//                 <FaCamera />
//                 Chạm để mở lại camera
//               </div>
//             </div>
//           </motion.button>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {showModal && (
//           <motion.div
//             className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 px-4"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.div
//               className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-5 shadow-xl"
//               initial={{ scale: 0.92, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               exit={{ scale: 0.92, opacity: 0 }}
//             >
//               <h2 className="text-lg font-semibold text-center text-gray-700">
//                 Xác nhận mã
//               </h2>

//               <input
//                 autoFocus
//                 value={qrData || ""}
//                 onChange={(e) => setQrData(e.target.value)}
//                 className="w-full p-3 text-center text-base sm:text-lg border rounded-2xl focus:ring-2 focus:ring-sky-400 outline-none"
//               />

//               <div className="flex flex-col gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setResult(1)}
//                   className={`flex items-center justify-center gap-2 h-12 rounded-2xl border transition ${
//                     result === 1
//                       ? "bg-emerald-100 border-emerald-500"
//                       : "border-emerald-300"
//                   }`}
//                 >
//                   <FaCheckCircle className="text-emerald-500" />
//                   Đạt
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setResult(0)}
//                   className={`flex items-center justify-center gap-2 h-12 rounded-2xl border transition ${
//                     result === 0
//                       ? "bg-rose-100 border-rose-500"
//                       : "border-rose-300"
//                   }`}
//                 >
//                   <FaTimesCircle className="text-rose-500" />
//                   Không đạt
//                 </button>

//                 <button
//                   type="button"
//                   onClick={() => setResult(2)}
//                   className={`flex items-center justify-center gap-2 h-12 rounded-2xl border transition ${
//                     result === 2
//                       ? "bg-yellow-100 border-yellow-500"
//                       : "border-yellow-300"
//                   }`}
//                 >
//                   Giao đặc biệt
//                 </button>
//               </div>

//               <div className="flex gap-3 pt-1">
//                 <button
//                   onClick={handleCancel}
//                   disabled={loading}
//                   className="flex-1 py-3 rounded-2xl border hover:bg-gray-50 disabled:opacity-60"
//                 >
//                   Huỷ
//                 </button>

//                 <button
//                   onClick={handleConfirm}
//                   disabled={loading}
//                   className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition disabled:opacity-70"
//                 >
//                   {loading ? (
//                     <>
//                       <FaSpinner className="animate-spin" />
//                       Đang lưu...
//                     </>
//                   ) : (
//                     "Xác nhận"
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {toast && (
//           <motion.div
//             className="fixed bottom-6 inset-x-0 flex justify-center z-[60] px-4"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 10 }}
//             onClick={() => setToast(null)}
//           >
//             <div className="bg-white px-5 py-3 rounded-full shadow-lg max-w-full">
//               <span
//                 className={`text-sm font-medium ${
//                   toast.type === "success"
//                     ? "text-emerald-600"
//                     : "text-rose-600"
//                 }`}
//               >
//                 {toast.message}
//               </span>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// export default Result;



import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaQrcode,
  FaBarcode,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaArrowLeft,
  FaPowerOff,
  FaCamera,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const AUTO_SLEEP_MS = 30000;
const DUPLICATE_BLOCK_MS = 1200;

function Result() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);
  const streamRef = useRef(null);
  const sleepTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const audioCtxRef = useRef(null);

  const isStartingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const lastScannedRef = useRef("");
  const lastScanAtRef = useRef(0);

  const [scanMode, setScanMode] = useState("BARCODE");
  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraSleeping, setCameraSleeping] = useState(false);

  const isValidCode = useCallback((value) => {
    const text = String(value || "").trim().toUpperCase();
    return text.startsWith("15");
  }, []);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (type, message, duration = 1800) => {
      clearToastTimer();
      setToast({ type, message });

      if (duration > 0) {
        toastTimerRef.current = setTimeout(() => {
          setToast(null);
        }, duration);
      }
    },
    [clearToastTimer]
  );

  const showErrorToast = useCallback(
    (message) => showToast("error", message, 1500),
    [showToast]
  );

  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        ctx.currentTime + 0.12
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.12);
    } catch (err) {
      console.log("playBeep error:", err);
    }
  }, []);

  const clearSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    try {
      const stream = streamRef.current || videoRef.current?.srcObject;
      if (stream?.getTracks) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch {}
        });
      }
    } catch {}

    streamRef.current = null;

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch {}
    }
  }, []);

  const stopScanner = useCallback(() => {
    clearSleepTimer();

    try {
      controlsRef.current?.stop();
    } catch {}

    controlsRef.current = null;
    stopTracks();
    setCameraOn(false);
    isStartingRef.current = false;
  }, [clearSleepTimer, stopTracks]);

  const sleepCamera = useCallback(() => {
    stopScanner();
    setCameraSleeping(true);
  }, [stopScanner]);

  const resetSleepTimer = useCallback(() => {
    clearSleepTimer();
    sleepTimerRef.current = setTimeout(() => {
      sleepCamera();
    }, AUTO_SLEEP_MS);
  }, [clearSleepTimer, sleepCamera]);

  const initReader = useCallback(() => {
    const hints = new Map();

    if (scanMode === "QRCODE") {
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    } else {
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.ITF,
        BarcodeFormat.CODABAR,
      ]);
    }

    hints.set(DecodeHintType.TRY_HARDER, true);
    codeReaderRef.current = new BrowserMultiFormatReader(hints);
  }, [scanMode]);

  const applyTrackAdvancedSettings = useCallback(async () => {
    try {
      const stream = videoRef.current?.srcObject;
      const track = stream?.getVideoTracks?.()[0];
      if (!track) return;

      const capabilities = track.getCapabilities?.() || {};
      const advanced = {};

      if (
        Array.isArray(capabilities.focusMode) &&
        capabilities.focusMode.includes("continuous")
      ) {
        advanced.focusMode = "continuous";
      }

      if (capabilities.zoom) {
        const min = capabilities.zoom.min ?? 1;
        const max = capabilities.zoom.max ?? 1;
        advanced.zoom = Math.min(Math.max(1.3, min), max);
      }

      if (Object.keys(advanced).length > 0) {
        await track.applyConstraints({ advanced: [advanced] });
      }
    } catch (err) {
      console.log("applyTrackAdvancedSettings error:", err);
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current || !codeReaderRef.current) return;
    if (isStartingRef.current) return;
    if (loading || showModal) return;

    isStartingRef.current = true;
    isProcessingRef.current = false;

    try {
      stopScanner();
      setCameraSleeping(false);

      controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 15, max: 18 },
          },
        },
        videoRef.current,
        (resultObj) => {
          if (!resultObj) return;
          if (isProcessingRef.current) return;

          const text = String(resultObj.getText?.() || "").trim();
          if (!text) return;

          const now = Date.now();

          if (
            text === lastScannedRef.current &&
            now - lastScanAtRef.current < DUPLICATE_BLOCK_MS
          ) {
            return;
          }

          lastScannedRef.current = text;
          lastScanAtRef.current = now;

          resetSleepTimer();

          if (scanMode === "BARCODE" && !/^[0-9A-Za-z\-]+$/.test(text)) {
            return;
          }

          if (!isValidCode(text)) {
            navigator.vibrate?.(180);
            showErrorToast("❌ Vui lòng quét mã 15");
            return;
          }

          isProcessingRef.current = true;

          playBeep();
          navigator.vibrate?.(80);

          stopScanner();
          setQrData(String(text).trim().toUpperCase());
          setShowModal(true);
        }
      );

      const stream = videoRef.current?.srcObject;
      streamRef.current = stream || null;

      await applyTrackAdvancedSettings();

      setCameraOn(true);
      resetSleepTimer();
    } catch (err) {
      console.error("Camera error:", err);
      setCameraOn(false);
      showErrorToast("❌ Không mở được camera");
    } finally {
      isStartingRef.current = false;
    }
  }, [
    applyTrackAdvancedSettings,
    isValidCode,
    loading,
    playBeep,
    resetSleepTimer,
    scanMode,
    showErrorToast,
    showModal,
    stopScanner,
  ]);

  useEffect(() => {
    initReader();
  }, [initReader]);

  useEffect(() => {
    if (!showModal) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner, scanMode, showModal]);

  useEffect(() => {
    return () => {
      clearSleepTimer();
      clearToastTimer();

      try {
        audioCtxRef.current?.close?.();
      } catch {}
    };
  }, [clearSleepTimer, clearToastTimer]);

  const restartScanner = useCallback(async () => {
    setShowModal(false);
    setQrData(null);
    setResult(1);
    isProcessingRef.current = false;
    await startScanner();
  }, [startScanner]);

  const handleWakeCamera = async () => {
    isProcessingRef.current = false;
    await startScanner();
  };

  const handleConfirm = async () => {
    const finalCode = String(qrData || "").trim().toUpperCase();

    if (!finalCode) {
      showToast("error", "❌ Mã không hợp lệ");
      return;
    }

    if (!isValidCode(finalCode)) {
      showToast("error", "❌ Vui lòng quét mã 15");
      return;
    }

    setLoading(true);

    try {
      const response = await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: finalCode,
        result,
        inspectionType: "OQC",
        scanType: scanMode,
        inputType: "SCAN",
      });

      showToast(
        "success",
        response?.data?.message || "✅ Lưu kết quả thành công"
      );

      setShowModal(false);
      setQrData(null);
      setResult(1);
      isProcessingRef.current = false;

      await startScanner();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message = data?.message;

      if (status === 409) {
        const lastScan = data?.data;

        if (lastScan?.employeeName && lastScan?.inspectionDateTime) {
          showToast(
            "error",
            `⚠️ Mã này đã được ${lastScan.employeeName} quét trong 24 giờ gần nhất`,
            2800
          );
        } else {
          showToast(
            "error",
            `⚠️ ${message || "Mã này đã quét trong 24 giờ gần nhất"}`,
            2800
          );
        }

        setShowModal(false);
        setQrData(null);
        setResult(1);
        isProcessingRef.current = false;

        await startScanner();
        return;
      }

      if (status === 400) {
        showToast(
          "error",
          `❌ ${message || "Dữ liệu không hợp lệ"}`,
          2200
        );
        return;
      }

      showToast(
        "error",
        `❌ ${message || "Không thể lưu kết quả"}`,
        2200
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await restartScanner();
  };

  const handleToggleMode = async () => {
    stopScanner();
    setCameraSleeping(false);
    setShowModal(false);
    setQrData(null);
    setResult(1);
    isProcessingRef.current = false;
    setScanMode((prev) => (prev === "BARCODE" ? "QRCODE" : "BARCODE"));
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <style>{`
        .scan-line {
          will-change: transform;
          transform: translate3d(0, 0, 0);
          animation: scanY 2.2s linear infinite;
        }

        @keyframes scanY {
          0% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, 165px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (min-width: 640px) {
          @keyframes scanY {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, 188px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
        }
      `}</style>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between">
        <button
          onClick={() => {
            stopScanner();
            navigate(-1);
          }}
          className="bg-white/25 backdrop-blur-md text-white p-3 rounded-full active:scale-95 transition"
        >
          <FaArrowLeft />
        </button>

        <div className="text-center">
          <h1 className="text-white font-semibold text-sm sm:text-base">
            {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
          </h1>
          <div className="text-white/70 text-[11px] mt-1">
            {cameraOn ? "Camera đang hoạt động" : "Camera đang tạm dừng"}
          </div>
        </div>

        <button
          onClick={handleToggleMode}
          className="bg-white/25 backdrop-blur-md text-white px-3 py-2 rounded-full text-xs flex items-center gap-2 active:scale-95 transition"
        >
          {scanMode === "BARCODE" ? (
            <>
              <FaQrcode /> QR
            </>
          ) : (
            <>
              <FaBarcode /> Barcode
            </>
          )}
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
        <div className="relative w-full max-w-[320px] h-[250px] sm:max-w-[360px] sm:h-[280px] flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />

          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-emerald-400/80" />

          <div className="absolute -top-10 left-0 right-0 text-center text-white/90 text-sm font-medium">
            Đưa mã vào giữa khung để quét nhanh hơn
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            {scanMode === "BARCODE" ? (
              <FaBarcode className="text-white text-[180px] sm:text-[220px] opacity-10" />
            ) : (
              <FaQrcode className="text-white text-[180px] sm:text-[220px] opacity-10" />
            )}
          </div>

          {cameraOn && !cameraSleeping && !showModal && (
            <div className="absolute left-4 right-4 top-[15%] h-[2px]">
              <div className="scan-line h-[2px] w-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {cameraSleeping && !showModal && (
          <motion.button
            type="button"
            onClick={handleWakeCamera}
            className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-6 text-white text-center shadow-2xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <FaPowerOff className="text-2xl" />
              </div>

              <div className="text-lg font-semibold">
                Camera đã tạm tắt sau 30 giây
              </div>

              <div className="mt-2 text-sm text-white/75 leading-6">
                Để giảm nóng máy và đỡ hao pin khi không quét được mã.
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium">
                <FaCamera />
                Chạm để mở lại camera
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-5 shadow-xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
            >
              <h2 className="text-lg font-semibold text-center text-gray-700">
                Xác nhận mã
              </h2>

              <input
                autoFocus
                value={qrData || ""}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full p-3 text-center text-base sm:text-lg border rounded-2xl focus:ring-2 focus:ring-sky-400 outline-none"
              />

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setResult(1)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-2xl border transition ${
                    result === 1
                      ? "bg-emerald-100 border-emerald-500"
                      : "border-emerald-300"
                  }`}
                >
                  <FaCheckCircle className="text-emerald-500" />
                  Đạt
                </button>

                <button
                  type="button"
                  onClick={() => setResult(0)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-2xl border transition ${
                    result === 0
                      ? "bg-rose-100 border-rose-500"
                      : "border-rose-300"
                  }`}
                >
                  <FaTimesCircle className="text-rose-500" />
                  Không đạt
                </button>

                <button
                  type="button"
                  onClick={() => setResult(2)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-2xl border transition ${
                    result === 2
                      ? "bg-yellow-100 border-yellow-500"
                      : "border-yellow-300"
                  }`}
                >
                  Giao đặc biệt
                </button>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl border hover:bg-gray-50 disabled:opacity-60"
                >
                  Huỷ
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 inset-x-0 flex justify-center z-[60] px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setToast(null)}
          >
            <div className="bg-white px-5 py-3 rounded-full shadow-lg max-w-full">
              <span
                className={`text-sm font-medium ${
                  toast.type === "success"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {toast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Result;
