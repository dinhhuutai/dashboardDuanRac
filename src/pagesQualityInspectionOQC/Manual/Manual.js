import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Manual() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleConfirm = async () => {
    if (!code.trim()) {
      setToast({
        type: "error",
        message: "❌ Vui lòng nhập mã",
      });
      return;
    }

    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: code,
        result,
        inspectionType: "OQC",
        inputType: 'MANUAL'
      });

      setToast({
        type: "success",
        message: "✅ Lưu kết quả thành công",
      });

      setCode("");
      setResult(1);
    } catch {
      setToast({
        type: "error",
        message: "❌ Không thể lưu kết quả",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF6F0] flex flex-col">

      {/* HEADER */}
      <div
        className="
          md:hidden
          bg-gradient-to-br
          from-sky-400
          via-sky-500
          to-blue-500
          px-4
          py-[20px]
          text-center
          text-white
        "
      >
        <h1 className="text-xl font-semibold">
          OQC kiểm tra chất lượng đầu ra
        </h1>
      </div>

      {/* CONTENT */}
      <div className="flex-1 flex items-center justify-center px-4 -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            w-full max-w-md
            bg-[#F8FBFF]
            border border-sky-200
            rounded-2xl
            p-6
            space-y-6
            shadow-[0_6px_20px_rgba(0,0,0,0.08)]
          "
        >
          <h2 className="text-base font-semibold text-center text-gray-700">
            Nhập mã kiểm tra
          </h2>

          {/* INPUT */}
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
            }}
            placeholder="Nhập mã sản phẩm..."
            className="
              w-full
              p-3
              border border-sky-200
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-sky-400
              text-center
              text-lg
              bg-white
              transition
            "
          />

          {/* RESULT */}
          <div className="flex justify-center gap-10 pt-2">
            <label className={`flex ${result === 1 && 'bg-emerald-200'} justify-center h-[48px] w-[170px] rounded-xl border border-emerald-500 items-center gap-2 cursor-pointer text-gray-700`}>
              <input
                type="radio"
                checked={result === 1}
                onChange={() => setResult(1)}
                className="accent-emerald-500"
              />
              <FaCheckCircle className="text-emerald-500" />
              Đạt
            </label>

            <label className={`flex ${result === 0 && 'bg-rose-200'} justify-center h-[48px] w-[170px] rounded-xl border border-rose-500 items-center gap-2 cursor-pointer text-gray-700`}>
              <input
                type="radio"
                checked={result === 0}
                onChange={() => setResult(0)}
                className="accent-rose-500"
              />
              <FaTimesCircle className="text-rose-500" />
              Không đạt
            </label>
          </div>

          {/* BUTTON */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="
              w-full
              py-3
              rounded-xl
              bg-sky-500
              hover:bg-sky-600
              text-white
              font-medium
              flex
              items-center
              justify-center
              gap-2
              active:scale-95
              transition
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
        </motion.div>
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-[102px] inset-x-0 flex justify-center z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setToast(null)}
          >
            <div
              className="
                bg-white
                px-5 py-3
                rounded-full
                shadow-[0_2px_8px_rgba(0,0,0,0.06)]
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