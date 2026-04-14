// // src/pages/Lunch/UserOrderSlide/components/FoodCard.jsx
// import React from "react";
// import { motion } from "framer-motion";
// import { FaCheck } from "react-icons/fa";
// import QuantityStepper from "~/components/lunch/QuantityStepper";
// import { getFoodIcon } from "../helpers/lunchHelpers";

// export default function FoodCard({
//   item,
//   day,
//   eid,
//   checked,
//   showPanel,
//   disabled,
//   isSec,

//   userPickDayMap,
//   onPickBranch,

//   qtyEntryValue,
//   onChangeQtyEntry,

//   selectedBrEntryMap,
//   qtyBrEntryMap,
//   onToggleBranch,
//   onChangeQtyBranch,

//   onCardClick,
// }) {
//   const userPicked = userPickDayMap?.[eid] ?? 0;

//   return (
//     <motion.div
//       key={eid}
//       whileTap={{ scale: 0.97 }}
//       role="button"
//       tabIndex={0}
//       onClick={onCardClick}
//       onKeyDown={(e) => {
//         if ((e.key === "Enter" || e.key === " ") && !disabled) onCardClick();
//       }}
//       className={`toy-card relative w-[220px] text-left cursor-pointer transition
//         ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
//         ${disabled ? "opacity-50 pointer-events-none" : ""}
//         bg-white/80 backdrop-blur border border-white/60 shadow-sm
//         rounded-[24px] flex flex-col
//       `}
//       style={{ minHeight: showPanel ? 320 : 270 }}
//     >
//       {/* Header */}
//       <div className="px-4 pt-3 pb-2">
//         <div className="flex items-center gap-3">
//           <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 shadow-inner text-slate-700">
//             {getFoodIcon(item.foodName)}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="text-[10px] uppercase tracking-widest text-slate-500">Món ăn</div>
//             <div className="font-semibold text-slate-800 leading-tight line-clamp-2">{item.foodName}</div>
//           </div>
//         </div>
//       </div>

//       {/* Image */}
//       <div
//         className={`mx-3 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-inner overflow-hidden
//           ${showPanel ? "h-28" : "h-36"}`}
//       >
//         {item.imageUrl ? (
//           <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
//         ) : (
//           <div className="text-slate-400 text-sm w-full h-full grid place-items-center">Chưa có hình</div>
//         )}
//       </div>

//       {/* Status */}
//       <div className="px-4 pt-2">
//         <div className="flex items-center justify-between">
//           <div
//             className={`px-3 py-1 rounded-full text-[10px] font-medium
//               ${checked ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-slate-100 text-slate-500"}`}
//           >
//             {checked ? (isSec ? "Đang chọn (thư ký)" : "Đã chọn") : "Chọn món"}
//           </div>
//           {checked && <FaCheck className="text-emerald-600" />}
//         </div>
//       </div>

//       {/* Panel */}
//       {showPanel && (
//         <div className="mt-2 mx-3 mb-3 p-0 flex-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
//           {!isSec ? (
//             // USER: chọn 1 branch (toggle về CHUNG)
//             <div className="flex flex-col gap-2">
//               {(item.branches || []).map((br, idx) => {
//                 const picked = userPickDayMap?.[eid]; // undefined => CHUNG
//                 const active = picked === br.branchId;
//                 const pal = [
//                   { bg: "bg-sky-50", border: "border-sky-200", ring: "ring-sky-300/60", text: "text-sky-700" },
//                   { bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-300/60", text: "text-violet-700" },
//                   { bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-300/60", text: "text-amber-800" },
//                   { bg: "bg-teal-50", border: "border-teal-200", ring: "ring-teal-300/60", text: "text-teal-700" },
//                   { bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-300/60", text: "text-rose-700" },
//                 ][idx % 5];

//                 return (
//                   <button
//                     key={br.branchId}
//                     type="button"
//                     disabled={disabled}
//                     className={`w-full h-11 rounded-xl border flex items-center justify-center text-[14px] font-semibold transition
//                       ${
//                         active
//                           ? `${pal.bg} ${pal.text} ${pal.border} ring-1 ${pal.ring}`
//                           : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
//                       }`}
//                     onClick={() => onPickBranch(br.branchId)}
//                   >
//                     {br.branchName || br.branchCode || "Branch"}
//                   </button>
//                 );
//               })}
//             </div>
//           ) : (
//             // SEC: qty chung + multi branch + stepper
//             <div className="flex flex-col gap-2">
//               <div className="flex items-center justify-center">
//                 {
//                   item.foodName !== 'Trứng' &&
//                   <QuantityStepper
//                     value={qtyEntryValue ?? 0}
//                     min={0}
//                     disabled={disabled}
//                     onChange={onChangeQtyEntry}
//                   />
//                 }
//               </div>

//               {(item.branches || []).map((br, idx) => {
//                 const brSel = !!selectedBrEntryMap?.[br.branchId];
//                 const qtyVal = brSel ? (qtyBrEntryMap?.[br.branchId] ?? 0) : 0;
//                 const pal = [
//                   { bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-300/60", text: "text-emerald-700" },
//                   { bg: "bg-sky-50", border: "border-sky-200", ring: "ring-sky-300/60", text: "text-sky-700" },
//                   { bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-300/60", text: "text-violet-700" },
//                   { bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-300/60", text: "text-amber-800" },
//                   { bg: "bg-teal-50", border: "border-teal-200", ring: "ring-teal-300/60", text: "text-teal-700" },
//                   { bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-300/60", text: "text-rose-700" },
//                 ][idx % 6];

//                 return (
//                   <div
//                     key={br.branchId}
//                     className={`rounded-2xl transition-all p-2 ${
//                       brSel ? `${pal.bg} border ${pal.border} ring-1 ${pal.ring}` : "border border-slate-200 bg-white/80"
//                     }`}
//                   >
//                     <button
//                       type="button"
//                       disabled={disabled}
//                       className={`w-full h-12 rounded-xl border flex items-center justify-center text-[14px] font-semibold transition
//                         ${brSel ? `bg-white ${pal.text} ${pal.border}` : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"}`}
//                       onClick={() => onToggleBranch(br.branchId, brSel)}
//                     >
//                       {br.branchName || br.branchCode || "Branch"}
//                     </button>

//                     {brSel && (
//                       <div className="mt-2 flex items-center justify-center">
//                         <QuantityStepper
//                           value={qtyVal}
//                           min={0}
//                           disabled={disabled}
//                           autoFocus={brSel}
//                           onChange={(v) => onChangeQtyBranch(br.branchId, v, qtyVal)}
//                         />
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       )}

//       <span className="shine" />
//     </motion.div>
//   );
// }




// src/pages/Lunch/UserOrderSlide/components/FoodCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import QuantityStepper from "~/components/lunch/QuantityStepper";
import { getFoodIcon } from "../helpers/lunchHelpers";

export default function FoodCard({
  item,
  day,
  eid,
  checked,
  showPanel,
  disabled,
  isSec,

  userPickDayMap,
  onPickBranch,

  qtyEntryValue,
  onChangeQtyEntry,

  selectedBrEntryMap,
  qtyBrEntryMap,
  onToggleBranch,
  onChangeQtyBranch,

  onCardClick,

  compact = false,
}) {
  const userPicked = userPickDayMap?.[eid] ?? 0;
  const branches = item.branches || [];

  const minH = compact
    ? showPanel
      ? 198
      : 168
    : showPanel
      ? 255
      : 215;

  return (
    <motion.div
      key={eid}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) onCardClick();
      }}
      className={`toy-card relative text-left cursor-pointer transition
        ${compact ? "w-full max-w-[172px]" : "w-full max-w-[210px] sm:max-w-[230px]"}
        ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
        bg-white/85 backdrop-blur border border-white/60 shadow-sm
        ${compact ? "rounded-[16px]" : "rounded-[20px] sm:rounded-[24px]"}
        flex flex-col overflow-hidden
      `}
      style={{ minHeight: minH }}
    >
      {/* Header */}
      <div className={`${compact ? "px-2 pt-2 pb-1" : "px-3 sm:px-4 pt-3 pb-2"}`}>
        <div className={`flex items-center ${compact ? "gap-1.5" : "gap-2.5"}`}>
          <div
            className={`grid place-items-center rounded-xl bg-gradient-to-br from-amber-200 to-amber-100 shadow-inner text-slate-700 shrink-0 ${
              compact ? "w-7 h-7 text-sm" : "w-8 h-8 sm:w-10 sm:h-10 rounded-2xl"
            }`}
          >
            {getFoodIcon(item.foodName)}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className={`uppercase tracking-widest text-slate-500 ${
                compact ? "text-[8px]" : "text-[9px] sm:text-[10px]"
              }`}
            >
              Món ăn
            </div>
            <div
              className={`font-semibold text-slate-800 leading-tight line-clamp-2 ${
                compact ? "text-[12px]" : "text-[13px] sm:text-[15px]"
              }`}
            >
              {item.foodName}
            </div>
          </div>
        </div>
      </div>

      {/* Image */}
      <div
        className={`rounded-xl bg-white/70 backdrop-blur border border-white/60 shadow-inner overflow-hidden ${
          compact ? "mx-2" : "mx-3 rounded-2xl"
        } ${
          compact
            ? showPanel
              ? "h-[3.25rem]"
              : "h-[4.25rem]"
            : showPanel
              ? "h-20 sm:h-24"
              : "h-24 sm:h-32"
        }`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.foodName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`text-slate-400 w-full h-full grid place-items-center ${
              compact ? "text-[10px]" : "text-xs sm:text-sm"
            }`}
          >
            Chưa có hình
          </div>
        )}
      </div>

      {/* Status */}
      <div className={`${compact ? "px-2 pt-1.5" : "px-3 sm:px-4 pt-2"}`}>
        <div className="flex items-center justify-between gap-2">
          <div
            className={`rounded-full font-medium whitespace-nowrap ${
              compact ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"
            }
              ${
                checked
                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                  : "bg-slate-100 text-slate-500"
              }`}
          >
            {checked ? (isSec ? "Đang chọn" : "Đã chọn") : "Chọn món"}
          </div>

          {checked && (
            <FaCheck className={`text-emerald-600 shrink-0 ${compact ? "text-xs" : "text-sm"}`} />
          )}
        </div>
      </div>

      {/* Preview branch count when closed */}
      {!showPanel && branches.length > 0 && (
        <div className={`${compact ? "px-2 pt-1" : "px-3 sm:px-4 pt-2"}`}>
          <div className={`flex flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}>
            {branches.slice(0, 2).map((br) => (
              <span
                key={br.branchId}
                className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 py-0.5 text-slate-600 max-w-full truncate ${
                  compact ? "px-1.5 text-[9px]" : "px-2 text-[10px]"
                }`}
              >
                {br.branchName || br.branchCode || "Branch"}
              </span>
            ))}
            {branches.length > 2 && (
              <span
                className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 py-0.5 text-slate-500 ${
                  compact ? "px-1.5 text-[9px]" : "px-2 text-[10px]"
                }`}
              >
                +{branches.length - 2} nhánh
              </span>
            )}
          </div>
        </div>
      )}

      {/* Panel */}
      {showPanel && (
        <div
          className={`p-0 flex-1 ${compact ? "mt-1.5 mx-2 mb-2" : "mt-2 mx-3 mb-3"}`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {!isSec ? (
            // USER: chọn 1 branch
            <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
              {branches.length > 0 ? (
                <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
                  {branches.map((br, idx) => {
                    const picked = userPickDayMap?.[eid];
                    const active = picked === br.branchId;

                    const pal = [
                      {
                        bg: "bg-sky-50",
                        border: "border-sky-200",
                        ring: "ring-sky-300/60",
                        text: "text-sky-700",
                      },
                      {
                        bg: "bg-violet-50",
                        border: "border-violet-200",
                        ring: "ring-violet-300/60",
                        text: "text-violet-700",
                      },
                      {
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                        ring: "ring-amber-300/60",
                        text: "text-amber-800",
                      },
                      {
                        bg: "bg-teal-50",
                        border: "border-teal-200",
                        ring: "ring-teal-300/60",
                        text: "text-teal-700",
                      },
                      {
                        bg: "bg-rose-50",
                        border: "border-rose-200",
                        ring: "ring-rose-300/60",
                        text: "text-rose-700",
                      },
                    ][idx % 5];

                    return (
                      <button
                        key={br.branchId}
                        type="button"
                        disabled={disabled}
                        className={`rounded-lg border font-semibold transition max-w-full truncate ${
                          compact ? "h-7 px-2 text-[10px]" : "h-9 rounded-xl px-3 text-[12px] sm:text-[13px]"
                        }
                          ${
                            active
                              ? `${pal.bg} ${pal.text} ${pal.border} ring-1 ${pal.ring}`
                              : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                          }`}
                        onClick={() => onPickBranch(br.branchId)}
                        title={br.branchName || br.branchCode || "Branch"}
                      >
                        {br.branchName || br.branchCode || "Branch"}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-slate-400 italic ${compact ? "text-[10px]" : "text-xs"}`}>
                  Không có nhánh
                </div>
              )}
            </div>
          ) : (
            // SEC: qty chung + multi branch + stepper
            <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
              {item.foodName !== "Trứng" && item.foodName !== "Tiền đi ca" && (
                <div className="flex items-center justify-center">
                  <QuantityStepper
                    value={qtyEntryValue ?? 0}
                    min={0}
                    disabled={disabled}
                    onChange={onChangeQtyEntry}
                  />
                </div>
              )}

              {branches.length > 0 ? (
                <div className={`flex flex-col ${compact ? "gap-1.5" : "gap-2"}`}>
                  {branches.map((br, idx) => {
                    const brSel = !!selectedBrEntryMap?.[br.branchId];
                    const qtyVal = brSel ? qtyBrEntryMap?.[br.branchId] ?? 0 : 0;

                    const pal = [
                      {
                        bg: "bg-emerald-50",
                        border: "border-emerald-200",
                        ring: "ring-emerald-300/60",
                        text: "text-emerald-700",
                      },
                      {
                        bg: "bg-sky-50",
                        border: "border-sky-200",
                        ring: "ring-sky-300/60",
                        text: "text-sky-700",
                      },
                      {
                        bg: "bg-violet-50",
                        border: "border-violet-200",
                        ring: "ring-violet-300/60",
                        text: "text-violet-700",
                      },
                      {
                        bg: "bg-amber-50",
                        border: "border-amber-200",
                        ring: "ring-amber-300/60",
                        text: "text-amber-800",
                      },
                      {
                        bg: "bg-teal-50",
                        border: "border-teal-200",
                        ring: "ring-teal-300/60",
                        text: "text-teal-700",
                      },
                      {
                        bg: "bg-rose-50",
                        border: "border-rose-200",
                        ring: "ring-rose-300/60",
                        text: "text-rose-700",
                      },
                    ][idx % 6];

                    return (
                      <div
                        key={br.branchId}
                        className={`transition-all ${compact ? "rounded-xl p-1.5" : "rounded-2xl p-2"} ${
                          brSel
                            ? `${pal.bg} border ${pal.border} ring-1 ${pal.ring}`
                            : "border border-slate-200 bg-white/80"
                        }`}
                      >
                        <button
                          type="button"
                          disabled={disabled}
                          className={`w-full flex items-center justify-center font-semibold transition text-center border ${
                            compact
                              ? "min-h-[32px] rounded-lg px-2 text-[10px]"
                              : "min-h-[38px] rounded-xl px-3 text-[12px] sm:text-[13px]"
                          }
                            ${
                              brSel
                                ? `bg-white ${pal.text} ${pal.border}`
                                : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                            }`}
                          onClick={() => onToggleBranch(br.branchId, brSel)}
                          title={br.branchName || br.branchCode || "Branch"}
                        >
                          <span className="truncate">
                            {br.branchName || br.branchCode || "Branch"}
                          </span>
                        </button>

                        {brSel && (
                          <div className={`flex items-center justify-center ${compact ? "mt-1.5" : "mt-2"}`}>
                            <QuantityStepper
                              value={qtyVal}
                              min={0}
                              disabled={disabled}
                              autoFocus={brSel}
                              onChange={(v) =>
                                onChangeQtyBranch(br.branchId, v, qtyVal)
                              }
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-slate-400 italic ${compact ? "text-[10px]" : "text-xs"}`}>
                  Không có nhánh
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <span className="shine" />
    </motion.div>
  );
}
