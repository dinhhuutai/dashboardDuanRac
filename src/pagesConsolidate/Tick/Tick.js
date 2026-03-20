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
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Tick() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);

  const [scanMode, setScanMode] = useState("BARCODE");
  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* ================= VALIDATE ================= */
  const isValidCode = (value) => {
    if (!value) return false;
    const text = String(value).trim();

    // chỉ cho phép mã bắt đầu bằng 15
    return text.startsWith("15");
  };

  const showErrorToast = (message) => {
    setToast({
      type: "error",
      message,
    });
  };

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
      controlsRef.current =
        await codeReaderRef.current.decodeFromConstraints(
          {
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          videoRef.current,
          (result, err) => {
            if (result) {
              const text = result.getText().trim();

              if (scanMode === "BARCODE") {
                if (!/^[0-9A-Za-z\-]+$/.test(text)) {
                  return;
                }
              }

              // kiểm tra đầu mã phải là 15
              if (!isValidCode(text)) {
                controlsRef.current?.stop();
                navigator.vibrate?.(250);
                showErrorToast("❌ Vui lòng quét mã 15");
                setTimeout(() => {
                  startScanner();
                }, 800);
                return;
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

  /* ================= CONFIRM ================= */
  const handleConfirm = async () => {
    const finalCode = (qrData || "").trim();

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

      setToast({
        type: "success",
        message: "✅ Lưu kết quả thành công",
      });

      setShowModal(false);
      setQrData(null);
      setResult(1);

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
              <h2 className="text-lg font-bold text-center">
                Xác nhận mã
              </h2>

              <input
                type="text"
                value={qrData || ""}
                onChange={(e) => setQrData(e.target.value)}
                className="w-full p-3 border rounded-xl"
              />

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

export default Tick;



