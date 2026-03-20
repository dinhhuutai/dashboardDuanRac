import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCheckCircle,
  FaSpinner,
  FaPlus,
  FaMinus,
  FaClipboardCheck,
  FaLayerGroup,
  FaExclamationTriangle,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

const qtyFields = [
  { key: "dat", label: "Đạt", icon: <FaCheckCircle className="text-emerald-500" /> },
  { key: "thieu", label: "Thiếu", icon: <FaExclamationTriangle className="text-amber-500" /> },
  { key: "du", label: "Dư", icon: <FaLayerGroup className="text-sky-500" /> },
  { key: "mau", label: "Mẫu", icon: <FaClipboardCheck className="text-violet-500" /> },
  { key: "vaiHu", label: "Vải hư", icon: <FaExclamationTriangle className="text-rose-500" /> },
];

function Manual() {
  const [code, setCode] = useState("");
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
    if (!value) return false;
    const text = String(value).trim();
    return text.startsWith("15");
  };

  const trimmedCode = code.trim();

  const codeError = useMemo(() => {
    if (!trimmedCode) return "";
    if (!isValidCode(trimmedCode)) {
      return "Mã không hợp lệ, mã phải bắt đầu bằng 15";
    }
    return "";
  }, [trimmedCode]);

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

  const canSubmit = !!trimmedCode && !codeError && totalAll > 0 && !loading;

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

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && numericValue >= 0) {
      updateQty(key, numericValue);
    }
  };

  const resetForm = () => {
    setCode("");
    setQuantities({
      dat: 0,
      thieu: 0,
      du: 0,
      mau: 0,
      vaiHu: 0,
    });
  };

  const handleConfirm = async () => {
    if (!trimmedCode) {
      setToast({
        type: "error",
        message: "❌ Vui lòng nhập mã",
      });
      return;
    }

    if (!isValidCode(trimmedCode)) {
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
        qrCode: trimmedCode,
        inspectionType: "KCS",
        result: Number(quantities.dat || 0) > 0 ? 1 : 0,
        transQuantity: Number(quantities.dat || 0),
        inputType: "MANUAL",
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

      resetForm();
    } catch {
      setToast({
        type: "error",
        message: "❌ Không thể lưu kết quả",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderQtyCard = (item, index) => {
    const isMain = item.key === "dat";

    return (
      <motion.div
        key={item.key}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className={`
          w-full min-w-0 rounded-2xl border bg-white shadow-sm
          ${isMain ? "border-emerald-200 md:col-span-2" : "border-slate-200"}
        `}
      >
        <div className="flex items-center justify-between gap-3 px-3 py-3 md:px-4 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`
                h-9 w-9 md:h-10 md:w-10 shrink-0 rounded-xl flex items-center justify-center
                ${isMain ? "bg-emerald-50" : "bg-slate-50"}
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
              ${isMain ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}
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
                ${
                  isMain
                    ? "border-emerald-200 focus:ring-emerald-400"
                    : "border-slate-200 focus:ring-slate-300"
                }
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
    <div className="min-h-screen bg-gradient-to-b from-[#E8F8F1] via-[#F2FBF7] to-[#F8FCFA]">
      <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-4 py-5 text-center text-white shadow-sm">
        <h1 className="text-lg md:text-2xl font-semibold">
          KCS kiểm tra chất lượng sau in
        </h1>
      </div>

      <div className="px-4 pb-[100px] pt-6 md:pt-8">
        <div className="mx-auto w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              rounded-[28px] border border-emerald-100 bg-[#F7FCF9]
              shadow-[0_10px_30px_rgba(16,24,40,0.06)] overflow-hidden
            "
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-0">
              <div className="p-4 md:p-6 lg:p-7">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mã sản phẩm / mã kiểm tra
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) {
                        handleConfirm();
                      }
                    }}
                    placeholder="Nhập mã sản phẩm..."
                    className={`
                      w-full min-w-0 h-11 md:h-14 px-4 border rounded-2xl
                      focus:outline-none focus:ring-2
                      bg-white text-center md:text-left text-base md:text-lg
                      ${
                        codeError
                          ? "border-rose-400 focus:ring-rose-300"
                          : "border-emerald-200 focus:ring-emerald-400"
                      }
                    `}
                  />

                  {codeError && (
                    <p className="mt-2 text-sm text-rose-600">
                      {codeError}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full min-w-0">
                  {qtyFields.map((item, index) => renderQtyCard(item, index))}
                </div>

                <div className="bg-white/80 border-t lg:border-t-0 lg:border-l border-emerald-100 p-4 md:p-6 lg:p-7">
                  <button
                    onClick={handleConfirm}
                    disabled={!canSubmit}
                    className={`
                      mt-5 w-full h-12 md:h-13 rounded-2xl
                      text-white font-semibold flex items-center justify-center gap-2
                      transition
                      ${
                        canSubmit
                          ? "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98]"
                          : "bg-slate-300 cursor-not-allowed"
                      }
                    `}
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
                    onClick={resetForm}
                    className="
                      mt-3 w-full h-11 rounded-2xl border border-slate-200
                      bg-white hover:bg-slate-50 text-slate-700 font-medium transition
                    "
                  >
                    Làm mới
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-[102px] inset-x-0 flex justify-center z-50 px-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => setToast(null)}
          >
            <div
              className="
                max-w-md w-full md:w-auto
                bg-white px-5 py-3 rounded-2xl
                shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-slate-100
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

export default Manual;

