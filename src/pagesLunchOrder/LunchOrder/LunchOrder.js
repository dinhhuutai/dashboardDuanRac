import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FaCheckCircle, FaUtensils } from "react-icons/fa";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";

function MealOrder() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  const [menu, setMenu] = useState([]); // { dayOfWeek, foods: [{foodId, foodName, imageUrl, colorCode}] }
  const [selections, setSelections] = useState({}); // { dayOfWeek: foodId | null }

  useEffect(() => {
    setUser(tmp?.login?.currentUser);
  }, [tmp]);

  useEffect(() => {
    fetchMenu();
  }, []);

  async function fetchMenu() {
    try {
      const res = await http.get(`${BASE_URL}/weekly-menu/current`);
      setMenu(res.data || []);
    } catch (err) {
      console.error("Fetch menu error:", err);
    }
  }

  function toggleSelection(day, foodId) {
    setSelections((prev) => ({
      ...prev,
      [day]: prev[day] === foodId ? null : foodId,
    }));
  }

  async function confirmOrder() {
    try {
      const payload = Object.entries(selections).map(([dayOfWeek, foodId]) => ({
        dayOfWeek: Number(dayOfWeek),
        foodId,
        userId: user.userID,
      }));

      await http.post(`${BASE_URL}/weekly-selections/confirm`, { payload });
      alert("✅ Đã đặt cơm thành công!");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi đặt cơm");
    }
  }

  return (
    <div className="p-3 md:p-6">
      {/* Header */}
      <div className="text-center mb-5">
        <h2 className="text-lg md:text-2xl font-bold text-slate-800">
          📅 Đặt cơm tuần này
        </h2>
        <p className="text-slate-500 text-sm">
          Vuốt sang trái/phải (mobile) hoặc click tab (desktop) để chọn món
        </p>
      </div>

      {/* Swiper: từng ngày */}
      <Swiper spaceBetween={16} slidesPerView={1} className="mb-5 md:hidden">
        {menu.map((day) => (
          <SwiperSlide key={day.dayOfWeek}>
            <DayMenu
              day={day}
              selectedFoodId={selections[day.dayOfWeek]}
              toggleSelection={toggleSelection}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Desktop grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {menu.map((day) => (
          <DayMenu
            key={day.dayOfWeek}
            day={day}
            selectedFoodId={selections[day.dayOfWeek]}
            toggleSelection={toggleSelection}
          />
        ))}
      </div>

      {/* Confirm */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={confirmOrder}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow hover:from-emerald-700 hover:to-teal-700 active:scale-[.98] transition"
        >
          ✅ Xác nhận đặt cơm
        </button>
      </div>
    </div>
  );
}

function DayMenu({ day, selectedFoodId, toggleSelection }) {
  const weekday = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm p-4 flex flex-col">
      <h3 className="font-bold text-slate-700 text-base mb-3">
        {weekday[day.dayOfWeek - 1]}
      </h3>
      <div className="flex-1 flex flex-col gap-3">
        {day.foods.map((food) => {
          const selected = selectedFoodId === food.foodId;
          return (
            <button
              key={food.foodId}
              onClick={() => toggleSelection(day.dayOfWeek, food.foodId)}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                selected
                  ? "bg-emerald-50 border-emerald-400"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: food.colorCode || "#f1f5f9" }}
              >
                {food.imageUrl ? (
                  <img
                    src={food.imageUrl}
                    alt={food.foodName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUtensils className="text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{food.foodName}</div>
                {food.description && (
                  <div className="text-xs text-slate-500">
                    {food.description}
                  </div>
                )}
              </div>
              {selected && (
                <FaCheckCircle className="text-emerald-600 text-xl flex-shrink-0" />
              )}
            </button>
          );
        })}
        {/* Nút không chọn */}
        <button
          onClick={() => toggleSelection(day.dayOfWeek, null)}
          className={`mt-2 px-4 py-2 text-sm rounded-lg border w-full ${
            selectedFoodId === null
              ? "bg-rose-50 border-rose-300 text-rose-700"
              : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
          }`}
        >
          🚫 Không chọn
        </button>
      </div>
    </div>
  );
}

export default MealOrder;
