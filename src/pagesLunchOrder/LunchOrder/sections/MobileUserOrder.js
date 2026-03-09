// src/pages/Lunch/UserOrderSlide/MobileUserOrderSlide.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";
import avatar_datcom from "~/assets/imgs/avatar-main.jpg";

import { FaThLarge, FaSpinner, FaBell, FaBellSlash, FaSave } from "react-icons/fa";

import NoticeModal from "~/components/lunch/NoticeModal";
import ConfirmCancelModal from "~/components/lunch/ConfirmCancelModal";

import { useFeatureAllowed } from "~/hooks/useFeatureGuard";
import MODULEID from "~/contants/modules";

import usePushSetup from "../hooks/usePushSetup";
import {
  dayNameVN,
  buildEntriesById,
  buildCmpByPositionId,
  cmpByPositionEntry,
  buildCanModifyDay,
  buildCanCancelDay,
} from "../helpers/lunchHelpers";

import { apiSaveSelections, apiItemActionCancel } from "../api/lunchApi";

import { useLunchData } from "../useLunchData";
import { useLunchActions } from "../useLunchActions";

import ResetBar from "../components/ResetBar";
import EditingBanner from "../components/EditingBanner";
import OrderTypeToggleMobi from "../components/OrderTypeToggleMobi";
import OrderedSummary from "../components/OrderedSummary";
import ChooseSwiper from "../components/ChooseSwiper";

/**
 * Mobile UI giống MobileViewPayslip (header + card nổi),
 * tông màu vàng, và phần CARD không chứa toggle loại đặt cơm.
 */
export default function MobileUserOrderSlide({ navigate, config }) {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  // Push
  const {
    notifPerm,
    isIOS,
    isStandalone,
    pushReady,
    pushChecking,
    pushError,
    pushBusy,
    pushStatus,
    enablePush,
    disablePush,
  } = usePushSetup();

  const [weekMode, setWeekMode] = useState("current"); // current | next

  function getMondayOfWeek(baseDate = new Date()) {
    const d = new Date(baseDate);
    const day = d.getDay(); // CN=0, T2=1, ...
    const diff = day === 0 ? -6 : 1 - day; // đưa về thứ 2
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const selectedMonday = useMemo(() => {
    const monday = getMondayOfWeek(new Date());
    if (weekMode === "next") {
      monday.setDate(monday.getDate() + 7);
    }
    return monday;
  }, [weekMode]);

  // Quyền
  const CAN_SECRETARY = useFeatureAllowed(MODULEID.DATCOM, "thukydatcom");
  const isSec = !!CAN_SECRETARY;

  // Loại
  const [orderType, setOrderType] = useState("re");

  // UI state
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });
  const [activeSlide, setActiveSlide] = useState(0);
  const swiperRef = useRef(null);

  // Reset/Edit states
  const [resetModeByType, setResetModeByType] = useState({ re: false, ws: false, ot: false });
  const [backupByType, setBackupByType] = useState({
    re: { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} },
    ws: { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} },
    ot: { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} },
  });

  const [stayOnChooseByType, setStayOnChooseByType] = useState({ re: false, ws: false, ot: false });
  const [editingDayByType, setEditingDayByType] = useState({ re: null, ws: null, ot: null });
  const [editBackupByType, setEditBackupByType] = useState({ re: {}, ws: {}, ot: {} });

  const [savingDay, setSavingDay] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const isSaving = savingDay || savingAll;

  useEffect(() => {
    setActiveSlide(0);
    setOrderType("re");
    setNotice({ open: false, title: "", message: "" });

    setStayOnChooseByType({ re: false, ws: false, ot: false });
    setEditingDayByType({ re: null, ws: null, ot: null });
    setResetModeByType({ re: false, ws: false, ot: false });

    if (swiperRef.current?.slideTo) swiperRef.current.slideTo(0);
  }, [weekMode]);

  // data
  const data = useLunchData({
    userId: tmp?.login?.currentUser?.userID,
    weekStartMonday: selectedMonday,
    hasSecretary: CAN_SECRETARY,
  });
  const weeklyMenu = data.weeklyMenu;

  // Derived
  const entriesById = useMemo(() => buildEntriesById(weeklyMenu), [weeklyMenu]);
  const cmpByPositionId = useMemo(() => buildCmpByPositionId(entriesById), [entriesById]);

  const grouped = useMemo(() => {
    const entries = weeklyMenu?.entries ?? [];
    const type = (orderType || "re").toLowerCase();
    const filtered = entries.filter((e) => (e.statusType || "re").toLowerCase() === type);
    const acc = filtered.reduce((acc2, e) => {
      (acc2[e.dayOfWeek] ||= []).push(e);
      return acc2;
    }, {});
    Object.keys(acc).forEach((d) => acc[d].sort(cmpByPositionEntry));
    return acc;
  }, [weeklyMenu, orderType]);

  const sortedDays = useMemo(
    () => Object.keys(grouped).sort((a, b) => Number(a) - Number(b)),
    [grouped]
  );

  const selected = data.selectedByType[orderType] || {};
  const selectedSec = data.selectedSecByType[orderType] || {};
  const selectedBr = data.selectedBranchesByType[orderType] || {};
  const qtyBr = data.qtyBranchesByType[orderType] || {};
  const qtyEntry = data.qtyEntryByType[orderType] || {};
  const skipSecDays = data.skipSecByType[orderType] || {};
  const userPick = data.userPickByType[orderType] || {};
  const resetMode = resetModeByType[orderType];
  const editingDay = editingDayByType[orderType];

  const canModifyDayByMode = useMemo(() => buildCanModifyDay(weeklyMenu), [weeklyMenu]);
  const canCancelDay = useMemo(() => buildCanCancelDay(weeklyMenu), [weeklyMenu]);

  const hasOrderedForType = useMemo(() => {
    if (!Object.keys(grouped).length) return false;
    if (isSec) {
      const anyItems = Object.keys(selectedSec).some((d) => Object.keys(selectedSec[d] || {}).length > 0);
      const anySkip = Object.keys(skipSecDays).some((d) => skipSecDays[d] === true);
      return anyItems || anySkip;
    }
    return Object.keys(selected).length > 0;
  }, [grouped, selected, selectedSec, skipSecDays, isSec]);

  const requiredDays = useMemo(() => {
    if (!weeklyMenu) return [];
    const base = new Date(weeklyMenu.weekStartMonday);
    if (Number.isNaN(base.getTime())) return sortedDays;

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const base00 = new Date(base);
    base00.setHours(0, 0, 0, 0);

    return sortedDays.filter((d) => {
      const dd = new Date(base00);
      dd.setDate(base00.getDate() + (Number(d) - 1));
      return dd.getTime() > endOfToday.getTime();
    });
  }, [weeklyMenu, sortedDays]);

  const hasChosenRequired = useMemo(() => {
    const days = requiredDays;
    if (!days.length) return true;
    if (isSec) return days.every((d) => skipSecDays[d] === true || Object.keys(selectedSec[d] || {}).length > 0);
    return days.every((d) => Object.prototype.hasOwnProperty.call(selected, d));
  }, [requiredDays, selected, selectedSec, skipSecDays, isSec]);

  // actions
  const actions = useLunchActions({
    isSec,
    user,
    weeklyMenu,

    orderType,
    swiperRef,
    setNotice,

    selectedByType: data.selectedByType,
    setSelectedByType: data.setSelectedByType,

    selectedSecByType: data.selectedSecByType,
    setSelectedSecByType: data.setSelectedSecByType,

    selectedBranchesByType: data.selectedBranchesByType,
    setSelectedBranchesByType: data.setSelectedBranchesByType,

    qtyBranchesByType: data.qtyBranchesByType,
    setQtyBranchesByType: data.setQtyBranchesByType,

    qtyEntryByType: data.qtyEntryByType,
    setQtyEntryByType: data.setQtyEntryByType,

    skipSecByType: data.skipSecByType,
    setSkipSecByType: data.setSkipSecByType,

    userPickByType: data.userPickByType,
    setUserPickByType: data.setUserPickByType,

    resetModeByType,
    setResetModeByType,
    backupByType,
    setBackupByType,
    stayOnChooseByType,
    setStayOnChooseByType,
    editingDayByType,

    lastSavedByType: data.lastSavedByType,
    setLastSavedByType: data.setLastSavedByType,

    savingAll,
    setSavingAll,

    CAN_SECRETARY
  });

  // --- Edit per day ---
  function startEditDay(day) {
    if (!canModifyDayByMode(Number(day))) {
      setNotice({ open: true, title: "Không thể đổi", message: "Đã quá hạn 9:00 cho ngày này nên không thể đổi." });
      return;
    }

    setEditBackupByType((prev) => {
      const perType = prev[orderType] || {};
      const backup = isSec
        ? {
            sec: { ...(data.selectedSecByType[orderType]?.[day] || {}) },
            selBr: { ...(data.selectedBranchesByType[orderType]?.[day] || {}) },
            qtyBr: { ...(data.qtyBranchesByType[orderType]?.[day] || {}) },
            qtyEntry: { ...(data.qtyEntryByType[orderType]?.[day] || {}) },
            skip: !!(data.skipSecByType[orderType]?.[day]),
          }
        : {
            user: data.selectedByType[orderType]?.[day] ?? null,
            userPick: { ...(data.userPickByType[orderType]?.[day] || {}) },
          };
      return { ...prev, [orderType]: { ...perType, [day]: backup } };
    });

    setEditingDayByType((p) => ({ ...p, [orderType]: String(day) }));
    setStayOnChooseByType((p) => ({ ...p, [orderType]: true }));

    const idx = sortedDays.indexOf(String(day));
    if (idx >= 0 && swiperRef.current?.slideTo) swiperRef.current.slideTo(idx);
  }

  function cancelEditDay() {
    const day = editingDay;
    if (!day) return;
    const b = editBackupByType[orderType]?.[day];

    if (isSec) {
      data.setSelectedSecByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b?.sec && Object.keys(b.sec).length) cur[day] = { ...b.sec };
        else delete cur[day];
        next[orderType] = cur;
        return next;
      });

      data.setSelectedBranchesByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b?.selBr && Object.keys(b.selBr).length) cur[day] = { ...b.selBr };
        else delete cur[day];
        next[orderType] = cur;
        return next;
      });

      data.setQtyBranchesByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b?.qtyBr && Object.keys(b.qtyBr).length) cur[day] = { ...b.qtyBr };
        else delete cur[day];
        next[orderType] = cur;
        return next;
      });

      data.setQtyEntryByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b?.qtyEntry && Object.keys(b.qtyEntry).length) cur[day] = { ...b.qtyEntry };
        else delete cur[day];
        next[orderType] = cur;
        return next;
      });

      data.setSkipSecByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b?.skip) cur[day] = true;
        else delete cur[day];
        next[orderType] = cur;
        return next;
      });
    } else {
      data.setSelectedByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b && "user" in b) {
          if (b.user === null || b.user === undefined) delete cur[day];
          else cur[day] = b.user;
        }
        next[orderType] = cur;
        return next;
      });

      data.setUserPickByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        if (b?.userPick) cur[day] = { ...b.userPick };
        else delete cur[day];
        next[orderType] = cur;
        return next;
      });
    }

    setEditingDayByType((p) => ({ ...p, [orderType]: null }));
    setStayOnChooseByType((p) => ({ ...p, [orderType]: false }));
    setEditBackupByType((prev) => {
      const perType = { ...(prev[orderType] || {}) };
      delete perType[day];
      return { ...prev, [orderType]: perType };
    });
  }

  async function saveEditDay() {
    if (savingDay) return;
    setSavingDay(true);
    try {
      let selections;

      if (isSec) {
        selections = actions.buildSelectionsSec(orderType); // toàn tuần
      } else {
        selections = Object.entries(data.selectedByType[orderType] || {})
          .map(([d, eid]) => {
            const picked = data.userPickByType[orderType]?.[d]?.[eid];
            return picked > 0 ? { entryId: Number(eid), branchId: Number(picked) } : Number(eid);
          })
          .filter(Boolean);
      }

      await apiSaveSelections({
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        statusType: orderType,
        selections,
        createdBy: user.fullName,
        hasSecretary: CAN_SECRETARY,
      });

      data.setLastSavedByType((prev) => {
        const next = { ...prev };
        next[orderType] = isSec
          ? {
              user: {},
              sec: { ...(data.selectedSecByType[orderType] || {}) },
              selBr: { ...(data.selectedBranchesByType[orderType] || {}) },
              qtyBr: { ...(data.qtyBranchesByType[orderType] || {}) },
              qtyEntry: { ...(data.qtyEntryByType[orderType] || {}) },
              skip: { ...(data.skipSecByType[orderType] || {}) },
              userPick: {},
            }
          : {
              user: { ...(data.selectedByType[orderType] || {}) },
              sec: {},
              selBr: {},
              qtyBr: {},
              qtyEntry: {},
              skip: {},
              userPick: { ...(data.userPickByType[orderType] || {}) },
            };
        return next;
      });

      setNotice({ open: true, title: "Đã lưu", message: "Cập nhật món theo ngày thành công." });
      setEditingDayByType((p) => ({ ...p, [orderType]: null }));
      setStayOnChooseByType((p) => ({ ...p, [orderType]: false }));
      setEditBackupByType((prev) => {
        const perType = { ...(prev[orderType] || {}) };
        if (editingDay) delete perType[editingDay];
        return { ...prev, [orderType]: perType };
      });
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không thể lưu thay đổi. Vui lòng thử lại." });
    } finally {
      setSavingDay(false);
    }
  }

  // --- Cancel ---
  const [cancelConfirm, setCancelConfirm] = useState({
    open: false,
    entryId: null,
    day: null,
    foodName: "",
    busy: false,
  });

  function askCancel(entryId, day, foodName) {
    if (!canModifyDayByMode(Number(day))) {
      setNotice({ open: true, title: "Không thể huỷ", message: "Đã quá hạn nên không thể huỷ nữa." });
      return;
    }
    setCancelConfirm({ open: true, entryId, day, foodName, busy: false });
  }

  async function doCancelOne() {
    const { entryId, day } = cancelConfirm;
    if (!weeklyMenu || weeklyMenu?.isLocked || !entryId) return;

    if (!canCancelDay(Number(day))) {
      setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
      setNotice({ open: true, title: "Không thể huỷ", message: "Đã quá hạn nên không thể huỷ nữa." });
      return;
    }

    setCancelConfirm((s) => ({ ...s, busy: true }));
    try {
      await apiItemActionCancel({
        userId: user.userID,
        weeklyMenuId: weeklyMenu.weeklyMenuId,
        weeklyMenuEntryId: entryId,
        updatedBy: String(user.fullName || user.userID || ""),
      });

      data.setSelectedByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        delete cur[day];
        next[orderType] = cur;
        return next;
      });

      setNotice({ open: true, title: "Đã huỷ", message: "Đã huỷ món cho ngày này." });
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Huỷ món không thành công." });
      setCancelConfirm((s) => ({ ...s, busy: false }));
    } finally {
      setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false });
    }
  }

  // ====== UI Theme (VÀNG) ======
  const fullName = tmp?.login?.currentUser?.fullName || "bạn";

  const t = {
    bgMain: "bg-[#FFF6D8]",
    headerGrad: "bg-gradient-to-br from-sky-600 via-sky-500 to-amber-400",
    cardBg:
      "bg-[#FFFDF4] border-2 border-amber-300/80 ring-1 ring-amber-300/30 shadow-[0_10px_22px_rgba(15,23,42,0.12)]",
    chipBg: "bg-[#FFF1C2] border border-amber-300/80",
    chipText: "text-slate-800",
    title1: "text-slate-900",
    title2: "text-sky-700",
    bellOn: "bg-gradient-to-br from-sky-600 to-sky-700 text-white",
    bellOff: "bg-[#FFF1C2] border-2 border-amber-300/80 text-slate-900",
    bellDenied: "bg-slate-200 text-slate-500 border-2 border-slate-300",
  };

  const canTogglePush = !pushChecking && notifPerm !== "unsupported" && notifPerm !== "denied";
  const bellBtnClass = !canTogglePush ? t.bellDenied : pushReady ? t.bellOff : t.bellOn;

  const bellTitle = !canTogglePush
    ? notifPerm === "denied"
      ? "Trình duyệt đã chặn thông báo"
      : "Thiết bị không hỗ trợ thông báo"
    : pushReady
    ? "Tắt thông báo"
    : "Bật thông báo";

  // Loading
  if (data.pageLoading)
    return (
      <div className="md:hidden p-6 text-sky-700 bg-[#FFF6D8]" style={{ minHeight: "100dvh" }}>
        <FaSpinner className="animate-spin inline-block mr-2" />
        Đang tải...
      </div>
    );

  // Empty menu
  if (!weeklyMenu) {
    return (
      <div className={`md:hidden ${t.bgMain}`} style={{ minHeight: "100dvh" }}>
        <div className={`relative ${t.headerGrad} rounded-b-[50px] px-4 pt-4 pb-[170px]`}>
          <div className="relative flex items-center justify-between mt-[20px]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
                <img
                  src={avatar_datcom}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm text-white/90">Xin chào,</div>
                <div className="text-[18px] font-semibold text-white truncate">{fullName}</div>
              </div>
            </div>

            <button
              onClick={() => navigate?.(config?.routes?.homeMain)}
              className="h-10 w-10 rounded-full grid place-items-center text-white bg-white/25 border border-white/40 active:scale-95 transition"
              aria-label="Chọn ứng dụng"
              title="Chọn ứng dụng"
            >
              <FaThLarge />
            </button>
          </div>
        </div>

        <div className="absolute left-4 right-4 top-[110px]">
          <div className={`rounded-3xl px-4 py-4 ${t.cardBg}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
  <div className={`text-[20px] font-extrabold ${t.title1}`}>
    🍱 Đặt cơm
  </div>

  <div className="inline-flex rounded-full p-1 bg-[#FFF1C2] border border-amber-300/80">
    <button
      type="button"
      onClick={() => setWeekMode("current")}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
        weekMode === "current"
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-700"
      }`}
    >
      Tuần này
    </button>

    <button
      type="button"
      onClick={() => setWeekMode("next")}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
        weekMode === "next"
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-700"
      }`}
    >
      Tuần sau
    </button>
  </div>
</div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${t.chipBg} ${t.chipText}`}
                  >
                    Chưa có thực đơn • Bạn có thể bật thông báo
                  </span>
                </div>
              </div>

              <button
                type="button"
                title={bellTitle}
                aria-label={bellTitle}
                disabled={!canTogglePush || pushBusy}
                onClick={() => {
                  if (!canTogglePush || pushBusy) return;
                  if (pushReady) disablePush?.();
                  else enablePush?.();
                }}
                className={`h-[50px] w-[50px] rounded-2xl grid place-items-center shadow-sm active:scale-95 transition ${bellBtnClass} ${
                  !canTogglePush || pushBusy ? "opacity-80" : ""
                }`}
              >
                {pushBusy ? (
                  <FaSpinner className="animate-spin text-[18px]" />
                ) : pushReady ? (
                  <FaBellSlash className="text-[18px]" />
                ) : (
                  <FaBell className="text-[18px]" />
                )}
              </button>
            </div>

            {(pushError || pushStatus) && (
              <div
                className={`mt-3 rounded-2xl p-3 text-sm ${
                  pushError
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {pushError || pushStatus}
              </div>
            )}

            <div className="mt-3 text-sm text-slate-600">
              Quản trị viên chưa đăng thực đơn. Bạn có thể bật thông báo để nhận tin khi menu được cập nhật.
            </div>

            <div className="mt-4 grid gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                Kiểm tra lại vào đầu tuần (thường đăng vào sáng thứ Hai).
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                Nhấn “Bật thông báo” để không bỏ lỡ thời điểm khóa menu.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const editingBannerVisible = !!editingDay;
  const daysToRender = editingDay ? [String(editingDay)] : sortedDays;

  return (
    <div className={`md:hidden ${t.bgMain}`} style={{ minHeight: "100dvh" }}>
      {/* Overlay khi lưu */}
      {isSaving && (
        <div className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-3 py-2 rounded-full bg-white/90 border border-slate-200 shadow-md text-slate-700 text-sm flex items-center gap-2">
            <FaSpinner className="animate-spin" />
            <span>Đang lưu thay đổi...</span>
          </div>
        </div>
      )}

      {/* HEADER (giống Payroll) */}
      <div className={`relative ${t.headerGrad} rounded-b-[50px] px-4 pt-4 pb-[170px]`}>
        <div className="relative flex items-center justify-between mt-[20px]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-full overflow-hidden bg-white/30 border border-white/40">
              <img
                src={avatar_datcom}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm text-white/90">Xin chào,</div>
              <div className="text-[18px] font-semibold text-white truncate">{fullName}</div>
            </div>
          </div>

          <button
            onClick={() => navigate?.(config?.routes?.homeMain)}
            className="h-10 w-10 rounded-full grid place-items-center text-white bg-white/25 border border-white/40 active:scale-95 transition"
            aria-label="Chọn ứng dụng"
            title="Chọn ứng dụng"
          >
            <FaThLarge />
          </button>
        </div>

        {/* CARD NỔI (KHÔNG chứa toggle loại đặt cơm) */}
        <div className="absolute left-4 right-4 top-[110px]">
          <div className={`rounded-3xl px-4 py-4 ${t.cardBg}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
  <div className={`text-[20px] font-extrabold ${t.title1}`}>
    🍱 Đặt cơm
  </div>

  <div className="inline-flex rounded-full p-1 bg-[#FFF1C2] border border-amber-300/80">
    <button
      type="button"
      onClick={() => setWeekMode("current")}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
        weekMode === "current"
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-700"
      }`}
    >
      Tuần này
    </button>

    <button
      type="button"
      onClick={() => setWeekMode("next")}
      className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition ${
        weekMode === "next"
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-700"
      }`}
    >
      Tuần sau
    </button>
  </div>
</div>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1 rounded-full ${t.chipBg} ${t.chipText}`}
                  >
                    Lướt để chọn • Lưu ở slide cuối
                  </span>
                </div>
              </div>

              {/* 🔔 Bell toggle */}
              <button
                type="button"
                title={bellTitle}
                aria-label={bellTitle}
                disabled={!canTogglePush || pushBusy}
                onClick={() => {
                  if (!canTogglePush || pushBusy) return;
                  if (pushReady) disablePush?.();
                  else enablePush?.();
                }}
                className={`h-[50px] w-[50px] rounded-2xl grid place-items-center shadow-sm active:scale-95 transition ${bellBtnClass} ${
                  !canTogglePush || pushBusy ? "opacity-80" : ""
                }`}
              >
                {pushBusy ? (
                  <FaSpinner className="animate-spin text-[18px]" />
                ) : pushReady ? (
                  <FaBellSlash className="text-[18px]" />
                ) : (
                  <FaBell className="text-[18px]" />
                )}
              </button>
            </div>

            {(pushError || pushStatus) && (
              <div
                className={`mt-3 rounded-2xl p-3 text-sm ${
                  pushError
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {pushError || pushStatus}
              </div>
            )}

            <div className="pt-[24px]">
              <OrderTypeToggleMobi
                visible={!resetMode && !editingBannerVisible}
                orderType={orderType}
                onChangeType={(k) => {
                  setOrderType(k);
                  actions.flushOtherTypes(k);
                  setStayOnChooseByType((p) => ({ ...p, [k]: false }));
                  setEditingDayByType((p) => ({ ...p, [k]: null }));
                  if (swiperRef.current?.slideTo) swiperRef.current.slideTo(0);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* khoảng trống dưới header */}
      <div className="h-[45px]" />

      {/* Reset / Editing banners */}
      <ResetBar visible={!!resetMode} onExit={actions.exitResetMode} />

      <EditingBanner
        visible={!!editingBannerVisible}
        dayText={editingDay ? dayNameVN(editingDay) : ""}
        isSaving={isSaving}
        savingDay={savingDay}
        onCancel={cancelEditDay}
        onSave={saveEditDay}
      />

      {/* Summary */}
      <div className="px-[10px] pt-[10px] pb-[80px]">
        <OrderedSummary
          visible={hasOrderedForType && !resetMode && !stayOnChooseByType[orderType]}
          weeklyMenu={weeklyMenu}
          sortedDays={sortedDays}
          orderType={orderType}
          isSec={isSec}
          selected={selected}
          selectedSec={selectedSec}
          selectedBr={selectedBr}
          qtyBr={qtyBr}
          qtyEntry={qtyEntry}
          skipSecDays={skipSecDays}
          userPick={userPick}
          cmpByPositionId={cmpByPositionId}
          dayNameVN={dayNameVN}
          canModifyDayByMode={canModifyDayByMode}
          canCancelDay={canCancelDay}
          onStartEditDay={startEditDay}
          onEnterResetMode={actions.enterResetMode}
          onAskCancel={askCancel}
        />
      </div>

      {/* Choose UI */}
      {(!hasOrderedForType || resetMode || stayOnChooseByType[orderType]) && (
        <div className="w-full pb-[80px]">
          <ChooseSwiper
            daysToRender={daysToRender}
            grouped={grouped}
            weeklyMenu={weeklyMenu}
            orderType={orderType}
            isSec={isSec}
            selected={selected}
            selectedSec={selectedSec}
            selectedBr={selectedBr}
            qtyBr={qtyBr}
            qtyEntry={qtyEntry}
            skipSecDays={skipSecDays}
            userPick={data.userPickByType[orderType] || {}}
            isSaving={isSaving}
            canModifyDayByMode={canModifyDayByMode}
            swiperRef={swiperRef}
            onSlideChange={(idx) => setActiveSlide(idx)}
            dayNameVN={dayNameVN}
            onCardClick={actions.handleCardClick}
            onPickBranch={(day, eid, branchId) => {
              data.setUserPickByType((prev) => {
                const n = { ...prev };
                const byType = { ...(n[orderType] || {}) };
                const byDay = { ...(byType[day] || {}) };
                if (byDay[eid] === branchId) delete byDay[eid];
                else byDay[eid] = branchId;
                if (Object.keys(byDay).length) byType[day] = byDay;
                else delete byType[day];
                n[orderType] = byType;
                return n;
              });
            }}
            onChangeQtyEntry={(day, eid, v, curVal) => {
              const next = parseInt(typeof v === "function" ? v(curVal) : v, 10);
              const nextVal = Number.isFinite(next) ? Math.max(0, next) : 0;
              data.setQtyEntryByType((prev) => {
                const n = { ...prev };
                const byType = { ...(n[orderType] || {}) };
                const byDay = { ...(byType[day] || {}) };
                byDay[eid] = nextVal;
                byType[day] = byDay;
                n[orderType] = byType;
                return n;
              });
            }}
            onToggleBranch={(day, eid, branchId, brSel) => {
              if (isSaving) return;
              data.setSelectedBranchesByType((prev) => {
                const n = { ...prev };
                const byType = { ...(n[orderType] || {}) };
                const byDay = { ...(byType[day] || {}) };
                const byEntry = { ...(byDay[eid] || {}) };
                if (byEntry[branchId]) delete byEntry[branchId];
                else byEntry[branchId] = true;
                if (!Object.keys(byEntry).length) delete byDay[eid];
                else byDay[eid] = byEntry;
                byType[day] = byDay;
                n[orderType] = byType;
                return n;
              });
              if (!brSel) {
                data.setQtyBranchesByType((prev) => {
                  const n = { ...prev };
                  const byType = { ...(n[orderType] || {}) };
                  const byDay = { ...(byType[day] || {}) };
                  const byEntry = { ...(byDay[eid] || {}) };
                  byEntry[branchId] = Math.max(1, parseInt(byEntry[branchId] ?? 1, 10));
                  byDay[eid] = byEntry;
                  byType[day] = byDay;
                  n[orderType] = byType;
                  return n;
                });
              }
            }}
            onChangeQtyBranch={(day, eid, branchId, v, curQty) => {
              const nextVal = Math.max(1, parseInt(typeof v === "function" ? v(curQty) : v, 10));
              data.setQtyBranchesByType((prev) => {
                const n = { ...prev };
                const byType = { ...(n[orderType] || {}) };
                const byDay = { ...(byType[day] || {}) };
                const byEntry = { ...(byDay[eid] || {}) };
                byEntry[branchId] = nextVal;
                byDay[eid] = byEntry;
                byType[day] = byDay;
                n[orderType] = byType;
                return n;
              });
            }}
            activeSlide={activeSlide}
          />

          {/* Save button on last slide */}
          {!weeklyMenu?.isLocked && activeSlide === daysToRender.length - 1 && (
            <div className="mt-2 px-4 pb-8 flex items-center justify-end gap-3">
              <button
                onClick={actions.handleSave}
                disabled={savingAll || !hasChosenRequired}
                className="
                  inline-flex items-center justify-center gap-2
                  px-6 py-3 rounded-xl
                  bg-gradient-to-br from-sky-600 to-amber-400
                  text-white shadow-sm hover:shadow transition-shadow
                  disabled:opacity-50
                "
              >
                {savingAll && <FaSpinner className="animate-spin" />}
                <FaSave /> {isSec ? "Lưu (thư ký)" : "Lưu đặt cơm"}
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
