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
  const desktopCompact = !mobile;

  const content = (
    <>
      <div
        className={`sticky top-0 z-10 bg-[#FFFDF4] border-b border-slate-200 ${
          mobile ? "rounded-t-[28px] px-4 pt-3 pb-3" : "rounded-t-2xl px-3.5 pt-3 pb-2.5"
        }`}
      >
        {mobile ? (
          <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300" />
        ) : null}

        <div className={`flex items-start justify-between ${mobile ? "gap-3" : "gap-2"}`}>
          <div className="min-w-0">
            <div
              className={
                mobile ? "text-[18px] font-bold text-slate-900" : "text-base font-bold text-slate-900 leading-tight"
              }
            >
              {dayNameVN(day)}
            </div>
            <div className={`${mobile ? "mt-1 text-sm" : "mt-0.5 text-xs"} text-slate-500`}>{dateText}</div>

            <div className={`${mobile ? "mt-2 gap-2" : "mt-1.5 gap-1.5"} flex flex-wrap`}>
              <span
                className={`inline-flex items-center rounded-full border border-amber-200 bg-amber-50 font-medium text-amber-800 ${
                  mobile ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]"
                }`}
              >
                {orderType === "re"
                  ? "Ca ngày"
                  : orderType === "ws"
                  ? "Đi ca"
                  : "Tăng ca"}
              </span>

              <span
                className={`inline-flex items-center rounded-full font-medium border ${
                  mobile ? "gap-1 px-3 py-1 text-xs" : "gap-0.5 px-2 py-0.5 text-[11px]"
                } ${
                  disabledDay
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {disabledDay ? (
                  <FaLock className={mobile ? "" : "text-[10px]"} />
                ) : (
                  <FaLockOpen className={mobile ? "" : "text-[10px]"} />
                )}
                {disabledDay ? "Không thể chỉnh" : "Có thể chọn"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 rounded-full border border-slate-200 bg-white text-slate-600 grid place-items-center ${
              mobile ? "h-10 w-10" : "h-8 w-8"
            }`}
          >
            <FaTimes className={mobile ? "" : "text-xs"} />
          </button>
        </div>
      </div>

      <div
        className={`${mobile ? "flex-1 overflow-auto px-3 pt-4 pb-[90px]" : "px-3 py-2.5"}`}
      >
        {items?.length ? (
          <div
            className={
              mobile
                ? "flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
                : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5 justify-items-center"
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
                    compact={desktopCompact}
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
                compact={desktopCompact}
                day={day}
                active={isSec ? skipSecDays?.[day] === true : selected?.[day] === null}
                disabled={disabledDay}
                onClick={() => onCardClick(day, null, disabledDay)}
              />
            </div>
          </div>
        ) : (
          <div
            className={`rounded-2xl border border-dashed border-slate-300 bg-white/70 text-center text-slate-500 ${
              mobile ? "px-4 py-8" : "px-3 py-5 text-sm"
            }`}
          >
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
    <div className="hidden md:block mt-2 rounded-2xl border border-slate-200 bg-[#FFFDF4] shadow-sm overflow-hidden">
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
      <div className="px-[10px] pt-[10px] pb-[20px] md:px-3 md:pt-2 md:pb-4">
        <div className="space-y-3 md:space-y-2">
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
                  className={`w-full rounded-2xl border text-left shadow-sm transition md:rounded-xl ${
                    isOpen
                      ? "border-sky-300 bg-sky-50"
                      : "border-white/60 bg-white/80"
                  } px-4 py-4 md:px-3 md:py-2.5`}
                >
                  <div className="flex items-start justify-between gap-3 md:gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap md:gap-1.5">
                        <span className="text-base md:text-sm font-bold text-slate-900">
                          {dayNameVN(info.day)}
                        </span>
                        <span className="text-sm md:text-xs text-slate-500">
                          {info.dateText}
                        </span>
                      </div>

                      <div className="mt-2 md:mt-1.5">
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

                      <div className="mt-2 md:mt-1.5 flex flex-wrap gap-2 md:gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full font-medium border md:px-2 md:py-0.5 md:text-[11px] ${
                            isEditable
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-rose-200 bg-rose-50 text-rose-700"
                          } px-2.5 py-1 text-xs`}
                        >
                          {isEditable ? (
                            <FaLockOpen className="md:text-[10px]" />
                          ) : (
                            <FaLock className="md:text-[10px]" />
                          )}
                          {isEditable ? "Có thể chọn" : "Đã khóa / quá giờ"}
                        </span>
                      </div>

                      <div className="mt-3 md:mt-2 min-h-[20px] md:min-h-0">
                        {info.chosenNames?.length ? (
                          <div className="flex flex-wrap gap-2 md:gap-1.5">
                            {info.chosenNames.slice(0, 3).map((name, idx) => (
                              <span
                                key={`${info.day}-${idx}`}
                                className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 md:px-2 md:py-0.5 text-xs md:text-[11px] font-medium text-sky-700"
                              >
                                {name}
                              </span>
                            ))}
                            {info.chosenNames.length > 3 ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 md:px-2 md:py-0.5 text-xs md:text-[11px] font-medium text-slate-600">
                                +{info.chosenNames.length - 3} món
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-sm md:text-xs text-slate-400 italic">
                            Chưa chọn món
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 pt-1 md:pt-0">
                      <div
                        className={`rounded-full grid place-items-center transition md:h-7 md:w-7 ${
                          isOpen
                            ? "bg-sky-100 text-sky-700 rotate-90"
                            : "bg-slate-100 text-slate-600"
                        } h-9 w-9`}
                      >
                        <FaChevronRight className="md:text-xs" />
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
