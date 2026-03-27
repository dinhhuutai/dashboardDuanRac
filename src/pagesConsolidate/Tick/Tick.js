// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { BrowserMultiFormatReader } from "@zxing/browser";
// import { BarcodeFormat, DecodeHintType } from "@zxing/library";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   FaQrcode,
//   FaBarcode,
//   FaSpinner,
//   FaArrowLeft,
// } from "react-icons/fa";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";

// function Tick() {
//   const navigate = useNavigate();
//   const videoRef = useRef(null);
//   const codeReaderRef = useRef(null);
//   const controlsRef = useRef(null);

//   const [scanMode, setScanMode] = useState("BARCODE");
//   const [qrData, setQrData] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [result, setResult] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);

//   /* ================= VALIDATE ================= */
//   const isValidCode = (value) => {
//     if (!value) return false;
//     const text = String(value).trim();

//     // chỉ cho phép mã bắt đầu bằng 15
//     return text.startsWith("15");
//   };

//   const showErrorToast = (message) => {
//     setToast({
//       type: "error",
//       message,
//     });
//   };

//   /* ================= BEEP ================= */
//   const playBeep = () => {
//     const ctx = new (window.AudioContext || window.webkitAudioContext)();
//     const oscillator = ctx.createOscillator();
//     const gainNode = ctx.createGain();

//     oscillator.connect(gainNode);
//     gainNode.connect(ctx.destination);

//     oscillator.frequency.value = 1200;
//     oscillator.start();

//     gainNode.gain.exponentialRampToValueAtTime(
//       0.00001,
//       ctx.currentTime + 0.2
//     );
//   };

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

//   /* ================= START SCANNER ================= */
//   const startScanner = useCallback(async () => {
//     if (!videoRef.current || !codeReaderRef.current) return;

//     try {
//       controlsRef.current =
//         await codeReaderRef.current.decodeFromConstraints(
//           {
//             video: {
//               facingMode: "environment",
//               width: { ideal: 1920 },
//               height: { ideal: 1080 },
//             },
//           },
//           videoRef.current,
//           (result, err) => {
//             if (result) {
//               const text = result.getText().trim();

//               if (scanMode === "BARCODE") {
//                 if (!/^[0-9A-Za-z\-]+$/.test(text)) {
//                   return;
//                 }
//               }

//               // kiểm tra đầu mã phải là 15
//               if (!isValidCode(text)) {
//                 controlsRef.current?.stop();
//                 navigator.vibrate?.(250);
//                 showErrorToast("❌ Vui lòng quét mã 15");
//                 setTimeout(() => {
//                   startScanner();
//                 }, 800);
//                 return;
//               }

//               playBeep();
//               navigator.vibrate?.(150);

//               controlsRef.current?.stop();
//               setQrData(text);
//               setShowModal(true);
//             }
//           }
//         );
//     } catch (err) {
//       console.error("Camera error:", err);
//     }
//   }, [scanMode]);

//   /* ================= EFFECT ================= */
//   useEffect(() => {
//     initReader();
//   }, [initReader]);

//   useEffect(() => {
//     startScanner();
//     return () => {
//       controlsRef.current?.stop();
//     };
//   }, [startScanner, scanMode]);

//   /* ================= RESTART ================= */
//   const restartScanner = async () => {
//     controlsRef.current?.stop();
//     await startScanner();
//   };

//   /* ================= CONFIRM ================= */
//   const handleConfirm = async () => {
//     const finalCode = (qrData || "").trim();

//     if (!isValidCode(finalCode)) {
//       showErrorToast("❌ Vui lòng quét mã 15");
//       return;
//     }

//     setLoading(true);
//     try {
//       await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
//         qrCode: finalCode,
//         result,
//         inspectionType: "GOM",
//         scanType: scanMode,
//         inputType: "SCAN",
//       });

//       setToast({
//         type: "success",
//         message: "✅ Lưu kết quả thành công",
//       });

//       setShowModal(false);
//       setQrData(null);
//       setResult(1);

//       await restartScanner();
//     } catch {
//       setToast({
//         type: "error",
//         message: "❌ Không thể lưu kết quả",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = async () => {
//     setShowModal(false);
//     setQrData(null);
//     setResult(1);
//     await restartScanner();
//   };

//   /* ================= UI ================= */
//   return (
//     <div className="fixed inset-0 bg-black">
//       <video
//         ref={videoRef}
//         autoPlay
//         playsInline
//         muted
//         className="absolute inset-0 w-full h-full object-cover"
//       />

//       <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-6 pb-4 flex items-center justify-between">
//         <button
//           onClick={() => navigate(-1)}
//           className="bg-white/30 backdrop-blur-md text-white p-3 rounded-full"
//         >
//           <FaArrowLeft />
//         </button>

//         <h1 className="text-white font-semibold">
//           {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
//         </h1>

//         <button
//           onClick={() =>
//             setScanMode(scanMode === "BARCODE" ? "QRCODE" : "BARCODE")
//           }
//           className="bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-full text-xs flex items-center gap-2"
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

//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//         <div className="relative w-80 h-80 flex items-center justify-center">
//           <div className="absolute inset-0 border-2 border-white/70 rounded-3xl" />

//           <div className="absolute inset-0 flex items-center justify-center">
//             {scanMode === "BARCODE" ? (
//               <FaBarcode className="text-white text-[220px] opacity-10" />
//             ) : (
//               <FaQrcode className="text-white text-[220px] opacity-10" />
//             )}
//           </div>

//           <motion.div
//             className="absolute left-4 right-4 h-[2px] bg-emerald-400"
//             animate={{ top: ["10%", "85%", "10%"] }}
//             transition={{ repeat: Infinity, duration: 2 }}
//           />
//         </div>
//       </div>

//       <AnimatePresence>
//         {showModal && (
//           <motion.div
//             className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.div
//               className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
//               initial={{ scale: 0.9 }}
//               animate={{ scale: 1 }}
//               exit={{ scale: 0.9 }}
//             >
//               <h2 className="text-lg font-bold text-center">
//                 Xác nhận mã
//               </h2>

//               <input
//                 type="text"
//                 value={qrData || ""}
//                 onChange={(e) => setQrData(e.target.value)}
//                 className="w-full p-3 border rounded-xl"
//               />

//               <div className="flex gap-3 pt-2">
//                 <button
//                   onClick={handleCancel}
//                   className="flex-1 py-3 rounded-xl border"
//                 >
//                   Huỷ
//                 </button>

//                 <button
//                   onClick={handleConfirm}
//                   disabled={loading}
//                   className="flex-1 py-3 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-2"
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
//             className="fixed bottom-6 inset-x-0 flex justify-center z-50"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setToast(null)}
//           >
//             <div className="bg-white px-5 py-3 rounded-full shadow-lg">
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

// export default Tick;



import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaQrcode,
  FaBarcode,
  FaSpinner,
  FaArrowLeft,
  FaPowerOff,
  FaCamera,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const AUTO_SLEEP_MS = 30000;
const DUPLICATE_BLOCK_MS = 1200;

function Tick() {
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
    if (!value) return false;
    const text = String(value).trim();
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
          if (!resultObj || isProcessingRef.current) return;

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
          setQrData(text);
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
    const finalCode = String(qrData || "").trim();

    if (!isValidCode(finalCode)) {
      showErrorToast("❌ Vui lòng quét mã 15");
      return;
    }

    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: finalCode,
        result,
        inspectionType: "GOM",
        scanType: scanMode,
        inputType: "SCAN",
      });

      showToast("success", "✅ Lưu kết quả thành công");

      setShowModal(false);
      setQrData(null);
      setResult(1);
      isProcessingRef.current = false;

      await startScanner();
    } catch (err) {
      console.error(err);
      showToast("error", "❌ Không thể lưu kết quả");
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
    <>
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
            transform: translate3d(0, 240px, 0);
          }
          100% {
            transform: translate3d(0, 0, 0);
          }
        }

        @media (min-width: 768px) {
          @keyframes scanY {
            0% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, 250px, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between gap-2 md:pt-6">
          <button
            onClick={() => {
              stopScanner();
              navigate(-1);
            }}
            className="h-11 w-11 shrink-0 rounded-full bg-white/20 text-white border border-white/20 flex items-center justify-center"
          >
            <FaArrowLeft />
          </button>

          <div className="text-center px-2">
            <h1 className="text-white font-semibold text-sm md:text-base">
              {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
            </h1>
            <div className="text-white/70 text-[11px] mt-1">
              {cameraOn ? "Camera đang hoạt động" : "Camera đang tạm dừng"}
            </div>
          </div>

          <button
            onClick={handleToggleMode}
            className="h-11 shrink-0 rounded-full bg-white/20 text-white px-3 text-xs flex items-center gap-2 border border-white/20"
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

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
          <div className="relative w-full max-w-[320px] h-[320px] md:max-w-[360px] md:h-[360px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-[28px] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.20)]" />

            <div className="absolute inset-0 rounded-[28px] overflow-hidden">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-2xl" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-2xl" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-2xl" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-2xl" />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              {scanMode === "BARCODE" ? (
                <FaBarcode className="text-white text-[160px] md:text-[220px] opacity-10" />
              ) : (
                <FaQrcode className="text-white text-[160px] md:text-[220px] opacity-10" />
              )}
            </div>

            {cameraOn && !cameraSleeping && !showModal && (
              <div className="absolute left-4 right-4 top-[12%] h-[2px] overflow-visible">
                <div className="scan-line h-[2px] w-full rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-7 left-0 right-0 z-20 px-6 text-center pointer-events-none">
          <p className="text-white/90 text-sm md:text-base font-medium">
            Đưa mã vào trong khung để quét tự động
          </p>
        </div>

        <AnimatePresence>
          {cameraSleeping && !showModal && (
            <motion.button
              type="button"
              onClick={handleWakeCamera}
              className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center px-5"
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
              className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-xl"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
              >
                <h2 className="text-lg font-semibold text-center text-slate-700">
                  Xác nhận mã
                </h2>

                <input
                  type="text"
                  value={qrData || ""}
                  onChange={(e) => setQrData(e.target.value)}
                  className="w-full p-3 text-center text-base sm:text-lg border rounded-2xl focus:ring-2 focus:ring-emerald-400 outline-none"
                />

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 py-3 rounded-2xl border hover:bg-slate-50 disabled:opacity-60"
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
              <div className="bg-white px-5 py-3 rounded-2xl shadow-lg max-w-full border border-slate-100">
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
    </>
  );
}

export default Tick;
