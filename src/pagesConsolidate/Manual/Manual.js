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
//   const [result, setResult] = useState(1);
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);

//   const isValidCode = (value) => {
//     if (!value) return false;
//     const text = String(value).trim();

//     // chỉ cho phép mã bắt đầu bằng 15
//     return text.startsWith("15");
//   };

//   const handleConfirm = async () => {
//     if (!code.trim()) {
//       setToast({
//         type: "error",
//         message: "❌ Vui lòng nhập mã",
//       });
//       return;
//     }

//     setLoading(true);
//     try {
//       await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
//         qrCode: code,
//         result,
//         inspectionType: "GOM",
//         inputType: 'MANUAL'
//       });

//       setToast({
//         type: "success",
//         message: "✅ Lưu kết quả thành công",
//       });

//       setCode("");
//       setResult(1);
//     } catch {
//       setToast({
//         type: "error",
//         message: "❌ Không thể lưu kết quả",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#FFF7ED] flex flex-col">

//       {/* HEADER */}
//       <div
//         className="
//           md:hidden
//           bg-gradient-to-br
//           from-orange-400
//           via-amber-500
//           to-orange-600
//           px-4
//           py-[20px]
//           text-center
//           text-white
//         "
//       >
//         <h1 className="text-xl font-semibold">
//           Gom hàng sau khi vải khô
//         </h1>
//       </div>

//       {/* CONTENT */}
//       <div className="flex-1 flex items-center justify-center px-4 -mt-20 md:mt-0">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="
//             w-full max-w-md
//             bg-[#FFFBF5]
//             border border-amber-200
//             rounded-2xl
//             p-6
//             space-y-6
//             shadow-[0_6px_20px_rgba(0,0,0,0.08)]
//           "
//         >
//           <h2 className="text-base font-semibold text-center text-gray-700">
//             Nhập mã kiểm tra
//           </h2>

//           {/* INPUT */}
//           <input
//             type="text"
//             value={code}
//             onChange={(e) => setCode(e.target.value)}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") handleConfirm();
//             }}
//             placeholder="Nhập mã sản phẩm..."
//             className="
//               w-full
//               p-3
//               border border-amber-200
//               rounded-xl
//               focus:outline-none
//               focus:ring-2
//               focus:ring-amber-400
//               text-center
//               text-lg
//               bg-white
//               transition
//             "
//           />

//           {/* BUTTON */}
//           <button
//             onClick={handleConfirm}
//             disabled={loading}
//             className="
//               w-full
//               py-3
//               rounded-xl
//               bg-orange-500
//               hover:bg-orange-600
//               text-white
//               font-medium
//               flex
//               items-center
//               justify-center
//               gap-2
//               active:scale-95
//               transition
//             "
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
//             className="fixed bottom-[102px] inset-x-0 flex justify-center z-50"
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setToast(null)}
//           >
//             <div
//               className="
//                 bg-white
//                 px-5 py-3
//                 rounded-full
//                 shadow-[0_2px_8px_rgba(0,0,0,0.06)]
//               "
//             >
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
import { FaSpinner } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Manual() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const isValidCode = (value) => {
    if (!value) return false;
    const text = String(value).trim();

    // chỉ cho phép mã bắt đầu bằng 15
    return text.startsWith("15");
  };

  const trimmedCode = code.trim();

  const codeError = useMemo(() => {
    if (!trimmedCode) return "";
    if (!isValidCode(trimmedCode)) return "Mã không hợp lệ, mã phải bắt đầu bằng 15";
    return "";
  }, [trimmedCode]);

  const canSubmit = trimmedCode && !codeError && !loading;

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

    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: trimmedCode,
        result,
        inspectionType: "GOM",
        inputType: "MANUAL",
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
    <div className="min-h-screen bg-[#FFF7ED] flex flex-col">
      <div
        className="
          md:hidden
          bg-gradient-to-br
          from-orange-400
          via-amber-500
          to-orange-600
          px-4
          py-[20px]
          text-center
          text-white
        "
      >
        <h1 className="text-xl font-semibold">Gom hàng sau khi vải khô</h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-20 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            w-full max-w-md
            bg-[#FFFBF5]
            border border-amber-200
            rounded-2xl
            p-6
            space-y-6
            shadow-[0_6px_20px_rgba(0,0,0,0.08)]
          "
        >
          <h2 className="text-base font-semibold text-center text-gray-700">
            Nhập mã kiểm tra
          </h2>

          <div className="space-y-2">
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
                w-full
                p-3
                border
                rounded-xl
                focus:outline-none
                focus:ring-2
                text-center
                text-lg
                bg-white
                transition
                ${
                  codeError
                    ? "border-rose-400 focus:ring-rose-300"
                    : "border-amber-200 focus:ring-amber-400"
                }
              `}
            />

            {codeError && (
              <p className="text-sm text-rose-600 px-1">{codeError}</p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={`
              w-full
              py-3
              rounded-xl
              text-white
              font-medium
              flex
              items-center
              justify-center
              gap-2
              transition
              ${
                canSubmit
                  ? "bg-orange-500 hover:bg-orange-600 active:scale-95"
                  : "bg-gray-300 cursor-not-allowed"
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