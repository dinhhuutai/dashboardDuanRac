import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaCalculator, FaWeight, FaRunning, FaFireAlt, FaDumbbell } from "react-icons/fa";

import MobileHome from "./sections/MobileHome";
import RobotHelloWidget from "./components/RobotHelloWidget";
import StatusPill from "./components/StatusPill";

import { softCard, softCard1, softInset, softBtn, pill } from "./styles/uiClasses";
import { mockUser, mockLatest, mockRange, mockToday } from "./data/mockBmi";

function fmtPct(v) {
  if (v == null) return "--";
  return `${Math.round(v * 100)}%`;
}
function rangeAccent(colorKey) {
  switch (colorKey) {
    case "green":
      return "text-emerald-700";
    case "yellow":
      return "text-amber-700";
    case "red":
      return "text-rose-700";
    case "blue":
      return "text-sky-700";
    default:
      return "text-slate-700";
  }
}
function sportIcon(type) {
  if (type === "strength") return <FaDumbbell className="text-slate-600" />;
  return <FaFireAlt className="text-slate-600" />;
}

export default function BMI() {
  const navigate = useNavigate();
  const bmi = mockLatest?.bmi ?? null;

  const headerSub = useMemo(() => {
    if (!mockLatest) return "Chưa có dữ liệu đo. Hãy đo BMI lần đầu nhé.";
    return `Cập nhật lúc ${mockLatest.measuredAt}`;
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <MobileHome navigate={navigate} bmi={bmi} />

      <div className="mx-auto max-w-full px-4 sm:px-6 py-5 sm:py-7">
        {/* PC header */}
        <div className={`${softCard} px-[25px] py-4 sm:py-5 hidden md:block`}>
          <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-slate-500">Xin chào,</div>
              <div className="text-xl sm:text-3xl font-semibold text-slate-900 tracking-tight truncate">
                {mockUser.fullName}
              </div>
              <div className="text-[12px] sm:text-[13px] text-slate-500 mt-1 truncate">
                {headerSub}
              </div>
            </div>

            <div className="shrink-0 flex items-center sm:mr-[150px]">
              <RobotHelloWidget className="scale-[0.85] sm:scale-100 origin-right" />
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="md:mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left */}
          <div className="lg:col-span-5 space-y-5">
            <div className={`${softCard1} md:p-5 sm:p-6`}>
              {/* PC-only BMI block */}
              <div className="hidden md:flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="text-[12px] text-slate-500">BMI hiện tại</div>
                  <div className="mt-1 flex items-end gap-2">
                    <div className="text-4xl sm:text-5xl font-bold text-slate-900">
                      {bmi?.toFixed?.(1) ?? "--"}
                    </div>
                    <div className={`pb-1 text-sm font-semibold ${rangeAccent(mockRange.colorKey)}`}>
                      {mockRange.title}
                    </div>
                  </div>
                  <div className="mt-2 text-[13px] text-slate-600">{mockRange.shortMessage}</div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2">
                  <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                    <div className={`${softInset} px-4 py-3 min-w-0 sm:min-w-[140px]`}>
                      <div className="text-[11px] text-slate-500">Chiều cao</div>
                      <div className="text-lg font-semibold text-slate-800">
                        {mockUser.heightCm} <span className="text-sm font-medium text-slate-500">cm</span>
                      </div>
                    </div>

                    <div className={`${softInset} px-4 py-3 min-w-0 sm:min-w-[140px]`}>
                      <div className="text-[11px] text-slate-500">Cân nặng</div>
                      <div className="text-lg font-semibold text-slate-800">
                        {mockLatest.weightKg} <span className="text-sm font-medium text-slate-500">kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advice card */}
              <div className="md:mt-3 rounded-2xl bg-white/55 border border-slate-200/70 shadow-[0_6px_16px_rgba(15,23,42,0.06)] p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-amber-50 border border-amber-100 grid place-items-center">
                    <span className="text-xl">💡</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 leading-tight">Gợi ý nhanh</div>
                  </div>
                </div>
                <div className="mt-2 text-[13px] text-slate-600 leading-relaxed">{mockRange.advice}</div>
              </div>

              {/* Buttons */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => navigate("/bmi/check")} className={`${softBtn} text-left group`}>
                  <div className="flex items-center gap-3">
                    <div className={`${softInset} h-11 w-11 grid place-items-center`}>
                      <FaCalculator className="text-slate-700 text-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800">Đo BMI</div>
                      <div className="text-[12px] text-slate-500 truncate">Kiểm tra nhanh</div>
                    </div>
                  </div>
                </button>

                <button onClick={() => navigate("/bmi/log-weight")} className={`${softBtn} text-left group`}>
                  <div className="flex items-center gap-3">
                    <div className={`${softInset} h-11 w-11 grid place-items-center`}>
                      <FaWeight className="text-slate-700 text-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800">Ghi cân</div>
                      <div className="text-[12px] text-slate-500 truncate">Hôm nay</div>
                    </div>
                  </div>
                </button>

                <button onClick={() => navigate("/bmi/log-activity")} className={`${softBtn} text-left group`}>
                  <div className="flex items-center gap-3">
                    <div className={`${softInset} h-11 w-11 grid place-items-center`}>
                      <FaRunning className="text-slate-700 text-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800">Ghi vận động</div>
                      <div className="text-[12px] text-slate-500 truncate">Phút & môn</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Today stats */}
            <div className={`${softCard} px-5 pb-5 pt-5`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Tóm tắt hôm nay</div>
                  <div className="text-[12px] text-slate-500">{mockToday.dateLabel}</div>
                </div>
                <button onClick={() => navigate("/bmi/dashboard")} className={`${pill} text-emerald-700 font-semibold`}>
                  Xem dashboard
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`${softInset} p-3`}>
                  <div className="text-[11px] text-slate-500">Cân nặng</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {mockToday.dailyLog.weightKg ?? "--"} <span className="text-sm font-medium text-slate-500">kg</span>
                  </div>
                </div>
                <div className={`${softInset} p-3`}>
                  <div className="text-[11px] text-slate-500">Vận động</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {mockToday.dailyLog.totalActiveMin ?? 0} <span className="text-sm font-medium text-slate-500">phút</span>
                  </div>
                </div>
                <div className={`${softInset} p-3`}>
                  <div className="text-[11px] text-slate-500">Hoàn thành</div>
                  <div className="text-lg font-semibold text-slate-800">
                    {fmtPct((mockToday.dailyLog.mealCompletionRate + mockToday.dailyLog.workoutCompletionRate) / 2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-7 space-y-5">
            <div className={`${softCard} p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800">Chế độ ăn & tập luyện hôm nay</div>
                  <div className="text-[12px] text-slate-500">Theo kế hoạch đang áp dụng (mock)</div>
                </div>
                <button onClick={() => navigate("/bmi/plan")} className={`${pill} text-emerald-700 font-semibold`}>
                  Xem kế hoạch
                </button>
              </div>

              <div className="mt-4">
                <div className="text-[12px] font-semibold text-slate-700 mb-2">🍽️ 3 bữa ăn</div>
                <div className="space-y-3">
                  {mockToday.meals.map((m, idx) => (
                    <div key={idx} className={`${softInset} p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`}>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800">{m.title}</div>
                        <div className="mt-1 text-[12px] text-slate-500">Ước tính: {m.calories} kcal</div>
                      </div>
                      <StatusPill done={m.done} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-[12px] font-semibold text-slate-700 mb-2">🏃‍♂️ Vận động</div>
                <div className="space-y-3">
                  {mockToday.workouts.map((w, idx) => (
                    <div key={idx} className={`${softInset} p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3`}>
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`${softInset} h-10 w-10 grid place-items-center shrink-0`}>
                          {sportIcon(w.sportType)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-800">{w.title}</div>
                          <div className="mt-1 text-[12px] text-slate-500">
                            {w.durationMin} phút • RPE {w.intensityRPE ?? "--"}
                          </div>
                        </div>
                      </div>
                      <StatusPill done={w.done} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => navigate("/bmi/today")} className={`${softBtn} w-full text-center font-semibold text-slate-800`}>
                  Mở “Hôm nay” (tick hoàn thành)
                </button>
                <button onClick={() => navigate("/bmi/check")} className={`${softBtn} w-full text-center font-semibold text-orange-700`}>
                  Đo lại BMI
                </button>
              </div>
            </div>

            <div className={`${softCard} p-5`}>
              <div className="text-sm font-semibold text-slate-800">Mẹo nhỏ</div>
              <ul className="mt-2 text-[13px] text-slate-600 space-y-1 list-disc pl-5">
                <li>Ngủ đủ 7–8 giờ giúp giảm mỡ và hồi phục tốt hơn.</li>
                <li>Đi bộ 10–15 phút sau bữa trưa hỗ trợ tiêu hoá.</li>
                <li>Tập sức mạnh 2 buổi/tuần giúp “săn chắc” (đẹp là bonus).</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
