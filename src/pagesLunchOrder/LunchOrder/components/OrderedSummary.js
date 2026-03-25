import React from "react";
import { FaRedo, FaLock, FaLockOpen, FaSpinner } from "react-icons/fa";

export default function OrderedSummary({
  visible,
  weeklyMenu,
  sortedDays,
  orderType,
  isSec,

  selected,
  selectedSec,
  selectedBr,
  qtyBr,
  qtyEntry,
  skipSecDays,
  userPick,

  cmpByPositionId,
  dayNameVN,

  canModifyDayByMode,
  canCancelDay,

  onStartEditDay,
  onEnterResetMode,
  onAskCancel,

  lockedDays = {},
  lockingDay = null,
  onAskLockDay,
}) {
  if (!visible) return null;

  return (
    <div className="relative bg-white/70 backdrop-blur rounded-2xl border border-white/40 shadow-xl p-4 sm:p-6 mx-2 sm:mx-[10px]">
      <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-slate-800">
        Bạn đã đặt cơm tuần này
      </h3>

      <ul className="space-y-2 sm:space-y-3">
        {sortedDays.map((day) => {
          const dayEntries = isSec
            ? Object.keys(selectedSec[day] || {}).map(Number).sort(cmpByPositionId)
            : [selected[day]].filter((v) => v !== undefined && v !== null);

          const isDayLocked = !!lockedDays?.[day]?.isLocked;
          const isExpiredDay = !canCancelDay(Number(day));
          const isDayClosed = isDayLocked || isExpiredDay;

          const canChangeThisDay = !isDayClosed && canModifyDayByMode(Number(day));
          const canCancelThisDay = !isDayClosed && canCancelDay(Number(day));
          const isLockingThisDay = String(lockingDay) === String(day);

          const chosenEid = !isSec ? (selected[day] ?? null) : null;
          const chosenEntry =
            !isSec && chosenEid
              ? (weeklyMenu?.entries || []).find((x) => x.weeklyMenuEntryId === chosenEid)
              : null;

          return (
            <li
              key={day}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="sm:col-span-2 flex items-center">
                <button
                  onClick={() => onStartEditDay(day)}
                  disabled={!canChangeThisDay}
                  className={`inline-flex shrink-0 px-2 py-1 rounded-md border text-sm font-medium ${
                    canChangeThisDay
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                  title={canChangeThisDay ? "Sửa ngày này" : isDayClosed ? "Ngày này đã chốt" : "Đã quá hạn đổi"}
                >
                  {dayNameVN(day)}
                </button>
              </div>

              <div className="sm:col-span-7 min-w-0">
                {isSec && skipSecDays[day] === true ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-sm">
                    Không chọn
                  </span>
                ) : dayEntries.length > 0 ? (
                  <div className="flex flex-wrap gap-2 -m-1 max-w-full">
                    {dayEntries.map((eid) => {
                      const e = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === eid);
                      if (!e || (e.statusType || "re").toLowerCase() !== orderType) return null;

                      if (!isSec) {
                        const pick = Number(userPick?.[day]?.[eid]) || 0;
                        const br = pick > 0 ? (e.branches || []).find((x) => x.branchId === pick) : null;

                        return (
                          <span
                            key={eid}
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm"
                          >
                            <span className="font-medium text-slate-700">{e?.foodName}</span>
                            {pick > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                {br?.branchName || br?.branchCode || `#${pick}`}
                              </span>
                            )}
                          </span>
                        );
                      }

                      const brMap = selectedBr?.[day]?.[eid] || {};
                      const qMap = qtyBr?.[day]?.[eid] || {};
                      const list = Object.keys(brMap).map(Number);
                      const qCommon = qtyEntry?.[day]?.[eid];

                      return (
                        <div key={eid} className="m-1">
                          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm">
                            <span className="font-medium text-slate-700">{e?.foodName}</span>

                            {Number.isFinite(qCommon) && qCommon > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                SL: {qCommon}
                              </span>
                            )}

                            {list.map((bid) => {
                              const br = (e.branches || []).find((x) => x.branchId === bid);
                              const label = br?.branchName || br?.branchCode || `#${bid}`;
                              return (
                                <span
                                  key={bid}
                                  className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                                >
                                  {label} ×{qMap[bid] ?? 1}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Không chọn</span>
                )}
              </div>

              <div className="sm:col-span-3 flex flex-wrap items-start sm:justify-end gap-2">
                {isDayClosed ? (
                  <span
                    className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap border ${
                      isDayLocked
                        ? "border-slate-300 text-slate-700"
                        : "border-emerald-500/90 text-emerald-500/90"
                    }`}
                    title={isDayLocked ? "Ngày này đã chốt" : "Đã quá giờ đặt"}
                  >
                    <FaLock className="mr-2 text-current" />
                    Đã chốt ngày
                  </span>
                ) : (
                  <button
                    onClick={() => onAskLockDay?.(day)}
                    disabled={isLockingThisDay}
                    className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap shadow-sm transition ${
                      isLockingThisDay
                        ? "bg-slate-400 text-white cursor-wait"
                        : "bg-slate-800 hover:bg-slate-900 text-white hover:shadow"
                    }`}
                    title="Chốt ngày này"
                  >
                    {isLockingThisDay ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang chốt...
                      </>
                    ) : (
                      <>
                        <FaLockOpen className="mr-2" />
                        Chốt ngày
                      </>
                    )}
                  </button>
                )}

                {!isSec && (
                  <button
                    onClick={() => onAskCancel(chosenEid, day, chosenEntry?.foodName || "")}
                    disabled={!chosenEid || !canCancelThisDay}
                    className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap shadow-sm transition ${
                      !chosenEid || !canCancelThisDay
                        ? "bg-rose-300 text-white/90 cursor-not-allowed"
                        : "bg-rose-500/90 hover:bg-rose-500 text-white hover:shadow"
                    }`}
                    title={
                      !chosenEid
                        ? "Chưa chọn món ở ngày này"
                        : isDayClosed
                        ? "Ngày này đã chốt"
                        : !canCancelThisDay
                        ? "Đã quá hạn huỷ"
                        : "Huỷ món ngày này"
                    }
                  >
                    Huỷ món
                  </button>
                )}

                {/* <button
                  onClick={() => onStartEditDay(day)}
                  disabled={!canChangeThisDay}
                  className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap shadow-sm transition ${
                    canChangeThisDay
                      ? "bg-emerald-500/90 hover:bg-emerald-500 text-white hover:shadow"
                      : "bg-emerald-300 text-white/90 cursor-not-allowed"
                  }`}
                  title={
                    isDayClosed
                      ? "Ngày này đã chốt"
                      : canChangeThisDay
                      ? "Sửa món ngày này"
                      : "Đã quá hạn đổi"
                  }
                >
                  Sửa ngày
                </button> */}

                <button
  onClick={() => onStartEditDay(day)}
  disabled={!canChangeThisDay}
  className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap border shadow-sm transition ${
    canChangeThisDay
      ? "bg-white border-slate-900 text-slate-900 hover:bg-slate-50 hover:shadow"
      : "bg-white border-slate-300 text-slate-400 cursor-not-allowed"
  }`}
  title={
    isDayClosed
      ? "Ngày này đã chốt"
      : canChangeThisDay
      ? "Sửa món ngày này"
      : "Đã quá hạn đổi"
  }
>
  Sửa ngày
</button>
              </div>
            </li>
          );
        })}
      </ul>

      {!weeklyMenu?.isLocked && (
        <div className="mt-4 sm:mt-6 flex">
          <button
            onClick={onEnterResetMode}
            className="inline-flex items-center justify-center w-full sm:w-auto sm:ml-auto px-5 sm:px-6 py-3 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white gap-2 shadow-sm hover:shadow transition-shadow"
          >
            <FaRedo /> Đặt lại
          </button>
        </div>
      )}
    </div>
  );
}
