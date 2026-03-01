// src/pages/Lunch/UserOrderSlide/components/ChooseSwiper.jsx
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import FoodCard from "./FoodCard";
import SkipCard from "./SkipCard";

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

  onCardClick, // (day, eid, disabled)
  onPickBranch, // (day, eid, branchId)
  onChangeQtyEntry,
  onToggleBranch,
  onChangeQtyBranch,

  activeSlide,
}) {
  return (
    <div className="p-6 mx-[10px]">
      <Swiper
        onSwiper={(s) => (swiperRef.current = s)}
        ref={swiperRef}
        spaceBetween={24}
        slidesPerView={1}
        className="rounded-2xl"
        onSlideChange={(s) => onSlideChange?.(s.activeIndex)}
      >
        {daysToRender.map((day) => {
          const items = grouped[day] || [];
          const canChangeThisDay = canModifyDayByMode(Number(day));

          function getDateFromWeekStart(dayNumber) {
            if (!weeklyMenu?.weekStartMonday) return "";

            const start = new Date(weeklyMenu.weekStartMonday);

            // tránh lệch timezone
            const utc = new Date(
              Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
            );

            utc.setUTCDate(utc.getUTCDate() + (Number(dayNumber) - 1));

            const dd = String(utc.getUTCDate()).padStart(2, "0");
            const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
            const yyyy = utc.getUTCFullYear();

            return `${dd}/${mm}/${yyyy}`;
          }

          return (
            <SwiperSlide key={day}>
              <div className="pb-5">
                <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">
                  {dayNameVN(day)} - {getDateFromWeekStart(day)}
                </h3>
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 justify-items-center">
                    {items.map((item) => {
                      const eid = item.weeklyMenuEntryId;
                      const checked = isSec ? !!selectedSec?.[day]?.[eid] : selected?.[day] === eid;
                      const showPanel = checked;
                      const disabled = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;

                      const userPickDayMap = userPick?.[day] || {};
                      const selectedBrEntryMap = selectedBr?.[day]?.[eid] || {};
                      const qtyBrEntryMap = qtyBr?.[day]?.[eid] || {};
                      const qtyEntryValue = qtyEntry?.[day]?.[eid] ?? 0;

                      return (
                        <FoodCard
                          key={eid}
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
                          onChangeQtyEntry={(v) => onChangeQtyEntry(day, eid, v, qtyEntryValue)}
                          selectedBrEntryMap={selectedBrEntryMap}
                          qtyBrEntryMap={qtyBrEntryMap}
                          onToggleBranch={(branchId, brSel) => onToggleBranch(day, eid, branchId, brSel)}
                          onChangeQtyBranch={(branchId, v, cur) => onChangeQtyBranch(day, eid, branchId, v, cur)}
                          onCardClick={() => onCardClick(day, eid, disabled)}
                        />
                      );
                    })}

                    {/* Skip card */}
                    <SkipCard
                      day={day}
                      active={isSec ? skipSecDays?.[day] === true : selected?.[day] === null}
                      disabled={!canChangeThisDay || weeklyMenu?.isLocked || isSaving}
                      onClick={() => onCardClick(day, null, (!canChangeThisDay || weeklyMenu?.isLocked || isSaving))}
                    />
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
