import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaQrcode,
  FaBarcode,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaArrowDown,
  FaArrowUp,
  FaRegClone,
  FaBan,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const qtyFields = [
  {
    key: "dat",
    label: "Đạt",
    tone: "emerald",
    icon: <FaCheckCircle className="text-emerald-500" />,
  },
  {
    key: "thieu",
    label: "Thiếu",
    tone: "amber",
    icon: <FaArrowDown className="text-amber-500" />,
  },
  {
    key: "du",
    label: "Dư",
    tone: "sky",
    icon: <FaArrowUp className="text-sky-500" />,
  },
  {
    key: "mau",
    label: "Mẫu",
    tone: "violet",
    icon: <FaRegClone className="text-violet-500" />,
  },
  {
    key: "vaiHu",
    label: "Vải hư",
    tone: "rose",
    icon: <FaBan className="text-rose-500" />,
  },
];

function Result() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const controlsRef = useRef(null);

  const [scanMode, setScanMode] = useState("BARCODE");
  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [quantities, setQuantities] = useState({
    dat: 0,
    thieu: 0,
    du: 0,
    mau: 0,
    vaiHu: 0,
  });

  const isValidCode = (value) => {
    const text = String(value || "").trim();
    return text.startsWith("15");
  };

  const showErrorToast = (message) => {
    setToast({
      type: "error",
      message,
    });
  };

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
        (resultObj) => {
          if (resultObj) {
            const text = resultObj.getText().trim();

            if (scanMode === "BARCODE") {
              if (!/^[0-9A-Za-z\-]+$/.test(text)) return;
            }

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

  useEffect(() => {
    initReader();
  }, [initReader]);

  useEffect(() => {
    startScanner();
    return () => {
      controlsRef.current?.stop();
    };
  }, [startScanner, scanMode]);

  const restartScanner = async () => {
    controlsRef.current?.stop();
    await startScanner();
  };

  const totalError = useMemo(() => {
    return (
      Number(quantities.thieu || 0) +
      Number(quantities.du || 0) +
      Number(quantities.mau || 0) +
      Number(quantities.vaiHu || 0)
    );
  }, [quantities]);

  const totalAll = useMemo(() => {
    return (
      Number(quantities.dat || 0) +
      Number(quantities.thieu || 0) +
      Number(quantities.du || 0) +
      Number(quantities.mau || 0) +
      Number(quantities.vaiHu || 0)
    );
  }, [quantities]);

  const updateQty = (key, value) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const increaseQuantity = (key) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: Number(prev[key] || 0) + 1,
    }));
  };

  const decreaseQuantity = (key) => {
    setQuantities((prev) => {
      const current = Number(prev[key] || 0);
      return {
        ...prev,
        [key]: current > 0 ? current - 1 : 0,
      };
    });
  };

  const handleQuantityChange = (key, e) => {
    const value = e.target.value;

    if (value === "") {
      updateQty(key, "");
      return;
    }

    const numberValue = Number(value);

    if (!Number.isNaN(numberValue) && numberValue >= 0) {
      updateQty(key, numberValue);
    }
  };

  const resetModalForm = () => {
    setQuantities({
      dat: 0,
      thieu: 0,
      du: 0,
      mau: 0,
      vaiHu: 0,
    });
  };

  const closeModalAndResumeScan = useCallback(async () => {
    setShowModal(false);
    setQrData(null);
    resetModalForm();
    await restartScanner();
  }, []);

  const handleConfirm = async () => {
    const finalCode = String(qrData || "").trim();

    if (!finalCode) {
      setToast({
        type: "error",
        message: "❌ Mã không hợp lệ",
      });
      return;
    }

    if (!isValidCode(finalCode)) {
      setToast({
        type: "error",
        message: "❌ Vui lòng quét mã 15",
      });
      return;
    }

    if (totalAll <= 0) {
      setToast({
        type: "error",
        message: "❌ Vui lòng nhập ít nhất 1 số lượng",
      });
      return;
    }

    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: finalCode,
        inspectionType: "KCS",
        scanType: scanMode,
        result: Number(quantities.dat || 0) > 0 ? 1 : 0,
        transQuantity: Number(quantities.dat || 0),
        inputType: "SCAN",
        detailQuantity: {
          dat: Number(quantities.dat || 0),
          thieu: Number(quantities.thieu || 0),
          du: Number(quantities.du || 0),
          mau: Number(quantities.mau || 0),
          vaiHu: Number(quantities.vaiHu || 0),
        },
      });

      setToast({
        type: "success",
        message: "✅ Lưu kết quả thành công",
      });

      setShowModal(false);
      setQrData(null);
      resetModalForm();

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
    await closeModalAndResumeScan();
  };

  const renderQtyCard = (item, index) => {
    const isMain = item.key === "dat";

    const toneMap = {
      emerald: {
        soft: "bg-emerald-50",
        border: "border-emerald-200",
        ring: "focus:ring-emerald-400",
        badge: "bg-emerald-100 text-emerald-700",
      },
      amber: {
        soft: "bg-amber-50",
        border: "border-amber-200",
        ring: "focus:ring-amber-300",
        badge: "bg-amber-100 text-amber-700",
      },
      sky: {
        soft: "bg-sky-50",
        border: "border-sky-200",
        ring: "focus:ring-sky-300",
        badge: "bg-sky-100 text-sky-700",
      },
      violet: {
        soft: "bg-violet-50",
        border: "border-violet-200",
        ring: "focus:ring-violet-300",
        badge: "bg-violet-100 text-violet-700",
      },
      rose: {
        soft: "bg-rose-50",
        border: "border-rose-200",
        ring: "focus:ring-rose-300",
        badge: "bg-rose-100 text-rose-700",
      },
    };

    const tone = toneMap[item.tone];

    return (
      <motion.div
        key={item.key}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={`
          w-full min-w-0 rounded-2xl border bg-white shadow-sm
          ${isMain ? "md:col-span-2 border-emerald-200" : "border-slate-200"}
        `}
      >
        <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`
                h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-xl flex items-center justify-center
                ${tone.soft}
              `}
            >
              {item.icon}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-semibold text-slate-800 truncate">
                {item.label}
              </h3>
              <p className="text-[11px] md:text-xs text-slate-500 truncate">
                Nhập số lượng {item.label.toLowerCase()}
              </p>
            </div>
          </div>

          <div
            className={`
              shrink-0 min-w-[48px] h-8 px-2 md:min-w-[56px] md:h-9 md:px-3 rounded-full text-sm font-semibold
              flex items-center justify-center
              ${tone.badge}
            `}
          >
            {Number(quantities[item.key] || 0)}
          </div>
        </div>

        <div className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3 w-full min-w-0">
            <button
              type="button"
              onClick={() => decreaseQuantity(item.key)}
              className="
                h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50
                flex items-center justify-center text-slate-700
                active:scale-95 transition hover:bg-slate-100
              "
            >
              <FaMinus className="text-sm" />
            </button>

            <input
              type="number"
              min="0"
              value={quantities[item.key]}
              onFocus={() => updateQty(item.key, "")}
              onBlur={() => {
                if (quantities[item.key] === "") updateQty(item.key, 0);
              }}
              onChange={(e) => handleQuantityChange(item.key, e)}
              className={`
                flex-1 min-w-0 w-0 h-10 md:h-12 rounded-xl border text-center text-base md:text-lg font-semibold bg-white
                focus:outline-none focus:ring-2 transition
                ${tone.border} ${tone.ring}
              `}
            />

            <button
              type="button"
              onClick={() => increaseQuantity(item.key)}
              className="
                h-10 w-10 md:h-12 md:w-12 shrink-0 rounded-xl border border-slate-200 bg-slate-50
                flex items-center justify-center text-slate-700
                active:scale-95 transition hover:bg-slate-100
              "
            >
              <FaPlus className="text-sm" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/45" />

      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-4 pb-4 md:px-4 md:pt-6 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate(-1)}
          className="h-11 w-11 shrink-0 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/20"
        >
          <FaArrowLeft />
        </button>

        <h1 className="text-white font-semibold text-sm md:text-base text-center px-2">
          {scanMode === "BARCODE" ? "Quét mã vạch" : "Quét mã QR"}
        </h1>

        <button
          onClick={() =>
            setScanMode(scanMode === "BARCODE" ? "QRCODE" : "BARCODE")
          }
          className="h-11 shrink-0 bg-white/20 backdrop-blur-md text-white px-3 rounded-full text-xs flex items-center gap-2 border border-white/20"
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
        <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
          <div className="absolute inset-0 rounded-[28px] border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]" />

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

          <motion.div
            className="absolute left-4 right-4 h-[2px] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            animate={{ top: ["12%", "85%", "12%"] }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          />
        </div>
      </div>

      <div className="absolute bottom-7 left-0 right-0 z-20 px-6 text-center pointer-events-none">
        <p className="text-white/90 text-sm md:text-base font-medium">
          Đưa mã vào trong khung để quét tự động
        </p>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-end md:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!loading) handleCancel();
            }}
          >
            <motion.div
              className="
                w-full md:max-w-4xl
                rounded-t-[28px] md:rounded-[28px]
                border border-emerald-100 bg-[#F7FCF9]
                shadow-[0_10px_30px_rgba(16,24,40,0.10)]
                overflow-hidden
                max-h-[92vh]
              "
              initial={{ y: 30, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="md:hidden flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                drag="y"
                dragDirectionLock
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.2 }}
                onDragEnd={(event, info) => {
                  if (loading) return;
                  if (info.offset.y > 100 || info.velocity.y > 700) {
                    handleCancel();
                  }
                }}
              >
                <div className="h-1.5 w-14 rounded-full bg-slate-300" />
              </motion.div>

              <div className="max-h-[calc(92vh-44px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
                  <div className="p-4 md:p-6 lg:p-7">
                    <div className="mb-5 text-center md:text-left">
                      <h2 className="text-lg md:text-2xl font-semibold text-slate-800">
                        Xác nhận mã vừa quét
                      </h2>
                    </div>

                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Mã sản phẩm / mã kiểm tra
                      </label>
                      <input
                        type="text"
                        value={qrData || ""}
                        onChange={(e) => setQrData(e.target.value)}
                        className="
                          w-full min-w-0 h-11 md:h-14 px-4 border border-emerald-200 rounded-2xl
                          focus:outline-none focus:ring-2 focus:ring-emerald-400
                          bg-white text-center md:text-left text-base md:text-lg
                        "
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full min-w-0">
                      {qtyFields.map((item, index) => renderQtyCard(item, index))}
                    </div>
                  </div>

                  <div className="bg-white/80 border-t lg:border-t-0 lg:border-l border-emerald-100 p-4 md:p-6 lg:p-7">
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="
                        mt-2 w-full h-12 rounded-2xl
                        bg-emerald-500 hover:bg-emerald-600
                        text-white font-semibold flex items-center justify-center gap-2
                        active:scale-[0.98] transition disabled:opacity-70
                      "
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

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="
                        mt-3 w-full h-11 rounded-2xl border border-slate-200
                        bg-white hover:bg-slate-50 text-slate-700 font-medium transition
                      "
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-5 inset-x-0 flex justify-center z-[60] px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setToast(null)}
          >
            <div
              className="
                max-w-md w-full sm:w-auto
                bg-white px-5 py-3 rounded-2xl shadow-xl border border-slate-100
                text-center
              "
            >
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
