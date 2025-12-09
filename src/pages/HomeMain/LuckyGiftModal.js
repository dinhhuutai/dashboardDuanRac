// // src/pages/Home/LuckyGiftModal.jsx
// import React, { useState } from "react";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";

// // tất cả các loại quà có thể xuất hiện
// const ALL_PRIZES = [
//   { key: "cash_500k", label: "500K tiền mặt", emoji: "💸" },
//   { key: "pizza", label: "Bánh pizza", emoji: "🍕" },
//   { key: "milk_tea", label: "Trà sữa", emoji: "🧋" },
//   { key: "snow_trip_india", label: "Du lịch ngắm tuyết tại Ấn Độ", emoji: "🏔️" },
//   {
//     key: "doraemon_movie_home",
//     label: "Vé xem phim Doraemon tại nhà",
//     emoji: "🎬",
//   },
//   {
//     key: "beach_trip_tay_nguyen",
//     label: "Du lịch tắm biển Tây Nguyên",
//     emoji: "🏖️",
//   },

//   // --- các phần quà thêm ---
//   { key: "coffee_milk", label: "Ly cà phê sữa đá", emoji: "🥤" },
//   { key: "snack", label: "Thanh socola", emoji: "🍫" },
//   { key: "snack_chips", label: "Bịch bánh snack ăn vặt", emoji: "🍟" },
//   { key: "buffet_discount", label: "Voucher buffet giảm giá 100%", emoji: "🥩" },
//   { key: "spa_voucher", label: "Voucher massage", emoji: "💆" },
//   { key: "powerbank", label: "Pin dự phòng", emoji: "🔋" },
//   { key: "wireless_mouse", label: "Chuột không dây", emoji: "🖱️" },
//   { key: "gym_1month", label: "Thẻ tập gym 1 tháng", emoji: "🏋️" },
//   { key: "yoga_10buoi", label: "10 buổi yoga", emoji: "🧘" },
//   { key: "fan_table", label: "Quạt để bàn", emoji: "🌬️" },
//   { key: "bed_sheet_set", label: "Bộ ga gối mới", emoji: "🛌" },
//   { key: "vacuum_mini", label: "Máy hút bụi mini", emoji: "🧹" },
//   {
//     key: "cooking_class",
//     label: "Khoá học nấu ăn – học xong vẫn ăn tiệm",
//     emoji: "👨‍🍳",
//   },
//   {
//     key: "data_4g_month",
//     label: "Gói 4G 1 tháng – lướt không cần WiFi",
//     emoji: "📶",
//   },
//   { key: "panda_plush", label: "Gấu trúc bông", emoji: "🐼" },
//   {
//     key: "water_bottle_big",
//     label: "Bình nước lớn 2L – mang đi là đủ uống cả ngày",
//     emoji: "🚰",
//   },
//   { key: "headphone_wired", label: "Tai nghe có dây", emoji: "🎧" },

//   // bắt buộc có trong mỗi lượt
//   { key: "better_luck_next_time", label: "Chúc bạn may mắn lần sau", emoji: "🍀" },
// ];

// const ALWAYS_LOSE_KEY = "better_luck_next_time";

// // màu mặt sau cho từng thẻ (theo key)
// const HIDDEN_COLORS = {
//   cash_500k: "from-indigo-400 to-indigo-600",
//   pizza: "from-rose-400 to-rose-600",
//   milk_tea: "from-amber-400 to-amber-600",
//   snow_trip_india: "from-sky-400 to-sky-600",
//   doraemon_movie_home: "from-cyan-400 to-cyan-600",
//   beach_trip_tay_nguyen: "from-emerald-400 to-emerald-600",

//   coffee_milk: "from-amber-400 to-amber-600",
//   snack: "from-pink-400 to-pink-600",
//   snack_chips: "from-lime-400 to-lime-600",
//   buffet_discount: "from-red-400 to-red-600",
//   spa_voucher: "from-rose-400 to-rose-600",
//   powerbank: "from-yellow-400 to-yellow-600",
//   wireless_mouse: "from-slate-400 to-slate-600",
//   gym_1month: "from-orange-400 to-orange-600",
//   yoga_10buoi: "from-teal-400 to-teal-600",
//   fan_table: "from-sky-400 to-sky-600",
//   bed_sheet_set: "from-indigo-400 to-indigo-600",
//   vacuum_mini: "from-lime-400 to-lime-600",
//   cooking_class: "from-amber-400 to-amber-600",
//   data_4g_month: "from-purple-400 to-purple-600",
//   panda_plush: "from-zinc-400 to-zinc-600",
//   water_bottle_big: "from-cyan-400 to-cyan-600",
//   headphone_wired: "from-fuchsia-400 to-fuchsia-600",

//   better_luck_next_time: "from-purple-400 to-purple-600",
// };

// // xáo trộn trong 5 giây
// const SPIN_DURATION_MS = 5000;
// // mỗi 80ms đảo vị trí 1 lần
// const SHUFFLE_INTERVAL_MS = 80;

// // helper: shuffle array
// function shuffleArray(arr) {
//   const a = [...arr];
//   for (let i = a.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [a[i], a[j]] = [a[j], a[i]];
//   }
//   return a;
// }

// // chọn ngẫu nhiên 9 phần quà, nhưng luôn có 1 "Chúc bạn may mắn lần sau" ở cuối mảng
// function pickNinePrizes() {
//   const losePrize = ALL_PRIZES.find((p) => p.key === ALWAYS_LOSE_KEY);
//   const others = ALL_PRIZES.filter((p) => p.key !== ALWAYS_LOSE_KEY);

//   const shuffledOthers = shuffleArray(others);
//   const picked8 = shuffledOthers.slice(0, 8);

//   // giữ losePrize ở cuối cùng
//   return [...picked8, losePrize];
// }

// export default function LuckyGiftModal({ isOpen, onClose }) {
//   const [phase, setPhase] = useState("intro"); // intro | spinning | choose | result
//   const [hiddenMode, setHiddenMode] = useState(false); // true = thẻ đang úp

//   // bộ 9 phần quà cho một lượt chơi
//   const [roundPrizes, setRoundPrizes] = useState(() => pickNinePrizes());
//   const [displayPrizes, setDisplayPrizes] = useState(() => roundPrizes);

//   const [shuffleTimerId, setShuffleTimerId] = useState(null);
//   const [selectedPrizeKey, setSelectedPrizeKey] = useState(null);
//   const [claiming, setClaiming] = useState(false);
//   const [finalResult, setFinalResult] = useState(null);

//   const [spinTick, setSpinTick] = useState(0);
//   const [spinProgress, setSpinProgress] = useState(0); // 0 → 1 trong 5s

//   // offset random cho chuyển động xoáo bài
//   const [randomOffsets] = useState(() =>
//     Array.from({ length: 9 }, () => ({
//       baseX: (Math.random() * 2 - 1) * 20, // -20 → 20
//       baseY: (Math.random() * 2 - 1) * 20, // -20 → 20
//       phase: Math.random() * Math.PI * 2,
//     }))
//   );

//   if (!isOpen) return null;

//   const handleStartSpin = () => {
//     if (phase !== "intro") return;

//     setPhase("spinning");
//     setHiddenMode(true); // úp toàn bộ thẻ
//     setSpinTick(0);
//     setSpinProgress(0);

//     let current = [...roundPrizes];
//     const start = performance.now();

//     const id = setInterval(() => {
//       // chỉ xáo 8 thẻ đầu, thẻ cuối (may mắn lần sau) đứng yên
//       const nonLose = current.slice(0, current.length - 1);
//       const loseCard = current[current.length - 1];

//       const shuffledNonLose = shuffleArray(nonLose);
//       current = [...shuffledNonLose, loseCard];

//       setDisplayPrizes(current);
//       setSpinTick((t) => t + 1);

//       const elapsed = performance.now() - start;
//       const progress = Math.min(elapsed / SPIN_DURATION_MS, 1);
//       setSpinProgress(progress);
//     }, SHUFFLE_INTERVAL_MS);

//     setShuffleTimerId(id);

//     setTimeout(() => {
//       clearInterval(id);
//       setShuffleTimerId(null);
//       setPhase("choose"); // cho chọn
//     }, SPIN_DURATION_MS);
//   };

//   const handlePickPrize = async (prize) => {
//     if (phase !== "choose" || claiming) return;

//     setSelectedPrizeKey(prize.key);
//     setPhase("result");
//     setClaiming(true);

//     try {
//       // backend: đánh dấu luckyGiftClaimed = 1, luôn trả "Chúc bạn may mắn lần sau"
//       const res = await http.post(`${BASE_URL}/api/lucky-gift/claim`, {
//         prizeKey: prize.key,
//       });

//       const msg =
//         res.data?.data?.luckyGiftResult || "Chúc bạn may mắn lần sau";
//       setFinalResult(msg);
//     } catch (err) {
//       console.error("Claim lucky gift error:", err);
//       setFinalResult("Chúc bạn may mắn lần sau");
//     } finally {
//       setClaiming(false);
//     }
//   };

//   const handleClose = () => {
//     if (shuffleTimerId) clearInterval(shuffleTimerId);
//     setShuffleTimerId(null);

//     // random bộ 9 quà mới, cuối vẫn là "may mắn lần sau"
//     const nextRound = pickNinePrizes();
//     setRoundPrizes(nextRound);
//     setDisplayPrizes(nextRound);

//     // reset state
//     setPhase("intro");
//     setHiddenMode(false);
//     setSelectedPrizeKey(null);
//     setClaiming(false);
//     setFinalResult(null);
//     setSpinTick(0);
//     setSpinProgress(0);
//     onClose?.();
//   };

//   const isSpinning = phase === "spinning";

//   return (
//     <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-3">
//       <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50 shadow-2xl p-4 sm:p-5 border border-slate-200/70">
//         {/* deco confetti góc trên */}
//         <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light">
//           <div className="absolute -top-6 -left-6 w-16 h-16 bg-pink-300/40 rounded-full blur-2xl" />
//           <div className="absolute -bottom-6 -right-4 w-16 h-16 bg-sky-300/40 rounded-full blur-2xl" />
//         </div>

//         {/* nút đóng */}
//         <button
//           type="button"
//           onClick={handleClose}
//           className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-slate-500 hover:bg-slate-100 shadow-sm"
//         >
//           ✕
//         </button>

//         {/* header */}
//         <div className="relative text-center mb-3 mt-1">
//           <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 border border-amber-200 text-[10px] uppercase tracking-wide font-semibold text-amber-700">
//             <span className="text-[11px]">🛠️</span>
//             <span>Bug Hunter Reward</span>
//           </div>
//           <h2 className="text-base sm:text-lg font-bold mt-2 mb-1 text-slate-800">
//             Quà sửa lỗi hệ thống
//           </h2>
//           <p className="text-[11px] sm:text-xs text-gray-600">
//             Minigame vui là chính - quà là... hên xui 😄
//           </p>
//         </div>

//         {/* khung bao lưới thẻ – thêm glow khi spinning */}
//         <div
//           className={`relative mt-2 rounded-2xl border bg-white/80 p-2 sm:p-2.5 ${
//             isSpinning
//               ? "border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_10px_25px_rgba(16,185,129,0.25)]"
//               : "border-slate-200 shadow-sm"
//           } transition-all`}
//         >
//           <PrizeGrid
//             prizes={displayPrizes}
//             hiddenMode={hiddenMode}
//             phase={phase}
//             selectedPrizeKey={selectedPrizeKey}
//             onPickPrize={handlePickPrize}
//             spinTick={spinTick}
//             spinProgress={spinProgress}
//             randomOffsets={randomOffsets}
//           />
//         </div>

//         {/* footer */}
//         <div className="mt-3 flex flex-col items-center gap-2 relative">
//           {phase === "intro" && (
//             <button
//               type="button"
//               onClick={handleStartSpin}
//               className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-600 flex items-center gap-2 shadow-sm"
//             >
//               <span>🎲 Bắt đầu xáo trộn</span>
//             </button>
//           )}

//           {phase === "spinning" && (
//             <button
//               type="button"
//               disabled
//               className="px-4 py-1.5 rounded-full bg-gray-400 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
//             >
//               <span className="inline-block h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
//               <span>Đang xáo trộn...</span>
//             </button>
//           )}

//           {phase === "choose" && (
//             <p className="text-[11px] sm:text-xs text-gray-600 text-center">
//               Chọn <span className="font-semibold">1 thẻ</span> mà bạn thấy may mắn nhất ✨
//             </p>
//           )}

//           {phase === "result" && (
//             <div className="flex flex-col items-center gap-1 mt-1">
//               <div className="text-3xl">🍀</div>
//               <div className="text-sm font-semibold text-center text-slate-800">
//                 {finalResult || "Chúc bạn may mắn lần sau"}
//               </div>
//               <p className="text-[10px] text-gray-500">
//                 Tinh thần là chính, vật chất tính sau nha 😆
//               </p>
//               <button
//                 type="button"
//                 onClick={handleClose}
//                 className="mt-1 px-4 py-1.5 rounded-full bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 shadow-sm"
//               >
//                 Đóng lại
//               </button>
//             </div>
//           )}

//           <p className="mt-1 text-[9px] text-gray-400 text-center">
//             *Tất cả phần quà chỉ mang tính chất minh hoạ, không có giá trị quy đổi.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// function PrizeGrid({
//   prizes,
//   hiddenMode,
//   phase,
//   selectedPrizeKey,
//   onPickPrize,
//   spinTick,
//   spinProgress,
//   randomOffsets,
// }) {
//   const canPick = phase === "choose";

//   return (
//     <div
//       className={`grid grid-cols-3 gap-1.5 sm:gap-2 transition-transform ${
//         phase === "spinning" ? "animate-pulse" : ""
//       }`}
//     >
//       {prizes.map((p, idx) => {
//         const isSelected = phase === "result" && p.key === selectedPrizeKey;

//         let spinStyle = { transition: "transform 0.15s ease-out" };

//         if (phase === "spinning") {
//           const progress = spinProgress || 0;

//           // độ "xáo trộn" – lớn suốt quá trình, nhưng 0.9 → 1 thì giảm dần về 0 (để tách ra lại ô)
//           const chaosFactor =
//             progress < 0.9 ? 1 : Math.max(0, (1 - progress) / 0.1); // 0.9→1: 1→0

//           const baseCfg =
//             randomOffsets[idx % randomOffsets.length] || {
//               baseX: 0,
//               baseY: 0,
//               phase: 0,
//             };

//           const t = spinTick * 0.5 + baseCfg.phase;

//           // biên độ xoáo bài
//           const amp = 26 * chaosFactor;

//           // chuyển động xoay vòng quanh tâm + lệch ngẫu nhiên
//           const swirlX = Math.cos(t) * amp + baseCfg.baseX * chaosFactor;
//           const swirlY = Math.sin(t * 1.3) * amp + baseCfg.baseY * chaosFactor;

//           // "hút" về vùng trung tâm grid để trông giống xào gom lại một cục
//           const col = idx % 3; // 0,1,2
//           const row = Math.floor(idx / 3); // 0,1,2
//           const centerBiasX = (1 - col) * 10 * chaosFactor; // col 0→+10, 2→-10
//           const centerBiasY = (1 - row) * 8 * chaosFactor; // tương tự theo row

//           const tx = swirlX + centerBiasX;
//           const ty = swirlY + centerBiasY;
//           const rot = Math.sin(t * 1.7) * 10 * chaosFactor;

//           spinStyle = {
//             transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg)`,
//             transition: "transform 0.08s linear",
//           };
//         }

//         const colorClass =
//           HIDDEN_COLORS[p.key] || "from-indigo-400 to-indigo-600";

//         return (
//           <button
//             key={p.key}
//             type="button"
//             onClick={() => canPick && onPickPrize?.(p)}
//             disabled={!canPick}
//             style={spinStyle}
//             className={`relative h-14 sm:h-16 rounded-lg border shadow-sm flex items-center justify-center text-center text-[9px] sm:text-[10px] transition
//               ${
//                 canPick
//                   ? "hover:-translate-y-0.5 hover:shadow cursor-pointer"
//                   : "cursor-default"
//               }
//               ${
//                 hiddenMode
//                   ? `bg-gradient-to-br ${colorClass} text-white border-transparent`
//                   : "bg-white border-slate-200 text-slate-700"
//               }
//             `}
//           >
//             {/* intro: hiện quà thật */}
//             {!hiddenMode && phase === "intro" && (
//               <div className="flex flex-col items-center px-1">
//                 <div className="text-lg mb-0.5">{p.emoji}</div>
//                 <div className="font-semibold leading-tight line-clamp-2">
//                   {p.label}
//                 </div>
//               </div>
//             )}

//             {/* spinning / choose: mặt sau với màu khác nhau */}
//             {hiddenMode && phase !== "result" && (
//               <div className="flex flex-col items-center">
//                 <div className="text-lg mb-0.5">❓</div>
//                 <div className="font-semibold leading-tight">
//                   Chọn tôi đi
//                 </div>
//               </div>
//             )}

//             {/* result: chỉ thẻ được chọn hiện thông điệp */}
//             {phase === "result" && (
//               <>
//                 {isSelected ? (
//                   <div className="flex flex-col items-center px-1">
//                     <div className="text-lg mb-0.5">🍀</div>
//                     <div className="font-semibold leading-tight">
//                       Chúc bạn may mắn lần sau
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center">
//                     <div className="text-lg mb-0.5">❓</div>
//                   </div>
//                 )}
//               </>
//             )}
//           </button>
//         );
//       })}
//     </div>
//   );
// }







// src/pages/Home/LuckyGiftModal.jsx
import React, { useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";

// tất cả các loại quà có thể xuất hiện
const ALL_PRIZES = [
  { key: "cash_500k", label: "500K tiền mặt", emoji: "💸" },
  { key: "pizza", label: "Bánh pizza", emoji: "🍕" },
  { key: "milk_tea", label: "Trà sữa", emoji: "🧋" },
  { key: "snow_trip_india", label: "Du lịch ngắm tuyết tại Ấn Độ", emoji: "🏔️" },
  {
    key: "doraemon_movie_home",
    label: "Vé xem phim Doraemon tại nhà",
    emoji: "🎬",
  },
  {
    key: "beach_trip_tay_nguyen",
    label: "Du lịch tắm biển Tây Nguyên",
    emoji: "🏖️",
  },

  // --- các phần quà thêm ---
  { key: "coffee_milk", label: "Ly cà phê sữa đá", emoji: "🥤" },
  { key: "snack", label: "Thanh socola", emoji: "🍫" },
  { key: "snack_chips", label: "Bịch bánh snack ăn vặt", emoji: "🍟" },
  { key: "buffet_discount", label: "Voucher buffet giảm giá 100%", emoji: "🥩" },
  { key: "spa_voucher", label: "Voucher massage", emoji: "💆" },
  { key: "powerbank", label: "Pin dự phòng", emoji: "🔋" },
  { key: "wireless_mouse", label: "Chuột không dây", emoji: "🖱️" },
  { key: "gym_1month", label: "Thẻ tập gym 1 tháng", emoji: "🏋️" },
  { key: "yoga_10buoi", label: "10 buổi yoga", emoji: "🧘" },
  { key: "fan_table", label: "Quạt để bàn", emoji: "🌬️" },
  { key: "bed_sheet_set", label: "Bộ ga gối mới", emoji: "🛌" },
  { key: "vacuum_mini", label: "Máy hút bụi mini", emoji: "🧹" },
  {
    key: "cooking_class",
    label: "Khoá học nấu ăn – học xong vẫn ăn tiệm",
    emoji: "👨‍🍳",
  },
  {
    key: "data_4g_month",
    label: "Gói 4G 1 tháng – lướt không cần WiFi",
    emoji: "📶",
  },
  { key: "panda_plush", label: "Gấu trúc bông", emoji: "🐼" },
  {
    key: "water_bottle_big",
    label: "Bình nước lớn 2L – mang đi là đủ uống cả ngày",
    emoji: "🚰",
  },
  { key: "headphone_wired", label: "Tai nghe có dây", emoji: "🎧" },

  // bắt buộc có trong mỗi lượt
  { key: "better_luck_next_time", label: "Chúc bạn may mắn lần sau", emoji: "🍀" },
];

const ALWAYS_LOSE_KEY = "better_luck_next_time";

// màu mặt sau cho từng thẻ (theo key)
const HIDDEN_COLORS = {
  cash_500k: "from-indigo-400 to-indigo-600",
  pizza: "from-rose-400 to-rose-600",
  milk_tea: "from-amber-400 to-amber-600",
  snow_trip_india: "from-sky-400 to-sky-600",
  doraemon_movie_home: "from-cyan-400 to-cyan-600",
  beach_trip_tay_nguyen: "from-emerald-400 to-emerald-600",

  coffee_milk: "from-amber-400 to-amber-600",
  snack: "from-pink-400 to-pink-600",
  snack_chips: "from-lime-400 to-lime-600",
  buffet_discount: "from-red-400 to-red-600",
  spa_voucher: "from-rose-400 to-rose-600",
  powerbank: "from-yellow-400 to-yellow-600",
  wireless_mouse: "from-slate-400 to-slate-600",
  gym_1month: "from-orange-400 to-orange-600",
  yoga_10buoi: "from-teal-400 to-teal-600",
  fan_table: "from-sky-400 to-sky-600",
  bed_sheet_set: "from-indigo-400 to-indigo-600",
  vacuum_mini: "from-lime-400 to-lime-600",
  cooking_class: "from-amber-400 to-amber-600",
  data_4g_month: "from-purple-400 to-purple-600",
  panda_plush: "from-zinc-400 to-zinc-600",
  water_bottle_big: "from-cyan-400 to-cyan-600",
  headphone_wired: "from-fuchsia-400 to-fuchsia-600",

  better_luck_next_time: "from-purple-400 to-purple-600",
};

// xáo trộn trong 5 giây
const SPIN_DURATION_MS = 5000;
// mỗi 80ms đảo vị trí 1 lần
const SHUFFLE_INTERVAL_MS = 80;

// helper: shuffle array
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// chọn ngẫu nhiên 9 phần quà, nhưng luôn có 1 "Chúc bạn may mắn lần sau" ở cuối mảng
function pickNinePrizes() {
  const losePrize = ALL_PRIZES.find((p) => p.key === ALWAYS_LOSE_KEY);
  const others = ALL_PRIZES.filter((p) => p.key !== ALWAYS_LOSE_KEY);

  const shuffledOthers = shuffleArray(others);
  const picked8 = shuffledOthers.slice(0, 8);

  // giữ losePrize ở cuối cùng
  return [...picked8, losePrize];
}

export default function LuckyGiftModal({ isOpen, onClose }) {
  const [phase, setPhase] = useState("intro"); // intro | spinning | choose | result
  const [hiddenMode, setHiddenMode] = useState(false); // true = thẻ đang úp

  // bộ 9 phần quà cho một lượt chơi
  const [roundPrizes, setRoundPrizes] = useState(() => pickNinePrizes());
  const [displayPrizes, setDisplayPrizes] = useState(() => roundPrizes);

  const [shuffleTimerId, setShuffleTimerId] = useState(null);
  const [selectedPrizeKey, setSelectedPrizeKey] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const [spinTick, setSpinTick] = useState(0);
  const [spinProgress, setSpinProgress] = useState(0); // 0 → 1 trong 5s

  // offset random cho chuyển động xoáo bài
  const [randomOffsets] = useState(() =>
    Array.from({ length: 9 }, () => ({
      baseX: (Math.random() * 2 - 1) * 20, // -20 → 20
      baseY: (Math.random() * 2 - 1) * 20, // -20 → 20
      phase: Math.random() * Math.PI * 2,
    }))
  );

  if (!isOpen) return null;

  const handleStartSpin = () => {
    if (phase !== "intro") return;

    setPhase("spinning");
    setHiddenMode(true); // úp toàn bộ thẻ
    setSpinTick(0);
    setSpinProgress(0);

    let current = [...roundPrizes];
    const start = performance.now();

    const id = setInterval(() => {
      // chỉ xáo 8 thẻ đầu, thẻ cuối (may mắn lần sau) đứng yên
      const nonLose = current.slice(0, current.length - 1);
      const loseCard = current[current.length - 1];

      const shuffledNonLose = shuffleArray(nonLose);
      current = [...shuffledNonLose, loseCard];

      setDisplayPrizes(current);
      setSpinTick((t) => t + 1);

      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / SPIN_DURATION_MS, 1);
      setSpinProgress(progress);
    }, SHUFFLE_INTERVAL_MS);

    setShuffleTimerId(id);

    setTimeout(() => {
      clearInterval(id);
      setShuffleTimerId(null);
      setPhase("choose"); // cho chọn
    }, SPIN_DURATION_MS);
  };

  const handlePickPrize = async (prize) => {
    if (phase !== "choose" || claiming) return;

    setSelectedPrizeKey(prize.key);
    setPhase("result");
    setClaiming(true);

    try {
      // backend: đánh dấu luckyGiftClaimed = 1, luôn trả "Chúc bạn may mắn lần sau"
      const res = await http.post(`${BASE_URL}/api/lucky-gift/claim`, {
        prizeKey: prize.key,
      });

      const msg =
        res.data?.data?.luckyGiftResult || "Chúc bạn may mắn lần sau";
      setFinalResult(msg);
    } catch (err) {
      console.error("Claim lucky gift error:", err);
      setFinalResult("Chúc bạn may mắn lần sau");
    } finally {
      setClaiming(false);
    }
  };

  const handleClose = () => {
    if (shuffleTimerId) clearInterval(shuffleTimerId);
    setShuffleTimerId(null);

    // random bộ 9 quà mới, cuối vẫn là "may mắn lần sau"
    const nextRound = pickNinePrizes();
    setRoundPrizes(nextRound);
    setDisplayPrizes(nextRound);

    // reset state
    setPhase("intro");
    setHiddenMode(false);
    setSelectedPrizeKey(null);
    setClaiming(false);
    setFinalResult(null);
    setSpinTick(0);
    setSpinProgress(0);
    onClose?.();
  };

  const isSpinning = phase === "spinning";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-3">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-gradient-to-br from-slate-50 via-white to-sky-50 shadow-2xl p-4 sm:p-5 border border-slate-200/70">
        {/* deco confetti góc trên */}
        <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-soft-light">
          <div className="absolute -top-6 -left-6 w-16 h-16 bg-pink-300/40 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 -right-4 w-16 h-16 bg-sky-300/40 rounded-full blur-2xl" />
        </div>

        {/* nút đóng */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-slate-500 hover:bg-slate-100 shadow-sm"
        >
          ✕
        </button>

        {/* header */}
        <div className="relative text-center mb-3 mt-1">
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 border border-amber-200 text-[10px] uppercase tracking-wide font-semibold text-amber-700">
            <span className="text-[11px]">🛠️</span>
            <span>Bug Hunter Reward</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold mt-2 mb-1 text-slate-800">
            Quà sửa lỗi hệ thống
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-600">
            Minigame vui là chính - quà là... hên xui 😄
          </p>
        </div>

        {/* khung bao lưới thẻ – thêm glow khi spinning */}
        <div
          className={`relative mt-2 rounded-2xl border bg-white/80 p-2 sm:p-2.5 ${
            isSpinning
              ? "border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_10px_25px_rgba(16,185,129,0.25)]"
              : "border-slate-200 shadow-sm"
          } transition-all`}
        >
          <PrizeGrid
            prizes={displayPrizes}
            hiddenMode={hiddenMode}
            phase={phase}
            selectedPrizeKey={selectedPrizeKey}
            onPickPrize={handlePickPrize}
            spinTick={spinTick}
            spinProgress={spinProgress}
            randomOffsets={randomOffsets}
          />
        </div>

        {/* footer */}
        <div className="mt-3 flex flex-col items-center gap-2 relative">
          {phase === "intro" && (
            <button
              type="button"
              onClick={handleStartSpin}
              className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-600 flex items-center gap-2 shadow-sm"
            >
              <span>🎲 Bắt đầu xáo trộn</span>
            </button>
          )}

          {phase === "spinning" && (
            <button
              type="button"
              disabled
              className="px-4 py-1.5 rounded-full bg-gray-400 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <span className="inline-block h-4 w-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
              <span>Đang xáo trộn...</span>
            </button>
          )}

          {phase === "choose" && (
            <p className="text-[11px] sm:text-xs text-gray-600 text-center">
              Chọn <span className="font-semibold">1 thẻ</span> mà bạn thấy may mắn nhất ✨
            </p>
          )}

          {phase === "result" && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="text-3xl">🍀</div>
              <div className="text-sm font-semibold text-center text-slate-800">
                {finalResult || "Chúc bạn may mắn lần sau"}
              </div>
              <p className="text-[10px] text-gray-500">
                Tinh thần là chính, vật chất tính sau nha 😆
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-1 px-4 py-1.5 rounded-full bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 shadow-sm"
              >
                Đóng lại
              </button>
            </div>
          )}

          <p className="mt-1 text-[9px] text-gray-400 text-center">
            *Tất cả phần quà chỉ mang tính chất minh hoạ, không có giá trị quy đổi.
          </p>
        </div>
      </div>
    </div>
  );
}

function PrizeGrid({
  prizes,
  hiddenMode,
  phase,
  selectedPrizeKey,
  onPickPrize,
  spinTick,
  spinProgress,
  randomOffsets,
}) {
  const canPick = phase === "choose";
  const isSpinning = phase === "spinning";

  // ================== MODE SPINNING: xào bài 3D ==================
  if (isSpinning) {
    const p = spinProgress || 0;

    // Timeline:
    // 0.00 → 0.30: từng thẻ chạy ra tạo vòng tròn
    // 0.30 → 0.65: vòng tròn xoay như cuộn băng keo (3D)
    // 0.65 → 0.82: gom từng tấm về chồng giữa
    // 0.82 → 1.00: phát từng tấm ra lưới 3x3
    const RING_BUILD_END = 0.3;
    const RING_SPIN_END = 0.65;
    const STACK_END = 0.82;
    const DEAL_END = 1.0;

    // easing mượt
    const smooth = (t) => t * t * (3 - 2 * t);

    return (
      <div
        className="relative h-44 sm:h-48 flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {prizes.map((card, idx) => {
          const colorClass =
            HIDDEN_COLORS[card.key] || "from-indigo-400 to-indigo-600";

          // Góc cố định cho mỗi thẻ trên vòng
          const baseAngle = ((2 * Math.PI) / prizes.length) * idx;

          // Vị trí đích trên lưới 3x3
          const col = idx % 3; // 0,1,2
          const row = Math.floor(idx / 3); // 0,1,2
          const targetX = (col - 1) * 70; // -70,0,70
          const targetY = (row - 1) * 80; // -80,0,80

          // offset nhỏ cho mỗi thẻ để đỡ đều quá
          const cfg =
            randomOffsets?.[idx % randomOffsets.length] || {
              baseX: 0,
              baseY: 0,
              phase: 0,
            };

          let x = 0;
          let y = 0;
          let z = 0;
          let rotX = 0;
          let rotY = 0;
          let rotZ = 0;
          let scale = 1;
          let zIndex = 10 + idx;

          // ========== STAGE 1: build vòng tròn ==========
          if (p <= RING_BUILD_END) {
            const progresStage = p / RING_BUILD_END; // 0→1
            // delay nhẹ cho từng thẻ => chạy nối đuôi
            const delay = idx * 0.06;
            const local = Math.min(
              Math.max(progresStage - delay, 0) / (1 - delay || 0.0001),
              1
            );
            const e = smooth(local);

            const radius = 80 * e;
            const angle = baseAngle;

            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius * 0.6;
            z = 0;

            rotY = 20 * (1 - e);
            rotX = 15 * (1 - e);
            rotZ = (idx - prizes.length / 2) * (1 - e) * 4;
            scale = 0.85 + 0.15 * e;
          }

          // ========== STAGE 2: vòng tròn xoay như cuộn băng keo ==========
          else if (p > RING_BUILD_END && p <= RING_SPIN_END) {
            const stageP =
              (p - RING_BUILD_END) / (RING_SPIN_END - RING_BUILD_END); // 0→1

            // số vòng quay
            const spinTurns = 3;
            const spinAngle =
              stageP * spinTurns * 2 * Math.PI + spinTick * 0.2;

            // bán kính cố định
            const radius = 80;
            const angle = baseAngle + spinAngle;

            // vòng elip (x,y)
            x = Math.cos(angle) * radius;
            y = Math.sin(angle) * radius * 0.6;

            // chiều sâu 3D (cuộn băng keo)
            const depth = Math.sin(angle); // -1 → 1
            z = depth * 80; // dịch ra sau / trước màn hình
            scale = 0.8 + ((depth + 1) / 2) * 0.2; // thẻ phía trước to hơn

            // xoay như thẻ gắn trên cuộn
            rotY = depth * 65; // quay quanh trục Y
            rotX = Math.cos(angle * 0.7 + cfg.phase) * 10;
            rotZ = Math.sin(angle * 1.3 + cfg.phase) * 6;

            // Thẻ phía trước: zIndex cao hơn
            zIndex = 100 + Math.round((depth + 1) * 20);
          }

          // ========== STAGE 3: gom từng tấm về chồng giữa ==========
          else if (p > RING_SPIN_END && p <= STACK_END) {
            const stageP =
              (p - RING_SPIN_END) / (STACK_END - RING_SPIN_END); // 0→1

            // vị trí xuất phát (trên vòng)
            const radius = 80;
            const angle = baseAngle + spinTick * 0.2;
            const startX = Math.cos(angle) * radius;
            const startY = Math.sin(angle) * radius * 0.6;
            const startDepth = Math.sin(angle);
            const startZ = startDepth * 60;

            // tâm chồng bài (chút lệch)
            const centerX = cfg.baseX * 0.4;
            const centerY = cfg.baseY * 0.4;
            const centerZ = 0;

            // mỗi thẻ bay vào chồng ở thời điểm khác nhau
            const window = 0.7;
            const step = (window / prizes.length) || 0.0001;
            const cardStart = step * idx;
            const cardEnd = cardStart + step;

            let local = 0;
            if (stageP <= cardStart) {
              local = 0;
            } else if (stageP >= cardEnd) {
              local = 1;
            } else {
              local = (stageP - cardStart) / (cardEnd - cardStart);
            }
            const e = smooth(local);

            x = startX + (centerX - startX) * e;
            y = startY + (centerY - startY) * e;
            z = startZ + (centerZ - startZ) * e;

            rotY = (1 - e) * 40;
            rotX = (1 - e) * 20;
            rotZ = (idx - prizes.length / 2) * (1 - e) * 3;
            scale = 0.9 + 0.1 * e;

            zIndex = 200 + idx; // chồng lên nhau
          }

          // ========== STAGE 4: phát từng tấm ra lưới ==========
          else {
            const stageP =
              (p - STACK_END) / (DEAL_END - STACK_END || 0.0001); // 0→1

            // vị trí chồng
            const stackX = cfg.baseX * 0.4;
            const stackY = cfg.baseY * 0.4;
            const stackZ = 0;

            // mỗi thẻ có "slot" riêng để bay ra
            const window = 0.85;
            const step = (window / prizes.length) || 0.0001;
            const cardStart = step * idx;
            const cardEnd = cardStart + step;

            let local = 0;
            if (stageP <= cardStart) {
              local = 0;
            } else if (stageP >= cardEnd) {
              local = 1;
            } else {
              local = (stageP - cardStart) / (cardEnd - cardStart);
            }
            const e = smooth(local);

            x = stackX + (targetX - stackX) * e;
            y = stackY + (targetY - stackY) * e;
            z = stackZ - 30 * (1 - e); // lúc mới bay ra hơi nổi lên

            rotY = (1 - e) * 25;
            rotX = (1 - e) * 10;
            rotZ = (1 - e) * (idx - prizes.length / 2) * 2;
            scale = 0.96 + 0.04 * e;

            zIndex = 300 + idx;
          }

          const transform = `
            translate(-50%, -50%)
            translate3d(${x}px, ${y}px, ${z}px)
            rotateX(${rotX}deg)
            rotateY(${rotY}deg)
            rotateZ(${rotZ}deg)
            scale(${scale})
          `;

          return (
            <button
              key={card.key}
              type="button"
              disabled={true}
              style={{
                transform,
                transition: "transform 0.08s linear",
                position: "absolute",
                left: "50%",
                top: "50%",
                zIndex,
              }}
              className={`w-14 sm:w-16 aspect-[3/4] rounded-lg border shadow-sm flex items-center justify-center text-center text-[9px] sm:text-[10px]
                bg-gradient-to-br ${colorClass} text-white border-transparent`}
            >
              <div className="flex flex-col items-center">
                <div className="text-lg mb-0.5">❓</div>
                <div className="font-semibold leading-tight">
                  Chọn tôi đi
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ================== CÁC MODE KHÁC: intro / choose / result – lưới bình thường ==================
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      {prizes.map((p) => {
        const isSelected = phase === "result" && p.key === selectedPrizeKey;
        const colorClass =
          HIDDEN_COLORS[p.key] || "from-indigo-400 to-indigo-600";

        return (
          <button
            key={p.key}
            type="button"
            onClick={() => canPick && onPickPrize?.(p)}
            disabled={!canPick}
            className={`relative h-14 sm:h-16 rounded-lg border shadow-sm flex items-center justify-center text-center text-[9px] sm:text-[10px] transition
              ${
                canPick
                  ? "hover:-translate-y-0.5 hover:shadow cursor-pointer"
                  : "cursor-default"
              }
              ${
                hiddenMode
                  ? `bg-gradient-to-br ${colorClass} text-white border-transparent`
                  : "bg-white border-slate-200 text-slate-700"
              }
            `}
          >
            {/* intro: hiện quà thật */}
            {!hiddenMode && phase === "intro" && (
              <div className="flex flex-col items-center px-1">
                <div className="text-lg mb-0.5">{p.emoji}</div>
                <div className="font-semibold leading-tight line-clamp-2">
                  {p.label}
                </div>
              </div>
            )}

            {/* choose: mặt sau */}
            {hiddenMode && phase === "choose" && (
              <div className="flex flex-col items-center">
                <div className="text-lg mb-0.5">❓</div>
                <div className="font-semibold leading-tight">
                  Chọn tôi đi
                </div>
              </div>
            )}

            {/* result: chỉ thẻ được chọn hiện thông điệp */}
            {phase === "result" && (
              <>
                {isSelected ? (
                  <div className="flex flex-col items-center px-1">
                    <div className="text-lg mb-0.5">🍀</div>
                    <div className="font-semibold leading-tight">
                      Chúc bạn may mắn lần sau
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-lg mb-0.5">❓</div>
                  </div>
                )}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}


