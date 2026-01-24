export const mockUser = { fullName: "Đinh Tài", heightCm: 170 };

export const mockLatest = {
  measuredAt: "2026-01-14 08:20",
  weightKg: 64.2,
  heightCm: 170,
  bmi: 22.2,
  bmiClass: "NORMAL",
};

export const mockRange = {
  title: "Bình thường",
  shortMessage: "BMI trong vùng ổn.",
  advice:
    "Duy trì ăn cân bằng + vận động đều. Ưu tiên sức mạnh 2 buổi/tuần để săn chắc.",
  colorKey: "green",
};

export const mockToday = {
  dateLabel: "Hôm nay • 14/01/2026",
  dailyLog: {
    weightKg: 64.0,
    totalActiveMin: 35,
    mealCompletionRate: 0.66,
    workoutCompletionRate: 0.5,
  },
  meals: [
    { title: "Sáng: 2 trứng luộc + 1 trái chuối", calories: 380, done: true },
    {
      title: "Trưa: Cơm công ty (cá kho + rau luộc) - 1 chén cơm",
      calories: 650,
      done: false,
    },
    { title: "Tối: Ức gà + salad + canh", calories: 520, done: false },
  ],
  workouts: [
    {
      sportType: "badminton",
      title: "Cầu lông nhẹ",
      durationMin: 45,
      intensityRPE: 6,
      done: false,
    },
    {
      sportType: "strength",
      title: "Sức mạnh (squat + plank + chống đẩy)",
      durationMin: 20,
      intensityRPE: 5,
      done: true,
    },
  ],
};
