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

/* ================= Notice Modal ================= */
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

/* ================= Confirm Cancel Modal ================= */
function ConfirmCancelModal({ open, foodName, dayText, onCancel, onConfirm, busy }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/45 z-[210] grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-md w-full border border-white/60"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
          >
            <div className="px-5 py-4 border-b border-slate-200/60">
              <h3 className="font-semibold text-lg text-slate-800">Xác nhận huỷ cơm</h3>
            </div>

            <div className="px-5 py-4 text-slate-700">
              <p>Bạn có chắc chắn muốn huỷ món <b>{foodName}</b> ({dayText}) không?</p>
              <p className="text-sm text-slate-500 mt-1">Thao tác này sẽ bỏ lựa chọn cho ngày này.</p>
            </div>

            <div className="px-5 py-3 border-t border-slate-200/60 flex justify-end gap-3">
              <button
                onClick={onCancel}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 disabled:opacity-60"
              >
                Bỏ qua
              </button>
              <button
                onClick={onConfirm}
                disabled={busy}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow disabled:opacity-60 inline-flex items-center gap-2"
              >
                {busy && <FaSpinner className="animate-spin" />}
                Xác nhận huỷ
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

  // active selections theo ngày: { [day]: weeklyMenuEntryId }
  const [selected, setSelected] = useState({});
  // canceled selections theo ngày: { [day]: { entryId, foodName } }
  const [canceledByDay, setCanceledByDay] = useState({});

  const [pageLoading, setPageLoading] = useState(false);
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });
  const [hasOrdered, setHasOrdered] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const swiperRef = useRef(null);

  // Push states
  const [notifPerm, setNotifPerm] = useState("unknown");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [pushReady, setPushReady] = useState(false);
  const [pushChecking, setPushChecking] = useState(true);
  const [pushError, setPushError] = useState("");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState("");

  // Reorder states
  const [reorderMode, setReorderMode] = useState(false);
  const prevSelectedRef = useRef(null);

  // Cancel confirmation states
  const [cancelConfirm, setCancelConfirm] = useState({
    open: false,
    entryId: null,
    day: null,
    foodName: "",
    busy: false,
  });
  const [cancelingKey, setCancelingKey] = useState(null); // `${day}-${entryId}`

  /* ===== Day utilities (khoá huỷ sau 10:00) ===== */
  function getDateFromMonday(mondayISO, dayOfWeek1to7) {
    if (!mondayISO) return null;
    const base = new Date(mondayISO); // kỳ vọng ISO từ BE
    if (Number.isNaN(base.getTime())) return null;
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (dayOfWeek1to7 - 1));
    return d;
  }

  // Cho phép huỷ nếu bây giờ <= 10:00 của ngày đó
  function canCancelDay(dayOfWeek1to7) {
    if (!weeklyMenu?.weekStartMonday) return false;
    const target = getDateFromMonday(weeklyMenu.weekStartMonday, dayOfWeek1to7);
    if (!target) return false;
    const cutoff = new Date(target);
    cutoff.setHours(10, 0, 0, 0); // 10:00 local time
    const now = new Date();
    return now <= cutoff;
  }

  // ===== Push check =====
  useEffect(() => {
    try {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsStandalone(window.navigator.standalone === true);
      const hasNoti = typeof window !== "undefined" && "Notification" in window;
      setNotifPerm(hasNoti ? Notification.permission : "unsupported");

      const supported =
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        hasNoti;

      if (!supported) {
        setPushReady(false);
        setPushChecking(false);
        return;
      }
      (async () => {
        let hasSub = false;
        if (Notification.permission === "granted") {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            hasSub = !!sub;
          } catch {}
        }
        setPushReady(Notification.permission === "granted" && hasSub);
        setPushChecking(false);
      })();
    } catch {
      setPushReady(false);
      setPushChecking(false);
      setNotifPerm("unsupported");
    }
  }, []);

  async function handleEnablePush() {
    if (pushBusy) return;
    setPushError("");
    setPushStatus("");
    setPushBusy(true);
    try {
      await registerPush();
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

  async function unregisterPush() {
    if (pushBusy) return;
    setPushError("");
    setPushStatus("");
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, { endpoint: sub.endpoint });
        } catch {}
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

  // ===== Data grouping =====
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

  // ===== Load data =====
  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const wmRes = await http.get(`${BASE_URL}/api/lunch-order/user/weekly-menu-latest`);
        const menu = wmRes.data?.data;
        if (!menu) {
          setWeeklyMenu(null);
          return;
        }
        setWeeklyMenu(menu);

        // sRes.data.data = [ [weeklyMenuEntryId, isAction], ... ]
        const sRes = await http.get(
          `${BASE_URL}/api/lunch-order/user/selections/${menu.weeklyMenuId}/${tmp?.login?.currentUser?.userID}`
        );
        const rows = sRes.data?.data || [];

        const active = {};
        const canceled = {};
        const entryMap = {};
        (menu.entries || []).forEach((e) => {
          entryMap[e.weeklyMenuEntryId] = e;
        });

        rows.forEach(([entryId, isAction]) => {
          const entry = entryMap[entryId];
          if (!entry) return;
          const day = entry.dayOfWeek;
          if (isAction) active[day] = entryId;
          else canceled[day] = { entryId, foodName: entry.foodName };
        });

        setSelected(active);
        setCanceledByDay(canceled);
        setHasOrdered(Object.keys(active).length > 0);
      } finally {
        setPageLoading(false);
      }
    }
    if (tmp?.login?.currentUser?.userID) load();
  }, [tmp?.login?.currentUser?.userID]);

  function choose(day, entryId) {
    if (weeklyMenu?.isLocked) return;
    // Nếu chọn lại món cho ngày đã huỷ, bỏ trạng thái huỷ
    setCanceledByDay((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
    setSelected((prev) => ({ ...prev, [day]: entryId }));
    // auto-next nếu chưa ở slide cuối
  const swiper = swiperRef.current;
  if (swiper && typeof swiper.activeIndex === 'number') {
    const isLast = swiper.activeIndex >= swiper.slides.length - 1;
    if (!isLast) {
      setTimeout(() => swiper.slideNext(), 250);
    }
  }
  }

  async function handleSave() {
    if (!weeklyMenu || weeklyMenu?.isLocked) return;
    setPageLoading(true);
    try {
      await http.post(`${BASE_URL}/api/lunch-order/user/selections/save`, {
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        selections: Object.values(selected).filter((x) => x !== undefined),
        createdBy: user.fullName,
      });
      setHasOrdered(true);
      setNotice({ open: true, title: "Thành công", message: "Đặt cơm thành công!" });
      setReorderMode(false);
      prevSelectedRef.current = null;
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không thể lưu đặt cơm." });
    } finally {
      setPageLoading(false);
    }
  }

  // ===== Cancel one (with confirm modal) =====
  function askCancel(entryId, day, foodName) {
    // chặn ngay tại UI nếu quá giờ
    if (!canCancelDay(Number(day))) {
      setNotice({
        open: true,
        title: "Không thể huỷ",
        message: "Đã quá 10:00 của ngày này nên không thể huỷ nữa.",
      });
      return;
    }
    setCancelConfirm({ open: true, entryId, day, foodName, busy: false });
  }

  async function doCancelOne() {
    const { entryId, day } = cancelConfirm;
    if (!weeklyMenu || weeklyMenu?.isLocked || !entryId) return;

    // kiểm tra lại phía client trước khi call BE
    if (!canCancelDay(Number(day))) {
      setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
      setNotice({
        open: true,
        title: "Không thể huỷ",
        message: "Đã quá 10:00 của ngày này nên không thể huỷ nữa.",
      });
      return;
    }

    const key = `${day}-${entryId}`;
    setCancelConfirm((s) => ({ ...s, busy: true }));
    setCancelingKey(key);

    try {
      await http.post(`${BASE_URL}/api/lunch-order/user/selections/item-action`, {
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        weeklyMenuEntryId: entryId,
        isAction: 0,
        updatedBy: String(user.fullName || user.userID || ""),
      });

      // Cập nhật UI: bỏ active, thêm canceledByDay
      const entry = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === entryId);
      setSelected((prev) => {
        const next = { ...prev };
        delete next[day];
        const stillChosen = Object.values(next).filter((v) => v != null).length;
        if (stillChosen <= 0) setHasOrdered(false);
        return next;
      });
      setCanceledByDay((prev) => ({
        ...prev,
        [day]: { entryId, foodName: entry?.foodName || "Đã huỷ cơm" },
      }));

      setNotice({ open: true, title: "Đã huỷ", message: "Đã huỷ món cho ngày này." });
    } catch (e) {
      setNotice({ open: true, title: "Lỗi", message: "Huỷ món không thành công." });
      setCancelConfirm((s) => ({ ...s, busy: false }));
    } finally {
      setCancelingKey(null);
      setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
    }
  }

  if (pageLoading)
    return (
      <div className="p-6 text-emerald-600">
        <FaSpinner className="animate-spin inline-block mr-2" />
        Đang tải...
      </div>
    );

  // --- Empty state khi chưa có menu ---
  if (!weeklyMenu) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 pt-[10px]">
        {!pushChecking && !pushReady && (
          <div className="mx-[10px] mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">Bật thông báo đặt cơm</div>
                <div className="text-sm opacity-90">Nhận nhắc lịch chọn món/khóa menu ngay cả khi bạn không mở trang.</div>
                {notifPerm === "denied" && (
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
                  {isIOS && !isStandalone ? "Cài lên màn hình chính" : pushBusy ? "Đang bật…" : "Bật thông báo"}
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="mx-[10px]">
          <div className="toy-card relative rounded-3xl border border-white/60 shadow-xl p-8 md:p-10 grid md:grid-cols-[1fr,360px] gap-8 items-center overflow-hidden">
            <span className="shine" />
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-800">
                Chưa có <span className="text-emerald-700">thực đơn tuần này</span>
              </h2>
              <p className="text-slate-600 mt-2">
                Hiện chưa có menu được mở. Bạn có thể bật thông báo để được nhắc ngay khi có, hoặc làm mới trang sau ít phút.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow"
                >
                  Làm mới
                </button>

                {!pushReady && (
                  <button
                    onClick={handleEnablePush}
                    disabled={pushBusy || (isIOS && !isStandalone)}
                    className={`px-5 py-2.5 rounded-xl text-white shadow ${
                      pushBusy ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      {pushBusy && <FaSpinner className="animate-spin" />}
                      Nhắc tôi khi có menu
                    </span>
                  </button>
                )}
              </div>

              {pushReady && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đã bật thông báo
                </div>
              )}
            </div>

            <div className="relative h-48 md:h-60">
              <svg viewBox="0 0 220 220" className="w-full h-full">
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                <circle cx="110" cy="110" r="100" fill="url(#g1)" />
                <g>
                  <rect x="45" y="80" rx="14" ry="14" width="130" height="70" fill="white" opacity="0.95" />
                  <rect x="55" y="90" rx="10" ry="10" width="50" height="50" fill="#e2e8f0" />
                  <rect x="115" y="95" width="50" height="8" rx="4" fill="#94a3b8" />
                  <rect x="115" y="112" width="40" height="8" rx="4" fill="#cbd5e1" />
                  <rect x="115" y="129" width="30" height="8" rx="4" fill="#cbd5e1" />
                  <circle cx="80" cy="115" r="12" fill="#fbbf24" />
                  <path d="M72 130 h16 a8 8 0 0 1 8 8 v2 h-32 v-2 a8 8 0 0 1 8-8z" fill="#fde68a" />
                </g>
                <g opacity="0.6">
                  <circle cx="40" cy="50" r="4" fill="#a7f3d0" />
                  <circle cx="190" cy="60" r="3" fill="#86efac" />
                  <circle cx="30" cy="170" r="3" fill="#bbf7d0" />
                </g>
              </svg>
            </div>
          </div>
        </div>

        <style>{`
          .toy-card {
            background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 100%);
            box-shadow: 0 12px 28px rgba(2,6,23,.08), inset 0 1px 0 rgba(255,255,255,.6);
            border: 1px solid rgba(255,255,255,.6);
            backdrop-filter: blur(6px);
          }
          .shine {
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
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 pt-[10px]">
      {/* Banner bật thông báo */}
      {!pushChecking && !pushReady && (
        <div className="mx-[10px] mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold">Bật thông báo đặt cơm</div>
              <div className="text-sm opacity-90">Nhận nhắc lịch chọn món/khóa menu ngay cả khi bạn không mở trang.</div>
              {notifPerm === "denied" && (
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
                {isIOS && !isStandalone ? "Cài lên màn hình chính" : pushBusy ? "Đang bật…" : "Bật thông báo"}
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

      {/* CSS share */}
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
              const activeEntryId = selected[day];
              const activeEntry = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === activeEntryId);
              const canceled = canceledByDay[day]; // { entryId, foodName } | undefined
              const isCanceling = activeEntry ? cancelingKey === `${day}-${activeEntryId}` : false;

              // Quy tắc khoá huỷ
              const cancelAllowed = activeEntry && canCancelDay(Number(day));
              const cancelTitle = cancelAllowed
                ? "Huỷ cơm ngày này"
                : "Đã quá 10:00 của ngày này nên không thể huỷ";

              return (
                <li key={day} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="w-24 font-medium">{dayNameVN(day)}</span>

                  <div className="flex-1 min-w-0">
                    {activeEntry ? (
                      <span className="text-slate-700">{activeEntry.foodName}</span>
                    ) : canceled ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 line-through">{canceled.foodName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
                          Đã huỷ cơm
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Không chọn</span>
                    )}
                  </div>

                  {/* Nút Huỷ cơm: chỉ hiện khi đang có món active & chưa khoá */}
                  {activeEntry && !weeklyMenu?.isLocked && (
                    <button
                      onClick={() => (cancelAllowed ? askCancel(activeEntry.weeklyMenuEntryId, day, activeEntry.foodName) : null)}
                      disabled={isCanceling || !cancelAllowed}
                      className={`px-3 py-1.5 rounded-lg text-white text-sm shadow inline-flex items-center gap-2 ${
                        isCanceling || !cancelAllowed
                          ? "bg-slate-300 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                      title={cancelTitle}
                    >
                      {isCanceling && <FaSpinner className="animate-spin" />}
                      Huỷ cơm
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          {!weeklyMenu?.isLocked && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  prevSelectedRef.current = {
                    selectedSnapshot: selected,
                    canceledSnapshot: canceledByDay,
                    hasOrderedSnapshot: hasOrdered,
                  };
                  setHasOrdered(false);
                  setSelected({});
                  setCanceledByDay({});
                  setReorderMode(true);
                }}
                className="px-6 py-3 rounded-xl bg-amber-500 text-white flex items-center gap-2 shadow hover:bg-amber-600"
              >
                <FaRedo /> Đặt lại
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full p-6 mx-[10px] lg:w-[calc(100vw-350px)]">
          {/* Thanh hành động khi đang “Đặt lại” */}
          {reorderMode && (
            <div className="mx-[10px] mb-3 sticky top-[10px] z-[110]">
              <div className="flex items-center justify-between rounded-2xl px-4 py-2 bg-white/80 backdrop-blur border border-white/60 shadow">
                <div className="text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <b>Đang đặt lại</b>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const snap = prevSelectedRef.current;
                      if (snap) {
                        setSelected(snap.selectedSnapshot || {});
                        setCanceledByDay(snap.canceledSnapshot || {});
                        setHasOrdered(snap.hasOrderedSnapshot ?? true);
                      } else {
                        setHasOrdered(true);
                      }
                      setReorderMode(false);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                  >
                    Thoát
                  </button>
                </div>
              </div>
            </div>
          )}

          <Swiper
            onSwiper={(s) => (swiperRef.current = s)}
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
  aria-pressed={selected[day] === null}
  title={selected[day] === null ? "Đã chọn: Không ăn ngày này" : "Chọn: Không ăn ngày này"}
  className={`toy-card relative w-[240px] h-[298px] rounded-[28px] grid place-items-center cursor-pointer
    ${selected[day] === null ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
    ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}`}
>
  {/* Chip trạng thái (góc phải trên) */}
  {selected[day] === null && (
    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-700 border border-rose-200 shadow">
      <FaCheck className="text-[10px]" />
      Đã chọn
    </span>
  )}

  {/* Nội dung thẻ */}
  <div className="text-center">
    <GiForkKnifeSpoon className={`text-3xl mx-auto mb-2 ${selected[day] === null ? "text-rose-500" : "text-slate-400"}`} />
    <span className={`font-medium ${
      selected[day] === null ? "text-rose-700" : "text-slate-600"
    }`}>
      Không chọn
    </span>

    {/* Gợi ý phụ (nhỏ, chỉ hiện khi đã chọn) */}
    {selected[day] === null && (
      <div className="mt-1 text-[11px] text-rose-500/90">
        Sẽ không đặt cơm ngày này
      </div>
    )}
  </div>

  {/* Icon check góc phải dưới (nhỏ xinh) */}
  {selected[day] === null && (
    <FaCheck className="absolute right-2 bottom-2 text-rose-500 opacity-80" />
  )}

  <span className="shine" />
</motion.button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Save button */}
          {activeSlide === totalSlides - 1 && hasChosenAll && !weeklyMenu?.isLocked && (
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={pageLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2 shadow disabled:opacity-50"
              >
                {pageLoading && <FaSpinner className="animate-spin" />}
                <FaSave /> Lưu đặt cơm
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <NoticeModal
        open={notice.open}
        title={notice.title}
        message={notice.message}
        onClose={() => setNotice({ ...notice, open: false })}
      />
      <ConfirmCancelModal
        open={cancelConfirm.open}
        foodName={cancelConfirm.foodName}
        dayText={cancelConfirm.day ? dayNameVN(cancelConfirm.day) : ""}
        busy={cancelConfirm.busy}
        onCancel={() =>
          !cancelConfirm.busy &&
          setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false })
        }
        onConfirm={doCancelOne}
      />
    </div>
  );
}
