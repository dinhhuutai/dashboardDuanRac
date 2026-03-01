import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QrScanner from "qr-scanner";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaQrcode,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Result() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  /* ================= INIT SCANNER ================= */
  useEffect(() => {
    if (!videoRef.current) return;

    scannerRef.current = new QrScanner(
      videoRef.current,
      (res) => {
        scannerRef.current?.stop();
        setQrData(res.data);
        setShowModal(true);
      },
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scannerRef.current.start();

    return () => {
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
    };
  }, []);

  /* ================= CONFIRM ================= */
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: qrData,
        result,
        inspectionType: 'OQC'
      });

      setToast({ type: "success", message: "✅ Lưu kết quả thành công" });
      setShowModal(false);
      setQrData(null);
      setResult(1);
      scannerRef.current?.start();
    } catch {
      setToast({ type: "error", message: "❌ Không thể lưu kết quả" });
    } finally {
      setLoading(false);
    }
  };

  /* ================= CANCEL ================= */
  const handleCancel = () => {
    setShowModal(false);
    setQrData(null);
    setResult(1);
    scannerRef.current?.start();
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen md:bg-gradient-to-b md:from-sky-50 md:to-emerald-50 flex items-center justify-center">
      {/* CAMERA WRAPPER */}
      <div
        className="
          relative
          w-full h-screen
          md:h-auto md:max-w-md
          md:rounded-3xl md:overflow-hidden
          bg-black md:shadow-xl
        "
      >
        {/* VIDEO */}
        <video
          ref={videoRef}
          className="w-full h-full md:h-[420px] object-cover"
        />

        {/* BACK BUTTON (mobile only) */}
        <button
          onClick={() => navigate(-1)}
          className="
            block md:hidden
            absolute top-4 left-4 z-20
            bg-black/50 text-white p-3 rounded-full
          "
        >
          <FaArrowLeft />
        </button>

        {/* FRAME */}
        <div
          className="
            absolute inset-12
            md:inset-10
            border-2 border-white/40 rounded-2xl
            pointer-events-none
          "
        />

        {/* SCAN LINE */}
        <motion.div
          className="
            absolute left-16 right-16
            h-[2px] bg-emerald-400
          "
          animate={{ top: ["25%", "75%", "25%"] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      </div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
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
                <FaQrcode className="inline mr-2 text-sky-600" />
                Kết quả kiểm tra
              </h2>

              <div className="text-sm text-slate-600 break-all bg-slate-50 p-3 rounded-xl">
                {qrData}
              </div>

              {/* RADIO */}
              <div className="flex justify-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={result === 1}
                    onChange={() => setResult(1)}
                  />
                  <FaCheckCircle className="text-emerald-600" />
                  <span>Đạt</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={result === 0}
                    onChange={() => setResult(0)}
                  />
                  <FaTimesCircle className="text-rose-600" />
                  <span>Không đạt</span>
                </label>
              </div>

              {/* ACTION */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                >
                  Huỷ
                </button>

                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold flex items-center justify-center gap-2"
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

      {/* ================= TOAST ================= */}
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
