// import React, { useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   FaCheckCircle,
//   FaTimesCircle,
//   FaSpinner,
// } from "react-icons/fa";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";

// function Manual() {
//   const [code, setCode] = useState("");
//   const [result, setResult] = useState(1); // 1: Đạt | 0: Không đạt | 2: Giao đặc biệt
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);

//   const handleConfirm = async () => {
//     if (!code.trim()) {
//       setToast({ type: "error", message: "❌ Vui lòng nhập mã" });
//       return;
//     }

//     setLoading(true);
//     try {
//       await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
//         qrCode: code,
//         result,
//         inspectionType: "OQC",
//         inputType: "MANUAL",
//       });

//       setToast({ type: "success", message: "✅ Lưu thành công" });
//       setCode("");
//       setResult(1);
//     } catch {
//       setToast({ type: "error", message: "❌ Lỗi khi lưu" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getStyle = (value) => {
//     if (value === 1)
//       return result === 1
//         ? "bg-emerald-200 border-emerald-500"
//         : "border-emerald-300";
//     if (value === 0)
//       return result === 0
//         ? "bg-rose-200 border-rose-500"
//         : "border-rose-300";
//     if (value === 2)
//       return result === 2
//         ? "bg-yellow-200 border-yellow-500"
//         : "border-yellow-300";
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100 flex flex-col">
      
//       {/* HEADER */}
//       <div className="md:hidden bg-gradient-to-r from-sky-500 to-blue-500 py-5 text-center text-white shadow">
//         <h1 className="text-lg font-semibold">
//           OQC kiểm tra chất lượng
//         </h1>
//       </div>

//       {/* CONTENT */}
//       <div className="flex-1 flex items-center justify-center px-4 -mt-16">
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="w-full max-w-md bg-white rounded-3xl p-6 space-y-6 shadow-lg"
//         >
//           <h2 className="text-center text-gray-700 font-semibold">
//             Nhập mã sản phẩm
//           </h2>

//           {/* INPUT */}
//           <input
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
//             placeholder="Nhập mã..."
//             className="w-full p-3 text-center text-lg border rounded-xl focus:ring-2 focus:ring-sky-400 outline-none"
//           />

//           {/* OPTIONS */}
//           <div className="flex flex-col gap-3">
//             {/* Đạt */}
//             <div
//               onClick={() => setResult(1)}
//               className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${getStyle(
//                 1
//               )}`}
//             >
//               <FaCheckCircle className="text-emerald-500" />
//               <span>Đạt</span>
//             </div>

//             {/* Không đạt */}
//             <div
//               onClick={() => setResult(0)}
//               className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${getStyle(
//                 0
//               )}`}
//             >
//               <FaTimesCircle className="text-rose-500" />
//               <span>Không đạt</span>
//             </div>

//             {/* Giao đặc biệt */}
//             <div
//               onClick={() => setResult(2)}
//               className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${getStyle(
//                 2
//               )}`}
//             >
//               <span>Giao đặc biệt</span>
//             </div>
//           </div>

//           {/* BUTTON */}
//           <button
//             onClick={handleConfirm}
//             disabled={loading}
//             className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex justify-center gap-2 transition"
//           >
//             {loading ? (
//               <>
//                 <FaSpinner className="animate-spin" />
//                 Đang lưu...
//               </>
//             ) : (
//               "Xác nhận"
//             )}
//           </button>
//         </motion.div>
//       </div>

//       {/* TOAST */}
//       <AnimatePresence>
//         {toast && (
//           <motion.div
//             className="fixed bottom-20 inset-x-0 flex justify-center"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setToast(null)}
//           >
//             <div className="bg-white px-5 py-3 rounded-full shadow">
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

// export default Manual;



import React, { useMemo, useState } from "react";
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
  const [result, setResult] = useState(1); // 1: Đạt | 0: Không đạt | 2: Giao đặc biệt
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

  const canSubmit = !!trimmedCode && !codeError && !loading;

  const handleConfirm = async () => {
    if (!trimmedCode) {
      setToast({ type: "error", message: "❌ Vui lòng nhập mã" });
      return;
    }

    if (!isValidCode(trimmedCode)) {
      return;
    }

    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: trimmedCode,
        result,
        inspectionType: "OQC",
        inputType: "MANUAL",
      });

      setToast({ type: "success", message: "✅ Lưu thành công" });
      setCode("");
      setResult(1);
    } catch {
      setToast({ type: "error", message: "❌ Lỗi khi lưu" });
    } finally {
      setLoading(false);
    }
  };

  const getStyle = (value) => {
    if (value === 1)
      return result === 1
        ? "bg-emerald-200 border-emerald-500"
        : "border-emerald-300";
    if (value === 0)
      return result === 0
        ? "bg-rose-200 border-rose-500"
        : "border-rose-300";
    if (value === 2)
      return result === 2
        ? "bg-yellow-200 border-yellow-500"
        : "border-yellow-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100 flex flex-col">
      <div className="md:hidden bg-gradient-to-r from-sky-500 to-blue-500 py-5 text-center text-white shadow">
        <h1 className="text-lg font-semibold">
          OQC kiểm tra chất lượng
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl p-6 space-y-6 shadow-lg"
        >
          <h2 className="text-center text-gray-700 font-semibold">
            Nhập mã sản phẩm
          </h2>

          <div className="space-y-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  handleConfirm();
                }
              }}
              placeholder="Nhập mã..."
              className={`
                w-full p-3 text-center text-lg border rounded-xl outline-none focus:ring-2
                ${
                  codeError
                    ? "border-rose-400 focus:ring-rose-300"
                    : "border-slate-300 focus:ring-sky-400"
                }
              `}
            />

            {codeError && (
              <p className="text-sm text-rose-600">
                {codeError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div
              onClick={() => setResult(1)}
              className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${getStyle(
                1
              )}`}
            >
              <FaCheckCircle className="text-emerald-500" />
              <span>Đạt</span>
            </div>

            <div
              onClick={() => setResult(0)}
              className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${getStyle(
                0
              )}`}
            >
              <FaTimesCircle className="text-rose-500" />
              <span>Không đạt</span>
            </div>

            <div
              onClick={() => setResult(2)}
              className={`flex items-center justify-center gap-2 h-12 rounded-xl border cursor-pointer transition ${getStyle(
                2
              )}`}
            >
              <span>Giao đặc biệt</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={`
              w-full py-3 rounded-xl text-white flex justify-center gap-2 transition
              ${
                canSubmit
                  ? "bg-sky-500 hover:bg-sky-600"
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
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-20 inset-x-0 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setToast(null)}
          >
            <div className="bg-white px-5 py-3 rounded-full shadow">
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