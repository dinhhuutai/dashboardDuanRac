// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { useDispatch } from "react-redux";
// import {
//   FaEye as Eye,
//   FaEyeSlash as EyeOff,
//   FaCheckCircle as CheckCircle2,
//   FaExclamationTriangle as AlertTriangle,
//   FaSpinner as Loader2,
//   FaLock as LockKeyhole,
//   FaUser as User2,
// } from "react-icons/fa";
// import authSlice from "~/redux/slices/authSlice";
// import config from "~/config";
// import logoTHLA from "~/assets/imgs/logoAdmin.png";
// import bgNeumo from "~/assets/imgs/bg-neumo.webp";

// import http from "~/api/http"; // ⬅️ dùng axios instance + in-memory token
// import { fetchUserModules } from "~/redux/slices/userModulesSlice";
// import MODULEID from "~/contants/modules";

// const bg = "#e9eef6";

// export default function Login() {
//   const [username, setUsername] = useState(localStorage.getItem("rememberUsername") || "");
//   const [password, setPassword] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [capsLockOn, setCapsLockOn] = useState(false);
//   const [rememberMe, setRememberMe] = useState(!!localStorage.getItem("rememberUsername"));
//   const [errorMessage, setErrorMessage] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   useEffect(() => {
//     document.title = "Đăng nhập | Thuận Hưng Long An";
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (isLoading) return;

//     if (!username || !password) {
//       setErrorMessage("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       setErrorMessage("");
//       dispatch(authSlice.actions.loginStart());

//       // ⬇️ Gọi đúng endpoint backend mới: /auth/login
//       const res = await http.post("/login", { username, password });
//       if (res?.data?.success) {
//         const { accessToken, user, permissions } = res.data.data || {};

//         // Ghi nhớ username nếu user tick
//         if (rememberMe) localStorage.setItem("rememberUsername", username);
//         else localStorage.removeItem("rememberUsername");

//         // Cập nhật Redux (KHÔNG lưu refresh/access vào localStorage nữa)
//         dispatch(authSlice.actions.loginSuccess({ user, accessToken, permissions }));

//         if (user?.userID) {
//           dispatch(fetchUserModules(user.userID));
//         }

        
//         navigate(config.routes.homeMain, {
//           replace: true,
//           state: { from: 'login' }   // <— cờ đánh dấu vừa login
//         });

//       } else {
//         setErrorMessage(res?.data?.message || "Tên đăng nhập hoặc mật khẩu không đúng.");
//         dispatch(authSlice.actions.loginFailed());
//       }
//     } catch (err) {
//       // Nếu backend trả 4xx/5xx có message
//       const apiMsg =
//         err?.response?.data?.message ||
//         err?.message ||
//         "Có lỗi xảy ra. Vui lòng thử lại sau.";
//       setErrorMessage(apiMsg);
//       dispatch(authSlice.actions.loginFailed());
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div
//       className="relative min-h-screen w-full flex items-center justify-center px-4"
//       style={{
//         background: `linear-gradient(135deg, ${bg} 0%, #f6f9ff 70%)`,
//         backgroundImage: `url(${bgNeumo})`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//         backgroundRepeat: "no-repeat",
//         backgroundBlendMode: "soft-light",
//       }}
//     >
//       {/* Overlay siêu nhẹ để dịu mắt */}
//       <div
//         aria-hidden
//         className="pointer-events-none absolute inset-0"
//         style={{
//           background: "rgba(255,255,255,0.35)",
//           backdropFilter: "blur(1.5px)",
//           WebkitBackdropFilter: "blur(1.5px)",
//           boxShadow: "inset 0 0 100px rgba(0,0,0,0.04)",
//         }}
//       />

//       <motion.div
//         initial={{ y: 24, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ duration: 0.5 }}
//         className="relative z-10 w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-8"
//       >
//         {/* Panel trái */}
//         <div
//           className="hidden lg:flex rounded-[28px] p-8 relative backdrop-blur-md"
//           style={{
//             background: "rgba(255,255,255,0.55)",
//             border: "1px solid rgba(255,255,255,0.6)",
//             boxShadow:
//               "8px 8px 20px rgba(186,197,216,0.55), -8px -8px 20px rgba(255,255,255,0.9)",
//           }}
//         >
//           <div className="my-auto">
//             <div className="mb-8 flex items-center gap-4">
//               <div
//                 className="grid place-items-center h-16 w-16 rounded-full"
//                 style={{
//                   background: "rgba(255,255,255,0.7)",
//                   boxShadow:
//                     "inset 4px 4px 9px rgba(205,215,230,0.7), inset -4px -4px 9px rgba(255,255,255,0.95)",
//                 }}
//               >
//                 <img src={logoTHLA} alt="Logo" className="h-10 w-10 object-contain opacity-90" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-800">Thuận Hưng Long An</h1>
//                 <p className="text-slate-500">Hệ thống nội bộ – an toàn & hiệu quả</p>
//               </div>
//             </div>

//             <ul className="space-y-4 text-slate-700">
//               <li className="flex items-start gap-3">
//                 <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
//                 Quản lý cân rác, cân mực, công việc & dự án
//               </li>
//               <li className="flex items-start gap-3">
//                 <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
//                 Phân quyền rõ ràng, nhật ký thao tác
//               </li>
//               <li className="flex items-start gap-3">
//                 <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
//                 Giao diện Neumorphism dịu mắt
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Card đăng nhập */}
//         <div
//           className="relative rounded-[30px] p-7 sm:p-9 backdrop-blur-md"
//           style={{
//             background: "rgba(255,255,255,0.6)",
//             border: "1px solid rgba(255,255,255,0.65)",
//             boxShadow:
//               "9px 9px 24px rgba(186,197,216,0.5), -9px -9px 24px rgba(255,255,255,0.92)",
//           }}
//         >
//           <div
//             className="mx-auto -mt-12 mb-6 h-14 w-14 rounded-full grid place-items-center"
//             style={{
//               background: "rgba(255,255,255,0.65)",
//               boxShadow:
//                 "inset 4px 4px 9px rgba(205,215,230,0.7), inset -4px -4px 9px rgba(255,255,255,0.95), 6px 6px 14px rgba(186,197,216,0.45), -6px -6px 14px rgba(255,255,255,0.95)",
//             }}
//           >
//             <User2 className="h-6 w-6 text-slate-500" />
//           </div>

//           <h3 className="text-center text-2xl sm:text-3xl font-bold text-slate-800">
//             Chào mừng trở lại
//           </h3>
//           <p className="text-center text-slate-500 mt-1 mb-8">
//             Vui lòng đăng nhập để tiếp tục
//           </p>

//           <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
//             {/* Username */}
//             <label className="block" htmlFor="username">
//               <span className="mb-2 block text-slate-600">Tên đăng nhập</span>
//               <div
//                 className="relative rounded-2xl"
//                 style={{
//                   boxShadow:
//                     "inset 4px 4px 9px rgba(205,215,230,0.7), inset -4px -4px 9px rgba(255,255,255,0.9)",
//                 }}
//               >
//                 <input
//                   id="username"
//                   type="text"
//                   value={username}
//                   onChange={(e) => {
//                     setErrorMessage("");
//                     setUsername(e.target.value);
//                   }}
//                   placeholder="vd: nguyenvana"
//                   className="w-full rounded-2xl bg-transparent px-12 py-3 text-slate-800 outline-none placeholder:text-slate-400"
//                 />
//                 <User2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
//               </div>
//             </label>

//             {/* Password */}
//             <label className="block" htmlFor="password">
//               <span className="mb-2 block text-slate-600">Mật khẩu</span>
//               <div
//                 className="relative rounded-2xl"
//                 style={{
//                   boxShadow:
//                     "inset 4px 4px 9px rgba(205,215,230,0.7), inset -4px -4px 9px rgba(255,255,255,0.9)",
//                 }}
//               >
//                 <input
//                   id="password"
//                   type={showPassword ? "text" : "password"}
//                   value={password}
//                   onChange={(e) => {
//                     setErrorMessage("");
//                     setPassword(e.target.value);
//                   }}
//                   onKeyUp={(e) =>
//                     setCapsLockOn(e.getModifierState && e.getModifierState("CapsLock"))
//                   }
//                   placeholder="••••••••"
//                   className="w-full rounded-2xl bg-transparent px-12 py-3 pr-12 text-slate-800 outline-none placeholder:text-slate-400"
//                   aria-describedby={capsLockOn ? "caps-hint" : undefined}
//                 />
//                 <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((v) => !v)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2"
//                   style={{
//                     boxShadow:
//                       "inset 3px 3px 6px rgba(205,215,230,0.7), inset -3px -3px 6px rgba(255,255,255,0.95)",
//                   }}
//                   aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-4 w-4 text-slate-600" />
//                   ) : (
//                     <Eye className="h-4 w-4 text-slate-600" />
//                   )}
//                 </button>
//               </div>
//               {capsLockOn && (
//                 <p id="caps-hint" className="mt-1 flex items-center gap-1 text-sm text-amber-600">
//                   <AlertTriangle className="h-4 w-4" /> Caps Lock đang bật
//                 </p>
//               )}
//             </label>

//             {/* Options */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center gap-2 text-slate-700">
//                 <input
//                   type="checkbox"
//                   className="accent-emerald-600"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                 />
//                 Ghi nhớ tôi
//               </label>
//               <a href="#" className="text-slate-600 hover:underline">
//                 Quên mật khẩu?
//               </a>
//             </div>

//             {/* Error */}
//             {errorMessage && (
//               <div
//                 className="flex items-start gap-2 rounded-2xl px-4 py-3 text-red-700"
//                 style={{
//                   background: "#fff0f0",
//                   boxShadow:
//                     "inset 4px 4px 9px rgba(231,201,201,0.7), inset -4px -4px 9px rgba(255,255,255,0.95)",
//                 }}
//               >
//                 <AlertTriangle className="mt-0.5 h-5 w-5" />
//                 <span className="text-sm">{errorMessage}</span>
//               </div>
//             )}

//             {/* Submit */}
//             <button
//               type="submit"
//               disabled={isLoading}
//               className="mt-2 w-full rounded-2xl font-semibold text-slate-700 active:scale-[.99]"
//               style={{
//                 background: "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(241,246,255,0.85))",
//                 boxShadow: isLoading
//                   ? "inset 4px 4px 10px rgba(205,215,230,0.7), inset -4px -4px 10px rgba(255,255,255,0.9)"
//                   : "6px 6px 16px rgba(186,197,216,0.5), -6px -6px 16px rgba(255,255,255,0.92)",
//                 border: "1px solid rgba(255,255,255,0.7)",
//               }}
//             >
//               <span className="inline-flex items-center justify-center gap-2 px-6 py-3">
//                 {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
//                 {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
//               </span>
//             </button>
//           </form>
//         </div>
//       </motion.div>
//     </div>
//   );
// }


import React from "react";

export default function SleepingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center bg-slate-900/70 border border-slate-700 rounded-3xl p-8 shadow-xl shadow-slate-900/50 backdrop-blur">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
          <span className="text-4xl">🌙</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold mb-3">
          Website đang ngủ đông
        </h1>

        <p className="text-sm md:text-base text-slate-300 mb-4">
          Hệ thống đang tạm dừng để bảo trì & nâng cấp. Bạn quay lại sau nhé.
        </p>

        <p className="text-xs md:text-sm text-slate-400 mb-6">
          Nếu cần hỗ trợ gấp, vui lòng liên hệ bộ phận phụ trách.
        </p>

        <a
          href="mailto:support@yourcompany.com"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-600 hover:border-slate-400 text-sm font-medium bg-slate-800 hover:bg-slate-700 transition"
        >
          Liên hệ hỗ trợ
        </a>

        <p className="mt-4 text-[11px] text-slate-500">
          ⏰ Dự kiến hoạt động lại: <span className="font-medium text-slate-300">…</span>
        </p>

        <div className="mt-6 text-[11px] text-slate-500">
          Cảm ơn bạn đã kiên nhẫn 💙
        </div>
      </div>
    </div>
  );
}
