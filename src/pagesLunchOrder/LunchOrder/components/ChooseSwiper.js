// // src/pages/Lunch/UserOrderSlide/components/ChooseSwiper.jsx
// import React, { useMemo, useState } from "react";
// import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css";
// import { FaChevronRight, FaTimes, FaLock, FaLockOpen } from "react-icons/fa";
// import FoodCard from "./FoodCard";
// import SkipCard from "./SkipCard";

// function getDateFromWeekStart(weeklyMenu, dayNumber) {
//   if (!weeklyMenu?.weekStartMonday) return "";

//   const start = new Date(weeklyMenu.weekStartMonday);

//   const utc = new Date(
//     Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
//   );

//   utc.setUTCDate(utc.getUTCDate() + (Number(dayNumber) - 1));

//   const dd = String(utc.getUTCDate()).padStart(2, "0");
//   const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
//   const yyyy = utc.getUTCFullYear();

//   return `${dd}/${mm}/${yyyy}`;
// }

// function DayPickerSheet({
//   open,
//   onClose,
//   day,
//   items,
//   weeklyMenu,
//   orderType,
//   isSec,
//   selected,
//   selectedSec,
//   selectedBr,
//   qtyBr,
//   qtyEntry,
//   skipSecDays,
//   userPick,
//   isSaving,
//   canModifyDayByMode,
//   dayNameVN,
//   onCardClick,
//   onPickBranch,
//   onChangeQtyEntry,
//   onToggleBranch,
//   onChangeQtyBranch,
// }) {
//   if (!open || !day) return null;

//   const canChangeThisDay = canModifyDayByMode(Number(day));
//   const disabledDay = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;
//   const dateText = getDateFromWeekStart(weeklyMenu, day);

//   return (
//     <div className="fixed inset-0 z-[80] md:hidden">
//       <div
//         className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
//         onClick={onClose}
//       />

//       <div className="absolute left-0 right-0 bottom-0 bg-[#FFFDF4] rounded-t-[28px] shadow-2xl border-t border-slate-200 max-h-[88dvh] flex flex-col">
//         <div className="sticky top-0 z-10 bg-[#FFFDF4] rounded-t-[28px] border-b border-slate-200 px-4 pt-3 pb-3">
//           <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300" />

//           <div className="flex items-start justify-between gap-3">
//             <div className="min-w-0">
//               <div className="text-[18px] font-bold text-slate-900">
//                 {dayNameVN(day)}
//               </div>
//               <div className="mt-1 text-sm text-slate-500">{dateText}</div>

//               <div className="mt-2 flex flex-wrap gap-2">
//                 <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
//                   {orderType === "re"
//                     ? "Ca ngày"
//                     : orderType === "ws"
//                     ? "Đi ca"
//                     : "Tăng ca"}
//                 </span>

//                 <span
//                   className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
//                     disabledDay
//                       ? "border-rose-200 bg-rose-50 text-rose-700"
//                       : "border-emerald-200 bg-emerald-50 text-emerald-700"
//                   }`}
//                 >
//                   {disabledDay ? <FaLock /> : <FaLockOpen />}
//                   {disabledDay ? "Không thể chỉnh" : "Có thể chọn"}
//                 </span>
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={onClose}
//               className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-white text-slate-600 grid place-items-center"
//             >
//               <FaTimes />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-auto px-3 pt-4 pb-[90px]">
//           {items?.length ? (
//             <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
//               {items.map((item) => {
//                 const eid = item.weeklyMenuEntryId;
//                 const checked = isSec
//                   ? !!selectedSec?.[day]?.[eid]
//                   : selected?.[day] === eid;
//                 const showPanel = checked;
//                 const disabled = disabledDay;

//                 const userPickDayMap = userPick?.[day] || {};
//                 const selectedBrEntryMap = selectedBr?.[day]?.[eid] || {};
//                 const qtyBrEntryMap = qtyBr?.[day]?.[eid] || {};
//                 const qtyEntryValue = qtyEntry?.[day]?.[eid] ?? 0;

//                 return (
//                   <div
//                     key={eid}
//                     className="snap-start shrink-0 w-[260px]"
//                   >
//                     <FoodCard
//                       item={item}
//                       day={day}
//                       eid={eid}
//                       checked={checked}
//                       showPanel={showPanel}
//                       disabled={disabled}
//                       isSec={isSec}
//                       userPickDayMap={userPickDayMap}
//                       onPickBranch={(branchId) => onPickBranch(day, eid, branchId)}
//                       qtyEntryValue={qtyEntryValue}
//                       onChangeQtyEntry={(v) =>
//                         onChangeQtyEntry(day, eid, v, qtyEntryValue)
//                       }
//                       selectedBrEntryMap={selectedBrEntryMap}
//                       qtyBrEntryMap={qtyBrEntryMap}
//                       onToggleBranch={(branchId, brSel) =>
//                         onToggleBranch(day, eid, branchId, brSel)
//                       }
//                       onChangeQtyBranch={(branchId, v, cur) =>
//                         onChangeQtyBranch(day, eid, branchId, v, cur)
//                       }
//                       onCardClick={() => onCardClick(day, eid, disabled)}
//                     />
//                   </div>
//                 );
//               })}

//               <div className="snap-start shrink-0 w-[260px]">
//                 <SkipCard
//                   day={day}
//                   active={isSec ? skipSecDays?.[day] === true : selected?.[day] === null}
//                   disabled={disabledDay}
//                   onClick={() => onCardClick(day, null, disabledDay)}
//                 />
//               </div>
//             </div>
//           ) : (
//             <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-slate-500">
//               Không có món cho ngày này
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function ChooseSwiper({
//   daysToRender,
//   grouped,
//   weeklyMenu,
//   orderType,
//   isSec,

//   selected,
//   selectedSec,
//   selectedBr,
//   qtyBr,
//   qtyEntry,
//   skipSecDays,
//   userPick,

//   isSaving,
//   canModifyDayByMode,

//   swiperRef,
//   onSlideChange,
//   dayNameVN,

//   onCardClick,
//   onPickBranch,
//   onChangeQtyEntry,
//   onToggleBranch,
//   onChangeQtyBranch,

//   activeSlide,
// }) {
//   const [openDay, setOpenDay] = useState(null);

//   const daySummaries = useMemo(() => {
//     return daysToRender.map((day) => {
//       const items = grouped[day] || [];
//       const canChangeThisDay = canModifyDayByMode(Number(day));
//       const disabledDay = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;

//       let chosenNames = [];

//       if (isSec) {
//         const secMap = selectedSec?.[day] || {};
//         const ids = Object.keys(secMap).map(Number);
//         chosenNames = ids
//           .map((eid) => items.find((x) => x.weeklyMenuEntryId === eid)?.foodName)
//           .filter(Boolean);
//       } else {
//         const selectedId = selected?.[day];
//         if (selectedId !== undefined) {
//           if (selectedId === null) {
//             chosenNames = ["Không chọn"];
//           } else {
//             const found = items.find((x) => x.weeklyMenuEntryId === selectedId);
//             chosenNames = found ? [found.foodName] : [];
//           }
//         }
//       }

//       if (isSec && skipSecDays?.[day] === true) {
//         chosenNames = ["Không chọn"];
//       }

//       return {
//         day: String(day),
//         items,
//         disabledDay,
//         dateText: getDateFromWeekStart(weeklyMenu, day),
//         itemCount: items.length,
//         chosenNames,
//       };
//     });
//   }, [
//     daysToRender,
//     grouped,
//     weeklyMenu,
//     isSaving,
//     canModifyDayByMode,
//     isSec,
//     selectedSec,
//     selected,
//     skipSecDays,
//   ]);

//   return (
//     <>
//       {/* MOBILE */}
//       <div className="md:hidden px-[10px] pt-[10px] pb-[20px]">
//         <div className="space-y-3">
//           {daySummaries.map((info, index) => {
//             const isOpen = openDay === info.day;
//             const isEditable = !info.disabledDay;

//             return (
//               <button
//                 key={info.day}
//                 type="button"
//                 onClick={() => {
//                   setOpenDay(info.day);
//                   onSlideChange?.(index);
//                 }}
//                 className={`w-full rounded-2xl border text-left px-4 py-4 shadow-sm transition ${
//                   isOpen
//                     ? "border-sky-300 bg-sky-50"
//                     : "border-white/60 bg-white/80"
//                 }`}
//               >
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="min-w-0 flex-1">
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <span className="text-base font-bold text-slate-900">
//                         {dayNameVN(info.day)}
//                       </span>
//                       <span className="text-sm text-slate-500">
//                         {info.dateText}
//                       </span>
//                     </div>

//                     <div className="mt-2 flex flex-wrap gap-2">
//                       <div className="mt-2">
//                         {info.items?.length ? (
//                           <div className="flex flex-wrap gap-1.5">
//                             {info.items.map((it) => (
//                               <span
//                                 key={it.weeklyMenuEntryId}
//                                 className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
//                               >
//                                 {it.foodName}
//                               </span>
//                             ))}
//                           </div>
//                         ) : (
//                           <div className="text-xs text-slate-400 italic">
//                             Không có món
//                           </div>
//                         )}
//                       </div>

//                       <span
//                         className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
//                           isEditable
//                             ? "border-emerald-200 bg-emerald-50 text-emerald-700"
//                             : "border-rose-200 bg-rose-50 text-rose-700"
//                         }`}
//                       >
//                         {isEditable ? <FaLockOpen /> : <FaLock />}
//                         {isEditable ? "Có thể chọn" : "Đã khóa / quá giờ"}
//                       </span>
//                     </div>

//                     <div className="mt-3 min-h-[20px]">
//                       {info.chosenNames?.length ? (
//                         <div className="flex flex-wrap gap-2">
//                           {info.chosenNames.slice(0, 3).map((name, idx) => (
//                             <span
//                               key={`${info.day}-${idx}`}
//                               className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
//                             >
//                               {name}
//                             </span>
//                           ))}
//                           {info.chosenNames.length > 3 ? (
//                             <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
//                               +{info.chosenNames.length - 3} món
//                             </span>
//                           ) : null}
//                         </div>
//                       ) : (
//                         <div className="text-sm text-slate-400 italic">
//                           Chưa chọn món
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className="shrink-0 pt-1">
//                     <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 grid place-items-center">
//                       <FaChevronRight />
//                     </div>
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* DESKTOP GIỮ NGUYÊN */}
//       <div className="hidden md:block p-6 mx-[10px]">
//         <Swiper
//           onSwiper={(s) => (swiperRef.current = s)}
//           ref={swiperRef}
//           spaceBetween={24}
//           slidesPerView={1}
//           className="rounded-2xl"
//           onSlideChange={(s) => onSlideChange?.(s.activeIndex)}
//         >
//           {daysToRender.map((day) => {
//             const items = grouped[day] || [];
//             const canChangeThisDay = canModifyDayByMode(Number(day));

//             return (
//               <SwiperSlide key={day}>
//                 <div className="pb-5">
//                   <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">
//                     {dayNameVN(day)} - {getDateFromWeekStart(weeklyMenu, day)}
//                   </h3>

//                   <div className="flex justify-center">
//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 justify-items-center">
//                       {items.map((item) => {
//                         const eid = item.weeklyMenuEntryId;
//                         const checked = isSec
//                           ? !!selectedSec?.[day]?.[eid]
//                           : selected?.[day] === eid;
//                         const showPanel = checked;
//                         const disabled = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;

//                         const userPickDayMap = userPick?.[day] || {};
//                         const selectedBrEntryMap = selectedBr?.[day]?.[eid] || {};
//                         const qtyBrEntryMap = qtyBr?.[day]?.[eid] || {};
//                         const qtyEntryValue = qtyEntry?.[day]?.[eid] ?? 0;

//                         return (
//                           <FoodCard
//                             key={eid}
//                             item={item}
//                             day={day}
//                             eid={eid}
//                             checked={checked}
//                             showPanel={showPanel}
//                             disabled={disabled}
//                             isSec={isSec}
//                             userPickDayMap={userPickDayMap}
//                             onPickBranch={(branchId) => onPickBranch(day, eid, branchId)}
//                             qtyEntryValue={qtyEntryValue}
//                             onChangeQtyEntry={(v) =>
//                               onChangeQtyEntry(day, eid, v, qtyEntryValue)
//                             }
//                             selectedBrEntryMap={selectedBrEntryMap}
//                             qtyBrEntryMap={qtyBrEntryMap}
//                             onToggleBranch={(branchId, brSel) =>
//                               onToggleBranch(day, eid, branchId, brSel)
//                             }
//                             onChangeQtyBranch={(branchId, v, cur) =>
//                               onChangeQtyBranch(day, eid, branchId, v, cur)
//                             }
//                             onCardClick={() => onCardClick(day, eid, disabled)}
//                           />
//                         );
//                       })}

//                       <SkipCard
//                         day={day}
//                         active={isSec ? skipSecDays?.[day] === true : selected?.[day] === null}
//                         disabled={!canChangeThisDay || weeklyMenu?.isLocked || isSaving}
//                         onClick={() =>
//                           onCardClick(
//                             day,
//                             null,
//                             !canChangeThisDay || weeklyMenu?.isLocked || isSaving
//                           )
//                         }
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </SwiperSlide>
//             );
//           })}
//         </Swiper>
//       </div>

//       <DayPickerSheet
//         open={!!openDay}
//         onClose={() => setOpenDay(null)}
//         day={openDay}
//         items={grouped[openDay] || []}
//         weeklyMenu={weeklyMenu}
//         orderType={orderType}
//         isSec={isSec}
//         selected={selected}
//         selectedSec={selectedSec}
//         selectedBr={selectedBr}
//         qtyBr={qtyBr}
//         qtyEntry={qtyEntry}
//         skipSecDays={skipSecDays}
//         userPick={userPick}
//         isSaving={isSaving}
//         canModifyDayByMode={canModifyDayByMode}
//         dayNameVN={dayNameVN}
//         onCardClick={onCardClick}
//         onPickBranch={onPickBranch}
//         onChangeQtyEntry={onChangeQtyEntry}
//         onToggleBranch={onToggleBranch}
//         onChangeQtyBranch={onChangeQtyBranch}
//       />
//     </>
//   );
// }




// src/pages/Lunch/UserOrderSlide/components/ChooseSwiper.jsx
import React, { useMemo, useState } from "react";
import { FaChevronRight, FaTimes, FaLock, FaLockOpen } from "react-icons/fa";
import FoodCard from "./FoodCard";
import SkipCard from "./SkipCard";

function getDateFromWeekStart(weeklyMenu, dayNumber) {
  if (!weeklyMenu?.weekStartMonday) return "";

  const start = new Date(weeklyMenu.weekStartMonday);

  const utc = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  );

  utc.setUTCDate(utc.getUTCDate() + (Number(dayNumber) - 1));

  const dd = String(utc.getUTCDate()).padStart(2, "0");
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = utc.getUTCFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

function DayItemsPanel({
  day,
  items,
  weeklyMenu,
  orderType,
  isSec,
  selected,
  selectedSec,
  selectedBr,
  qtyBr,
  qtyEntry,
  skipSecDays,
  userPick,
  isSaving,
  canModifyDayByMode,
  dayNameVN,
  onCardClick,
  onPickBranch,
  onChangeQtyEntry,
  onToggleBranch,
  onChangeQtyBranch,
  onClose,
  mobile = false,
}) {
  if (!day) return null;

  const canChangeThisDay = canModifyDayByMode(Number(day));
  const disabledDay = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;
  const dateText = getDateFromWeekStart(weeklyMenu, day);

  const content = (
    <>
      <div
        className={`sticky top-0 z-10 bg-[#FFFDF4] border-b border-slate-200 ${
          mobile ? "rounded-t-[28px] px-4 pt-3 pb-3" : "rounded-t-3xl px-5 pt-4 pb-4"
        }`}
      >
        {mobile ? (
          <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300" />
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[18px] font-bold text-slate-900">
              {dayNameVN(day)}
            </div>
            <div className="mt-1 text-sm text-slate-500">{dateText}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                {orderType === "re"
                  ? "Ca ngày"
                  : orderType === "ws"
                  ? "Đi ca"
                  : "Tăng ca"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium border ${
                  disabledDay
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {disabledDay ? <FaLock /> : <FaLockOpen />}
                {disabledDay ? "Không thể chỉnh" : "Có thể chọn"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 shrink-0 rounded-full border border-slate-200 bg-white text-slate-600 grid place-items-center"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      <div className={`${mobile ? "flex-1 overflow-auto px-3 pt-4 pb-[90px]" : "px-4 py-4"}`}>
        {items?.length ? (
          <div
            className={
              mobile
                ? "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
                : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            }
          >
            {items.map((item) => {
              const eid = item.weeklyMenuEntryId;
              const checked = isSec
                ? !!selectedSec?.[day]?.[eid]
                : selected?.[day] === eid;
              const showPanel = checked;
              const disabled = disabledDay;

              const userPickDayMap = userPick?.[day] || {};
              const selectedBrEntryMap = selectedBr?.[day]?.[eid] || {};
              const qtyBrEntryMap = qtyBr?.[day]?.[eid] || {};
              const qtyEntryValue = qtyEntry?.[day]?.[eid] ?? 0;

              return (
                <div
                  key={eid}
                  className={mobile ? "snap-start shrink-0 w-[260px]" : ""}
                >
                  <FoodCard
                    item={item}
                    day={day}
                    eid={eid}
                    checked={checked}
                    showPanel={showPanel}
                    disabled={disabled}
                    isSec={isSec}
                    userPickDayMap={userPickDayMap}
                    onPickBranch={(branchId) => onPickBranch(day, eid, branchId)}
                    qtyEntryValue={qtyEntryValue}
                    onChangeQtyEntry={(v) =>
                      onChangeQtyEntry(day, eid, v, qtyEntryValue)
                    }
                    selectedBrEntryMap={selectedBrEntryMap}
                    qtyBrEntryMap={qtyBrEntryMap}
                    onToggleBranch={(branchId, brSel) =>
                      onToggleBranch(day, eid, branchId, brSel)
                    }
                    onChangeQtyBranch={(branchId, v, cur) =>
                      onChangeQtyBranch(day, eid, branchId, v, cur)
                    }
                    onCardClick={() => onCardClick(day, eid, disabled)}
                  />
                </div>
              );
            })}

            <div className={mobile ? "snap-start shrink-0 w-[260px]" : ""}>
              <SkipCard
                day={day}
                active={isSec ? skipSecDays?.[day] === true : selected?.[day] === null}
                disabled={disabledDay}
                onClick={() => onCardClick(day, null, disabledDay)}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-8 text-center text-slate-500">
            Không có món cho ngày này
          </div>
        )}
      </div>
    </>
  );

  if (mobile) {
    return (
      <div className="fixed inset-0 z-[80] md:hidden">
        <div
          className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
          onClick={onClose}
        />

        <div className="absolute left-0 right-0 bottom-0 bg-[#FFFDF4] rounded-t-[28px] shadow-2xl border-t border-slate-200 max-h-[88dvh] flex flex-col">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block mt-3 rounded-[28px] border border-slate-200 bg-[#FFFDF4] shadow-sm overflow-hidden">
      {content}
    </div>
  );
}

export default function ChooseSwiper({
  daysToRender,
  grouped,
  weeklyMenu,
  orderType,
  isSec,

  selected,
  selectedSec,
  selectedBr,
  qtyBr,
  qtyEntry,
  skipSecDays,
  userPick,

  isSaving,
  canModifyDayByMode,

  swiperRef,
  onSlideChange,
  dayNameVN,

  onCardClick,
  onPickBranch,
  onChangeQtyEntry,
  onToggleBranch,
  onChangeQtyBranch,

  activeSlide,
}) {
  const [openDay, setOpenDay] = useState(null);

  const daySummaries = useMemo(() => {
    return daysToRender.map((day) => {
      const items = grouped[day] || [];
      const canChangeThisDay = canModifyDayByMode(Number(day));
      const disabledDay = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;

      let chosenNames = [];

      if (isSec) {
        const secMap = selectedSec?.[day] || {};
        const ids = Object.keys(secMap).map(Number);
        chosenNames = ids
          .map((eid) => items.find((x) => x.weeklyMenuEntryId === eid)?.foodName)
          .filter(Boolean);
      } else {
        const selectedId = selected?.[day];
        if (selectedId !== undefined) {
          if (selectedId === null) {
            chosenNames = ["Không chọn"];
          } else {
            const found = items.find((x) => x.weeklyMenuEntryId === selectedId);
            chosenNames = found ? [found.foodName] : [];
          }
        }
      }

      if (isSec && skipSecDays?.[day] === true) {
        chosenNames = ["Không chọn"];
      }

      return {
        day: String(day),
        items,
        disabledDay,
        dateText: getDateFromWeekStart(weeklyMenu, day),
        itemCount: items.length,
        chosenNames,
      };
    });
  }, [
    daysToRender,
    grouped,
    weeklyMenu,
    isSaving,
    canModifyDayByMode,
    isSec,
    selectedSec,
    selected,
    skipSecDays,
  ]);

  return (
    <>
      <div className="px-[10px] pt-[10px] pb-[20px] md:px-4 md:pt-4 md:pb-6">
        <div className="space-y-3">
          {daySummaries.map((info, index) => {
            const isOpen = openDay === info.day;
            const isEditable = !info.disabledDay;

            return (
              <div key={info.day}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenDay((prev) => (prev === info.day ? null : info.day));
                    onSlideChange?.(index);
                  }}
                  className={`w-full rounded-2xl border text-left px-4 py-4 shadow-sm transition ${
                    isOpen
                      ? "border-sky-300 bg-sky-50"
                      : "border-white/60 bg-white/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-bold text-slate-900">
                          {dayNameVN(info.day)}
                        </span>
                        <span className="text-sm text-slate-500">
                          {info.dateText}
                        </span>
                      </div>

                      <div className="mt-2">
                        {info.items?.length ? (
                          <div className="flex flex-wrap gap-1.5">
                            {info.items.map((it) => (
                              <span
                                key={it.weeklyMenuEntryId}
                                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-700"
                              >
                                {it.foodName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Không có món
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
                            isEditable
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isEditable ? <FaLockOpen /> : <FaLock />}
                          {isEditable ? "Có thể chọn" : "Đã khóa / quá giờ"}
                        </span>
                      </div>

                      <div className="mt-3 min-h-[20px]">
                        {info.chosenNames?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {info.chosenNames.slice(0, 3).map((name, idx) => (
                              <span
                                key={`${info.day}-${idx}`}
                                className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700"
                              >
                                {name}
                              </span>
                            ))}
                            {info.chosenNames.length > 3 ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                                +{info.chosenNames.length - 3} món
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400 italic">
                            Chưa chọn món
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <div
                        className={`h-9 w-9 rounded-full grid place-items-center transition ${
                          isOpen
                            ? "bg-sky-100 text-sky-700 rotate-90"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <FaChevronRight />
                      </div>
                    </div>
                  </div>
                </button>

                {isOpen ? (
                  <DayItemsPanel
                    day={info.day}
                    items={grouped[info.day] || []}
                    weeklyMenu={weeklyMenu}
                    orderType={orderType}
                    isSec={isSec}
                    selected={selected}
                    selectedSec={selectedSec}
                    selectedBr={selectedBr}
                    qtyBr={qtyBr}
                    qtyEntry={qtyEntry}
                    skipSecDays={skipSecDays}
                    userPick={userPick}
                    isSaving={isSaving}
                    canModifyDayByMode={canModifyDayByMode}
                    dayNameVN={dayNameVN}
                    onCardClick={onCardClick}
                    onPickBranch={onPickBranch}
                    onChangeQtyEntry={onChangeQtyEntry}
                    onToggleBranch={onToggleBranch}
                    onChangeQtyBranch={onChangeQtyBranch}
                    onClose={() => setOpenDay(null)}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <DayItemsPanel
        mobile
        day={openDay}
        items={grouped[openDay] || []}
        weeklyMenu={weeklyMenu}
        orderType={orderType}
        isSec={isSec}
        selected={selected}
        selectedSec={selectedSec}
        selectedBr={selectedBr}
        qtyBr={qtyBr}
        qtyEntry={qtyEntry}
        skipSecDays={skipSecDays}
        userPick={userPick}
        isSaving={isSaving}
        canModifyDayByMode={canModifyDayByMode}
        dayNameVN={dayNameVN}
        onCardClick={onCardClick}
        onPickBranch={onPickBranch}
        onChangeQtyEntry={onChangeQtyEntry}
        onToggleBranch={onToggleBranch}
        onChangeQtyBranch={onChangeQtyBranch}
        onClose={() => setOpenDay(null)}
      />
    </>
  );
}
