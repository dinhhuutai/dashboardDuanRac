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
//         inspectionType: "KCS",
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
//     <div className="min-h-screen bg-[#E8F8F1] flex flex-col">

//       {/* HEADER */}
//       <div
//         className="
//           md:hidden
//           bg-gradient-to-br
//           from-green-400
//           via-green-500
//           to-emerald-600
//           px-4
//           py-[20px]
//           text-center
//           text-white
//         "
//       >
//         <h1 className="text-xl font-semibold">
//           KCS kiểm tra chất lượng sau in
//         </h1>
//       </div>

//       {/* CONTENT */}
//       <div className="flex-1 flex items-center justify-center px-4 -mt-20 md:mt-0">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="
//             w-full max-w-md
//             bg-[#F3FBF6]
//             border border-green-200
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
//               border border-green-200
//               rounded-xl
//               focus:outline-none
//               focus:ring-2
//               focus:ring-green-400
//               text-center
//               text-lg
//               bg-white
//               transition
//             "
//           />

//           {/* RESULT */}
//           <div className="flex justify-center gap-10 pt-2">
            
//                         <label className={`flex ${result === 1 && 'bg-emerald-200'} justify-center h-[48px] w-[170px] rounded-xl border border-emerald-500 items-center gap-2 cursor-pointer text-gray-700`}>
//                           <input
//                             type="radio"
//                             checked={result === 1}
//                             onChange={() => setResult(1)}
//                             className="accent-emerald-500"
//                           />
//                           <FaCheckCircle className="text-emerald-500" />
//                           Đạt
//                         </label>
            
//                         <label className={`flex ${result === 0 && 'bg-rose-200'} justify-center h-[48px] w-[170px] rounded-xl border border-rose-500 items-center gap-2 cursor-pointer text-gray-700`}>
//                           <input
//                             type="radio"
//                             checked={result === 0}
//                             onChange={() => setResult(0)}
//                             className="accent-rose-500"
//                           />
//                           <FaTimesCircle className="text-rose-500" />
//                           Không đạt
//                         </label>
//           </div>

//           {/* BUTTON */}
//           <button
//             onClick={handleConfirm}
//             disabled={loading}
//             className="
//               w-full
//               py-3
//               rounded-xl
//               bg-emerald-500
//               hover:bg-emerald-600
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




import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaPlus,
  FaMinus,
} from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";

function Manual() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(1);
  const [transQuantity, setTransQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const increaseQuantity = () => {
    setTransQuantity((prev) => Number(prev || 0) + 1);
  };

  const decreaseQuantity = () => {
    setTransQuantity((prev) => {
      const current = Number(prev || 1);
      return current > 0 ? current - 1 : 0;
    });
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value;

    if (value === "") {
      setTransQuantity("");
      return;
    }

    const numericValue = Number(value);

    if (!Number.isNaN(numericValue) && numericValue >= 0) {
      setTransQuantity(numericValue);
    }
  };

  const handleConfirm = async () => {
    if (!code.trim()) {
      setToast({
        type: "error",
        message: "❌ Vui lòng nhập mã",
      });
      return;
    }

    if (result === 1 && transQuantity === "") {
      setToast({
        type: "error",
        message: "❌ Vui lòng nhập số lượng đạt hợp lệ",
      });
      return;
    }

    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/quality-inspection/save-result`, {
        qrCode: code,
        result,
        inspectionType: "KCS",
        transQuantity: result === 1 ? Number(transQuantity) : 0,
        inputType: 'MANUAL'
      });

      setToast({
        type: "success",
        message: "✅ Lưu kết quả thành công",
      });

      setCode("");
      setResult(1);
      setTransQuantity(1);
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
    <div className="min-h-screen bg-[#E8F8F1] flex flex-col">
      <div
        className="
          md:hidden
          bg-gradient-to-br
          from-green-400
          via-green-500
          to-emerald-600
          px-4
          py-[20px]
          text-center
          text-white
        "
      >
        <h1 className="text-xl font-semibold">
          KCS kiểm tra chất lượng sau in
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 -mt-20 md:mt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            w-full max-w-md
            bg-[#F3FBF6]
            border border-green-200
            rounded-2xl
            p-6
            space-y-6
            shadow-[0_6px_20px_rgba(0,0,0,0.08)]
          "
        >
          <h2 className="text-base font-semibold text-center text-gray-700">
            Nhập mã kiểm tra
          </h2>

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
              border border-green-200
              rounded-xl
              focus:outline-none
              focus:ring-2
              focus:ring-green-400
              text-center
              text-lg
              bg-white
              transition
            "
          />

          <div className="flex justify-center gap-10 pt-2">
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Số lượng đạt
              </label>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  className="
                    h-12 w-12
                    rounded-xl
                    border border-green-200
                    bg-white
                    flex items-center justify-center
                    text-gray-700
                    active:scale-95
                    transition
                  "
                >
                  <FaMinus />
                </button>

                <input
                  type="number"
                  min="0"
                  value={transQuantity}
                  onChange={handleQuantityChange}
                  className="
                    flex-1
                    h-12
                    border border-green-200
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    focus:ring-green-400
                    text-center
                    text-lg
                    font-semibold
                    bg-white
                  "
                />

                <button
                  type="button"
                  onClick={increaseQuantity}
                  className="
                    h-12 w-12
                    rounded-xl
                    border border-green-200
                    bg-white
                    flex items-center justify-center
                    text-gray-700
                    active:scale-95
                    transition
                  "
                >
                  <FaPlus />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="
              w-full
              py-3
              rounded-xl
              bg-emerald-500
              hover:bg-emerald-600
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

