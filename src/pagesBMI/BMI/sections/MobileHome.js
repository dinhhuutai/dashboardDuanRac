import React from "react";
import { FaThLarge } from "react-icons/fa";
import avatarBMI from "~/assets/imgs/avatar_bmi.png";
import config from "~/config";

import RobotLottie from "../components/RobotLottie";
import { mockUser, mockLatest, mockRange } from "../data/mockBmi";

export default function MobileHome({ navigate, bmi }) {
  return (
    <div className="md:hidden">
      <div
        className={[
          "relative",
          "bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500",
          "rounded-b-[50px]",
          "px-4 pt-4 pb-[170px]",
        ].join(" ")}
      >
        <div className="flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full bg-white/30 border border-white/45 overflow-hidden shrink-0">
              <img src={avatarBMI} alt="Avatar" className="h-full w-full object-cover" />
            </div>

            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-2xl font-semibold text-white tracking-tight truncate">
                {mockUser.fullName}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(config.routes.homeMain)}
            className="h-10 w-10 rounded-full bg-white/20 border border-white/35 grid place-items-center text-white active:scale-[0.98]"
            aria-label="Chọn ứng dụng"
            title="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>
        </div>

        <div className="absolute left-4 right-4 top-[110px]">
          <div className="rounded-2xl bg-white border border-slate-200/70 shadow-[0_10px_22px_rgba(15,23,42,0.12)] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-semibold text-slate-900 tracking-tight">
                  BMI{" "}
                  <span className="text-emerald-700 font-bold">
                    {bmi?.toFixed?.(1) ?? "--"}
                  </span>
                </div>

                <div className="mt-1">
                  <span className="inline-block text-[12px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {mockRange.title}
                  </span>
                </div>
              </div>

              <div className="h-[100px] w-[100px] flex items-center justify-center shrink-0">
                <RobotLottie isMobile className="w-[100px] h-[100px]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2">
                <div className="text-[11px] text-slate-500">Chiều cao</div>
                <div className="text-[15px] font-semibold text-slate-800">
                  {mockUser.heightCm} <span className="text-slate-500 font-medium">cm</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-white px-3 py-2">
                <div className="text-[11px] text-slate-500">Cân nặng</div>
                <div className="text-[15px] font-semibold text-slate-800">
                  {mockLatest.weightKg} <span className="text-slate-500 font-medium">kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[56px]" />
    </div>
  );
}
