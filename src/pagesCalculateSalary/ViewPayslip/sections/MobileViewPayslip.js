// // src/pages/Payroll/sections/MobileViewPayslip.jsx
// import React from "react";
// import { FaThLarge, FaSpinner, FaBell, FaBellSlash } from "react-icons/fa";

// import avatarPayslip from "~/assets/imgs/avatar_phieuluong.png";
// import {
//   fmtVND,
//   companyFromMSNV,
//   Row,
//   Sep,
//   Line,
//   Hr,
//   PairRow,
// } from "./payslipUi";

// /* ======================================================= */

// export default function MobileViewPayslip({
//   tmp,
//   navigate,
//   config,

//   // data
//   loading,
//   payslip,

//   // push states
//   pushChecking,
//   pushReady,
//   pushBusy,
//   pushStatus,
//   pushError,
//   notifPerm,

//   // actions
//   handleEnablePush,
//   unregisterPush,
// }) {
//   const user = tmp?.login?.currentUser;
//   const fullName = user?.fullName || "bạn";
//   const isKyI = /KỲ\s*I/i.test(payslip?.title || "");

//   const THEME = "emerald"; // "emerald" | "skyAmber" | "violetPink"

//   const THEMES = {
//     emerald: {
//       bgMain: "bg-[#E3F4EC]",
//       headerGrad:
//         "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600",
//       cardBg:
//         "bg-[#ECF8F1] border-2 border-emerald-300/80 ring-1 ring-emerald-300/30 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
//       chipBg: "bg-[#E3F4EC] border border-emerald-300/80",
//       bellOn:
//         "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
//       bellOff:
//         "bg-[#E3F4EC] border-2 border-emerald-300/80 text-emerald-900",
//       bellDenied:
//         "bg-slate-200 text-slate-500 border-2 border-slate-300",
//       chipText: "text-emerald-900",
//       title1: "text-emerald-900",
//       title2: "text-emerald-700",

//       netBox: "bg-emerald-50 border-emerald-200",
//       netText: "text-emerald-900",
//       netLabel: "text-emerald-700",
//     },

//     skyAmber: {
//       bgMain: "bg-[#FFF6D8]",
//       headerGrad:
//         "bg-gradient-to-br from-sky-600 via-sky-500 to-amber-400",
//       cardBg:
//         "bg-[#FFFDF4] border-2 border-amber-300/80 ring-1 ring-amber-300/30 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
//       chipBg: "bg-[#FFF1C2] border border-amber-300/80",
//       bellOn: "bg-gradient-to-br from-sky-600 to-sky-700 text-white",
//       bellOff:
//         "bg-[#FFF1C2] border-2 border-amber-300/80 text-slate-900",
//       bellDenied:
//         "bg-slate-200 text-slate-500 border-2 border-slate-300",
//       chipText: "text-slate-800",
//       title1: "text-slate-900",
//       title2: "text-sky-700",

//       netBox: "bg-amber-50 border-amber-200",
//       netText: "text-slate-900",
//       netLabel: "text-sky-700",
//     },

//     violetPink: {
//       bgMain: "bg-[#F6F2FF]",
//       headerGrad:
//         "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400",
//       cardBg:
//         "bg-white/90 border-2 border-violet-200 ring-1 ring-violet-200/50 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
//       chipBg: "bg-violet-50 border border-violet-200",
//       bellOn:
//         "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white",
//       bellOff:
//         "bg-violet-50 border-2 border-violet-200 text-violet-800",
//       bellDenied:
//         "bg-slate-200 text-slate-500 border-2 border-slate-300",
//       chipText: "text-violet-800",
//       title1: "text-slate-900",
//       title2: "text-violet-700",

//       netBox: "bg-violet-50 border-violet-200",
//       netText: "text-slate-900",
//       netLabel: "text-violet-700",
//     },
//   };

//   const t = THEMES[THEME] || THEMES.emerald;

//   const canTogglePush =
//     !pushChecking && notifPerm !== "unsupported" && notifPerm !== "denied";

//   const bellBtnClass = !canTogglePush
//     ? t.bellDenied
//     : pushReady
//     ? t.bellOff
//     : t.bellOn;

//   const bellTitle = !canTogglePush
//     ? notifPerm === "denied"
//       ? "Trình duyệt đã chặn thông báo"
//       : "Thiết bị không hỗ trợ thông báo"
//     : pushReady
//     ? "Tắt thông báo"
//     : "Bật thông báo";

//   const netValue = isKyI ?
//     fmtVND(payslip?.totalSalary) :
//     fmtVND(payslip?.luongthuclanh) ||
//     fmtVND(payslip?.luongThucLanh) ||
//     fmtVND(payslip?.net) ||
//     "-";

//   return (
//     <div className={`md:hidden ${t.bgMain}`} style={{ minHeight: "100dvh" }}>
//       {/* HEADER */}
//       <div
//         className={`
//           relative
//           ${t.headerGrad}
//           rounded-b-[50px]
//           px-4 pt-4
//           pb-[170px]
//         `}
//       >
//         {/* Top row */}
//         <div className="relative flex items-center justify-between mt-[40px]">
//           <div className="flex items-center gap-3 min-w-0">
//             {/* Avatar */}
//             <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
//               <img
//                 src={avatarPayslip}
//                 alt="avatar"
//                 className="h-full w-full object-cover"
//               />
//             </div>

//             <div className="min-w-0">
//               <div className="text-sm text-white/90">Xin chào,</div>
//               <div className="text-[18px] font-semibold text-white truncate">
//                 {fullName}
//               </div>
//             </div>
//           </div>

//           <button
//             onClick={() => navigate(config.routes.homeMain)}
//             className="
//               h-10 w-10 rounded-full grid place-items-center text-white
//               bg-white/25 border border-white/40
//               active:scale-95 transition
//             "
//             aria-label="Chọn ứng dụng"
//             title="Chọn ứng dụng"
//           >
//             <FaThLarge />
//           </button>
//         </div>

//         {/* ===== CARD CHỈ TÓM TẮT (không chứa BODY nữa) ===== */}
//         <div className="absolute left-4 right-4 top-[130px]">
//           <div className={`rounded-3xl px-4 py-4 ${t.cardBg}`}>
//             {/* Title + Bell */}
//             <div className="flex items-start gap-3">
//               <div className="flex-1 min-w-0">
//                 <div className={`text-[20px] font-extrabold ${t.title1}`}>
//                   💰 Phiếu lương{" "}
//                   <span className={`${t.title2}`}>gần nhất</span>
//                 </div>

//                 <div className="mt-2">
//                   <span
//                     className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${t.chipBg} ${t.chipText}`}
//                   >
//                     Xem nhanh • Cập nhật mới
//                   </span>
//                 </div>
//               </div>

//               {/* 🔔 Bell toggle */}
//               <button
//                 type="button"
//                 title={bellTitle}
//                 aria-label={bellTitle}
//                 disabled={!canTogglePush || pushBusy}
//                 onClick={() => {
//                   if (!canTogglePush || pushBusy) return;
//                   if (pushReady) unregisterPush();
//                   else handleEnablePush();
//                 }}
//                 className={`
//                   h-[50px] w-[50px] rounded-2xl
//                   grid place-items-center
//                   shadow-sm
//                   active:scale-95 transition
//                   ${bellBtnClass}
//                   ${(!canTogglePush || pushBusy) ? "opacity-80" : ""}
//                 `}
//               >
//                 {pushBusy ? (
//                   <FaSpinner className="animate-spin text-[18px]" />
//                 ) : pushReady ? (
//                   <FaBellSlash className="text-[18px]" />
//                 ) : (
//                   <FaBell className="text-[18px]" />
//                 )}
//               </button>
//             </div>

//             {/* Status (nếu có) */}
//             {(pushError || pushStatus) && (
//               <div
//                 className={`mt-3 rounded-2xl p-3 text-sm ${
//                   pushError
//                     ? "bg-rose-50 text-rose-700 border border-rose-200"
//                     : "bg-emerald-50 text-emerald-700 border border-emerald-200"
//                 }`}
//               >
//                 {pushError || pushStatus}
//               </div>
//             )}

//             {/* ✅ THÊM “LƯƠNG THỰC LÃNH” TRONG CARD */}
//             <div className="mt-3">
//               <div
//                 className={`
//                   rounded-2xl border px-4 py-3
//                   ${t.netBox}
//                   flex items-center justify-between gap-3
//                 `}
//               >
//                 <div className="min-w-0">
//                   <div className={`text-[11px] font-semibold ${t.netLabel}`}>
//                     LƯƠNG THỰC LÃNH
//                   </div>
//                   <div className={`text-[18px] font-extrabold tabular-nums ${t.netText}`}>
//                     {netValue}
//                   </div>
//                 </div>

//                 <div className="text-[12px] text-slate-500 text-right">
                  
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       <div className="h-[45px]" />

//       {/* ===== BODY ĐƯA RA NGOÀI CARD (nằm dưới) ===== */}
//       <div className="p-[10px]">
//               <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
//                 {!payslip ? (
//                   <div className="p-5 text-slate-600">Chưa có phiếu lương nào.</div>
//                 ) : (
//                   <div className="p-4 md:p-6">
//                     {/* Header giống ảnh */}
//                     <div className="text-center border-b pb-3">
//                       <div className="font-semibold text-slate-800">{companyFromMSNV(payslip?.msnv ?? user?.msnv)}</div>
//                       <div className="font-extrabold text-xl md:text-2xl text-slate-900 tracking-wide mt-1 uppercase">
//                         {payslip?.title}
//                       </div>
//                     </div>
      
//                     {/* Thông tin MSTT/Bộ phận/MSNV */}
//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm mt-3">
//                       <div className="flex items-center gap-2">
//                         <span className="font-semibold">MSTT:</span>
//                         <span>{payslip.stt ?? '-'}</span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <span className="font-semibold">BỘ PHẬN:</span>
//                         <span className="uppercase">{payslip.department || '-'}</span>
//                       </div>
//                       <div className="flex items-center gap-2">
//                         <span className="font-semibold">MSNV:</span>
//                         <span>{payslip.msnv || '-'}</span>
//                       </div>
//                     </div>
      
//                     {/* TÊN */}
//                     <div className="mt-2 text-sm">
//                       <span className="font-semibold">HỌ VÀ TÊN:</span>
//                       <span className="ml-3 font-bold uppercase">{payslip.name || '-'}</span>
//                     </div>
      
//                     {/* ======= NHÁNH HIỂN THỊ THEO TITLE ======= */}
//                     {isKyI ? (
//                       /* ========= GIAO DIỆN HIỆN TẠI (Kỳ I) ========= */
//                       <div className="mt-4 border">
//                         <table className="w-full text-sm">
//                           <colgroup>
//                             <col className="w-[55%]" />
//                             <col className="w-[15%]" />
//                             <col className="w-[30%]" />
//                           </colgroup>
//                           <tbody>
//                             <Row left="Lương cơ bản" mid={fmtVND(payslip.basicSalary)} />
//                             <Row left="Trách nhiệm" mid={fmtVND(payslip.responsibility)} />
//                             <Row left="Tổng ngày công:" mid={payslip.totalWorkingDays} />
//                             <Row left="Lễ:" mid={payslip.holiday} />
//                             <Row left="Lương thực tế:" mid="" right={fmtVND(payslip.actualSalary)} strongRight />
      
//                             <Sep />
      
//                             <Row left="Giờ tăng ca 1,5" mid={payslip.ot15} right={fmtVND(payslip.otSalary15)} />
//                             <Row left="Giờ tăng ca 1,8" mid={payslip.ot18} right={fmtVND(payslip.otSalary18)} />
//                             <Row left="Phụ cấp T.ca (0.5 giờ)" mid={payslip.ot05} right={fmtVND(payslip.otSalary05)} />
//                             <Row left="Phép năm:" mid={payslip.annualLeave} right={fmtVND(payslip.leavePay)} />
//                             <Row left="Nhà trọ (xe):" mid="" right={fmtVND(payslip.rent)} />
//                             <Row left="Thưởng chất lượng:" mid="" right={fmtVND(payslip.qualityBonus)} />
      
//                             <Sep />
      
//                             <Row
//                               left="TỔNG LƯƠNG KỲ I:"
//                               right={fmtVND(payslip?.totalSalary)}
//                               strongLeft
//                               strongRight
//                               bigRight
//                             />
//                           </tbody>
//                         </table>
//                       </div>
//                     ) : (
//                       /* ========= GIAO DIỆN THÁNG (không Kỳ I) – giống ảnh: Thu nhập / Khấu trừ ========= */
//       <div className="mt-4 grid md:grid-cols-2 gap-6">
//         {/* Thu nhập */}
//         <div className="rounded-xl border border-slate-200 overflow-hidden">
//           <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">THU NHẬP</div>
//           <div className="p-4 text-sm space-y-1">
//             <Line k="Lương cơ bản" v={fmtVND(payslip.basicSalary)} />
//             <Line k="Trách nhiệm" v={fmtVND(payslip.responsibility)} />
//             <Line k="Công hành chánh" v={payslip.conghanhchanh} />
//             <Line k="Công ca đêm" v={payslip.congcadem} />
//             <Line k="Tổng ngày công" v={payslip.totalWorkingDays} />
//             <Line k="Nghỉ lễ" v={payslip.holiday} />
//             <Line k="Lương thực tế" v={fmtVND(payslip.actualSalary)} bold />
//             <Hr />
      
//             {/* GHÉP TRÊN 1 HÀNG, 3 CỘT: Nhãn | SL/Giờ | Tiền */}
//       <PairRow label="Tăng ca 1,5" mid={payslip.ot15}  right={fmtVND(payslip.otSalary15)} />
//       <PairRow label="Tăng ca 1,8" mid={payslip.ot18}  right={fmtVND(payslip.otSalary18)} />
//       <PairRow label="Phụ cấp T.ca (0,5)" mid={payslip.ot05} right={fmtVND(payslip.otSalary05)} />
//       <PairRow label="Chủ nhật"       mid={payslip.chunhat} right={fmtVND(payslip.luongchunhat)} />
      
//       {/* Gộp Phép năm + Tiền phép trên 1 hàng */}
//       <PairRow label="Phép năm" mid={payslip.annualLeave} right={fmtVND(payslip.leavePay)} />
      
//             <Line k="Chờ việc" v={fmtVND(payslip.choviec)} />
//             <Line k="Nghỉ khác" v={fmtVND(payslip.nghikhac)} />
//             <Line k="Lương chờ việc" v={fmtVND(payslip.luongchoviec)} />
//             <Line k="Lương khác" v={fmtVND(payslip.luongkhac)} />
      
//             <Line k="Nhà trọ / xe" v={fmtVND(payslip.rent)} />
//             <Line k="Hỗ trợ nghỉ giữa ca" v={fmtVND(payslip.hotronghigiuaca)} />
//             <Line k="Hỗ trợ ngày hành kinh" v={fmtVND(payslip.hotrongayhanhkinh)} />
//             <Line k="Con nhỏ" v={fmtVND(payslip.connho)} />
//             <Line k="Thưởng HQCV 1(CC)" v={fmtVND(payslip.thuong1CC)} />
//             <Line k="Thưởng HQCV" v={fmtVND(payslip.qualityBonus)} />
//             <Line k="Hỗ trợ khác" v={fmtVND(payslip.hotrokhac)} />
//             <Line k="Thưởng lễ" v={fmtVND(payslip.thuongle)} />
      
            
//       {/* Tiền cơm: SL | Tiền */}
//       <PairRow label="Tiền cơm" mid={payslip.tiencomSL} right={fmtVND(payslip.tiencom)} />
      
//           </div>
      
//           <div className="px-4 py-2 border-t font-bold flex justify-between gap-[6px]">
//             <span>TỔNG LƯƠNG TRƯỚC KHẤU TRỪ</span>
//             <span className="text-emerald-700">{fmtVND(payslip.totalSalary) || '-'}</span>
//           </div>
//         </div>
      
//         {/* Khấu trừ + Net */}
//         <div className="space-y-4">
//           <div className="rounded-xl border border-slate-200 overflow-hidden">
//             <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">KHẤU TRỪ</div>
//             <div className="p-4 text-sm space-y-1">
//               <Line k="BHXH, BHYT, BHTN" v={fmtVND(payslip.ktbh)} />
//               <Line k="Công đoàn" v={fmtVND(payslip.ktcongdoan)} />
//               <Line k="Lương kỳ I" v={fmtVND(payslip.ktluongky1)} />
//               <Line k="Trừ cơm" v={fmtVND(payslip.kttrucom)} />
//               <Line k="Thuế TNCN" v={fmtVND(payslip.ktthue)} />
//               <Line k="Khấu trừ khác" v={fmtVND(payslip.ktkhac)} />
//             </div>
//           </div>
      
//           <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex justify-between items-center">
//             <span className="font-bold text-emerald-800">LƯƠNG THỰC LÃNH</span>
//             <span className="font-bold text-emerald-900 text-lg">
//                     {fmtVND(payslip?.luongthuclanh) || fmtVND(payslip?.luongThucLanh) || fmtVND(payslip?.net) || '-'}
//             </span>
//           </div>
//         </div>
//       </div>
      
//                     )}
      
//                     <div className="text-[12px] text-slate-500 mt-2">
//                       * Số liệu được làm tròn và chỉ mang tính chất tham khảo nội bộ.
//                     </div>
//                   </div>
//                 )}
//                </div>
//       </div>
//     </div>
//   );
// }





// src/pages/Payroll/sections/MobileViewPayslip.jsx
import React from "react";
import { FaThLarge, FaSpinner, FaBell, FaBellSlash } from "react-icons/fa";

import avatarPayslip from "~/assets/imgs/avatar-main.jpg";
import {
  fmtVND,
  companyFromMSNV,
  Row,
  Sep,
  Line,
  Hr,
  PairRow,
} from "./payslipUi";

/* ======================================================= */

export default function MobileViewPayslip({
  tmp,
  navigate,
  config,

  // data
  loading,
  payslip,

  // push states
  pushChecking,
  pushReady,
  pushBusy,
  pushStatus,
  pushError,
  notifPerm,

  // actions
  handleEnablePush,
  unregisterPush,
}) {
  const user = tmp?.login?.currentUser;
  const fullName = user?.fullName || "bạn";
  const isKyI = /KỲ\s*I/i.test(payslip?.title || "");

  // ✅ YEAR BONUS
  const isYearBonus =
    String(payslip?.docType || "").toUpperCase() === "YEAR_BONUS" ||
    /THƯỞNG\s*NĂM/i.test(payslip?.title || "");

  const THEME = "emerald"; // "emerald" | "skyAmber" | "violetPink"

  const THEMES = {
    emerald: {
      bgMain: "bg-[#E3F4EC]",
      headerGrad:
        "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600",
      cardBg:
        "bg-[#ECF8F1] border-2 border-emerald-300/80 ring-1 ring-emerald-300/30 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
      chipBg: "bg-[#E3F4EC] border border-emerald-300/80",
      bellOn:
        "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
      bellOff:
        "bg-[#E3F4EC] border-2 border-emerald-300/80 text-emerald-900",
      bellDenied:
        "bg-slate-200 text-slate-500 border-2 border-slate-300",
      chipText: "text-emerald-900",
      title1: "text-emerald-900",
      title2: "text-emerald-700",

      netBox: "bg-emerald-50 border-emerald-200",
      netText: "text-emerald-900",
      netLabel: "text-emerald-700",
    },

    skyAmber: {
      bgMain: "bg-[#FFF6D8]",
      headerGrad:
        "bg-gradient-to-br from-sky-600 via-sky-500 to-amber-400",
      cardBg:
        "bg-[#FFFDF4] border-2 border-amber-300/80 ring-1 ring-amber-300/30 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
      chipBg: "bg-[#FFF1C2] border border-amber-300/80",
      bellOn: "bg-gradient-to-br from-sky-600 to-sky-700 text-white",
      bellOff:
        "bg-[#FFF1C2] border-2 border-amber-300/80 text-slate-900",
      bellDenied:
        "bg-slate-200 text-slate-500 border-2 border-slate-300",
      chipText: "text-slate-800",
      title1: "text-slate-900",
      title2: "text-sky-700",

      netBox: "bg-amber-50 border-amber-200",
      netText: "text-slate-900",
      netLabel: "text-sky-700",
    },

    violetPink: {
      bgMain: "bg-[#F6F2FF]",
      headerGrad:
        "bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-400",
      cardBg:
        "bg-white/90 border-2 border-violet-200 ring-1 ring-violet-200/50 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
      chipBg: "bg-violet-50 border border-violet-200",
      bellOn:
        "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white",
      bellOff:
        "bg-violet-50 border-2 border-violet-200 text-violet-800",
      bellDenied:
        "bg-slate-200 text-slate-500 border-2 border-slate-300",
      chipText: "text-violet-800",
      title1: "text-slate-900",
      title2: "text-violet-700",

      netBox: "bg-violet-50 border-violet-200",
      netText: "text-slate-900",
      netLabel: "text-violet-700",
    },
  };

  const t = THEMES[THEME] || THEMES.emerald;

  const canTogglePush =
    !pushChecking && notifPerm !== "unsupported" && notifPerm !== "denied";

  const bellBtnClass = !canTogglePush
    ? t.bellDenied
    : pushReady
    ? t.bellOff
    : t.bellOn;

  const bellTitle = !canTogglePush
    ? notifPerm === "denied"
      ? "Trình duyệt đã chặn thông báo"
      : "Thiết bị không hỗ trợ thông báo"
    : pushReady
    ? "Tắt thông báo"
    : "Bật thông báo";

  const netValue = isYearBonus
    ? // ✅ YEAR BONUS: ưu tiên các field mới, fallback luongthuclanh/net
      fmtVND(payslip?.yb_netPay) ||
      fmtVND(payslip?.netPay) ||
      fmtVND(payslip?.luongthuclanh) ||
      fmtVND(payslip?.net) ||
      "-"
    : isKyI
    ? fmtVND(payslip?.totalSalary)
    : fmtVND(payslip?.luongthuclanh) ||
      fmtVND(payslip?.luongThucLanh) ||
      fmtVND(payslip?.net) ||
      "-";

  // ====== YEAR BONUS helpers ======
  const vOrDash = (v) => {
    const s = String(v ?? "").trim();
    return s ? s : "-";
  };

  const fmtNum2 = (v) => {
    if (v == null || v === "") return "-";
    const n = Number(v);
    if (!Number.isFinite(n)) return vOrDash(v);
    return n.toFixed(2).replace(".", ",");
  };

  const pickFirstMoney = (...vals) => {
    for (const x of vals) {
      const s = String(x ?? "").trim();
      if (s && s !== "0" && s !== "-") return fmtVND(s);
    }
    return "-";
  };

  const YearBonusMobile = ({ p }) => {
    const monthsWorked = p?.yb_monthsWorked ?? p?.monthsWorked ?? "";
    const rating = p?.yb_rating ?? p?.rating ?? "";

    const avgEligible = p?.yb_avgEligibleDaysYear ?? p?.avgEligibleDaysYear ?? "";
    const avgActual = p?.yb_avgWorkDaysYear ?? p?.avgWorkDaysYear ?? "";

    const diffDays = (() => {
      const a = Number(avgEligible);
      const b = Number(avgActual);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return "-";
      return (a - b).toFixed(1).replace(".", ",");
    })();

    const bonusMonth13 = pickFirstMoney(
      p?.yb_bonus1MonthSalary_2,
      p?.bonusMonth13
    );

    const bonusABC = pickFirstMoney(
      p?.yb_bonusABC_1,
      p?.yb_bonusABC_2,
      p?.bonusABC
    );

    const totalBonus = pickFirstMoney(p?.yb_totalBonus, p?.totalBonus);
    const tax = pickFirstMoney(p?.yb_taxWithheld, p?.taxWithheld, p?.ktthue);
    const net = pickFirstMoney(p?.yb_netPay, p?.netPay, p?.luongthuclanh, p?.net);

    return (
      <div className="overflow-hidden">
        <div className="p-4">
          {/* Top meta (MSTT / Tổ / MSNV) */}
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold">MSTT</span>
              <span className="font-bold">{vOrDash(p?.stt)}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="font-semibold">Tổ:</span>
              <span className="font-bold uppercase">
                {vOrDash(p?.yb_team || p?.department)}
              </span>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <span className="font-semibold">MSNV:</span>
              <span className="font-bold">{vOrDash(p?.msnv)}</span>
            </div>
          </div>

          {/* Name */}
          <div className="mt-2 text-[13px]">
            <span className="font-semibold">HỌ VÀ TÊN:</span>
            <span className="ml-2 font-extrabold uppercase">
              {vOrDash(p?.name)}
            </span>
          </div>

          {/* Content */}
          <div className="mt-3 border-t pt-3 text-[13px] space-y-1">
            <Line k="Lương cơ bản:" v={fmtVND(p?.basicSalary) || "-"} />
            <Line k="Trách nhiệm:" v={fmtVND(p?.responsibility) || "-"} />
            <Line k="Tiền xăng, nhà trọ :" v={fmtVND(p?.rent) || "-"} />
            <Line k="HTCV :" v={fmtVND(p?.qualityBonus) || "-"} />

            <div className="my-2 border-t" />
            <Line k="Tổng cộng lương:" v={fmtVND(p?.totalSalary) || "-"} bold />

            <div className="my-2 border-t" />
            <Line k="Số tháng làm việc trong năm:" v={vOrDash(monthsWorked)} />
            <Line k="Xếp loại :" v={vOrDash(rating)} />

            <div className="my-2 border-t" />
            <Line
              k="Ngày công b/q đủ trong năm:"
              v={fmtNum2(avgEligible)}
            />
            <Line
              k="Ngày công b/q thực tế trong năm:"
              v={fmtNum2(avgActual)}
            />
            <Line k="Chênh lệch ngày công:" v={diffDays} />

            <div className="my-2 border-t" />
            <Line k="Tiền thưởng tháng 13:" v={bonusMonth13} bold />
            <Line k="Thưởng đánh giá A,B,C :" v={bonusABC} />

            <div className="my-2 border-t" />
            <Line k="Tổng tiền thưởng :" v={totalBonus} bold />
            <Line k="Tạm thu Thuế TNCN" v={tax} />

            <div className="my-2 border-t" />
            <div className="flex justify-between items-center pt-1">
              <div className="font-extrabold text-slate-800">Thực lãnh :</div>
              <div className="font-extrabold text-[16px] text-slate-900">
                {net}
              </div>
            </div>

            {String(p?.yb_note ?? p?.note ?? "").trim() ? (
              <div className="pt-2 text-[12px] text-slate-500">
                <span className="font-semibold">Ghi chú:</span>{" "}
                {p?.yb_note ?? p?.note}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`md:hidden ${t.bgMain}`} style={{ minHeight: "100dvh" }}>
      {/* HEADER */}
      <div
        className={`
          relative
          ${t.headerGrad}
          rounded-b-[50px]
          px-4 pt-4
          pb-[170px]
        `}
      >
        {/* Top row */}
        <div className="relative flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img
                src={tmp?.login?.currentUser?.avatar || avatarPayslip}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-[18px] font-semibold text-white truncate">
                {fullName}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(config.routes.homeMain)}
            className="
              h-10 w-10 rounded-full grid place-items-center text-white
              bg-white/25 border border-white/40
              active:scale-95 transition
            "
            aria-label="Chọn ứng dụng"
            title="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>
        </div>

        {/* ===== CARD CHỈ TÓM TẮT ===== */}
        <div className="absolute left-4 right-4 top-[110px]">
          <div className={`rounded-3xl px-4 py-4 ${t.cardBg}`}>
            {/* Title + Bell */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className={`text-[20px] font-extrabold ${t.title1}`}>
                  💰 Phiếu lương{" "}
                  <span className={`${t.title2}`}>gần nhất</span>
                </div>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${t.chipBg} ${t.chipText}`}
                  >
                    Xem nhanh • Cập nhật mới
                  </span>
                </div>
              </div>

              {/* 🔔 Bell toggle */}
              <button
                type="button"
                title={bellTitle}
                aria-label={bellTitle}
                disabled={!canTogglePush || pushBusy}
                onClick={() => {
                  if (!canTogglePush || pushBusy) return;
                  if (pushReady) unregisterPush();
                  else handleEnablePush();
                }}
                className={`
                  h-[50px] w-[50px] rounded-2xl
                  grid place-items-center
                  shadow-sm
                  active:scale-95 transition
                  ${bellBtnClass}
                  ${!canTogglePush || pushBusy ? "opacity-80" : ""}
                `}
              >
                {pushBusy ? (
                  <FaSpinner className="animate-spin text-[18px]" />
                ) : pushReady ? (
                  <FaBellSlash className="text-[18px]" />
                ) : (
                  <FaBell className="text-[18px]" />
                )}
              </button>
            </div>

            {/* Status */}
            {(pushError || pushStatus) && (
              <div
                className={`mt-3 rounded-2xl p-3 text-sm ${
                  pushError
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {pushError || pushStatus}
              </div>
            )}

            {/* ✅ NET box */}
            <div className="mt-3">
              <div
                className={`
                  rounded-2xl border px-4 py-3
                  ${t.netBox}
                  flex items-center justify-between gap-3
                `}
              >
                <div className="min-w-0">
                  <div className={`text-[11px] font-semibold ${t.netLabel}`}>
                    {isYearBonus ? "THƯỞNG THỰC LÃNH" : "LƯƠNG THỰC LÃNH"}
                  </div>
                  <div
                    className={`text-[18px] font-extrabold tabular-nums ${t.netText}`}
                  >
                    {netValue}
                  </div>
                </div>
                <div className="text-[12px] text-slate-500 text-right"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[45px]" />

      {/* ===== BODY ===== */}
      <div className="p-[10px]">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {!payslip ? (
            <div className="p-5 text-slate-600">Chưa có phiếu lương nào.</div>
          ) : (
            <div className="p-4">
              {/* Header */}
              <div className="text-center border-b pb-3">
                <div className="font-semibold text-slate-800">
                  {companyFromMSNV(payslip?.msnv ?? user?.msnv)}
                </div>
                <div className="font-extrabold text-[16px] text-slate-900 tracking-wide mt-1 uppercase">
                  {payslip?.title}
                </div>
              </div>

              {/* Thông tin */}
              {
                !isYearBonus &&
                <>
                  <div className="grid grid-cols-1 gap-2 text-sm mt-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">MSTT:</span>
                      <span>{payslip.stt ?? "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">BỘ PHẬN:</span>
                      <span className="uppercase">{payslip.department || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">MSNV:</span>
                      <span>{payslip.msnv || "-"}</span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm">
                    <span className="font-semibold">HỌ VÀ TÊN:</span>
                    <span className="ml-3 font-bold uppercase">
                      {payslip.name || "-"}
                    </span>
                  </div>
                </>
              }

              {/* ======= BRANCH ======= */}
              {isYearBonus ? (
                <YearBonusMobile p={payslip} />
              ) : isKyI ? (
                /* ========= KỲ I ========= */
                <div className="mt-4 border">
                  <table className="w-full text-sm">
                    <colgroup>
                      <col className="w-[55%]" />
                      <col className="w-[15%]" />
                      <col className="w-[30%]" />
                    </colgroup>
                    <tbody>
                      <Row left="Lương cơ bản" mid={fmtVND(payslip.basicSalary)} />
                      <Row left="Trách nhiệm" mid={fmtVND(payslip.responsibility)} />
                      <Row left="Tổng ngày công:" mid={payslip.totalWorkingDays} />
                      <Row left="Lễ:" mid={payslip.holiday} />
                      <Row
                        left="Lương thực tế:"
                        mid=""
                        right={fmtVND(payslip.actualSalary)}
                        strongRight
                      />

                      <Sep />

                      <Row
                        left="Giờ tăng ca 1,5"
                        mid={payslip.ot15}
                        right={fmtVND(payslip.otSalary15)}
                      />
                      <Row
                        left="Giờ tăng ca 1,8"
                        mid={payslip.ot18}
                        right={fmtVND(payslip.otSalary18)}
                      />
                      <Row
                        left="Phụ cấp T.ca (0.5 giờ)"
                        mid={payslip.ot05}
                        right={fmtVND(payslip.otSalary05)}
                      />
                      <Row
                        left="Phép năm:"
                        mid={payslip.annualLeave}
                        right={fmtVND(payslip.leavePay)}
                      />
                      <Row left="Nhà trọ (xe):" mid="" right={fmtVND(payslip.rent)} />
                      <Row
                        left="Thưởng chất lượng:"
                        mid=""
                        right={fmtVND(payslip.qualityBonus)}
                      />

                      <Sep />

                      <Row
                        left="TỔNG LƯƠNG KỲ I:"
                        right={fmtVND(payslip?.totalSalary)}
                        strongLeft
                        strongRight
                        bigRight
                      />
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ========= THÁNG ========= */
                <div className="mt-4 grid gap-4">
                  {/* Thu nhập */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">
                      THU NHẬP
                    </div>
                    <div className="p-4 text-sm space-y-1">
                      <Line k="Lương cơ bản" v={fmtVND(payslip.basicSalary)} />
                      <Line k="Trách nhiệm" v={fmtVND(payslip.responsibility)} />
                      <Line k="Công hành chánh" v={payslip.totalWorkingDays} />
                      <Line k="Công ca đêm" v={payslip.congcadem} />
                      <Line k="Tổng ngày công" v={payslip.totalWorkingDays} />
                      <Line k="Nghỉ lễ" v={payslip.holiday} />
                      <Line k="Lương thực tế" v={fmtVND(payslip.actualSalary)} bold />
                      <Hr />

                      <PairRow
                        label="Tăng ca 1,5"
                        mid={payslip.ot15}
                        right={fmtVND(payslip.otSalary15)}
                      />
                      <PairRow
                        label="Tăng ca 1,8"
                        mid={payslip.ot18}
                        right={fmtVND(payslip.otSalary18)}
                      />
                      <PairRow
                        label="Phụ cấp T.ca (0,5)"
                        mid={payslip.ot05}
                        right={fmtVND(payslip.otSalary05)}
                      />
                      <PairRow
                        label="Chủ nhật"
                        mid={payslip.chunhat}
                        right={fmtVND(payslip.luongchunhat)}
                      />
                      <PairRow
                        label="Phép năm"
                        mid={payslip.annualLeave}
                        right={fmtVND(payslip.leavePay)}
                      />

                      <Line k="Chờ việc" v={fmtVND(payslip.choviec)} />
                      <Line k="Nghỉ khác" v={fmtVND(payslip.nghikhac)} />
                      <Line k="Lương chờ việc" v={fmtVND(payslip.luongchoviec)} />
                      <Line k="Lương khác" v={fmtVND(payslip.luongkhac)} />

                      <Line k="Nhà trọ / xe" v={fmtVND(payslip.rent)} />
                      <Line
                        k="Hỗ trợ nghỉ giữa ca"
                        v={fmtVND(payslip.hotronghigiuaca)}
                      />
                      <Line
                        k="Hỗ trợ ngày hành kinh"
                        v={fmtVND(payslip.hotrongayhanhkinh)}
                      />
                      <Line k="Con nhỏ" v={fmtVND(payslip.connho)} />
                      <Line k="Thưởng HQCV 1(CC)" v={fmtVND(payslip.thuong1CC)} />
                      <Line k="Thưởng HQCV" v={fmtVND(payslip.qualityBonus)} />
                      <Line k="Hỗ trợ khác" v={fmtVND(payslip.hotrokhac)} />
                      <Line k="Thưởng lễ" v={fmtVND(payslip.thuongle)} />

                      <PairRow
                        label="Tiền cơm"
                        mid={payslip.tiencomSL}
                        right={fmtVND(payslip.tiencom)}
                      />
                    </div>

                    <div className="px-4 py-2 border-t font-bold flex justify-between gap-[6px]">
                      <span>TỔNG LƯƠNG TRƯỚC KHẤU TRỪ</span>
                      <span className="text-emerald-700">
                        {fmtVND(payslip.totalSalary) || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Khấu trừ */}
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2 border-b font-semibold bg-slate-50 text-slate-700">
                      KHẤU TRỪ
                    </div>
                    <div className="p-4 text-sm space-y-1">
                      <Line k="BHXH, BHYT, BHTN" v={fmtVND(payslip.ktbh)} />
                      <Line k="Công đoàn" v={fmtVND(payslip.ktcongdoan)} />
                      <Line k="Lương kỳ I" v={fmtVND(payslip.ktluongky1)} />
                      <Line k="Trừ cơm" v={fmtVND(payslip.kttrucom)} />
                      <Line k="Thuế TNCN" v={fmtVND(payslip.ktthue)} />
                      <Line k="Khấu trừ khác" v={fmtVND(payslip.ktkhac)} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex justify-between items-center">
                    <span className="font-bold text-emerald-800">
                      LƯƠNG THỰC LÃNH
                    </span>
                    <span className="font-bold text-emerald-900 text-lg">
                      {fmtVND(payslip?.luongthuclanh) ||
                        fmtVND(payslip?.luongThucLanh) ||
                        fmtVND(payslip?.net) ||
                        "-"}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-[12px] text-slate-500 mt-2">
                * Số liệu được làm tròn và chỉ mang tính chất tham khảo nội bộ.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


