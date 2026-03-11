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
//       hints.set(DecodeHintType.POSSIBLE_FORMATS, [
//         BarcodeFormat.QR_CODE,
//       ]);
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
//           (resultObj, err) => {
//             if (resultObj) {
//               const text = resultObj.getText();

//               if (scanMode === "BARCODE") {
//                 if (!/^[0-9A-Za-z\-]+$/.test(text)) return;
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
//     setLoading(true);
//     try {
//       await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
//         qrCode: qrData,
//         result,
//         inspectionType: "KCS", // 🔥 giữ KCS
//         scanType: scanMode,
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

//       {/* HEADER */}
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

//       {/* FRAME */}
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

//       {/* MODAL */}
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

//               {/* ĐẠT / KHÔNG ĐẠT */}
//               <div className="flex justify-center gap-6 pt-2">
                
//                             <label className={`flex ${result === 1 && 'bg-emerald-200'} justify-center h-[48px] w-[170px] rounded-xl border border-emerald-500 items-center gap-2 cursor-pointer text-gray-700`}>
//                               <input
//                                 type="radio"
//                                 checked={result === 1}
//                                 onChange={() => setResult(1)}
//                                 className="accent-emerald-500"
//                               />
//                               <FaCheckCircle className="text-emerald-500" />
//                               Đạt
//                             </label>
                
//                             <label className={`flex ${result === 0 && 'bg-rose-200'} justify-center h-[48px] w-[170px] rounded-xl border border-rose-500 items-center gap-2 cursor-pointer text-gray-700`}>
//                               <input
//                                 type="radio"
//                                 checked={result === 0}
//                                 onChange={() => setResult(0)}
//                                 className="accent-rose-500"
//                               />
//                               <FaTimesCircle className="text-rose-500" />
//                               Không đạt
//                             </label>
//               </div>

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

//       {/* TOAST */}
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
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Result() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);

  const [scanMode, setScanMode] = useState("BARCODE");
  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(1);
  const [transQuantity, setTransQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* ================= BEEP ================= */
  const playBeep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 1200;
    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(
      0.00001,
      ctx.currentTime + 0.2
    );
  };

  /* ================= INIT READER ================= */
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

  /* ================= START SCANNER ================= */
  const startScanner = useCallback(async () => {
    if (!videoRef.current || !codeReaderRef.current) return;

    try {
      controlsRef.current = await codeReaderRef.current.decodeFromConstraints(
        {
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (resultObj, err) => {
          if (resultObj) {
            const text = resultObj.getText();

            if (scanMode === "BARCODE") {
              if (!/^[0-9A-Za-z\-]+$/.test(text)) return;
            }

            playBeep();
            navigator.vibrate?.(150);

            controlsRef.current?.stop();
            setQrData(text);
            setShowModal(true);
          }
        }
      );
    } catch (err) {
      console.error("Camera error:", err);
    }
  }, [scanMode]);

  /* ================= EFFECT ================= */
  useEffect(() => {
    initReader();
  }, [initReader]);

  useEffect(() => {
    startScanner();
    return () => {
      controlsRef.current?.stop();
    };
  }, [startScanner, scanMode]);

  /* ================= RESTART ================= */
  const restartScanner = async () => {
    controlsRef.current?.stop();
    await startScanner();
  };

  /* ================= QUANTITY ================= */
  const increaseQuantity = () => {
    setTransQuantity((prev) => Number(prev || 0) + 1);
  };

  const decreaseQuantity = () => {
    setTransQuantity((prev) => {
      const current = Number(prev || 0);
      return current > 0 ? current - 1 : 0;
    });
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setTransQuantity("");
      return;
    }

    const numberValue = Number(value);

    if (!Number.isNaN(numberValue) && numberValue >= 0) {
      setTransQuantity(numberValue);
    }
  };

  /* ================= CONFIRM ================= */
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: qrData,
        result,
        inspectionType: "KCS",
        scanType: scanMode,
        transQuantity: result === 1 ? Number(transQuantity) || 0 : 0,
        inputType: 'SCAN'
      });

      setToast({
        type: "success",
        message: "✅ Lưu kết quả thành công",
      });

      setShowModal(false);
      setQrData(null);
      setResult(1);
      setTransQuantity(0);

      await restartScanner();
    } catch {
      setToast({
        type: "error",
        message: "❌ Không thể lưu kết quả",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setShowModal(false);
    setQrData(null);
    setResult(1);
    setTransQuantity(0);
    await restartScanner();
  };

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="bg-white/30 backdrop-blur-md text-white p-3 rounded-full"
        >
          <FaArrowLeft />
        </button>

        <h1 className="text-white font-semibold">
          {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
        </h1>

        <button
          onClick={() =>
            setScanMode(scanMode === "BARCODE" ? "QRCODE" : "BARCODE")
          }
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

          <motion.div
            className="absolute left-4 right-4 h-[2px] bg-emerald-400"
            animate={{ top: ["10%", "85%", "10%"] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 space-y-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h2 className="text-lg font-bold text-center">Xác nhận mã</h2>

              <input
                type="text"
                value={qrData || ""}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full p-3 border rounded-xl"
              />

              <div className="flex justify-center gap-6 pt-2">
                <label
                  className={`flex ${
                    result === 1 ? "bg-emerald-200" : ""
                  } justify-center h-[48px] w-[170px] rounded-xl border border-emerald-500 items-center gap-2 cursor-pointer text-gray-700`}
                >
                  <input
                    type="radio"
                    checked={result === 1}
                    onChange={() => setResult(1)}
                    className="accent-emerald-500"
                  />
                  <FaCheckCircle className="text-emerald-500" />
                  Đạt
                </label>

                <label
                  className={`flex ${
                    result === 0 ? "bg-rose-200" : ""
                  } justify-center h-[48px] w-[170px] rounded-xl border border-rose-500 items-center gap-2 cursor-pointer text-gray-700`}
                >
                  <input
                    type="radio"
                    checked={result === 0}
                    onChange={() => {setResult(0); setTransQuantity(0)}}
                    className="accent-rose-500"
                  />
                  <FaTimesCircle className="text-rose-500" />
                  Không đạt
                </label>
              </div>

              {result === 1 && (
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số lượng đạt
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={decreaseQuantity}
                      className="h-12 w-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-700"
                    >
                      <FaMinus />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={transQuantity}
                      onChange={handleQuantityChange}
                      className="flex-1 h-12 border rounded-xl text-center text-lg font-semibold outline-none"
                    />

                    <button
                      type="button"
                      onClick={increaseQuantity}
                      className="h-12 w-12 rounded-xl border border-gray-300 flex items-center justify-center text-gray-700"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl border"
                >
                  Huỷ
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 text-white flex items-center justify-center gap-2"
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
            onClick={() => setToast(null)}
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

