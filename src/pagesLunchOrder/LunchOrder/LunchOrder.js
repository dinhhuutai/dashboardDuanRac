import React, { useEffect, useState, useRef } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaSpinner, FaSave, FaTimes, FaRedo } from "react-icons/fa";

function dayNameVN(day) {
  const map = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    7: "Chủ nhật",
  };
  return map[day];
}

/* ==== Modal Thông báo ==== */
function NoticeModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 z-[200] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gray-100 rounded-2xl shadow-xl max-w-md w-full"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-gray-700">{message}</div>
            <div className="px-5 py-3 border-t flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UserOrderSlide() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });
  const [hasOrdered, setHasOrdered] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const swiperRef = useRef(null);

  // Load menu + selections
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const wmRes = await http.get(
          `${BASE_URL}/api/lunch-order/user/weekly-menu-latest`
        );
        const menu = wmRes.data?.data;

        if (!menu) {
          setWeeklyMenu(null);
          return;
        }
        setWeeklyMenu(menu);

        // lấy selections của user
        const sRes = await http.get(
          `${BASE_URL}/api/lunch-order/user/selections/${menu.weeklyMenuId}/${tmp?.login?.currentUser?.userID}`
        );
        if (sRes.data?.data?.length > 0) {
          setHasOrdered(true);
          const sel = {};
          sRes.data.data.forEach((eid) => {
            const entry = menu.entries.find(
              (x) => x.weeklyMenuEntryId === eid
            );
            if (entry) sel[entry.dayOfWeek] = entry.weeklyMenuEntryId;
          });
          setSelected(sel);
        } else {
          setHasOrdered(false);
          setSelected({});
        }
      } finally {
        setLoading(false);
      }
    }
    if (tmp?.login?.currentUser?.userID) load();
  }, []);

  function choose(day, entryId) {
    if (weeklyMenu?.isLocked) return; // 🔒 không cho chọn
    setSelected((prev) => ({ ...prev, [day]: entryId }));
    if (swiperRef.current) {
      const swiper = swiperRef.current.swiper;
      if (swiper && swiper.activeIndex < swiper.slides.length - 1) {
        setTimeout(() => swiper.slideNext(), 300);
      }
    }
  }

  async function handleSave() {
    if (!weeklyMenu || weeklyMenu?.isLocked) return;
    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/lunch-order/user/selections/save`, {
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        selections: Object.values(selected).filter((x) => x !== undefined),
        createdBy: user.fullName,
      });
      setHasOrdered(true);
      setNotice({
        open: true,
        title: "Thành công",
        message: "Đặt cơm thành công!",
      });
    } catch {
      setNotice({
        open: true,
        title: "Lỗi",
        message: "Không thể lưu đặt cơm.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleReorder() {
    if (weeklyMenu?.isLocked) return; // 🔒 không cho đặt lại
    setHasOrdered(false);
    setSelected({});
  }

  if (loading)
    return (
      <div className="p-6 text-emerald-600">
        <FaSpinner className="animate-spin" /> Đang tải...
      </div>
    );
  if (!weeklyMenu) return <div className="p-6">Chưa có menu tuần này</div>;

  const grouped = weeklyMenu.entries.reduce((acc, e) => {
    acc[e.dayOfWeek] = acc[e.dayOfWeek] || [];
    acc[e.dayOfWeek].push(e);
    return acc;
  }, {});
  const totalSlides = Object.keys(grouped).length;

  // Kiểm tra đã chọn đủ chưa
  const allDays = Object.keys(grouped);
  const hasChosenAll = allDays.every((day) =>
    Object.prototype.hasOwnProperty.call(selected, day)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* CSS cho hiệu ứng shine */}
<style>{`
  .card { 
    position: relative; 
    overflow: hidden; 
  }

  .card .shine {
    position: absolute;
    top: -60%;
    left: -60%;
    height: 220%;
    width: 110px; /* dải sáng to hơn chút */
    transform: rotate(25deg) translateX(-200%);
    background: linear-gradient(
      90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.7) 50%,
      rgba(255,255,255,0) 100%
    );
    pointer-events: none;
    /* Tổng 6s: ~1s chạy + ~5s nghỉ */
    animation: shine 6s linear infinite;
  }

  @keyframes shine {
    /* 0% -> 16.666% (~1s nếu tổng 6s): chạy ngang qua hết thẻ */
    0%   { transform: rotate(25deg) translateX(-200%); opacity: 0; }
    4%   { opacity: 1; }
    16.666% { transform: rotate(25deg) translateX(250%); opacity: 1; }

    /* 16.667% -> 99%: ẩn để tạo khoảng nghỉ ~5s */
    16.667% { opacity: 0; }
    99%  { opacity: 0; transform: rotate(25deg) translateX(250%); }

    /* 100%: reset về đầu (ẩn nên không thấy giật) */
    100% { transform: rotate(25deg) translateX(-200%); opacity: 0; }
  }
`}</style>



      {hasOrdered ? (
        <div className="bg-white rounded-2xl shadow p-6 mt-[10px]">
          <h3 className="font-semibold text-lg mb-4">
            Bạn đã đặt cơm tuần này
          </h3>
          <ul className="space-y-3">
            {Object.keys(grouped).map((day) => {
              const entryId = selected[day];
              const entry = weeklyMenu.entries.find(
                (x) => x.weeklyMenuEntryId === entryId
              );
              return (
                <li
                  key={day}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50"
                >
                  <span className="w-24 font-medium">{dayNameVN(day)}</span>
                  {entry ? (
                    <span className="text-slate-700">{entry.foodName}</span>
                  ) : (
                    <span className="text-slate-400 italic">Không chọn</span>
                  )}
                </li>
              );
            })}
          </ul>
          {!weeklyMenu?.isLocked && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleReorder}
                className="px-6 py-3 rounded-xl bg-amber-500 text-white flex items-center gap-2 shadow hover:bg-amber-600"
              >
                <FaRedo /> Đặt lại
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Swiper
            ref={swiperRef}
            spaceBetween={30}
            slidesPerView={1}
            className="rounded-2xl"
            onSlideChange={(s) => setActiveSlide(s.activeIndex)}
          >
            {Object.keys(grouped).map((day) => {
              const items = grouped[day];
              return (
                <SwiperSlide key={day}>
                  <div className="pb-[20px]">
                    <h3 className="text-xl font-semibold text-slate-700 mb-6 text-center">
                      {dayNameVN(day)}
                    </h3>
                    <div className="flex justify-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 justify-items-center">
                        <AnimatePresence>
                          {items.map((item) => {
                            const checked =
                              selected[day] === item.weeklyMenuEntryId;
                            return (
                              <motion.div
                                key={item.weeklyMenuEntryId}
                                layout
                                whileTap={{ scale: 0.97 }}
                                className={`card relative w-56 h-64 rounded-3xl flex flex-col cursor-pointer
                                  transition transform
                                  ${checked ? "ring-2 ring-emerald-400" : ""}
                                  bg-gray-100 
                                  shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]
                                  hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]
                                  ${
                                    weeklyMenu?.isLocked
                                      ? "opacity-50 pointer-events-none"
                                      : ""
                                  }
                                `}
                                onClick={() =>
                                  choose(day, item.weeklyMenuEntryId)
                                }
                              >
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.foodName}
                                    className="h-32 w-full object-cover rounded-t-2xl"
                                  />
                                ) : (
                                  <div className="h-32 w-full flex items-center justify-center text-gray-400 bg-slate-100 rounded-t-3xl">
                                    Chưa có hình
                                  </div>
                                )}
                                <div className="flex-1 p-4 flex flex-col justify-center items-center">
                                  <h3 className="font-semibold text-lg text-center text-gray-700">
                                    {item.foodName}
                                  </h3>
                                  {checked && (
                                    <FaCheck className="text-emerald-600 mt-2 text-xl" />
                                  )}
                                </div>
                                <span className="shine" />
                              </motion.div>
                            );
                          })}

                          {/* Thẻ "Không chọn" */}
                          <motion.div
                            key={`none-${day}`}
                            layout
                            whileTap={{ scale: 0.97 }}
                            className={`card relative w-56 h-64 rounded-3xl flex flex-col items-center justify-center cursor-pointer
                              bg-gray-100 
                              shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]
                              hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]
                              ${
                                selected[day] === null
                                  ? "ring-2 ring-rose-400"
                                  : ""
                              }
                              ${
                                weeklyMenu?.isLocked
                                  ? "opacity-50 pointer-events-none"
                                  : ""
                              }
                            `}
                            onClick={() => choose(day, null)}
                          >
                            <span className="font-medium text-gray-600">
                              Không chọn
                            </span>
                            <span className="shine" />
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Nút chỉ hiện ở slide cuối + chọn đủ tất cả ngày + chưa bị lock */}
          {activeSlide === totalSlides - 1 &&
            hasChosenAll &&
            !weeklyMenu?.isLocked && (
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white flex items-center gap-2 shadow disabled:opacity-50"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  <FaSave /> Lưu đặt cơm
                </button>
              </div>
            )}
        </>
      )}

      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        onClose={() => setNotice({ ...notice, open: false })}
      />
    </div>
  );
}
