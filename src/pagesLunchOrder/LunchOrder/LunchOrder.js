// src/pages/Lunch/UserOrderSlide.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaSpinner, FaSave, FaTimes, FaRedo } from "react-icons/fa";
import { MdOutlineRestaurant, MdOutlineSoupKitchen } from "react-icons/md";
import { GiForkKnifeSpoon, GiChopsticks } from "react-icons/gi";

import { registerPush } from "~/push/registerPush";

/* ================= Helpers ================= */
function dayNameVN(day) {
  const map = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
  return map[day];
}

function getFoodIcon(name = "") {
  const n = name.toLowerCase();
  if (/(soup|canh)/.test(n)) return <MdOutlineSoupKitchen className="text-2xl" />;
  if (/(cơm|rice|bento)/.test(n)) return <MdOutlineRestaurant className="text-2xl" />;
  if (/(bún|phở|mì|noodle)/.test(n)) return <GiChopsticks className="text-2xl" />;
  return <GiForkKnifeSpoon className="text-2xl" />;
}

/* ================= Modal ================= */
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
            className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl max-w-md w-full border border-white/40"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60">
              <h3 className="font-semibold text-lg text-slate-800">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                <FaTimes />
              </button>
            </div>
            <div className="px-5 py-4 text-slate-700">{message}</div>
            <div className="px-5 py-3 border-t border-slate-200/60 flex justify-end">
              <button onClick={onClose} className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow">
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= Main ================= */
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

  // thêm state
const [notifPerm, setNotifPerm] = useState('unknown'); // 'granted' | 'denied' | 'default' | 'unsupported'
const [isIOS, setIsIOS] = useState(false);
const [isStandalone, setIsStandalone] = useState(false);

  // Push states
  const [pushReady, setPushReady] = useState(false);
  const [pushChecking, setPushChecking] = useState(true);
  const [pushError, setPushError] = useState("");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState(""); // "Đã bật thông báo"/"Đã tắt thông báo"/...

  // Kiểm tra permission + subscription để xác định "đã bật"
  useEffect(() => {
  try {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    // iOS PWA mở từ Home Screen sẽ có navigator.standalone = true (Safari)
    setIsStandalone(window.navigator.standalone === true);

    const hasNoti = typeof window !== 'undefined' && 'Notification' in window;
    setNotifPerm(hasNoti ? Notification.permission : 'unsupported');

    const supported =
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      hasNoti;

    if (!supported) {
      setPushReady(false);
      setPushChecking(false);
      return;
    }

    (async () => {
      let hasSub = false;
      if (Notification.permission === 'granted') {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          hasSub = !!sub;
        } catch {}
      }
      setPushReady(Notification.permission === 'granted' && hasSub);
      setPushChecking(false);
    })();
  } catch {
    setPushReady(false);
    setPushChecking(false);
    setNotifPerm('unsupported');
  }
}, []);

  // Bật thông báo
  async function handleEnablePush() {
    if (pushBusy) return;
    setPushError("");
    setPushStatus("");
    setPushBusy(true);
    try {
      await registerPush();
      // xác nhận có subscription thật
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushReady(!!sub);
      setPushStatus("Đã bật thông báo");
    } catch (e) {
      setPushError(e?.message || "Không thể bật thông báo");
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushStatus(""), 2500);
    }
  }

  // Tắt thông báo
  async function unregisterPush() {
    if (pushBusy) return;
    setPushError("");
    setPushStatus("");
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Gọi BE xoá endpoint khỏi DB (dùng axios http để tự kèm Bearer)
        try {
          await http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, { endpoint: sub.endpoint });
        } catch (e) {
          // vẫn tiếp tục huỷ ở client
          // console.warn('Unsubscribe server cleanup failed:', e?.message);
        }
        await sub.unsubscribe();
      }

      setPushReady(false);
      setPushStatus("Đã tắt thông báo");
    } catch (e) {
      setPushError(e?.message || "Không thể tắt thông báo");
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushStatus(""), 2500);
    }
  }

  // Gom dữ liệu menu theo ngày
  const grouped = useMemo(() => {
    const entries = weeklyMenu?.entries ?? [];
    return entries.reduce((acc, e) => {
      (acc[e.dayOfWeek] ||= []).push(e);
      return acc;
    }, {});
  }, [weeklyMenu]);

  const totalSlides = useMemo(() => Object.keys(grouped).length, [grouped]);

  const hasChosenAll = useMemo(
    () => Object.keys(grouped).every((d) => Object.prototype.hasOwnProperty.call(selected, d)),
    [grouped, selected]
  );

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const wmRes = await http.get(`${BASE_URL}/api/lunch-order/user/weekly-menu-latest`);
        const menu = wmRes.data?.data;
        if (!menu) {
          setWeeklyMenu(null);
          return;
        }
        setWeeklyMenu(menu);

        const sRes = await http.get(
          `${BASE_URL}/api/lunch-order/user/selections/${menu.weeklyMenuId}/${tmp?.login?.currentUser?.userID}`
        );
        if (sRes.data?.data?.length > 0) {
          setHasOrdered(true);
          const sel = {};
          sRes.data.data.forEach((eid) => {
            const entry = menu.entries.find((x) => x.weeklyMenuEntryId === eid);
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
  }, [tmp?.login?.currentUser?.userID]);

  function choose(day, entryId) {
    if (weeklyMenu?.isLocked) return;
    setSelected((prev) => ({ ...prev, [day]: entryId }));
    // auto next
    if (swiperRef.current) {
      const swiper = swiperRef.current.swiper;
      if (swiper && swiper.activeIndex < swiper.slides.length - 1) {
        setTimeout(() => swiper.slideNext(), 250);
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
      setNotice({ open: true, title: "Thành công", message: "Đặt cơm thành công!" });
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không thể lưu đặt cơm." });
    } finally {
      setLoading(false);
    }
  }

  function handleReorder() {
    if (weeklyMenu?.isLocked) return;
    setHasOrdered(false);
    setSelected({});
  }

  if (loading)
    return (
      <div className="p-6 text-emerald-600">
        <FaSpinner className="animate-spin inline-block mr-2" />
        Đang tải...
      </div>
    );
  if (!weeklyMenu) return <div className="p-6">Chưa có menu tuần này</div>;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 pt-[10px]">
      {/* Banner bật thông báo */}
{!pushChecking && !pushReady && (
  <div className="mx-[10px] mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-semibold">Bật thông báo đặt cơm</div>
        <div className="text-sm opacity-90">
          Nhận nhắc lịch chọn món/khóa menu ngay cả khi bạn không mở trang.
        </div>

        {/* iOS guidance */}
        {/* {isIOS && !isStandalone && (
          <div className="text-[13px] text-slate-700 mt-2">
            iPhone/iPad: để bật thông báo, hãy mở trang qua HTTPS và cài lên màn hình chính:
            <ol className="list-decimal ml-5 mt-1">
              <li>Vào liên kết HTTPS của app (vd: ngrok).</li>
              <li>Chạm nút <b>Share</b> → <b>Add to Home Screen</b>.</li>
              <li>Mở app từ icon Home Screen rồi bấm “Bật thông báo”.</li>
            </ol>
          </div>
        )} */}

        {notifPerm === 'denied' && (
          <div className="text-red-600 text-sm mt-1">
            Bạn đang chặn thông báo. Hãy bật lại trong cài đặt trình duyệt, rồi bấm “Bật thông báo”.
          </div>
        )}
        {pushError && <div className="text-red-600 text-sm mt-1">{pushError}</div>}
        {pushStatus && <div className="text-emerald-700 text-sm mt-1">{pushStatus}</div>}
      </div>

      <button
        onClick={handleEnablePush}
        disabled={pushBusy || (isIOS && !isStandalone)}
        className={`px-4 py-2 rounded-xl text-white shadow ${
          pushBusy ? "bg-amber-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"
        }`}
        aria-busy={pushBusy}
      >
        <span className="inline-flex items-center gap-2">
          {pushBusy && <FaSpinner className="animate-spin" />}
          {isIOS && !isStandalone ? "Cài lên màn hình chính" : (pushBusy ? "Đang bật…" : "Bật thông báo")}
        </span>
      </button>
    </div>
  </div>
)}


      {/* Chip đã bật + nút tắt */}
      {!pushChecking && pushReady && (
        <div className="mx-[10px] mb-3 flex items-center gap-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {pushStatus || "Đã bật thông báo"}
          </span>
          <button
            onClick={unregisterPush}
            disabled={pushBusy}
            className={`px-3 py-1.5 rounded-lg text-slate-800 text-sm ${
              pushBusy ? "bg-slate-200 cursor-not-allowed" : "bg-slate-200 hover:bg-slate-300"
            }`}
            aria-busy={pushBusy}
          >
            <span className="inline-flex items-center gap-2">
              {pushBusy && <FaSpinner className="animate-spin" />}
              {pushBusy ? "Đang tắt…" : "Tắt thông báo"}
            </span>
          </button>
        </div>
      )}

      {/* CSS shine + blister */}
      <style>{`
        .toy-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 100%);
          box-shadow: 0 12px 28px rgba(2,6,23,.08), inset 0 1px 0 rgba(255,255,255,.6);
          border: 1px solid rgba(255,255,255,.6);
          backdrop-filter: blur(6px);
        }
        .card { position: relative; overflow: hidden; }
        .card .shine, .toy-card .shine {
          position: absolute; top: -60%; left: -60%;
          height: 220%; width: 110px;
          transform: rotate(25deg) translateX(-200%);
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%);
          pointer-events: none; animation: shine 6s linear infinite;
        }
        @keyframes shine {
          0% { transform: rotate(25deg) translateX(-200%); opacity: 0; }
          4% { opacity: 1; }
          16.6% { transform: rotate(25deg) translateX(250%); opacity: 1; }
          16.7% { opacity: 0; }
          100% { transform: rotate(25deg) translateX(-200%); opacity: 0; }
        }
      `}</style>

      {hasOrdered ? (
        <div className="bg-white/70 backdrop-blur rounded-2xl border border-white/40 shadow-xl p-6 mx-[10px]">
          <h3 className="font-semibold text-lg mb-4 text-slate-800">Bạn đã đặt cơm tuần này</h3>
          <ul className="space-y-3">
            {Object.keys(grouped).map((day) => {
              const entryId = selected[day];
              const entry = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === entryId);
              return (
                <li key={day} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-24 font-medium">{dayNameVN(day)}</span>
                  {entry ? <span className="text-slate-700">{entry.foodName}</span> : <span className="text-slate-400 italic">Không chọn</span>}
                </li>
              );
            })}
          </ul>
          {!weeklyMenu?.isLocked && (
            <div className="mt-6 flex justify-end">
              <button onClick={handleReorder} className="px-6 py-3 rounded-xl bg-amber-500 text-white flex items-center gap-2 shadow hover:bg-amber-600">
                <FaRedo /> Đặt lại
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full p-6 mx-[10px] lg:w-[calc(100vw-350px)]">
          <Swiper ref={swiperRef} spaceBetween={30} slidesPerView={1} className="rounded-2xl" onSlideChange={(s) => setActiveSlide(s.activeIndex)}>
            {Object.keys(grouped).map((day) => {
              const items = grouped[day];
              return (
                <SwiperSlide key={day}>
                  <div className="pb-5">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">{dayNameVN(day)}</h3>

                    <div className="flex justify-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 justify-items-center">
                        {items.map((item) => {
                          const checked = selected[day] === item.weeklyMenuEntryId;
                          return (
                            <motion.button
                              key={item.weeklyMenuEntryId}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => choose(day, item.weeklyMenuEntryId)}
                              className={`toy-card relative w-[240px] h-[298px] rounded-[28px] text-left cursor-pointer transition 
                                ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
                                ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              <div className="px-5 pt-4 pb-2">
                                <div className="flex items-center gap-3">
                                  <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 shadow-inner text-slate-700">
                                    {getFoodIcon(item.foodName)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] uppercase tracking-widest text-slate-500">Món ăn</div>
                                    <div className="font-semibold text-slate-800 leading-tight line-clamp-2">{item.foodName}</div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex mx-4 mt-2 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-inner h-40 overflow-hidden place-items-center">
                                {item.imageUrl ? (
                                  <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-slate-400 text-sm">Chưa có hình</div>
                                )}
                              </div>

                              <div className="px-5 pt-3">
                                <div className="flex items-center justify-between">
                                  <div
                                    className={`px-3 py-1 rounded-full text-[11px] font-medium
                                      ${checked ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-slate-100 text-slate-500"}`}
                                  >
                                    {checked ? "Đã chọn" : "Chọn món"}
                                  </div>
                                  {checked && <FaCheck className="text-emerald-600" />}
                                </div>
                              </div>

                              <span className="shine" />
                            </motion.button>
                          );
                        })}

                        {/* None card */}
                        <motion.button
                          key={`none-${day}`}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => choose(day, null)}
                          className={`toy-card relative w-[240px] h-[298px] rounded-[28px] grid place-items-center cursor-pointer
                            ${selected[day] === null ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
                            ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          <div className="text-center">
                            <GiForkKnifeSpoon className="text-3xl text-slate-400 mx-auto mb-2" />
                            <span className="font-medium text-slate-600">Không chọn</span>
                          </div>
                          <span className="shine" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Save button (only at last slide + chosen all) */}
          {activeSlide === totalSlides - 1 && hasChosenAll && !weeklyMenu?.isLocked && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2 shadow disabled:opacity-50"
              >
                {loading && <FaSpinner className="animate-spin" />}
                <FaSave /> Lưu đặt cơm
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notice */}
      <NoticeModal open={notice.open} title={notice.title} message={notice.message} onClose={() => setNotice({ ...notice, open: false })} />
    </div>
  );
}
