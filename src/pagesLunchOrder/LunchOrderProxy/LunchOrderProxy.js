// src/pagesLunchOrder/LunchOrderProxy/ProxyOrder.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { FaCheck, FaSpinner, FaSave, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";

/* Utils */
function dayNameVN(day) {
  return ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"][day] || "";
}

/* ===== Modal Thông báo ===== */
function NoticeModal({ open, title, message, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] grid place-items-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl max-w-md w-[92%]"
            initial={{ scale: 0.96, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 10 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-slate-100 transition"
              >
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
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

export default function ProxyOrder() {
  const tmp = useSelector(userSelector);

  const [currentUser, setCurrentUser] = useState({});
  const [mode, setMode] = useState("history"); // "history" | "proxy"

  // Lịch sử
  const [date, setDate] = useState("");
  const [history, setHistory] = useState([]); // [{userID, fullName, items:[{...}]}]
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  // Đặt giùm
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [isMenuLocked, setIsMenuLocked] = useState(false);
  const [deptUsers, setDeptUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // react-select object {value,label}
  const [selected, setSelected] = useState({}); // {dayOfWeek: weeklyMenuEntryId | null}
  const [loading, setLoading] = useState(false);

  // Modal thông báo
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });

  const swiperRef = useRef(null);

  useEffect(() => setCurrentUser(tmp?.login?.currentUser), [tmp]);

  // Mới vào -> set ngày hiện tại
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  }, []);

  // Lịch sử theo ngày
  useEffect(() => {
    if (mode !== "history" || !date || !currentUser?.userID) return;
    setLoading(true);
    http
      .get(`${BASE_URL}/api/lunch-order/proxy/history`, {
        params: { selectedByUserId: currentUser.userID, date },
      })
      .then((res) => setHistory(res?.data?.data || []))
      .finally(() => setLoading(false));
  }, [mode, date, currentUser]);

  // Khi nhấn "Đặt giùm" -> đọc menu mới nhất (để biết isLocked) + load user cùng bộ phận
  useEffect(() => {
    if (mode !== "proxy" || !currentUser?.userID) return;

    // Menu mới nhất
    http
      .get(`${BASE_URL}/api/lunch-order/user/weekly-menu-latest`)
      .then((res) => {
        const menu = res?.data?.data || null;
        setWeeklyMenu(menu);
        setIsMenuLocked(!!menu?.isLocked);
      });

    // Danh sách user cùng bộ phận
    http
      .get(`${BASE_URL}/api/lunch-order/proxy/department-users`, {
        params: { requesterId: currentUser.userID },
      })
      .then((res) => setDeptUsers(res?.data?.data || []));
  }, [mode, currentUser]);

  // Chọn user -> load selections
  useEffect(() => {
    async function loadSelections() {
      if (mode !== "proxy" || !selectedUser?.value || !weeklyMenu?.weeklyMenuId) return;

      setLoading(true);
      try {
        const selRes = await http.get(`${BASE_URL}/api/lunch-order/proxy/selections`, {
          params: {
            weeklyMenuId: weeklyMenu.weeklyMenuId,
            userId: selectedUser.value,
            selectedByUserId: currentUser.userID,
          },
        });

        const sel = {};
        const ids = selRes?.data?.data || [];
        ids.forEach((entryId) => {
          const entry = weeklyMenu.entries?.find(
            (x) => x.weeklyMenuEntryId === entryId
          );
          if (entry) sel[entry.dayOfWeek] = entry.weeklyMenuEntryId;
        });
        setSelected(sel);
      } finally {
        setLoading(false);
      }
    }
    loadSelections();
  }, [mode, selectedUser, weeklyMenu, currentUser]);

  // Gom entries theo ngày
  const grouped = useMemo(() => {
    const entries = weeklyMenu?.entries || [];
    return entries.reduce((acc, e) => {
      acc[e.dayOfWeek] = acc[e.dayOfWeek] || [];
      acc[e.dayOfWeek].push(e);
      return acc;
    }, {});
  }, [weeklyMenu]);

  const allDays = Object.keys(grouped);
  const hasChosenAll = allDays.length > 0 && allDays.every((day) => day in selected);

  function choose(day, entryId) {
    if (isMenuLocked) return;
    setSelected((prev) => ({ ...prev, [day]: entryId }));
    if (swiperRef.current) {
      const swiper = swiperRef.current.swiper;
      if (swiper && swiper.activeIndex < swiper.slides.length - 1) {
        setTimeout(() => swiper.slideNext(), 250);
      }
    }
  }

  async function handleSave() {
    if (!weeklyMenu || isMenuLocked || !selectedUser?.value) return;
    setLoading(true);
    try {
      await http.post(`${BASE_URL}/api/lunch-order/proxy/save`, {
        userId: Number(selectedUser.value),
        selectedByUserId: currentUser.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        selections: Object.values(selected).filter((x) => x !== undefined),
        createdBy: currentUser.userID, // backend nhận INT
      });

      setNotice({
        open: true,
        title: "Thành công",
        message: `Đặt giùm cho ${selectedUser.label} thành công!`,
      });

      // quay lại lịch sử sau khi đóng modal
    } catch (e) {
      setNotice({
        open: true,
        title: "Lỗi",
        message: "Không thể lưu đặt giùm. Vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }

  // React-select options
  const userOptions = useMemo(
    () =>
      (deptUsers || []).map((u) => ({
        value: u.userID,
        label: u.fullName,
      })),
    [deptUsers]
  );

  // Sau khi đóng modal thành công -> trở về lịch sử
  function handleCloseNotice() {
    const wasSuccess = notice.title === "Thành công";
    setNotice((n) => ({ ...n, open: false }));
    if (wasSuccess) {
      setMode("history");
      setSelectedUser(null);
      setSelected({});
    }
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header controls */}
      <div className="flex items-center gap-4 mb-6">
        {mode === "history" ? (
          <>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 rounded-xl border shadow-inner"
            />
            <button
              onClick={() => setMode("proxy")}
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white shadow"
            >
              Đặt giùm
            </button>
          </>
        ) : (
          <>
            <div className="w-60 z-[999]">
              <Select
                value={selectedUser}
                onChange={(opt) => setSelectedUser(opt ?? null)}
                options={userOptions}
                placeholder="Chọn user để đặt giùm..."
                isSearchable
              />
            </div>
            <button
              onClick={() => {
                setMode("history");
                setSelectedUser(null);
                setSelected({});
              }}
              className="px-5 py-2 rounded-xl bg-rose-500 text-white shadow"
            >
              Thoát
            </button>
          </>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-emerald-600 mb-4">
          <FaSpinner className="animate-spin" /> Đang tải...
        </div>
      )}

      {/* ====== Lịch sử (History) ====== */}
      {mode === "history" && !loading && (
        <>
          {/* Ô tìm kiếm theo tên */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên..."
              className="w-full px-3 py-2 rounded-xl border shadow-inner"
            />
          </div>

          {(history || [])
            .filter((u) =>
              (u?.fullName || "")
                .toLowerCase()
                .includes(search.trim().toLowerCase())
            )
            .map((u) => (
              <div
                key={u.userID}
                className="bg-white rounded-2xl p-4 mb-3 shadow hover:shadow-lg transition"
              >
                {/* Header: Tên + toggle */}
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() =>
                    setExpandedUser(expandedUser === u.userID ? null : u.userID)
                  }
                >
                  <span className="font-semibold text-slate-700">
                    {u.fullName}
                  </span>
                  <span className="text-sm text-slate-500 select-none">
                    {expandedUser === u.userID ? "▲ Thu gọn" : "▼ Xem chi tiết"}
                  </span>
                </div>

                {/* Body: danh sách món đã đặt giùm */}
                {expandedUser === u.userID && (
                  <ul className="mt-3 space-y-2 pl-3 border-l">
                    {(u.items || []).map((item) => (
                      <li
                        key={item.userWeeklySelectionId}
                        className="flex justify-between text-sm text-slate-700"
                      >
                        <span className="line-clamp-1">{item.foodName}</span>
                        <span className="text-slate-400">
                          {dayNameVN(item.dayOfWeek)}
                        </span>
                      </li>
                    ))}
                    {(u.items || []).length === 0 && (
                      <li className="text-slate-400 italic">Không có món</li>
                    )}
                  </ul>
                )}
              </div>
            ))}

          {(history || []).length === 0 && (
            <div className="text-slate-500 italic">
              Bạn chưa có đặt giùm ai
            </div>
          )}
        </>
      )}

      {/* ====== Form đặt giùm (Proxy) ====== */}
      {mode === "proxy" && selectedUser && weeklyMenu && (
        <>
          {isMenuLocked && (
            <div className="mb-4 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              Menu tuần này đã khóa. Bạn không thể đặt giùm.
            </div>
          )}

          <Swiper ref={swiperRef} spaceBetween={30} slidesPerView={1}>
            {Object.keys(grouped).map((day) => {
              const items = grouped[day] || [];
              return (
                <SwiperSlide key={day}>
                  <h3 className="text-xl font-semibold text-center mb-6">
                    {dayNameVN(day)}
                  </h3>
                  <div className="flex gap-6 justify-center flex-wrap">
                    {items.map((item) => {
                      const checked =
                        selected[day] === item.weeklyMenuEntryId;
                      return (
                        <motion.div
                          key={item.weeklyMenuEntryId}
                          whileTap={{ scale: 0.98 }}
                          className={`relative w-56 h-64 rounded-3xl bg-gray-100 cursor-pointer flex flex-col shadow ${
                            checked ? "ring-2 ring-emerald-400" : ""
                          } ${isMenuLocked ? "opacity-50 pointer-events-none" : ""}`}
                          onClick={() => choose(day, item.weeklyMenuEntryId)}
                        >
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.foodName}
                              className="h-32 w-full object-cover rounded-t-3xl"
                            />
                          ) : (
                            <div className="h-32 flex items-center justify-center text-gray-400">
                              Chưa có hình
                            </div>
                          )}
                          <div className="flex-1 p-4 flex flex-col justify-center items-center">
                            <h3 className="font-semibold text-center line-clamp-2">
                              {item.foodName}
                            </h3>
                            {checked && (
                              <FaCheck className="text-emerald-600 mt-2" />
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Thẻ "Không chọn" */}
                    <motion.div
                      key={`none-${day}`}
                      whileTap={{ scale: 0.98 }}
                      className={`relative w-56 h-64 rounded-3xl bg-gray-100 cursor-pointer flex flex-col items-center justify-center shadow ${
                        selected[day] === null ? "ring-2 ring-rose-400" : ""
                      } ${isMenuLocked ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => choose(day, null)}
                    >
                      <span className="font-medium text-gray-600">
                        Không chọn
                      </span>
                    </motion.div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Nút lưu: chỉ hiện khi chọn hết + chưa khoá */}
          {hasChosenAll && !isMenuLocked && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white flex items-center gap-2 shadow disabled:opacity-50"
              >
                {loading && <FaSpinner className="animate-spin" />}
                <FaSave /> Lưu
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal thông báo */}
      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        onClose={handleCloseNotice}
      />
    </div>
  );
}
