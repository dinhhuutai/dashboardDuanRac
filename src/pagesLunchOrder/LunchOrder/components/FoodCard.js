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
}) {
  const userPicked = userPickDayMap?.[eid] ?? 0;

  return (
    <motion.div
      key={eid}
      whileTap={{ scale: 0.97 }}
      role="button"
      tabIndex={0}
      onClick={onCardClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) onCardClick();
      }}
      className={`toy-card relative w-[220px] text-left cursor-pointer transition
        ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
        ${disabled ? "opacity-50 pointer-events-none" : ""}
        bg-white/80 backdrop-blur border border-white/60 shadow-sm
        rounded-[24px] flex flex-col
      `}
      style={{ minHeight: showPanel ? 320 : 270 }}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 shadow-inner text-slate-700">
            {getFoodIcon(item.foodName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Món ăn</div>
            <div className="font-semibold text-slate-800 leading-tight line-clamp-2">{item.foodName}</div>
          </div>
        </div>
      </div>

      {/* Image */}
      <div
        className={`mx-3 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-inner overflow-hidden
          ${showPanel ? "h-28" : "h-36"}`}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400 text-sm w-full h-full grid place-items-center">Chưa có hình</div>
        )}
      </div>

      {/* Status */}
      <div className="px-4 pt-2">
        <div className="flex items-center justify-between">
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-medium
              ${checked ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-slate-100 text-slate-500"}`}
          >
            {checked ? (isSec ? "Đang chọn (thư ký)" : "Đã chọn") : "Chọn món"}
          </div>
          {checked && <FaCheck className="text-emerald-600" />}
        </div>
      </div>

      {/* Panel */}
      {showPanel && (
        <div className="mt-2 mx-3 mb-3 p-0 flex-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          {!isSec ? (
            // USER: chọn 1 branch (toggle về CHUNG)
            <div className="flex flex-col gap-2">
              {(item.branches || []).map((br, idx) => {
                const picked = userPickDayMap?.[eid]; // undefined => CHUNG
                const active = picked === br.branchId;
                const pal = [
                  { bg: "bg-sky-50", border: "border-sky-200", ring: "ring-sky-300/60", text: "text-sky-700" },
                  { bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-300/60", text: "text-violet-700" },
                  { bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-300/60", text: "text-amber-800" },
                  { bg: "bg-teal-50", border: "border-teal-200", ring: "ring-teal-300/60", text: "text-teal-700" },
                  { bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-300/60", text: "text-rose-700" },
                ][idx % 5];

                return (
                  <button
                    key={br.branchId}
                    type="button"
                    disabled={disabled}
                    className={`w-full h-11 rounded-xl border flex items-center justify-center text-[14px] font-semibold transition
                      ${
                        active
                          ? `${pal.bg} ${pal.text} ${pal.border} ring-1 ${pal.ring}`
                          : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                      }`}
                    onClick={() => onPickBranch(br.branchId)}
                  >
                    {br.branchName || br.branchCode || "Branch"}
                  </button>
                );
              })}
            </div>
          ) : (
            // SEC: qty chung + multi branch + stepper
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center">
                {
                  item.foodName !== 'Trứng' &&
                  <QuantityStepper
                    value={qtyEntryValue ?? 0}
                    min={0}
                    disabled={disabled}
                    onChange={onChangeQtyEntry}
                  />
                }
              </div>

              {(item.branches || []).map((br, idx) => {
                const brSel = !!selectedBrEntryMap?.[br.branchId];
                const qtyVal = brSel ? (qtyBrEntryMap?.[br.branchId] ?? 0) : 0;
                const pal = [
                  { bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-300/60", text: "text-emerald-700" },
                  { bg: "bg-sky-50", border: "border-sky-200", ring: "ring-sky-300/60", text: "text-sky-700" },
                  { bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-300/60", text: "text-violet-700" },
                  { bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-300/60", text: "text-amber-800" },
                  { bg: "bg-teal-50", border: "border-teal-200", ring: "ring-teal-300/60", text: "text-teal-700" },
                  { bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-300/60", text: "text-rose-700" },
                ][idx % 6];

                return (
                  <div
                    key={br.branchId}
                    className={`rounded-2xl transition-all p-2 ${
                      brSel ? `${pal.bg} border ${pal.border} ring-1 ${pal.ring}` : "border border-slate-200 bg-white/80"
                    }`}
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      className={`w-full h-12 rounded-xl border flex items-center justify-center text-[14px] font-semibold transition
                        ${brSel ? `bg-white ${pal.text} ${pal.border}` : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"}`}
                      onClick={() => onToggleBranch(br.branchId, brSel)}
                    >
                      {br.branchName || br.branchCode || "Branch"}
                    </button>

                    {brSel && (
                      <div className="mt-2 flex items-center justify-center">
                        <QuantityStepper
                          value={qtyVal}
                          min={0}
                          disabled={disabled}
                          autoFocus={brSel}
                          onChange={(v) => onChangeQtyBranch(br.branchId, v, qtyVal)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <span className="shine" />
    </motion.div>
  );
}
