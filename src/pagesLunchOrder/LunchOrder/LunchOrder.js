

// src/pages/Lunch/UserOrderSlide.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import http from "~/api/http";
import { BASE_URL } from "~/config";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion } from "framer-motion";
import { FaCheck, FaSpinner, FaSave, FaRedo } from "react-icons/fa";
import { MdOutlineRestaurant, MdOutlineSoupKitchen } from "react-icons/md";
import { GiForkKnifeSpoon, GiChopsticks } from "react-icons/gi";
import { registerPush } from "~/push/registerPush";

import QuantityStepper from "~/components/lunch/QuantityStepper";
import NoticeModal from "~/components/lunch/NoticeModal";
import ConfirmCancelModal from "~/components/lunch/ConfirmCancelModal";
import QtyChip from "~/components/lunch/QtyChip";
import TopControlBar from "./components/TopControlBar";
import OvertimeWeekInputs from "./components/OvertimeWeekInputs";

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


/* ================= Subcomponent: Đặt theo ngày ================= */
function DaySecretaryPanelInline({ user }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);   // danh sách món có sẵn của ngày
  const [picked, setPicked] = useState({});     // { entryId: quantity }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [cutoffPassed, setCutoffPassed] = useState(false);

  // kiểm tra cutoff 09:00 khi đổi ngày
  useEffect(() => {
    const now = new Date();
    const cutoff = new Date(date + "T09:00:00");
    setCutoffPassed(now > cutoff);
  }, [date]);

  // load entries theo ngày
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const rs = await http.get(`${BASE_URL}/api/lunch-order/day/entries`, { params: { date } });
        if (!mounted) return;
        setEntries(rs.data?.data?.entries || []);
        setPicked({});
      } catch {
        if (mounted) {
          setEntries([]);
          setPicked({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [date]);

  const togglePick = (eid) => {
    if (cutoffPassed) return;
    setPicked((prev) => {
      const n = { ...prev };
      if (n[eid]) delete n[eid];
      else n[eid] = 1;
      return n;
    });
  };

  const setQty = (eid, q) => {
    if (cutoffPassed) return;
    setPicked((prev) => {
      const v = Math.max(0, parseInt(typeof q === "function" ? q(prev[eid] || 1) : q, 10) || 1);
      return { ...prev, [eid]: v };
    });
  };

  const canSubmit = () => {
    return !cutoffPassed && !busy && Object.keys(picked).length > 0 && user?.userID;
  };

  const save = async () => {
    if (!canSubmit()) return;
    setBusy(true);
    setMsg("");
    try {
      const payload = {
        date,
        userId: user.userID,
        createdBy: user.fullName,
        selections: Object.entries(picked).map(([eid, qty]) => ({
          weeklyMenuEntryId: Number(eid),
          quantity: qty
        })),
      };
      await http.post(`${BASE_URL}/api/lunch-order/day/secretary/save`, payload);
      setMsg("Đặt theo ngày thành công!");
      setPicked({});
    } catch (e) {
      setMsg(e?.response?.data?.message || "Không thể lưu. Thử lại sau.");
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(""), 2500);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow p-4 mx-[10px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">Đặt theo ngày</h3>
        {loading && (
          <span className="text-xs text-emerald-600 inline-flex items-center gap-2">
            <FaSpinner className="animate-spin" /> Đang tải…
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* NGÀY + trạng thái cutoff */}
        <div>
          <label className="text-sm text-slate-600">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-400 outline-none"
          />
          <p className={`text-xs mt-2 ${cutoffPassed ? "text-rose-600" : "text-slate-500"}`}>
            {cutoffPassed ? "ĐÃ QUÁ 11:00 – không thể đặt/chỉnh ngày này." : "Đặt/đổi được đến 11:00 của ngày chọn."}
          </p>
        </div>

        {/* Danh sách món của ngày */}
        <div className="md:col-span-2">
          {entries.length === 0 ? (
            <div className="text-sm text-slate-500">Không có món sẵn có cho ngày này.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {entries.map((it) => {
                const checked = picked[it.weeklyMenuEntryId] > 0;
                const qty = picked[it.weeklyMenuEntryId] || 1;
                return (
                  <div
                    key={it.weeklyMenuEntryId}
                    className={`p-3 rounded-xl border transition
                      ${checked ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}
                      ${cutoffPassed ? "opacity-50" : "hover:bg-slate-50 cursor-pointer"}`}
                    onClick={() => togglePick(it.weeklyMenuEntryId)}
                  >
                    <div className="font-medium text-slate-800">{it.foodName}</div>
                    {checked ? (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Số lượng</span>
                        <QuantityStepper
                          value={qty}
                          min={1}
                          disabled={cutoffPassed}
                          onChange={(v) => setQty(it.weeklyMenuEntryId, v)}
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 mt-1">Nhấn để chọn</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* submit */}
      <div className="mt-4 flex justify-end gap-3">
        {msg && <div className="text-sm text-emerald-700 self-center">{msg}</div>}
        <button
          disabled={!canSubmit()}
          onClick={save}
          className="px-5 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy && <FaSpinner className="animate-spin" />}
          <FaSave /> Lưu đặt ngày này
        </button>
      </div>
    </div>
  );
}

/* ================= Main ================= */
export default function UserOrderSlide() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  const [tab, setTab] = useState("week"); // "week" | "day"

  const [weeklyMenu, setWeeklyMenu] = useState(null);

  // User thường: 1 món/ngày
  const [selected, setSelected] = useState({});
  // Thư ký: nhiều món/ngày + số lượng
  const [selectedSec, setSelectedSec] = useState({}); // { [day]: { [entryId]: true } }
  const [qtySec, setQtySec] = useState({});           // { [day]: { [entryId]: number } }

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

  // Cancel confirmation (user thường)
  const [cancelConfirm, setCancelConfirm] = useState({
    open: false, entryId: null, day: null, foodName: "", busy: false,
  });

  // nếu chưa có:
const [isOvertime, setOvertime] = useState(false);

  // Toggle “chế độ thư ký”
  const [secEnabled, setSecEnabled] = useState(false);
  const isSec = secEnabled;
  useEffect(() => {
    localStorage.setItem("lunch.secMode", secEnabled ? "1" : "0");
  }, [secEnabled]);

  // ==== Inline edit (thư ký) – cho phần “Bạn đã đặt…” ====
  const [editing, setEditing] = useState(null);
  // { day: "1|2|...", entryId: number, value: number, max: number }

  // ===== Cutoff helpers (ĐẶT BÊN TRONG component để đọc được weeklyMenu) =====
  const getDateFromMonday = useCallback((mondayISO, dayOfWeek1to7) => {
    if (!mondayISO) return null;
    const base = new Date(mondayISO);
    if (Number.isNaN(base.getTime())) return null;
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (dayOfWeek1to7 - 1));
    return d;
  }, []);

  /** Chỉ cho phép chỉnh số lượng/huỷ (của thư ký) nếu now <= 09:00 của ngày đó */
  const canModifyDay = useCallback((dayOfWeek1to7) => {
    const mondayISO = weeklyMenu?.weekStartMonday;
    if (!mondayISO) return false;
    const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
    if (!target) return false;
    const cutoff = new Date(target);
    cutoff.setHours(9, 0, 0, 0); // 09:00
    return new Date() <= cutoff;
  }, [weeklyMenu, getDateFromMonday]);

  /** Huỷ cơm (user thường) theo cutoff 10:00 – giữ logic cũ */
  const canCancelDay = useCallback((dayOfWeek1to7) => {
    const mondayISO = weeklyMenu?.weekStartMonday;
    if (!mondayISO) return false;
    const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
    if (!target) return false;
    const cutoff = new Date(target);
    cutoff.setHours(10, 0, 0, 0); // 10:00
    return new Date() <= cutoff;
  }, [weeklyMenu, getDateFromMonday]);

  
// ✅ Cho phép chỉnh số lượng/đặt tới 09:00 (tab "week") hoặc 11:00 (tab "day")
const canModifyDayByMode = useCallback((dayOfWeek1to7) => {
  const mondayISO = weeklyMenu?.weekStartMonday;
  if (!mondayISO) return false;
  const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
  if (!target) return false;

  const cutoff = new Date(target);
  // week: 09:00 | day: 11:00
  cutoff.setHours(tab === "day" ? 11 : 9, 0, 0, 0);
  return new Date() <= cutoff;
}, [weeklyMenu, getDateFromMonday, tab]);


  function openEditQty(day, entryId, currentQty) {
    setEditing({ day: String(day), entryId, value: currentQty, max: currentQty });
  }
  function cancelEdit() { setEditing(null); }
  function changeEditValue(v) {
    const n = Number.isFinite(v) ? v : 0;
    setEditing((s) => (s ? { ...s, value: Math.min(Math.max(0, n), s.max) } : s));
  }

  async function saveEdit() {
    if (!editing) return;
    const { day, entryId, value } = editing;

    if (!canModifyDayByMode(Number(day))) {
      setNotice({
        open: true,
        title: "Không thể cập nhật",
        message: "Đã quá 09:00 của ngày này nên không thể chỉnh số lượng.",
      });
      setEditing(null);
      return;
    }

    // cập nhật local
    setQtySec((prev) => ({
      ...prev,
      [day]: { ...(prev[day] || {}), [entryId]: value },
    }));

    // Nếu về 0 -> bỏ khỏi selectedSec
    if (value === 0) {
      setSelectedSec((prev) => {
        const next = { ...(prev || {}) };
        const atDay = { ...(next[day] || {}) };
        delete atDay[entryId];
        if (Object.keys(atDay).length) next[day] = atDay;
        else delete next[day];
        return next;
      });
    }

    try {
      await http.post(`${BASE_URL}/api/lunch-order/secretary/update-quantity`, {
        userId: user?.userID,
        weeklyMenuId: weeklyMenu?.weeklyMenuId,
        dayOfWeek: Number(day),
        weeklyMenuEntryId: entryId,
        quantity: value,
        updatedBy: user?.fullName || user?.userID,
      });
      setNotice({ open: true, title: "Đã lưu", message: "Cập nhật số lượng thành công." });
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không thể cập nhật số lượng." });
    } finally {
      setEditing(null);
    }
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
          } catch { }
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
        } catch { }
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

  // ===== Grouping & flags =====
  const grouped = useMemo(() => {
    const entries = weeklyMenu?.entries ?? [];
    return entries.reduce((acc, e) => {
      (acc[e.dayOfWeek] ||= []).push(e);
      return acc;
    }, {});
  }, [weeklyMenu]);

  const hasChosenAll = useMemo(() => {
    const days = Object.keys(grouped);
    if (!days.length) return false;
    if (isSec) return days.every((d) => Object.keys(selectedSec[d] || {}).length > 0);
    return days.every((d) => Object.prototype.hasOwnProperty.call(selected, d));
  }, [grouped, selected, selectedSec, isSec]);

  // ===== Load data =====
  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const wmRes = await http.get(`${BASE_URL}/api/lunch-order/user/weekly-menu-latest`);
        const menu = wmRes.data?.data;

        console.log(menu);
        if (!menu) {
          setWeeklyMenu(null);
          return;
        }
        setWeeklyMenu(menu);

        // rows = [ [weeklyMenuEntryId, isAction, quantity] ]
        const sRes = await http.get(
          `${BASE_URL}/api/lunch-order/user/selections/${menu.weeklyMenuId}/${tmp?.login?.currentUser?.userID}`
        );
        const rows = sRes.data?.data || [];

        const active = {};
        const canceled = {};
        const sec = {};
        const qsec = {};
        const entryMap = {};
        (menu.entries || []).forEach((e) => (entryMap[e.weeklyMenuEntryId] = e));

        rows.forEach(([entryId, isAction, q]) => {
          const entry = entryMap[entryId];
          if (!entry) return;
          const day = entry.dayOfWeek;

          if (isAction) {
            if (!active[day]) active[day] = entryId; // user thường
            (sec[day] ||= {})[entryId] = true;       // thư ký
            (qsec[day] ||= {})[entryId] = Number.isFinite(+q) && +q > 0 ? +q : 1;
          } else {
            canceled[day] = { entryId, foodName: entry.foodName };
          }
        });

        setSelected(active);
        setSelectedSec(sec);
        setQtySec(qsec);
        setCanceledByDay(canceled);

        const anyPicked =
          Object.keys(sec).some((d) => Object.keys(sec[d] || {}).length > 0) ||
          Object.keys(active).length > 0;
        setHasOrdered(anyPicked);
      } finally {
        setPageLoading(false);
      }
    }
    if (tmp?.login?.currentUser?.userID) load();
  }, [tmp?.login?.currentUser?.userID]);

  // Chọn món
  function choose(day, entryId) {
    if (weeklyMenu?.isLocked) return;

    if (isSec) {
      // Toggle nhiều món trong 1 ngày
      setSelectedSec((prev) => {
        const next = { ...(prev || {}) };
        const dayMap = { ...(next[day] || {}) };
        if (dayMap[entryId]) {
          // Bỏ chọn
          delete dayMap[entryId];
          if (!Object.keys(dayMap).length) delete next[day];
          else next[day] = dayMap;
          // Xoá qty tương ứng
          setQtySec((qPrev) => {
            const n = { ...(qPrev || {}) };
            const m = { ...(n[day] || {}) };
            delete m[entryId];
            if (!Object.keys(m).length) delete n[day];
            else n[day] = m;
            return n;
          });
        } else {
          // Thêm chọn
          dayMap[entryId] = true;
          next[day] = dayMap;
          setQtySec((qPrev) => {
            const n = { ...(qPrev || {}) };
            const m = { ...(n[day] || {}) };
            if (!m[entryId] || m[entryId] < 1) m[entryId] = 1;
            n[day] = m;
            return n;
          });
        }
        return next;
      });
      return;
    }

    // User thường: 1 món/ngày
    setCanceledByDay((prev) => {
      const next = { ...prev };
      delete next[day];
      return next;
    });
    setSelected((prev) => ({ ...prev, [day]: entryId }));

    // Auto-next
    const swiper = swiperRef.current;
    if (swiper && typeof swiper.activeIndex === "number") {
      const isLast = swiper.activeIndex >= swiper.slides.length - 1;
      if (!isLast) setTimeout(() => swiper.slideNext(), 250);
    }
  }

  async function handleSave() {
    if (!weeklyMenu || weeklyMenu?.isLocked) return;
    setPageLoading(true);
    try {
      let selections;
      if (isSec) {
        // [{entryId, quantity}]
        selections = [];
        for (const d of Object.keys(selectedSec || {})) {
          const map = selectedSec[d] || {};
          for (const eidStr of Object.keys(map)) {
            const eid = Number(eidStr);
            const q = Math.max(1, parseInt(qtySec?.[d]?.[eid] ?? 1, 10));
            selections.push({ entryId: eid, quantity: q });
          }
        }
      } else {
        selections = Object.entries(selected)
          .filter(([, eid]) => eid !== undefined && eid !== null)
          .map(([, eid]) => Number(eid));
      }

      await http.post(`${BASE_URL}/api/lunch-order/user/selections/save`, {
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        selections,
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

  // ===== Cancel one (user thường) =====
  function askCancel(entryId, day, foodName) {
    if (!canModifyDayByMode(Number(day))) {
      setNotice({
        open: true,
        title: "Không thể huỷ",
        message: "Đã quá 09:00 của ngày này nên không thể huỷ nữa.",
      });
      return;
    }
    setCancelConfirm({ open: true, entryId, day, foodName, busy: false });
  }

  async function doCancelOne() {
    const { entryId, day } = cancelConfirm;
    if (!weeklyMenu || weeklyMenu?.isLocked || !entryId) return;
    if (!canCancelDay(Number(day))) {
      setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
      setNotice({
        open: true,
        title: "Không thể huỷ",
        message: "Đã quá 09:00 của ngày này nên không thể huỷ nữa.",
      });
      return;
    }

    setCancelConfirm((s) => ({ ...s, busy: true }));
    try {
      await http.post(`${BASE_URL}/api/lunch-order/user/selections/item-action`, {
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        weeklyMenuEntryId: entryId,
        isAction: 0,
        updatedBy: String(user.fullName || user.userID || ""),
      });

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
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Huỷ món không thành công." });
      setCancelConfirm((s) => ({ ...s, busy: false }));
    } finally {
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
      {/* Tabs */}
      {/* <div className="mx-[10px] mb-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            className={`px-4 py-2 text-sm ${tab === "week" ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
            onClick={() => setTab("week")}
          >
            Đặt theo tuần
          </button>
          <button
            className={`px-4 py-2 text-sm ${tab === "day" ? "bg-emerald-600 text-white" : "text-slate-700 hover:bg-slate-50"}`}
            onClick={() => setTab("day")}
          >
            Đặt theo ngày
          </button>
        </div>
      </div> */}

      {/* Action bar: Thông báo + Chế độ thư ký */}
{!pushChecking && tab !== "day" && (
  <TopControlBar
        // ---- Props Push
        pushReady={pushReady}
        pushBusy={pushBusy}
        isIOS={isIOS}
        isStandalone={!!isStandalone}
        notifPerm={notifPerm}
        pushStatus={pushStatus}
        pushError={pushError}
        unregisterPush={unregisterPush}
        handleEnablePush={handleEnablePush}

        // ---- Props Tăng ca & Thư ký
        isOvertime={isOvertime}
        setOvertime={setOvertime}
        isSec={isSec}
        setSecEnabled={setSecEnabled}
      />
)}


      {tab === "day" ? (
        <DaySecretaryPanelInline 
          user={user}
          weekStartMonday={weeklyMenu?.weekStartMonday}
          cutoffHour={11} />
      ) : 
      isOvertime ? (
        <OvertimeWeekInputs
          weeklyMenuId={weeklyMenu.weeklyMenuId} // id tuần hiện tại
          userId={user.userID}             // user đang đặt
          actorId={true}           // người thao tác (user hoặc thư ký)
          isOvertime={isOvertime} 
        />
      ) :(
        <>
          {/* ĐÃ ĐẶT – chip + edit (thư ký, cutoff 09:00) */}
          {hasOrdered ? (
            <div className="bg-white/70 backdrop-blur rounded-2xl border border-white/40 shadow-xl p-4 sm:p-6 mx-2 sm:mx-[10px]">
  <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-slate-800">
    Bạn đã đặt cơm tuần này
  </h3>

  <ul className="space-y-2 sm:space-y-3">
    {Object.keys(grouped).map((day) => {
      const dayEntries = isSec
        ? Object.keys(selectedSec[day] || {}).map((eid) => Number(eid))
        : [selected[day]].filter(Boolean);
      const canceled = canceledByDay[day];

      return (
        <li
          key={day}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
        >
          {/* Cột: ngày (mobile đặt trên cùng) */}
          <div className="sm:col-span-2 flex items-center">
            <span className="inline-flex shrink-0 px-2 py-1 rounded-md bg-white border border-slate-200 text-sm font-medium text-slate-700">
              {dayNameVN(day)}
            </span>
          </div>

          {/* Cột: danh sách món/chip (tự wrap + có thể cuộn ngang nếu quá dài) */}
          <div className="sm:col-span-8 min-w-0">
            {dayEntries.length > 0 ? (
              <div className="flex flex-wrap gap-2 -m-1 max-w-full">
                {dayEntries.map((eid) => {
                  const e = (weeklyMenu?.entries ?? []).find(
                    (x) => x.weeklyMenuEntryId === eid
                  );
                  const currentQty = isSec ? (qtySec[day]?.[eid] ?? 1) : 1;
                  const isEditing =
                    !!(editing &&
                    editing.day === String(day) &&
                    editing.entryId === eid);

                  return (
                    <div key={eid} className="m-1">
                      <QtyChip
                        day={day}
                        entryId={eid}
                        foodName={e?.foodName}
                        currentQty={currentQty}
                        isSec={isSec}
                        isEditing={isEditing}
                        editing={editing}
                        openEditQty={openEditQty}
                        changeEditValue={changeEditValue}
                        saveEdit={saveEdit}
                        cancelEdit={cancelEdit}
                        canEdit={canModifyDayByMode(Number(day))}
                      />
                    </div>
                  );
                })}
              </div>
            ) : canceled ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 line-through truncate">
                  {canceled.foodName}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
                  Đã huỷ cơm
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">Không chọn</span>
            )}
          </div>

          {/* Cột: nút huỷ (desktop: cột phải; mobile: full width phía dưới) */}
          {!isSec && dayEntries[0] && (
            <div className="sm:col-span-2 flex sm:justify-end">
              {(() => {
                const canCancel =
                  !weeklyMenu?.isLocked && canCancelDay(Number(day));
                const e = (weeklyMenu?.entries ?? []).find(
                  (x) => x.weeklyMenuEntryId === dayEntries[0]
                );

                return (
                  <button
                    onClick={() => {
                      if (!canCancel) return;
                      if (e) askCancel(e.weeklyMenuEntryId, day, e.foodName);
                    }}
                    disabled={!canCancel}
                    aria-disabled={!canCancel}
                    className={[
                      "w-full sm:w-auto px-4 py-2 rounded-lg text-white text-sm shadow inline-flex items-center justify-center gap-2 transition",
                      canCancel
                        ? "bg-rose-500 hover:bg-rose-600"
                        : "bg-rose-400 opacity-60 cursor-not-allowed"
                    ].join(" ")}
                    title={canCancel ? "Huỷ cơm ngày này" : "Đã quá hạn huỷ"}
                    aria-label={canCancel ? "Huỷ cơm" : "Đã quá hạn huỷ"}
                  >
                    Huỷ cơm
                  </button>
                );
              })()}
            </div>
          )}
        </li>
      );
    })}
  </ul>

  {/* Nút Đặt lại: gom về cuối, full-width mobile, phải desktop */}
  {!weeklyMenu?.isLocked && (
    <div className="mt-4 sm:mt-6 flex">
      <button
        onClick={() => {
          prevSelectedRef.current = {
            selectedSnapshot: selected,
            selectedSecSnapshot: selectedSec,
            qtySecSnapshot: qtySec,
            canceledSnapshot: canceledByDay,
            hasOrderedSnapshot: hasOrdered,
          };
          setHasOrdered(false);
          setSelected({});
          setSelectedSec({});
          setQtySec({});
          setCanceledByDay({});
          setReorderMode(true);
        }}
        className="w-full sm:w-auto sm:ml-auto px-5 sm:px-6 py-3 rounded-xl bg-amber-500 text-white flex items-center justify-center gap-2 shadow hover:bg-amber-600 transition"
      >
        <FaRedo /> Đặt lại
      </button>
    </div>
  )}
</div>
          ) : (
            <div className="w-full p-6 mx-[10px] lg:w-[calc(100vw-350px)]">
              {/* Thanh “Đang đặt lại” */}
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
                            setSelectedSec(snap.selectedSecSnapshot || {});
                            setQtySec(snap.qtySecSnapshot || {});
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
                              const eid = item.weeklyMenuEntryId;
                              const checked = isSec ? !!(selectedSec[day]?.[eid]) : selected[day] === eid;
                              const showStepper = isSec && checked;

                              return (
                                <motion.button
                                  key={eid}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => choose(day, eid)}
                                  className={`toy-card relative w-[240px] rounded-[28px] text-left cursor-pointer transition
                                    ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
                                    ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}
                                    ${showStepper ? "h-[320px] pb-16 flex flex-col" : "h-[298px]"}
                                    bg-white/80 backdrop-blur border border-white/60 shadow-sm`}
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

                                  <div className={`flex mx-4 mt-2 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-inner overflow-hidden place-items-center
                                    ${showStepper ? "h-36" : "h-40"}`}>
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="text-slate-400 text-sm">Chưa có hình</div>
                                    )}
                                  </div>

                                  <div className="px-5 pt-2">
                                    <div className="flex items-center justify-between">
                                      <div
                                        className={`px-3 py-1 rounded-full text-[11px] font-medium
                                          ${checked ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-slate-100 text-slate-500"}`}
                                      >
                                        {checked ? (isSec ? "Đã chọn (thư ký)" : "Đã chọn") : "Chọn món"}
                                      </div>
                                      {checked && <FaCheck className="text-emerald-600" />}
                                    </div>
                                  </div>

                                  {showStepper && (
                                    <div className="absolute left-5 right-5 bottom-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="text-[12px] text-slate-500">Số lượng</span>
                                        <QuantityStepper
                                          value={qtySec[day]?.[eid] ?? 1}
                                          min={1}
                                          disabled={weeklyMenu?.isLocked}
                                          onChange={(v) =>
                                            setQtySec((prev) => {
                                              const n = { ...(prev || {}) };
                                              const m = { ...(n[day] || {}) };
                                              m[eid] = typeof v === "function" ? v(m[eid] ?? 1) : v;
                                              n[day] = m;
                                              return n;
                                            })
                                          }
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <span className="shine" />
                                </motion.button>
                              );
                            })}

                            {(
                              <motion.button
                                key={`none-${day}`}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => choose(day, null)}
                                aria-pressed={selected[day] === null}
                                title={selected[day] === null ? "Đã chọn: Không ăn ngày này" : "Chọn: Không ăn ngày này"}
                                className={`toy-card relative w-[240px] h-[298px] rounded-[28px] grid place-items-center cursor-pointer
                                  ${selected[day] === null ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
                                  ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}
                                  bg-white/90 backdrop-blur border border-white/60 shadow-sm`}
                              >
                                {selected[day] === null && (
                                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-700 border border-rose-200 shadow">
                                    <FaCheck className="text-[10px]" />
                                    Đã chọn
                                  </span>
                                )}
                                <div className="text-center">
                                  <GiForkKnifeSpoon className={`text-3xl mx-auto mb-2 ${selected[day] === null ? "text-rose-500" : "text-slate-400"}`} />
                                  <span className={`font-medium ${selected[day] === null ? "text-rose-700" : "text-slate-600"}`}>Không chọn</span>
                                  {selected[day] === null && (
                                    <div className="mt-1 text-[11px] text-rose-500/90">Sẽ không đặt cơm ngày này</div>
                                  )}
                                </div>
                                {selected[day] === null && <FaCheck className="absolute right-2 bottom-2 text-rose-500 opacity-80" />}
                                <span className="shine" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {(!weeklyMenu?.isLocked) && (activeSlide === Object.keys(grouped).length - 1) && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={pageLoading || (Object.keys(grouped).length && !hasChosenAll)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2 shadow disabled:opacity-50"
                  >
                    {pageLoading && <FaSpinner className="animate-spin" />}
                    <FaSave /> {isSec ? "Lưu (thư ký)" : "Lưu đặt cơm"}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
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



// // src/pages/Lunch/UserOrderSlide.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import http from "~/api/http";
// import { BASE_URL } from "~/config";
// import { useSelector } from "react-redux";
// import { userSelector } from "~/redux/selectors";
// import { Swiper, SwiperSlide } from "swiper/react";
// import "swiper/css";
// import { motion } from "framer-motion";
// import { FaCheck, FaSpinner, FaSave, FaRedo } from "react-icons/fa";
// import { MdOutlineRestaurant, MdOutlineSoupKitchen } from "react-icons/md";
// import { GiForkKnifeSpoon, GiChopsticks } from "react-icons/gi";
// import { registerPush } from "~/push/registerPush";

// import DaySecretaryPanel from "./components/DaySecretaryPanel";

// import QuantityStepper from "~/components/lunch/QuantityStepper";
// import NoticeModal from "~/components/lunch/NoticeModal";
// import ConfirmCancelModal from "~/components/lunch/ConfirmCancelModal";
// import QtyChip from "~/components/lunch/QtyChip";

// /* ================= Helpers ================= */
// function dayNameVN(day) {
//   const map = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
//   return map[day];
// }
// function getFoodIcon(name = "") {
//   const n = name.toLowerCase();
//   if (/(soup|canh)/.test(n)) return <MdOutlineSoupKitchen className="text-2xl" />;
//   if (/(cơm|rice|bento)/.test(n)) return <MdOutlineRestaurant className="text-2xl" />;
//   if (/(bún|phở|mì|noodle)/.test(n)) return <GiChopsticks className="text-2xl" />;
//   return <GiForkKnifeSpoon className="text-2xl" />;
// }

// /* ================= Main ================= */
// export default function UserOrderSlide() {
//   const tmp = useSelector(userSelector);
//   const [user, setUser] = useState({});
//   useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

//   const [tab, setTab] = useState("week"); // "week" | "day"

//   const [weeklyMenu, setWeeklyMenu] = useState(null);

//   // User thường: 1 món/ngày
//   const [selected, setSelected] = useState({});
//   // Thư ký: nhiều món/ngày + số lượng
//   const [selectedSec, setSelectedSec] = useState({}); // { [day]: { [entryId]: true } }
//   const [qtySec, setQtySec] = useState({});           // { [day]: { [entryId]: number } }

//   const [canceledByDay, setCanceledByDay] = useState({});
//   const [pageLoading, setPageLoading] = useState(false);
//   const [notice, setNotice] = useState({ open: false, title: "", message: "" });
//   const [hasOrdered, setHasOrdered] = useState(false);
//   const [activeSlide, setActiveSlide] = useState(0);
//   const swiperRef = useRef(null);

//   // Push states
//   const [notifPerm, setNotifPerm] = useState("unknown");
//   const [isIOS, setIsIOS] = useState(false);
//   const [isStandalone, setIsStandalone] = useState(false);
//   const [pushReady, setPushReady] = useState(false);
//   const [pushChecking, setPushChecking] = useState(true);
//   const [pushError, setPushError] = useState("");
//   const [pushBusy, setPushBusy] = useState(false);
//   const [pushStatus, setPushStatus] = useState("");

//   // Reorder states
//   const [reorderMode, setReorderMode] = useState(false);
//   const prevSelectedRef = useRef(null);

//   // Cancel confirmation (user thường)
//   const [cancelConfirm, setCancelConfirm] = useState({
//     open: false, entryId: null, day: null, foodName: "", busy: false,
//   });

//   // Toggle “chế độ thư ký”
//   const [secEnabled, setSecEnabled] = useState(() => localStorage.getItem("lunch.secMode") === "1");
//   const isSec = secEnabled;
//   useEffect(() => {
//     localStorage.setItem("lunch.secMode", secEnabled ? "1" : "0");
//   }, [secEnabled]);

//   // ==== Inline edit (thư ký) – cho phần “Bạn đã đặt…” ====
//   const [editing, setEditing] = useState(null);
//   // { day: "1|2|...", entryId: number, value: number, max: number }

//   // ===== Cutoff helpers (ĐẶT BÊN TRONG component để đọc được weeklyMenu) =====
//   const getDateFromMonday = useCallback((mondayISO, dayOfWeek1to7) => {
//     if (!mondayISO) return null;
//     const base = new Date(mondayISO);
//     if (Number.isNaN(base.getTime())) return null;
//     const d = new Date(base);
//     d.setHours(0, 0, 0, 0);
//     d.setDate(d.getDate() + (dayOfWeek1to7 - 1));
//     return d;
//   }, []);

//   /** Chỉ cho phép chỉnh số lượng/huỷ (của thư ký) nếu now <= 09:00 của ngày đó */
//   const canModifyDay = useCallback((dayOfWeek1to7) => {
//     const mondayISO = weeklyMenu?.weekStartMonday;
//     if (!mondayISO) return false;
//     const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
//     if (!target) return false;
//     const cutoff = new Date(target);
//     cutoff.setHours(9, 0, 0, 0); // 09:00
//     return new Date() <= cutoff;
//   }, [weeklyMenu, getDateFromMonday]);

//   /** Huỷ cơm (user thường) theo cutoff 10:00 – giữ logic cũ */
//   const canCancelDay = useCallback((dayOfWeek1to7) => {
//     const mondayISO = weeklyMenu?.weekStartMonday;
//     if (!mondayISO) return false;
//     const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
//     if (!target) return false;
//     const cutoff = new Date(target);
//     cutoff.setHours(10, 0, 0, 0); // 10:00
//     return new Date() <= cutoff;
//   }, [weeklyMenu, getDateFromMonday]);

//   function openEditQty(day, entryId, currentQty) {
//     setEditing({ day: String(day), entryId, value: currentQty, max: currentQty });
//   }
//   function cancelEdit() { setEditing(null); }
//   function changeEditValue(v) {
//     const n = Number.isFinite(v) ? v : 0;
//     setEditing((s) => (s ? { ...s, value: Math.min(Math.max(0, n), s.max) } : s));
//   }

//   async function saveEdit() {
//     if (!editing) return;
//     const { day, entryId, value } = editing;

//     if (!canModifyDay(Number(day))) {
//       setNotice({
//         open: true,
//         title: "Không thể cập nhật",
//         message: "Đã quá 09:00 của ngày này nên không thể chỉnh số lượng.",
//       });
//       setEditing(null);
//       return;
//     }

//     // cập nhật local
//     setQtySec((prev) => ({
//       ...prev,
//       [day]: { ...(prev[day] || {}), [entryId]: value },
//     }));

//     // Nếu về 0 -> bỏ khỏi selectedSec
//     if (value === 0) {
//       setSelectedSec((prev) => {
//         const next = { ...(prev || {}) };
//         const atDay = { ...(next[day] || {}) };
//         delete atDay[entryId];
//         if (Object.keys(atDay).length) next[day] = atDay;
//         else delete next[day];
//         return next;
//       });
//     }

//     try {
//       await http.post(`${BASE_URL}/api/lunch-order/secretary/update-quantity`, {
//         userId: user?.userID,
//         weeklyMenuId: weeklyMenu?.weeklyMenuId,
//         dayOfWeek: Number(day),
//         weeklyMenuEntryId: entryId,
//         quantity: value,
//         updatedBy: user?.fullName || user?.userID,
//       });
//       setNotice({ open: true, title: "Đã lưu", message: "Cập nhật số lượng thành công." });
//     } catch {
//       setNotice({ open: true, title: "Lỗi", message: "Không thể cập nhật số lượng." });
//     } finally {
//       setEditing(null);
//     }
//   }

//   // ===== Push check =====
//   useEffect(() => {
//     try {
//       setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
//       setIsStandalone(window.navigator.standalone === true);
//       const hasNoti = typeof window !== "undefined" && "Notification" in window;
//       setNotifPerm(hasNoti ? Notification.permission : "unsupported");

//       const supported =
//         typeof navigator !== "undefined" &&
//         "serviceWorker" in navigator &&
//         "PushManager" in window &&
//         hasNoti;

//       if (!supported) {
//         setPushReady(false);
//         setPushChecking(false);
//         return;
//       }
//       (async () => {
//         let hasSub = false;
//         if (Notification.permission === "granted") {
//           try {
//             const reg = await navigator.serviceWorker.ready;
//             const sub = await reg.pushManager.getSubscription();
//             hasSub = !!sub;
//           } catch {}
//         }
//         setPushReady(Notification.permission === "granted" && hasSub);
//         setPushChecking(false);
//       })();
//     } catch {
//       setPushReady(false);
//       setPushChecking(false);
//       setNotifPerm("unsupported");
//     }
//   }, []);

//   async function handleEnablePush() {
//     if (pushBusy) return;
//     setPushError("");
//     setPushStatus("");
//     setPushBusy(true);
//     try {
//       await registerPush();
//       const reg = await navigator.serviceWorker.ready;
//       const sub = await reg.pushManager.getSubscription();
//       setPushReady(!!sub);
//       setPushStatus("Đã bật thông báo");
//     } catch (e) {
//       setPushError(e?.message || "Không thể bật thông báo");
//     } finally {
//       setPushBusy(false);
//       setTimeout(() => setPushStatus(""), 2500);
//     }
//   }
//   async function unregisterPush() {
//     if (pushBusy) return;
//     setPushError("");
//     setPushStatus("");
//     setPushBusy(true);
//     try {
//       const reg = await navigator.serviceWorker.ready;
//       const sub = await reg.pushManager.getSubscription();
//       if (sub) {
//         try {
//           await http.post(`${BASE_URL}/api/push/lunch-order/unsubscribe`, { endpoint: sub.endpoint });
//         } catch {}
//         await sub.unsubscribe();
//       }
//       setPushReady(false);
//       setPushStatus("Đã tắt thông báo");
//     } catch (e) {
//       setPushError(e?.message || "Không thể tắt thông báo");
//     } finally {
//       setPushBusy(false);
//       setTimeout(() => setPushStatus(""), 2500);
//     }
//   }

//   // ===== Grouping & flags =====
//   const grouped = useMemo(() => {
//     const entries = weeklyMenu?.entries ?? [];
//     return entries.reduce((acc, e) => {
//       (acc[e.dayOfWeek] ||= []).push(e);
//       return acc;
//     }, {});
//   }, [weeklyMenu]);

//   const hasChosenAll = useMemo(() => {
//     const days = Object.keys(grouped);
//     if (!days.length) return false;
//     if (isSec) return days.every((d) => Object.keys(selectedSec[d] || {}).length > 0);
//     return days.every((d) => Object.prototype.hasOwnProperty.call(selected, d));
//   }, [grouped, selected, selectedSec, isSec]);

//   // ===== Load data =====
//   useEffect(() => {
//     async function load() {
//       setPageLoading(true);
//       try {
//         const wmRes = await http.get(`${BASE_URL}/api/lunch-order/user/weekly-menu-latest`);
//         const menu = wmRes.data?.data;
//         if (!menu) {
//           setWeeklyMenu(null);
//           return;
//         }
//         setWeeklyMenu(menu);

//         // rows = [ [weeklyMenuEntryId, isAction, quantity] ]
//         const sRes = await http.get(
//           `${BASE_URL}/api/lunch-order/user/selections/${menu.weeklyMenuId}/${tmp?.login?.currentUser?.userID}`
//         );
//         const rows = sRes.data?.data || [];

//         const active = {};
//         const canceled = {};
//         const sec = {};
//         const qsec = {};
//         const entryMap = {};
//         (menu.entries || []).forEach((e) => (entryMap[e.weeklyMenuEntryId] = e));

//         rows.forEach(([entryId, isAction, q]) => {
//           const entry = entryMap[entryId];
//           if (!entry) return;
//           const day = entry.dayOfWeek;

//           if (isAction) {
//             if (!active[day]) active[day] = entryId; // user thường
//             (sec[day] ||= {})[entryId] = true;       // thư ký
//             (qsec[day] ||= {})[entryId] = Number.isFinite(+q) && +q > 0 ? +q : 1;
//           } else {
//             canceled[day] = { entryId, foodName: entry.foodName };
//           }
//         });

//         setSelected(active);
//         setSelectedSec(sec);
//         setQtySec(qsec);
//         setCanceledByDay(canceled);

//         const anyPicked =
//           Object.keys(sec).some((d) => Object.keys(sec[d] || {}).length > 0) ||
//           Object.keys(active).length > 0;
//         setHasOrdered(anyPicked);
//       } finally {
//         setPageLoading(false);
//       }
//     }
//     if (tmp?.login?.currentUser?.userID) load();
//   }, [tmp?.login?.currentUser?.userID]);

//   // Chọn món
//   function choose(day, entryId) {
//     if (weeklyMenu?.isLocked) return;

//     if (isSec) {
//       // Toggle nhiều món trong 1 ngày
//       setSelectedSec((prev) => {
//         const next = { ...(prev || {}) };
//         const dayMap = { ...(next[day] || {}) };
//         if (dayMap[entryId]) {
//           // Bỏ chọn
//           delete dayMap[entryId];
//           if (!Object.keys(dayMap).length) delete next[day];
//           else next[day] = dayMap;
//           // Xoá qty tương ứng
//           setQtySec((qPrev) => {
//             const n = { ...(qPrev || {}) };
//             const m = { ...(n[day] || {}) };
//             delete m[entryId];
//             if (!Object.keys(m).length) delete n[day];
//             else n[day] = m;
//             return n;
//           });
//         } else {
//           // Thêm chọn
//           dayMap[entryId] = true;
//           next[day] = dayMap;
//           setQtySec((qPrev) => {
//             const n = { ...(qPrev || {}) };
//             const m = { ...(n[day] || {}) };
//             if (!m[entryId] || m[entryId] < 1) m[entryId] = 1;
//             n[day] = m;
//             return n;
//           });
//         }
//         return next;
//       });
//       return;
//     }

//     // User thường: 1 món/ngày
//     setCanceledByDay((prev) => {
//       const next = { ...prev };
//       delete next[day];
//       return next;
//     });
//     setSelected((prev) => ({ ...prev, [day]: entryId }));

//     // Auto-next
//     const swiper = swiperRef.current;
//     if (swiper && typeof swiper.activeIndex === "number") {
//       const isLast = swiper.activeIndex >= swiper.slides.length - 1;
//       if (!isLast) setTimeout(() => swiper.slideNext(), 250);
//     }
//   }

//   async function handleSave() {
//     if (!weeklyMenu || weeklyMenu?.isLocked) return;
//     setPageLoading(true);
//     try {
//       let selections;
//       if (isSec) {
//         // [{entryId, quantity}]
//         selections = [];
//         for (const d of Object.keys(selectedSec || {})) {
//           const map = selectedSec[d] || {};
//           for (const eidStr of Object.keys(map)) {
//             const eid = Number(eidStr);
//             const q = Math.max(1, parseInt(qtySec?.[d]?.[eid] ?? 1, 10));
//             selections.push({ entryId: eid, quantity: q });
//           }
//         }
//       } else {
//         selections = Object.entries(selected)
//           .filter(([, eid]) => eid !== undefined && eid !== null)
//           .map(([, eid]) => Number(eid));
//       }

//       await http.post(`${BASE_URL}/api/lunch-order/user/selections/save`, {
//         userId: user.userID,
//         weeklyMenuId: weeklyMenu.weeklyMenuId,
//         selections,
//         createdBy: user.fullName,
//       });

//       setHasOrdered(true);
//       setNotice({ open: true, title: "Thành công", message: "Đặt cơm thành công!" });
//       setReorderMode(false);
//       prevSelectedRef.current = null;
//     } catch {
//       setNotice({ open: true, title: "Lỗi", message: "Không thể lưu đặt cơm." });
//     } finally {
//       setPageLoading(false);
//     }
//   }

//   // ===== Cancel one (user thường) =====
//   function askCancel(entryId, day, foodName) {
//     if (!canModifyDay(Number(day))) {
//       setNotice({
//         open: true,
//         title: "Không thể huỷ",
//         message: "Đã quá 09:00 của ngày này nên không thể huỷ nữa.",
//       });
//       return;
//     }
//     setCancelConfirm({ open: true, entryId, day, foodName, busy: false });
//   }

//   async function doCancelOne() {
//     const { entryId, day } = cancelConfirm;
//     if (!weeklyMenu || weeklyMenu?.isLocked || !entryId) return;
//     if (!canCancelDay(Number(day))) {
//       setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
//       setNotice({
//         open: true,
//         title: "Không thể huỷ",
//         message: "Đã quá 10:00 của ngày này nên không thể huỷ nữa.",
//       });
//       return;
//     }

//     setCancelConfirm((s) => ({ ...s, busy: true }));
//     try {
//       await http.post(`${BASE_URL}/api/lunch-order/user/selections/item-action`, {
//         userId: user.userID,
//         weeklyMenuId: weeklyMenu.weeklyMenuId,
//         weeklyMenuEntryId: entryId,
//         isAction: 0,
//         updatedBy: String(user.fullName || user.userID || ""),
//       });

//       const entry = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === entryId);
//       setSelected((prev) => {
//         const next = { ...prev };
//         delete next[day];
//         const stillChosen = Object.values(next).filter((v) => v != null).length;
//         if (stillChosen <= 0) setHasOrdered(false);
//         return next;
//       });
//       setCanceledByDay((prev) => ({
//         ...prev,
//         [day]: { entryId, foodName: entry?.foodName || "Đã huỷ cơm" },
//       }));

//       setNotice({ open: true, title: "Đã huỷ", message: "Đã huỷ món cho ngày này." });
//     } catch {
//       setNotice({ open: true, title: "Lỗi", message: "Huỷ món không thành công." });
//       setCancelConfirm((s) => ({ ...s, busy: false }));
//     } finally {
//       setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
//     }
//   }

//   if (pageLoading)
//     return (
//       <div className="p-6 text-emerald-600">
//         <FaSpinner className="animate-spin inline-block mr-2" />
//         Đang tải...
//       </div>
//     );

//   // --- Empty state khi chưa có menu ---
//   if (!weeklyMenu) {
//     return (
//       <div className="min-h-screen relative bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 pt-[10px]">
//         {!pushChecking && !pushReady && (
//           <div className="mx-[10px] mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
//             <div className="flex items-start justify-between gap-4">
//               <div>
//                 <div className="font-semibold">Bật thông báo đặt cơm</div>
//                 <div className="text-sm opacity-90">Nhận nhắc lịch chọn món/khóa menu ngay cả khi bạn không mở trang.</div>
//                 {notifPerm === "denied" && (
//                   <div className="text-red-600 text-sm mt-1">
//                     Bạn đang chặn thông báo. Hãy bật lại trong cài đặt trình duyệt, rồi bấm “Bật thông báo”.
//                   </div>
//                 )}
//                 {pushError && <div className="text-red-600 text-sm mt-1">{pushError}</div>}
//                 {pushStatus && <div className="text-emerald-700 text-sm mt-1">{pushStatus}</div>}
//               </div>

//               <button
//                 onClick={handleEnablePush}
//                 disabled={pushBusy || (isIOS && !isStandalone)}
//                 className={`px-4 py-2 rounded-xl text-white shadow ${
//                   pushBusy ? "bg-amber-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"
//                 }`}
//                 aria-busy={pushBusy}
//               >
//                 <span className="inline-flex items-center gap-2">
//                   {pushBusy && <FaSpinner className="animate-spin" />}
//                   {isIOS && !isStandalone ? "Cài lên màn hình chính" : pushBusy ? "Đang bật…" : "Bật thông báo"}
//                 </span>
//               </button>
//             </div>
//           </div>
//         )}
//         {/* ... phần card minh hoạ của bạn ... */}
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen relative bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 pt-[10px]">
//       {/* Action bar gọn */}
//       {!pushChecking && (
//         <div className="mx-[10px] mb-3 rounded-xl bg-white/80 backdrop-blur border border-white/60 shadow px-3 py-2">
//           <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
//             <div className="flex items-center gap-2 w-full sm:w-auto">
//               <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm
//                 ${pushReady ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
//                 <span className={`w-2 h-2 rounded-full ${pushReady ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
//                 {pushReady ? (pushStatus || "Đã bật thông báo") : "Thông báo: Tắt"}
//               </span>

//               {pushReady ? (
//                 <button
//                   onClick={unregisterPush}
//                   disabled={pushBusy}
//                   className={`h-8 px-3 rounded-lg text-sm border transition
//                     ${pushBusy ? "bg-slate-200 text-slate-600 cursor-not-allowed" : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"}`}
//                   aria-busy={pushBusy}
//                 >
//                   {pushBusy ? "Đang tắt…" : "Tắt"}
//                 </button>
//               ) : (
//                 <button
//                   onClick={handleEnablePush}
//                   disabled={pushBusy || (isIOS && !isStandalone)}
//                   className={`h-8 px-3 rounded-lg text-sm text-white shadow transition
//                     ${pushBusy ? "bg-amber-400 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`}
//                   aria-busy={pushBusy}
//                   title={notifPerm === "denied" ? "Bạn đang chặn thông báo trong trình duyệt" : ""}
//                 >
//                   {isIOS && !isStandalone ? "Cài lên màn hình chính" : pushBusy ? "Đang bật…" : "Bật thông báo"}
//                 </button>
//               )}
//             </div>

//             {!pushReady && notifPerm === "denied" && (
//               <div className="text-[12px] text-red-600/90 w-full sm:w-auto">
//                 Bạn đang chặn thông báo. Hãy bật lại trong cài đặt trình duyệt.
//               </div>
//             )}
//             {!pushReady && pushError && (
//               <div className="text-[12px] text-red-600/90 w-full sm:w-auto">{pushError}</div>
//             )}

//             <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
//               <span className="text-slate-700 text-sm">Chế độ thư ký</span>
//               <button
//                 role="switch"
//                 aria-checked={isSec}
//                 onClick={() => setSecEnabled((v) => !v)}
//                 className={`relative inline-flex h-7 w-12 items-center rounded-full transition
//                   ${isSec ? "bg-emerald-600" : "bg-slate-300"}`}
//                 title={isSec ? "Tắt chế độ thư ký" : "Bật chế độ thư ký"}
//               >
//                 <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${isSec ? "translate-x-6" : "translate-x-1"}`} />
//               </button>
//               <span className={`text-xs px-2 py-0.5 rounded-full border
//                 ${isSec ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-slate-200 text-slate-600 bg-slate-50"}`}>
//                 {isSec ? "Đang bật" : "Đang tắt"}
//               </span>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ĐÃ ĐẶT – chip + edit (thư ký, cutoff 09:00) */}
//       {hasOrdered ? (
//         <div className="bg-white/70 backdrop-blur rounded-2xl border border-white/40 shadow-xl p-6 mx-[10px]">
//           <h3 className="font-semibold text-lg mb-4 text-slate-800">Bạn đã đặt cơm tuần này</h3>
//           <ul className="space-y-3">
//             {Object.keys(grouped).map((day) => {
//               const dayEntries = isSec
//                 ? Object.keys(selectedSec[day] || {}).map((eid) => Number(eid))
//                 : [selected[day]].filter(Boolean);
//               const canceled = canceledByDay[day];

//               return (
//                 <li key={day} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
//                   <span className="w-24 font-medium">{dayNameVN(day)}</span>

//                   <div className="flex-1 min-w-0">
//                     {dayEntries.length > 0 ? (
//                       <div className="flex flex-wrap gap-2">
//                         {dayEntries.map((eid) => {
//                           const e = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === eid);
//                           const currentQty = isSec ? (qtySec[day]?.[eid] ?? 1) : 1;
//                           const isEditing = !!(editing && editing.day === String(day) && editing.entryId === eid);

//                           return (
//                             <QtyChip
//                               key={eid}
//                               day={day}
//                               entryId={eid}
//                               foodName={e?.foodName}
//                               currentQty={currentQty}
//                               isSec={isSec}
//                               isEditing={isEditing}
//                               editing={editing}
//                               openEditQty={openEditQty}
//                               changeEditValue={changeEditValue}
//                               saveEdit={saveEdit}
//                               cancelEdit={cancelEdit}
//                               // nếu bạn đã cập nhật QtyChip để hỗ trợ canEdit, prop này sẽ khoá UI ngay từ chip
//                               canEdit={canModifyDay(Number(day))}
//                             />
//                           );
//                         })}
//                       </div>
//                     ) : canceled ? (
//                       <div className="flex items-center gap-2">
//                         <span className="text-slate-400 line-through">{canceled.foodName}</span>
//                         <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-500 border border-slate-200">
//                           Đã huỷ cơm
//                         </span>
//                       </div>
//                     ) : (
//                       <span className="text-slate-400 italic">Không chọn</span>
//                     )}
//                   </div>

//                   {/* Huỷ cơm: chỉ user thường */}
// {!isSec && dayEntries[0] && (
//   (() => {
//     const canCancel = !weeklyMenu?.isLocked && canCancelDay(Number(day)); // còn hạn & menu chưa khoá
//     const e = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === dayEntries[0]);

//     return (
//       <button
//         onClick={() => {
//           if (!canCancel) return;
//           if (e) askCancel(e.weeklyMenuEntryId, day, e.foodName);
//         }}
//         disabled={!canCancel}
//         aria-disabled={!canCancel}
//         className={[
//           "px-3 py-1.5 rounded-lg text-white text-sm shadow inline-flex items-center gap-2",
//           "bg-rose-500",
//           canCancel ? "hover:bg-rose-600" : "opacity-50 cursor-not-allowed pointer-events-none"
//         ].join(" ")}
//         title={canCancel ? "Huỷ cơm ngày này" : "Đã quá hạn huỷ"}
//       >
//         Huỷ cơm
//       </button>
//     );
//   })()
// )}
//                 </li>
//               );
//             })}
//           </ul>

//           {!weeklyMenu?.isLocked && (
//             <div className="mt-6 flex justify-end">
//               <button
//                 onClick={() => {
//                   prevSelectedRef.current = {
//                     selectedSnapshot: selected,
//                     selectedSecSnapshot: selectedSec,
//                     qtySecSnapshot: qtySec,
//                     canceledSnapshot: canceledByDay,
//                     hasOrderedSnapshot: hasOrdered,
//                   };
//                   setHasOrdered(false);
//                   setSelected({});
//                   setSelectedSec({});
//                   setQtySec({});
//                   setCanceledByDay({});
//                   setReorderMode(true);
//                 }}
//                 className="px-6 py-3 rounded-xl bg-amber-500 text-white flex items-center gap-2 shadow hover:bg-amber-600"
//               >
//                 <FaRedo /> Đặt lại
//               </button>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="w-full p-6 mx-[10px] lg:w-[calc(100vw-350px)]">
//           {/* Thanh “Đang đặt lại” */}
//           {reorderMode && (
//             <div className="mx-[10px] mb-3 sticky top-[10px] z-[110]">
//               <div className="flex items-center justify-between rounded-2xl px-4 py-2 bg-white/80 backdrop-blur border border-white/60 shadow">
//                 <div className="text-sm text-slate-600">
//                   <span className="inline-flex items-center gap-2">
//                     <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
//                     <b>Đang đặt lại</b>
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => {
//                       const snap = prevSelectedRef.current;
//                       if (snap) {
//                         setSelected(snap.selectedSnapshot || {});
//                         setSelectedSec(snap.selectedSecSnapshot || {});
//                         setQtySec(snap.qtySecSnapshot || {});
//                         setCanceledByDay(snap.canceledSnapshot || {});
//                         setHasOrdered(snap.hasOrderedSnapshot ?? true);
//                       } else {
//                         setHasOrdered(true);
//                       }
//                       setReorderMode(false);
//                     }}
//                     className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
//                   >
//                     Thoát
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           <Swiper
//             onSwiper={(s) => (swiperRef.current = s)}
//             ref={swiperRef}
//             spaceBetween={30}
//             slidesPerView={1}
//             className="rounded-2xl"
//             onSlideChange={(s) => setActiveSlide(s.activeIndex)}
//           >
//             {Object.keys(grouped).map((day) => {
//               const items = grouped[day];
//               return (
//                 <SwiperSlide key={day}>
//                   <div className="pb-5">
//                     <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">{dayNameVN(day)}</h3>

//                     <div className="flex justify-center">
//                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 justify-items-center">
//                         {items.map((item) => {
//                           const eid = item.weeklyMenuEntryId;
//                           const checked = isSec ? !!(selectedSec[day]?.[eid]) : selected[day] === eid;
//                           const showStepper = isSec && checked;

//                           return (
//                             <motion.button
//                               key={eid}
//                               whileTap={{ scale: 0.97 }}
//                               onClick={() => choose(day, eid)}
//                               className={`toy-card relative w-[240px] rounded-[28px] text-left cursor-pointer transition
//                                 ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
//                                 ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}
//                                 ${showStepper ? "h-[320px] pb-16 flex flex-col" : "h-[298px]"}`}
//                             >
//                               <div className="px-5 pt-4 pb-2">
//                                 <div className="flex items-center gap-3">
//                                   <div className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 shadow-inner text-slate-700">
//                                     {getFoodIcon(item.foodName)}
//                                   </div>
//                                   <div className="flex-1 min-w-0">
//                                     <div className="text-[11px] uppercase tracking-widest text-slate-500">Món ăn</div>
//                                     <div className="font-semibold text-slate-800 leading-tight line-clamp-2">{item.foodName}</div>
//                                   </div>
//                                 </div>
//                               </div>

//                               <div className={`flex mx-4 mt-2 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-inner overflow-hidden place-items-center
//                                 ${showStepper ? "h-36" : "h-40"}`}>
//                                 {item.imageUrl ? (
//                                   <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
//                                 ) : (
//                                   <div className="text-slate-400 text-sm">Chưa có hình</div>
//                                 )}
//                               </div>

//                               <div className="px-5 pt-2">
//                                 <div className="flex items-center justify-between">
//                                   <div
//                                     className={`px-3 py-1 rounded-full text-[11px] font-medium
//                                       ${checked ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-slate-100 text-slate-500"}`}
//                                   >
//                                     {checked ? (isSec ? "Đã chọn (thư ký)" : "Đã chọn") : "Chọn món"}
//                                   </div>
//                                   {checked && <FaCheck className="text-emerald-600" />}
//                                 </div>
//                               </div>

//                               {showStepper && (
//                                 <div className="absolute left-5 right-5 bottom-4">
//                                   <div className="flex items-center justify-between gap-3">
//                                     <span className="text-[12px] text-slate-500">Số lượng</span>
//                                     <QuantityStepper
//                                       value={qtySec[day]?.[eid] ?? 1}
//                                       min={1}
//                                       disabled={weeklyMenu?.isLocked}
//                                       onChange={(v) =>
//                                         setQtySec((prev) => {
//                                           const n = { ...(prev || {}) };
//                                           const m = { ...(n[day] || {}) };
//                                           m[eid] = typeof v === "function" ? v(m[eid] ?? 1) : v;
//                                           n[day] = m;
//                                           return n;
//                                         })
//                                       }
//                                     />
//                                   </div>
//                                 </div>
//                               )}

//                               <span className="shine" />
//                             </motion.button>
//                           );
//                         })}

//                         {!isSec && (
//                           <motion.button
//                             key={`none-${day}`}
//                             whileTap={{ scale: 0.97 }}
//                             onClick={() => choose(day, null)}
//                             aria-pressed={selected[day] === null}
//                             title={selected[day] === null ? "Đã chọn: Không ăn ngày này" : "Chọn: Không ăn ngày này"}
//                             className={`toy-card relative w-[240px] h-[298px] rounded-[28px] grid place-items-center cursor-pointer
//                               ${selected[day] === null ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
//                               ${weeklyMenu?.isLocked ? "opacity-50 pointer-events-none" : ""}`}
//                           >
//                             {selected[day] === null && (
//                               <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-700 border border-rose-200 shadow">
//                                 <FaCheck className="text-[10px]" />
//                                 Đã chọn
//                               </span>
//                             )}
//                             <div className="text-center">
//                               <GiForkKnifeSpoon className={`text-3xl mx-auto mb-2 ${selected[day] === null ? "text-rose-500" : "text-slate-400"}`} />
//                               <span className={`font-medium ${selected[day] === null ? "text-rose-700" : "text-slate-600"}`}>Không chọn</span>
//                               {selected[day] === null && (
//                                 <div className="mt-1 text-[11px] text-rose-500/90">Sẽ không đặt cơm ngày này</div>
//                               )}
//                             </div>
//                             {selected[day] === null && <FaCheck className="absolute right-2 bottom-2 text-rose-500 opacity-80" />}
//                             <span className="shine" />
//                           </motion.button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </SwiperSlide>
//               );
//             })}
//           </Swiper>

//           {(!weeklyMenu?.isLocked) && (activeSlide === Object.keys(grouped).length - 1) && (
//             <div className="mt-8 flex justify-end">
//               <button
//                 onClick={handleSave}
//                 disabled={pageLoading || (Object.keys(grouped).length && !hasChosenAll)}
//                 className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center gap-2 shadow disabled:opacity-50"
//               >
//                 {pageLoading && <FaSpinner className="animate-spin" />}
//                 <FaSave /> {isSec ? "Lưu (thư ký)" : "Lưu đặt cơm"}
//               </button>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Modals */}
//       <NoticeModal
//         open={notice.open}
//         title={notice.title}
//         message={notice.message}
//         onClose={() => setNotice({ ...notice, open: false })}
//       />
//       <ConfirmCancelModal
//         open={cancelConfirm.open}
//         foodName={cancelConfirm.foodName}
//         dayText={cancelConfirm.day ? dayNameVN(cancelConfirm.day) : ""}
//         busy={cancelConfirm.busy}
//         onCancel={() =>
//           !cancelConfirm.busy &&
//           setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false })
//         }
//         onConfirm={doCancelOne}
//       />
//     </div>
//   );
// }


