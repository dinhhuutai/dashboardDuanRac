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
// } from "react-icons/fa";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";

// function Result() {
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
//     const text = String(value || "").trim();
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
//       controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
//         {
//           video: {
//             facingMode: "environment",
//             width: { ideal: 1920 },
//             height: { ideal: 1080 },
//           },
//         },
//         videoRef.current,
//         (resultObj, err) => {
//           if (resultObj) {
//             const text = resultObj.getText().trim();

//             if (scanMode === "BARCODE") {
//               if (!/^[0-9A-Za-z\-]+$/.test(text)) return;
//             }

//             if (!isValidCode(text)) {
//               controlsRef.current?.stop();
//               navigator.vibrate?.(250);
//               showErrorToast("❌ Vui lòng quét mã 15");

//               setTimeout(() => {
//                 startScanner();
//               }, 800);

//               return;
//             }

//             playBeep();
//             navigator.vibrate?.(150);

//             controlsRef.current?.stop();
//             setQrData(text);
//             setShowModal(true);
//           }
//         }
//       );
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
//     const finalCode = String(qrData || "").trim();

//     if (!finalCode) {
//       setToast({
//         type: "error",
//         message: "❌ Mã không hợp lệ",
//       });
//       return;
//     }

//     if (!isValidCode(finalCode)) {
//       setToast({
//         type: "error",
//         message: "❌ Vui lòng quét mã 15",
//       });
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
//             className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//           >
//             <motion.div
//               className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 space-y-5 shadow-xl"
//               initial={{ scale: 0.9 }}
//               animate={{ scale: 1 }}
//               exit={{ scale: 0.9 }}
//             >
//               <h2 className="text-lg font-semibold text-center text-gray-700">
//                 Xác nhận mã
//               </h2>

//               <input
//                 autoFocus
//                 value={qrData || ""}
//                 onChange={(e) => setQrData(e.target.value)}
//                 className="w-full p-3 text-center text-lg border rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
//               />

//               <div className="flex flex-col gap-3">
//                 <div
//                   onClick={() => setResult(1)}
//                   className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${
//                     result === 1
//                       ? "bg-emerald-200 border-emerald-500"
//                       : "border-emerald-300"
//                   }`}
//                 >
//                   <FaCheckCircle className="text-emerald-500" />
//                   Đạt
//                 </div>

//                 <div
//                   onClick={() => setResult(0)}
//                   className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${
//                     result === 0
//                       ? "bg-rose-200 border-rose-500"
//                       : "border-rose-300"
//                   }`}
//                 >
//                   <FaTimesCircle className="text-rose-500" />
//                   Không đạt
//                 </div>

//                 <div
//                   onClick={() => setResult(2)}
//                   className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${
//                     result === 2
//                       ? "bg-yellow-200 border-yellow-500"
//                       : "border-yellow-300"
//                   }`}
//                 >
//                   Giao đặc biệt
//                 </div>
//               </div>

//               <div className="flex gap-3 pt-2">
//                 <button
//                   onClick={handleCancel}
//                   disabled={loading}
//                   className="flex-1 py-3 rounded-xl border hover:bg-gray-50"
//                 >
//                   Huỷ
//                 </button>

//                 <button
//                   onClick={handleConfirm}
//                   disabled={loading}
//                   className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition"
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
  FaCamera,
  FaBolt,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Result() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);
  const idleTimerRef = useRef(null);
  const isStartingRef = useRef(false);
  const streamRef = useRef(null);
  const nativeScanTimerRef = useRef(null);
  const nativeDetectorRef = useRef(null);
  const lastScanRef = useRef({ text: "", at: 0 });
  const toastTimerRef = useRef(null);

  const [scanMode, setScanMode] = useState("BARCODE"); // BARCODE | QRCODE
  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [supportsTorch, setSupportsTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [engineName, setEngineName] = useState(""); // Native / ZXing

  const SCAN_IDLE_MS = 30000;
  const DUPLICATE_GUARD_MS = 1500;

  /* ================= VALIDATE ================= */
  const isValidCode = (value) => {
    const text = String(value || "").trim();
    return text.startsWith("15");
  };

  const showToast = useCallback((type, message, ms = 2200) => {
    setToast({ type, message });

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, ms);
  }, []);

  /* ================= BEEP ================= */
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 1200;
      oscillator.start();

      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.18);

      oscillator.stop(ctx.currentTime + 0.18);

      setTimeout(() => {
        try {
          ctx.close();
        } catch {}
      }, 250);
    } catch {}
  };

  /* ================= TIMER ================= */
  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const startIdleTimer = useCallback(() => {
    clearIdleTimer();

    idleTimerRef.current = setTimeout(() => {
      if (showModal || loading) return;

      try {
        controlsRef.current?.stop?.();
      } catch {}

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch {}

      if (nativeScanTimerRef.current) {
        clearInterval(nativeScanTimerRef.current);
        nativeScanTimerRef.current = null;
      }

      controlsRef.current = null;
      streamRef.current = null;
      setTorchOn(false);
      setSupportsTorch(false);
      setIsCameraOn(false);
    }, SCAN_IDLE_MS);
  }, [clearIdleTimer, showModal, loading]);

  /* ================= HELPERS ================= */
  const stopScanner = useCallback(() => {
    clearIdleTimer();

    if (nativeScanTimerRef.current) {
      clearInterval(nativeScanTimerRef.current);
      nativeScanTimerRef.current = null;
    }

    try {
      controlsRef.current?.stop?.();
    } catch {}

    controlsRef.current = null;

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    } catch {}

    streamRef.current = null;
    nativeDetectorRef.current = null;
    setTorchOn(false);
    setSupportsTorch(false);
    setIsCameraOn(false);
  }, [clearIdleTimer]);

  const getVideoConstraints = useCallback(() => {
    if (scanMode === "BARCODE") {
      return {
        facingMode: { ideal: "environment" },
        width: { ideal: 1600 },
        height: { ideal: 900 },
      };
    }

    return {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
  }, [scanMode]);

  const isDuplicateRecent = useCallback((text) => {
    const now = Date.now();
    if (
      lastScanRef.current.text === text &&
      now - lastScanRef.current.at < DUPLICATE_GUARD_MS
    ) {
      return true;
    }

    lastScanRef.current = { text, at: now };
    return false;
  }, []);

  const handleDetectedCode = useCallback(
    (rawText) => {
      const text = String(rawText || "").trim();
      if (!text) return;
      if (isDuplicateRecent(text)) return;

      if (scanMode === "BARCODE" && !/^[0-9A-Za-z\-]+$/.test(text)) {
        return;
      }

      if (!isValidCode(text)) {
        playBeep();
        navigator.vibrate?.(220);
        showToast("error", "❌ Vui lòng quét mã 15", 1600);

        stopScanner();

        setTimeout(() => {
          if (!showModal && !loading) {
            startScanner();
          }
        }, 700);

        return;
      }

      playBeep();
      navigator.vibrate?.(120);

      stopScanner();
      setQrData(text);
      setShowModal(true);
    },
    [isDuplicateRecent, scanMode, showModal, loading, stopScanner, showToast]
  );

  const applyCameraEnhancements = useCallback(async () => {
    try {
      const track =
        streamRef.current?.getVideoTracks?.()?.[0] ||
        videoRef.current?.srcObject?.getVideoTracks?.()?.[0];

      if (!track) return;

      const caps = track.getCapabilities?.() || {};
      const advanced = [];

      if (
        caps.focusMode &&
        Array.isArray(caps.focusMode) &&
        caps.focusMode.includes("continuous")
      ) {
        advanced.push({ focusMode: "continuous" });
      }

      if (scanMode === "BARCODE" && caps.zoom) {
        const min = Number(caps.zoom.min ?? 1);
        const max = Number(caps.zoom.max ?? 1);
        const preferred = Math.min(max, Math.max(min, 1.5));
        if (Number.isFinite(preferred)) {
          advanced.push({ zoom: preferred });
        }
      }

      if (caps.torch) {
        setSupportsTorch(true);
      } else {
        setSupportsTorch(false);
      }

      if (advanced.length > 0) {
        await track.applyConstraints({ advanced });
      }
    } catch (err) {
      console.warn("applyCameraEnhancements error:", err);
    }
  }, [scanMode]);

  const toggleTorch = useCallback(async () => {
    try {
      const track =
        streamRef.current?.getVideoTracks?.()?.[0] ||
        videoRef.current?.srcObject?.getVideoTracks?.()?.[0];

      if (!track) return;

      const caps = track.getCapabilities?.() || {};
      if (!caps.torch) return;

      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn("toggleTorch error:", err);
    }
  }, [torchOn]);

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

    codeReaderRef.current = new BrowserMultiFormatReader(hints);
  }, [scanMode]);

  const startNativeBarcodeDetector = useCallback(async () => {
    const DetectorClass = window.BarcodeDetector;
    if (!DetectorClass) return false;
    if (scanMode !== "BARCODE") return false;
    if (!videoRef.current) return false;

    try {
      const supportedFormats = await DetectorClass.getSupportedFormats?.();
      const desiredFormats = [
        "code_128",
        "code_39",
        "ean_13",
        "ean_8",
        "itf",
        "codabar",
      ];

      const formats =
        Array.isArray(supportedFormats) && supportedFormats.length
          ? desiredFormats.filter((f) => supportedFormats.includes(f))
          : desiredFormats;

      if (!formats.length) return false;

      nativeDetectorRef.current = new DetectorClass({ formats });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: getVideoConstraints(),
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await videoRef.current.play().catch(() => {});
      await applyCameraEnhancements();

      setEngineName("Native");
      setIsCameraOn(true);
      startIdleTimer();

      nativeScanTimerRef.current = setInterval(async () => {
        if (!nativeDetectorRef.current || !videoRef.current) return;
        if (showModal || loading) return;

        try {
          const results = await nativeDetectorRef.current.detect(videoRef.current);
          if (results && results.length > 0) {
            const rawValue = results[0]?.rawValue;
            if (rawValue) {
              handleDetectedCode(rawValue);
            }
          }
        } catch (err) {
          console.warn("native detect error:", err);
        }
      }, 120);

      controlsRef.current = {
        stop: () => {
          if (nativeScanTimerRef.current) {
            clearInterval(nativeScanTimerRef.current);
            nativeScanTimerRef.current = null;
          }

          try {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
            }
          } catch {}

          streamRef.current = null;
          nativeDetectorRef.current = null;
        },
      };

      return true;
    } catch (err) {
      console.warn("startNativeBarcodeDetector error:", err);
      return false;
    }
  }, [
    scanMode,
    getVideoConstraints,
    applyCameraEnhancements,
    startIdleTimer,
    showModal,
    loading,
    handleDetectedCode,
  ]);

  const startZXingScanner = useCallback(async () => {
    if (!videoRef.current || !codeReaderRef.current) return false;

    try {
      setEngineName("ZXing");
      setIsCameraOn(true);
      startIdleTimer();

      controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
        {
          video: getVideoConstraints(),
        },
        videoRef.current,
        (resultObj) => {
          if (!resultObj) return;
          const text = resultObj.getText?.()?.trim?.() || "";
          if (!text) return;
          handleDetectedCode(text);
        }
      );

      const stream =
        videoRef.current?.srcObject instanceof MediaStream
          ? videoRef.current.srcObject
          : null;

      if (stream) {
        streamRef.current = stream;
        await applyCameraEnhancements();
      }

      return true;
    } catch (err) {
      console.error("ZXing camera error:", err);
      setIsCameraOn(false);
      return false;
    }
  }, [
    getVideoConstraints,
    startIdleTimer,
    handleDetectedCode,
    applyCameraEnhancements,
  ]);

  /* ================= START SCANNER ================= */
  const startScanner = useCallback(async () => {
    if (isStartingRef.current) return;
    if (showModal || loading) return;
    if (!videoRef.current) return;

    isStartingRef.current = true;

    try {
      stopScanner();

      let started = false;

      if (scanMode === "BARCODE" && "BarcodeDetector" in window) {
        started = await startNativeBarcodeDetector();
      }

      if (!started) {
        started = await startZXingScanner();
      }

      if (!started) {
        setIsCameraOn(false);
        showToast("error", "❌ Không thể mở camera");
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [
    showModal,
    loading,
    stopScanner,
    scanMode,
    startNativeBarcodeDetector,
    startZXingScanner,
    showToast,
  ]);

  const restartScanner = useCallback(async () => {
    stopScanner();
    await startScanner();
  }, [stopScanner, startScanner]);

  /* ================= EFFECT ================= */
  useEffect(() => {
    initReader();
  }, [initReader]);

  useEffect(() => {
    if (!showModal) {
      startScanner();
    }

    return () => {
      clearIdleTimer();
      if (nativeScanTimerRef.current) {
        clearInterval(nativeScanTimerRef.current);
        nativeScanTimerRef.current = null;
      }
      try {
        controlsRef.current?.stop?.();
      } catch {}
      controlsRef.current = null;

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch {}

      streamRef.current = null;
    };
  }, [scanMode, showModal, startScanner, clearIdleTimer]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  /* ================= ACTIONS ================= */
  const handleConfirm = async () => {
    const finalCode = String(qrData || "").trim();

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
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: finalCode,
        result,
        inspectionType: "OQC",
        scanType: scanMode,
        inputType: "SCAN",
      });

      showToast("success", "✅ Lưu kết quả thành công");
      setShowModal(false);
      setQrData(null);
      setResult(1);

      setTimeout(() => {
        restartScanner();
      }, 120);
    } catch (err) {
      console.error(err);
      showToast("error", "❌ Không thể lưu kết quả");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setShowModal(false);
    setQrData(null);
    setResult(1);

    setTimeout(() => {
      restartScanner();
    }, 120);
  };

  const handleWakeCamera = async () => {
    if (showModal || loading) return;
    if (isCameraOn) return;
    await startScanner();
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black" onClick={handleWakeCamera}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(-1);
          }}
          className="bg-white/30 backdrop-blur-md text-white p-3 rounded-full"
        >
          <FaArrowLeft />
        </button>

        <div className="text-center">
          <h1 className="text-white font-semibold">
            {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
          </h1>
          {!!engineName && (
            <div className="text-[11px] text-white/70 mt-0.5">
              Engine: {engineName}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {supportsTorch && isCameraOn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTorch();
              }}
              className={`backdrop-blur-md text-white px-3 py-2 rounded-full text-xs flex items-center gap-2 ${
                torchOn ? "bg-yellow-500/70" : "bg-white/30"
              }`}
            >
              <FaBolt />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setScanMode(scanMode === "BARCODE" ? "QRCODE" : "BARCODE");
            }}
            className="bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-full text-xs flex items-center gap-2"
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
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-80 h-80 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-white/70 rounded-3xl" />

          <div className="absolute inset-0 flex items-center justify-center">
            {scanMode === "BARCODE" ? (
              <FaBarcode className="text-white text-[220px] opacity-10" />
            ) : (
              <FaQrcode className="text-white text-[220px] opacity-10" />
            )}
          </div>

          {isCameraOn && (
            <motion.div
              className="absolute left-4 right-4 h-[2px] bg-emerald-400"
              animate={{ top: ["10%", "85%", "10%"] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </div>
      </div>

      {!isCameraOn && !showModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 z-20 pointer-events-none">
          <div className="text-center text-white px-6">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white/15 flex items-center justify-center">
              <FaCamera className="text-2xl" />
            </div>
            <p className="text-lg font-semibold">Camera đã tạm tắt</p>
            <p className="text-sm opacity-80 mt-2">Chạm màn hình để mở lại</p>
            <p className="text-xs opacity-60 mt-2">
              Tự tắt sau 30 giây để giảm nóng máy
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 space-y-5 shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-lg font-semibold text-center text-gray-700">
                Xác nhận mã
              </h2>

              <input
                autoFocus
                value={qrData || ""}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full p-3 text-center text-lg border rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
              />

              <div className="flex flex-col gap-3">
                <div
                  onClick={() => setResult(1)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${
                    result === 1
                      ? "bg-emerald-200 border-emerald-500"
                      : "border-emerald-300"
                  }`}
                >
                  <FaCheckCircle className="text-emerald-500" />
                  Đạt
                </div>

                <div
                  onClick={() => setResult(0)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${
                    result === 0
                      ? "bg-rose-200 border-rose-500"
                      : "border-rose-300"
                  }`}
                >
                  <FaTimesCircle className="text-rose-500" />
                  Không đạt
                </div>

                <div
                  onClick={() => setResult(2)}
                  className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${
                    result === 2
                      ? "bg-yellow-200 border-yellow-500"
                      : "border-yellow-300"
                  }`}
                >
                  Giao đặc biệt
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border hover:bg-gray-50"
                >
                  Huỷ
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition"
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
            className="fixed bottom-6 inset-x-0 flex justify-center z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setToast(null);
            }}
          >
            <div className="bg-white px-5 py-3 rounded-full shadow-lg">
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
