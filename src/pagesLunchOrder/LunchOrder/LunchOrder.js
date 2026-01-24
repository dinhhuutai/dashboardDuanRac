// src/pages/Lunch/UserOrderSlide.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { userSelector } from "~/redux/selectors";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { motion } from "framer-motion";
import { FaCheck, FaSpinner, FaSave, FaRedo } from "react-icons/fa";
import { FiBell, FiAlertTriangle, FiInfo, FiCheckCircle } from "react-icons/fi";

import QuantityStepper from "~/components/lunch/QuantityStepper"; // vẫn dùng cho thư ký
import NoticeModal from "~/components/lunch/NoticeModal";
import ConfirmCancelModal from "~/components/lunch/ConfirmCancelModal";
import { useFeatureAllowed } from "~/hooks/useFeatureGuard";
import MODULEID from "~/contants/modules";

import usePushSetup from "./hooks/usePushSetup";
import {
  dayNameVN, getFoodIcon,
  buildEntriesById, buildCmpByPositionId, cmpByPositionEntry,
  buildCanModifyDay, buildCanCancelDay,
} from "./helpers/lunchHelpers";
import {
  apiGetWeeklyMenuLatest, apiGetSelections, apiSaveSelections, apiItemActionCancel,
} from "./api/lunchApi";

export default function UserOrderSlide() {
  const tmp = useSelector(userSelector);
  const [user, setUser] = useState({});
  useEffect(() => setUser(tmp?.login?.currentUser), [tmp]);

  // Push
  const { notifPerm, isIOS, isStandalone, pushReady, pushChecking, pushError, pushBusy, pushStatus,
    enablePush, disablePush } = usePushSetup();

  // Quyền
  const CAN_SECRETARY = useFeatureAllowed(MODULEID.DATCOM, "thukydatcom");
  const isSec = !!CAN_SECRETARY;

  // Loại
  const [orderType, setOrderType] = useState("re");
  const [weeklyMenu, setWeeklyMenu] = useState(null);

  // State chung
  const [selectedByType, setSelectedByType] = useState({ re: {}, ws: {}, ot: {} });

  // Thư ký (giữ nguyên logic cũ)
  const [selectedSecByType, setSelectedSecByType] = useState({ re: {}, ws: {}, ot: {} });
  const [selectedBranchesByType, setSelectedBranchesByType] = useState({ re: {}, ws: {}, ot: {} });
  const [qtyBranchesByType, setQtyBranchesByType] = useState({ re: {}, ws: {}, ot: {} });
  const [qtyEntryByType, setQtyEntryByType] = useState({ re: {}, ws: {}, ot: {} });
  const [skipSecByType, setSkipSecByType] = useState({ re: {}, ws: {}, ot: {} });

  // 🌟 Người dùng thường: chọn 1 trong [Chung | 1 branch]
  // userPickByType[type][day][entryId] = 0 (chung) | branchId (>0)
  const [userPickByType, setUserPickByType] = useState({ re: {}, ws: {}, ot: {} });

  // Reset & backup
  const [resetModeByType, setResetModeByType] = useState({ re: false, ws: false, ot: false });
  const [backupByType, setBackupByType] = useState({
    re: { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} },
    ws: { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} },
    ot: { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} },
  });
  
  // Snapshot đã LƯU cuối cùng (từ load() hoặc sau khi save thành công)
const EMPTY_SNAPSHOT = { user:{}, sec:{}, selBr:{}, qtyBr:{}, qtyEntry:{}, skip:{}, userPick:{} };
const [lastSavedByType, setLastSavedByType] = useState({
  re: { ...EMPTY_SNAPSHOT },
  ws: { ...EMPTY_SNAPSHOT },
  ot: { ...EMPTY_SNAPSHOT },
});

  const [savingDay, setSavingDay] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const isSaving = savingDay || savingAll;

  const clickGuardRef = useRef(0);
  const swiperRef = useRef(null);

  const [stayOnChooseByType, setStayOnChooseByType] = useState({ re: false, ws: false, ot: false });
  const [editingDayByType, setEditingDayByType] = useState({ re: null, ws: null, ot: null });
  const [editBackupByType, setEditBackupByType] = useState({ re: {}, ws: {}, ot: {} });

  const [pageLoading, setPageLoading] = useState(false);
  const [notice, setNotice] = useState({ open: false, title: "", message: "" });
  const [activeSlide, setActiveSlide] = useState(0);

  // Load tuần + selections
  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const menu = await apiGetWeeklyMenuLatest();
        if (!menu) { setWeeklyMenu(null); return; }
        setWeeklyMenu(menu);

        const rows = await apiGetSelections(menu.weeklyMenuId, tmp?.login?.currentUser?.userID);
        const entryMap = {};
        (menu.entries || []).forEach((e) => (entryMap[e.weeklyMenuEntryId] = e));

        const activeByType = { re: {}, ws: {}, ot: {} };
        const secByType = { re: {}, ws: {}, ot: {} };
        const selBrByType = { re: {}, ws: {}, ot: {} };
        const qtyBrByType = { re: {}, ws: {}, ot: {} };
        const qtyEntryInit = { re: {}, ws: {}, ot: {} };

        // Với user thường: khởi tạo userPick=0 (chung) nếu thấy bản ghi không branch
        const userPickInit = { re: {}, ws: {}, ot: {} };

        rows.forEach(([entryId, isAction, q, branchId]) => {
          const entry = entryMap[entryId];
          if (!entry) return;
          const day = entry.dayOfWeek;
          const type = (entry.statusType || "re").toLowerCase();

          if (isAction) {
            if (!activeByType[type][day]) activeByType[type][day] = entryId;
            (secByType[type][day] ||= {})[entryId] = true;

            const bId = Number(branchId) || null;
            const qty = Number.isFinite(+q) && +q > 0 ? +q : 1;

            if (bId) {
              (selBrByType[type][day] ||= {})[entryId] ||= {};
              selBrByType[type][day][entryId][bId] = true;
              (qtyBrByType[type][day] ||= {})[entryId] ||= {};
              qtyBrByType[type][day][entryId][bId] = qty;
            } else {
              (qtyEntryInit[type][day] ||= {})[entryId] = qty;
            }
          }
        });

        // đảm bảo mở panel có qty/chung
        Object.keys(secByType).forEach(t => {
          Object.keys(secByType[t] || {}).forEach(day => {
            (qtyEntryInit[t][day] ||= {});
            Object.keys(secByType[t][day] || {}).forEach(eidStr => {
              const eid = Number(eidStr);
              if (!Number.isFinite(qtyEntryInit[t][day][eid])) qtyEntryInit[t][day][eid] = 0;
            });
          });
        });

        setSelectedByType(activeByType);
        setSelectedSecByType(secByType);
        setSelectedBranchesByType(selBrByType);
        setQtyBranchesByType(qtyBrByType);
        setQtyEntryByType(qtyEntryInit);
        setUserPickByType(prev => ({ ...prev, ...userPickInit }));
        setSkipSecByType({ re: {}, ws: {}, ot: {} });

        setLastSavedByType({
  re: {
    user: { ...(activeByType.re || {}) },
    sec: { ...(secByType.re || {}) },
    selBr: { ...(selBrByType.re || {}) },
    qtyBr: { ...(qtyBrByType.re || {}) },
    qtyEntry: { ...(qtyEntryInit.re || {}) },
    skip: {},
    userPick: { ...(userPickInit.re || {}) },
  },
  ws: {
    user: { ...(activeByType.ws || {}) },
    sec: { ...(secByType.ws || {}) },
    selBr: { ...(selBrByType.ws || {}) },
    qtyBr: { ...(qtyBrByType.ws || {}) },
    qtyEntry: { ...(qtyEntryInit.ws || {}) },
    skip: {},
    userPick: { ...(userPickInit.ws || {}) },
  },
  ot: {
    user: { ...(activeByType.ot || {}) },
    sec: { ...(secByType.ot || {}) },
    selBr: { ...(selBrByType.ot || {}) },
    qtyBr: { ...(qtyBrByType.ot || {}) },
    qtyEntry: { ...(qtyEntryInit.ot || {}) },
    skip: {},
    userPick: { ...(userPickInit.ot || {}) },
  },
});
      } finally {
        setPageLoading(false);
      }
    }
    if (tmp?.login?.currentUser?.userID) load();
  }, [tmp?.login?.currentUser?.userID]);

  // Derived
  const entriesById = useMemo(() => buildEntriesById(weeklyMenu), [weeklyMenu]);
  const cmpByPositionId = useMemo(() => buildCmpByPositionId(entriesById), [entriesById]);

  const grouped = useMemo(() => {
    const entries = weeklyMenu?.entries ?? [];
    const type = (orderType || "re").toLowerCase();
    const filtered = entries.filter(e => (e.statusType || "re").toLowerCase() === type);
    const acc = filtered.reduce((acc2, e) => {
      (acc2[e.dayOfWeek] ||= []).push(e);
      return acc2;
    }, {});
    Object.keys(acc).forEach(d => { acc[d].sort(cmpByPositionEntry); });
    return acc;
  }, [weeklyMenu, orderType]);

  const sortedDays = useMemo(() => Object.keys(grouped).sort((a, b) => Number(a) - Number(b)), [grouped]);

  const selected = selectedByType[orderType] || {};
  const selectedSec = selectedSecByType[orderType] || {};
  const selectedBr = selectedBranchesByType[orderType] || {};
  const qtyBr = qtyBranchesByType[orderType] || {};
  const qtyEntry = qtyEntryByType[orderType] || {};
  const skipSecDays = skipSecByType[orderType] || {};
  const userPick = userPickByType[orderType] || {};
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

  // Required
  const requiredDays = useMemo(() => {
    if (!weeklyMenu) return [];
    const base = new Date(weeklyMenu.weekStartMonday);
    if (Number.isNaN(base.getTime())) return sortedDays;
    const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
    const base00 = new Date(base); base00.setHours(0, 0, 0, 0);
    return sortedDays.filter((d) => {
      const dd = new Date(base00); dd.setDate(base00.getDate() + (Number(d) - 1));
      return dd.getTime() > endOfToday.getTime();
    });
  }, [weeklyMenu, sortedDays]);

  const hasChosenRequired = useMemo(() => {
    const days = requiredDays;
    if (!days.length) return true;
    if (isSec) {
      return days.every((d) => skipSecDays[d] === true || Object.keys(selectedSec[d] || {}).length > 0);
    }
    return days.every((d) => Object.prototype.hasOwnProperty.call(selected, d));
  }, [requiredDays, selected, selectedSec, skipSecDays, isSec]);

  // Guard
  const handleCardClick = (day, eid, disabled) => {
    if (disabled) return;
    const now = Date.now();
    if (now - clickGuardRef.current < 350) return;
    clickGuardRef.current = now;
    choose(day, eid);
  };

  const ALL_TYPES = ["re", "ws", "ot"];

const flushOtherTypes = useCallback((keepType) => {
  const others = ALL_TYPES.filter(t => t !== keepType);

  // 🔄 Khôi phục về trạng thái đã LƯU gần nhất (không xoá trắng)
  setSelectedByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.user || {}) }; });
    return n;
  });
  setUserPickByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.userPick || {}) }; });
    return n;
  });

  setSelectedSecByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.sec || {}) }; });
    return n;
  });
  setSelectedBranchesByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.selBr || {}) }; });
    return n;
  });
  setQtyBranchesByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.qtyBr || {}) }; });
    return n;
  });
  setQtyEntryByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.qtyEntry || {}) }; });
    return n;
  });
  setSkipSecByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...(lastSavedByType[t]?.skip || {}) }; });
    return n;
  });

  // 🔧 Chỉ reset UI flags/backup (đúng yêu cầu "xoá nháp")
  setResetModeByType(p => { const n = { ...p }; others.forEach(t => { n[t] = false; }); return n; });
  setStayOnChooseByType(p => { const n = { ...p }; others.forEach(t => { n[t] = false; }); return n; });
  setEditingDayByType(p => { const n = { ...p }; others.forEach(t => { n[t] = null; }); return n; });
  setEditBackupByType(p => { const n = { ...p }; others.forEach(t => { n[t] = {}; }); return n; });
  setBackupByType(p => {
    const n = { ...p };
    others.forEach(t => { n[t] = { ...EMPTY_SNAPSHOT }; });
    return n;
  });
}, [lastSavedByType]);


  // Reset
  const enterResetMode = useCallback(() => {
    setBackupByType((prev) => ({
      ...prev,
      [orderType]: {
        user: { ...(selectedByType[orderType] || {}) },
        sec: { ...(selectedSecByType[orderType] || {}) },
        selBr: { ...(selectedBranchesByType[orderType] || {}) },
        qtyBr: { ...(qtyBranchesByType[orderType] || {}) },
        qtyEntry: { ...(qtyEntryByType[orderType] || {}) },
        skip: { ...(skipSecByType[orderType] || {}) },
        userPick: { ...(userPickByType[orderType] || {}) },
      },
    }));
    if (isSec) {
      setSelectedSecByType((p) => ({ ...p, [orderType]: {} }));
      setSelectedBranchesByType((p)=>({ ...p, [orderType]: {} }));
      setQtyBranchesByType((p)=>({ ...p, [orderType]: {} }));
      setQtyEntryByType((p)=>({ ...p, [orderType]: {} }));
      setSkipSecByType((p) => ({ ...p, [orderType]: {} }));
    } else {
      setSelectedByType((p) => ({ ...p, [orderType]: {} }));
      setUserPickByType((p) => ({ ...p, [orderType]: {} }));
    }
    setResetModeByType((p) => ({ ...p, [orderType]: true }));
    if (swiperRef.current?.slideTo) swiperRef.current.slideTo(0);
  }, [orderType, isSec, selectedByType, selectedSecByType, selectedBranchesByType, qtyBranchesByType, qtyEntryByType, skipSecByType, userPickByType]);

  const exitResetMode = useCallback((restore = true) => {
    if (restore) {
      const b = backupByType[orderType] || { user: {}, sec: {}, selBr: {}, qtyBr: {}, qtyEntry: {}, skip: {}, userPick: {} };
      if (isSec) {
        setSelectedSecByType((p) => ({ ...p, [orderType]: { ...(b.sec || {}) } }));
        setSelectedBranchesByType((p)=>({ ...p, [orderType]: { ...(b.selBr || {}) } }));
        setQtyBranchesByType((p)=>({ ...p, [orderType]: { ...(b.qtyBr || {}) } }));
        setQtyEntryByType((p)=>({ ...p, [orderType]: { ...(b.qtyEntry || {}) } }));
        setSkipSecByType((p) => ({ ...p, [orderType]: { ...(b.skip || {}) } }));
      } else {
        setSelectedByType((p) => ({ ...p, [orderType]: { ...(b.user || {}) } }));
        setUserPickByType((p) => ({ ...p, [orderType]: { ...(b.userPick || {}) } }));
      }
    }
    setResetModeByType((p) => ({ ...p, [orderType]: false }));
    setStayOnChooseByType(p => ({ ...p, [orderType]: false }));
  }, [backupByType, orderType, isSec]);

  // Build selections (thư ký)
  const buildSelections = useCallback((typeKey, onlyDay = null) => {
    const openCards = selectedSecByType[typeKey] || {};
    const selBr = selectedBranchesByType[typeKey] || {};
    const qBr  = qtyBranchesByType[typeKey] || {};
    const qEntry = qtyEntryByType[typeKey] || {};

    const days = onlyDay ? [onlyDay] : Object.keys(openCards);
    const selections = [];

    for (const d of days) {
      const entriesOfDay = openCards[d] || {};
      for (const eidStr of Object.keys(entriesOfDay)) {
        const eid = Number(eidStr);
        const brMap = selBr?.[d]?.[eid] || {};
        const qMap  = qBr?.[d]?.[eid] || {};
        const chosenBranches = Object.keys(brMap);

        const q0 = parseInt(qEntry?.[d]?.[eid] ?? 0, 10);
        const qCommon = Number.isFinite(q0) ? Math.max(0, q0) : 0;
        if (qCommon > 0) selections.push({ entryId: eid, quantity: qCommon });

        for (const bidStr of chosenBranches) {
          const bid = Number(bidStr);
          const q = Math.max(1, parseInt(qMap[bid] ?? 1, 10));
          selections.push({ entryId: eid, quantity: q, branchId: bid });
        }
      }
    }
    return selections;
  }, [selectedSecByType, selectedBranchesByType, qtyBranchesByType, qtyEntryByType]);

  // Edit per day (giữ nguyên)
  function startEditDay(day) {
    if (!canModifyDayByMode(Number(day))) {
      setNotice({ open: true, title: "Không thể đổi", message: "Đã quá hạn 9:00 cho ngày này nên không thể đổi." });
      return;
    }
    setEditBackupByType(prev => {
      const perType = prev[orderType] || {};
      const backup = isSec
        ? {
            sec: { ...(selectedSecByType[orderType]?.[day] || {}) },
            selBr: { ...(selectedBranchesByType[orderType]?.[day] || {}) },
            qtyBr: { ...(qtyBranchesByType[orderType]?.[day] || {}) },
            qtyEntry: { ...(qtyEntryByType[orderType]?.[day] || {}) },
            skip: !!(skipSecByType[orderType]?.[day]),
          }
        : {
            user: selectedByType[orderType]?.[day] ?? null,
            userPick: { ...(userPickByType[orderType]?.[day] || {}) },
          };
      return { ...prev, [orderType]: { ...perType, [day]: backup } };
    });
    setEditingDayByType(p => ({ ...p, [orderType]: String(day) }));
    setStayOnChooseByType(p => ({ ...p, [orderType]: true }));
    const idx = sortedDays.indexOf(String(day));
    if (idx >= 0 && swiperRef.current?.slideTo) swiperRef.current.slideTo(idx);
  }

  function cancelEditDay() {
    const day = editingDay;
    if (!day) return;
    const b = editBackupByType[orderType]?.[day];
    if (isSec) {
      // restore thư ký
      setSelectedSecByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b?.sec && Object.keys(b.sec).length) cur[day] = { ...b.sec }; else delete cur[day]; next[orderType] = cur; return next; });
      setSelectedBranchesByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b?.selBr && Object.keys(b.selBr).length) cur[day] = { ...b.selBr }; else delete cur[day]; next[orderType] = cur; return next; });
      setQtyBranchesByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b?.qtyBr && Object.keys(b.qtyBr).length) cur[day] = { ...b.qtyBr }; else delete cur[day]; next[orderType] = cur; return next; });
      setQtyEntryByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b?.qtyEntry && Object.keys(b.qtyEntry).length) cur[day] = { ...b.qtyEntry }; else delete cur[day]; next[orderType] = cur; return next; });
      setSkipSecByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b?.skip) cur[day] = true; else delete cur[day]; next[orderType] = cur; return next; });
    } else {
      // restore user
      setSelectedByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b && ("user" in b)) { if (b.user === null || b.user === undefined) delete cur[day]; else cur[day] = b.user; }
        next[orderType] = cur; return next; });
      setUserPickByType(prev => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) };
        if (b?.userPick) cur[day] = { ...b.userPick }; else delete cur[day]; next[orderType] = cur; return next; });
    }
    setEditingDayByType(p => ({ ...p, [orderType]: null }));
    setStayOnChooseByType(p => ({ ...p, [orderType]: false }));
    setEditBackupByType(prev => {
      const perType = { ...(prev[orderType] || {}) }; delete perType[day];
      return { ...prev, [orderType]: perType };
    });
  }

  async function saveEditDay() {
    if (savingDay) return;
    setSavingDay(true);
    try {
         let selections;
   if (isSec) {
     // Thư ký: build toàn tuần (qty chung  nhiều branch)
     selections = buildSelections(orderType); // KHÔNG truyền onlyDay
   } else {
     // User thường: mỗi ngày 1 entry  optional branchId (toàn tuần)
     selections = Object.entries(selectedByType[orderType] || {})
       .map(([d, eid]) => {
         const picked = userPickByType[orderType]?.[d]?.[eid];
         return picked > 0
           ? { entryId: Number(eid), branchId: Number(picked) }
           : Number(eid);
       })
       .filter(Boolean);
   }

   await apiSaveSelections({
     userId: user.userID,
     weeklyMenuId: weeklyMenu.weeklyMenuId,
     statusType: orderType,
     selections,
     createdBy: user.fullName,
   });

   // ✅ Cập nhật snapshot đã LƯU cho loại hiện tại
setLastSavedByType(prev => {
  const next = { ...prev };
  if (isSec) {
    next[orderType] = {
      user: {}, // không dùng cho thư ký
      sec: { ...(selectedSecByType[orderType] || {}) },
      selBr: { ...(selectedBranchesByType[orderType] || {}) },
      qtyBr: { ...(qtyBranchesByType[orderType] || {}) },
      qtyEntry: { ...(qtyEntryByType[orderType] || {}) },
      skip: { ...(skipSecByType[orderType] || {}) },
      userPick: {}, // không dùng cho thư ký
    };
  } else {
    next[orderType] = {
      user: { ...(selectedByType[orderType] || {}) },
      sec: {},
      selBr: {},
      qtyBr: {},
      qtyEntry: {},
      skip: {},
      userPick: { ...(userPickByType[orderType] || {}) },
    };
  }
  return next;
});

      setNotice({ open: true, title: "Đã lưu", message: "Cập nhật món theo ngày thành công." });
      setEditingDayByType(p => ({ ...p, [orderType]: null }));
      setStayOnChooseByType(p => ({ ...p, [orderType]: false }));
      setEditBackupByType(prev => {
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

  // Chọn món
  function choose(day, entryId) {
    if (weeklyMenu?.isLocked) return;

    if (isSec) {
      // (giữ nguyên thư ký)
      setStayOnChooseByType(p => ({ ...p, [orderType]: true }));
      if (entryId === null) {
        setSelectedSecByType((prev) => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) }; if (cur[day]) delete cur[day]; next[orderType] = cur; return next; });
        setSelectedBranchesByType((prev) => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) }; if (cur[day]) delete cur[day]; next[orderType] = cur; return next; });
        setQtyBranchesByType((prev) => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) }; if (cur[day]) delete cur[day]; next[orderType] = cur; return next; });
        setQtyEntryByType((prev) => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) }; if (cur[day]) delete cur[day]; next[orderType] = cur; return next; });
        setSkipSecByType((prev) => { const next = { ...prev }; next[orderType] = { ...(next[orderType] || {}), [day]: true }; return next; });
        return;
      }
      setSkipSecByType((prev) => { const next = { ...prev }; const cur = { ...(next[orderType] || {}) }; if (cur[day]) delete cur[day]; next[orderType] = cur; return next; });
      setSelectedSecByType((prev) => {
        const next = { ...prev };
        const cur = { ...(next[orderType] || {}) };
        const dayMap = { ...(cur[day] || {}) };
        if (dayMap[entryId]) { delete dayMap[entryId]; if (!Object.keys(dayMap).length) delete cur[day]; else cur[day] = dayMap; }
        else { dayMap[entryId] = true; cur[day] = dayMap;
          setQtyEntryByType(prev2 => { const n = { ...prev2 }; const byType = { ...(n[orderType] || {}) };
            const byDay = { ...(byType[day] || {}) }; if (!Number.isFinite(byDay[entryId])) byDay[entryId] = 0; byType[day] = byDay; n[orderType] = byType; return n; });
        }
        next[orderType] = cur; return next;
      });
      return;
    }

    // Người dùng thường: chọn entry và mở panel; khởi tạo "chung" nếu chưa có
    setStayOnChooseByType(p => ({ ...p, [orderType]: true }));
    setSelectedByType((prev) => {
      const next = { ...prev };
      next[orderType] = { ...(next[orderType] || {}), [day]: entryId };
      return next;
    });
    setUserPickByType(prev => {
      const n = { ...prev };
      const byType = { ...(n[orderType] || {}) };
      const byDay = { ...(byType[day] || {}) };
      byType[day] = byDay;
      n[orderType] = byType;
      return n;
    });

    const swiper = swiperRef.current;
    if (swiper && typeof swiper.activeIndex === "number") {
      const isLast = swiper.activeIndex >= swiper.slides.length - 1;
      if (!isLast && !editingDay) setTimeout(() => swiper.slideNext(), 250);
    }
  }

  // Lưu theo loại hiện tại
  async function handleSave() {
    if (!weeklyMenu || weeklyMenu?.isLocked) return;
    if (savingAll) return;
    setSavingAll(true);
    try {
      let selections;
      if (isSec) {
        selections = buildSelections(orderType);
      } else {
        // build toàn tuần cho user: mỗi ngày 1 entry + optional branchId
        selections = Object.entries(selectedByType[orderType] || {})
          .map(([d, eid]) => {
            const picked = userPickByType[orderType]?.[d]?.[eid];
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
      });

      // ✅ Cập nhật snapshot đã LƯU cho loại hiện tại
setLastSavedByType(prev => {
  const next = { ...prev };
  if (isSec) {
    next[orderType] = {
      user: {}, // không dùng cho thư ký
      sec: { ...(selectedSecByType[orderType] || {}) },
      selBr: { ...(selectedBranchesByType[orderType] || {}) },
      qtyBr: { ...(qtyBranchesByType[orderType] || {}) },
      qtyEntry: { ...(qtyEntryByType[orderType] || {}) },
      skip: { ...(skipSecByType[orderType] || {}) },
      userPick: {}, // không dùng cho thư ký
    };
  } else {
    next[orderType] = {
      user: { ...(selectedByType[orderType] || {}) },
      sec: {},
      selBr: {},
      qtyBr: {},
      qtyEntry: {},
      skip: {},
      userPick: { ...(userPickByType[orderType] || {}) },
    };
  }
  return next;
});


      setNotice({ open: true, title: "Thành công", message: "Lưu đặt cơm thành công!" });
      if (resetMode) setResetModeByType((p) => ({ ...p, [orderType]: false }));
      setStayOnChooseByType(p => ({ ...p, [orderType]: false }));
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không thể lưu đặt cơm." });
    } finally {
      setSavingAll(false);
    }
  }

  function askCancel(entryId, day, foodName) {
    if (!canModifyDayByMode(Number(day))) {
      setNotice({ open: true, title: "Không thể huỷ", message: "Đã quá hạn nên không thể huỷ nữa." });
      return;
    }
    setCancelConfirm({ open: true, entryId, day, foodName, busy: false });
  }

  const [cancelConfirm, setCancelConfirm] = useState({
    open: false, entryId: null, day: null, foodName: "", busy: false,
  });

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

      setSelectedByType((prev) => {
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

  if (pageLoading)
    return (
      <div className="p-6 text-emerald-600">
        <FaSpinner className="animate-spin inline-block mr-2" />
        Đang tải...
      </div>
    );

  if (!weeklyMenu) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-lime-50 to-teal-50 pt-3">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />

      {/* Push banner */}
      {!pushChecking && !pushReady && (
        <div className="mx-[10px] mb-4 group">
          <div className="relative rounded-2xl border border-emerald-200/60 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300">
            {/* subtle gradient header strip */}
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-lime-400" />
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-300/40">
                    <FiBell className="text-emerald-600 text-xl" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-base md:text-lg">
                      Bật thông báo đặt cơm
                    </div>
                    <div className="text-sm text-slate-600">
                      Nhận nhắc lịch chọn món / khóa menu ngay cả khi bạn không mở trang.
                    </div>

                    {/* status / errors */}
                    {notifPerm === "denied" && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm text-red-700 ring-1 ring-red-200">
                        <FiAlertTriangle />
                        <span>Bạn đang chặn thông báo. Hãy bật lại trong cài đặt trình duyệt.</span>
                      </div>
                    )}

                    {pushError && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-sm text-red-700 ring-1 ring-red-200">
                        <FiAlertTriangle />
                        <span>{pushError}</span>
                      </div>
                    )}

                    {pushStatus && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
                        <FiCheckCircle />
                        <span>{pushStatus}</span>
                      </div>
                    )}

                    {/* small helper line */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <FiInfo className="opacity-80" />
                      <span>Có thể tắt bất kỳ lúc nào trong phần Cài đặt trình duyệt.</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={enablePush}
                  disabled={pushBusy || (isIOS && !isStandalone)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-white",
                    "bg-gradient-to-r from-emerald-500 to-teal-500",
                    "shadow-sm hover:shadow md:active:scale-[0.98]",
                    "transition-all focus:outline-none focus:ring-2 focus:ring-emerald-300",
                    "disabled:cursor-not-allowed disabled:opacity-60"
                  ].join(" ")}
                  title={isIOS && !isStandalone ? "Hãy thêm trang ra màn hình chính để bật thông báo trên iOS" : ""}
                >
                  {pushBusy ? <FaSpinner className="animate-spin" /> : <FiBell />}
                  <span>Bật thông báo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      <div className="mx-[10px]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-xl p-8 md:p-10 shadow-sm">
          <div className="mb-3 text-2xl font-semibold text-slate-800 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5">
              🍱
            </span>
            Chưa có thực đơn tuần này
          </div>
          <p className="text-slate-600">
            Quản trị viên chưa đăng thực đơn. Bạn có thể bật thông báo để nhận tin khi menu được cập nhật.
          </p>

          {/* gentle divider */}
          <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* quick tips */}
          <ul className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Kiểm tra lại vào đầu tuần (thường đăng vào sáng thứ Hai).
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Nhấn “Bật thông báo” để không bỏ lỡ thời điểm khóa menu.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

  const editingBannerVisible = !!editingDay;
  const daysToRender = editingDay ? [String(editingDay)] : sortedDays;

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-emerald-100 via-teal-50 to-lime-100 pt-[10px]">
      {/* Overlay khi lưu */}
      {isSaving && (
        <div className="fixed inset-0 z-[60] bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-3 py-2 rounded-full bg-white/90 border border-slate-200 shadow-md text-slate-700 text-sm flex items-center gap-2">
            <FaSpinner className="animate-spin" />
            <span>Đang lưu thay đổi...</span>
          </div>
        </div>
      )}

      {/* Push info */}
      {!pushChecking && !editingBannerVisible && (
        <div className="mx-2 mb-3 rounded-2xl bg-white/80 backdrop-blur border border-slate-200 shadow-sm p-3 flex items-center justify-between">
          <div className="text-sm text-slate-700">
            {pushReady ? "Đang bật thông báo đặt cơm" : "Bạn có thể bật thông báo để được nhắc khi có menu/khoá menu"}
          </div>
          <div className="flex gap-2">
            <button onClick={enablePush} disabled={pushBusy || pushReady}
              className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-emerald-500/90 text-white text-[12px] shadow-sm hover:shadow transition-shadow hover:bg-emerald-500 disabled:opacity-50">
              Bật thông báo
            </button>
            {pushReady && (
              <button onClick={disablePush} disabled={pushBusy}
                className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-xl bg-white text-slate-700 text-[12px] border border-slate-200 hover:bg-slate-50 shadow-sm transition">
                Tắt
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reset bar */}
      {resetMode && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 shadow-lg backdrop-blur-sm flex items-center gap-3">
          <span className="text-xs font-medium">Đang ở chế độ đặt lại – các thay đổi chưa lưu</span>
          <button onClick={() => exitResetMode(true)}
            className="inline-flex items-center justify-center px-3 h-8 rounded-full text-xs bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 transition shadow-sm">
            Tắt đặt lại
          </button>
        </div>
      )}

      {/* Editing banner */}
      {editingBannerVisible && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-2 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-lg backdrop-blur-sm flex items-center gap-2">
          <span className="text-xs font-medium">Đang đổi: {dayNameVN(editingDay)}</span>
          <button onClick={cancelEditDay} disabled={isSaving}
            className="inline-flex items-center justify-center px-3 h-8 rounded-full text-xs bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-60">
            Huỷ đổi
          </button>
          <button onClick={saveEditDay} disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-3 h-8 rounded-full text-xs text-white bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-60">
            {savingDay && <FaSpinner className="animate-spin" />} Lưu thay đổi
          </button>
        </div>
      )}

      {/* Toggle loại */}
      {!resetMode && !editingBannerVisible && (
        <div className="mx-[10px] mb-3">
          <div className="relative inline-flex bg-white/70 backdrop-blur rounded-xl p-1 border border-slate-200 shadow-sm">
            {[
              { k: "re", label: "Ca ngày" },
              { k: "ws", label: "Đi ca" },
              { k: "ot", label: "Tăng ca" },
            ].map(t => (
              <button key={t.k}
                   onClick={() => {
                    setOrderType(t.k);
                    // dọn nháp của 2 bên còn lại
                    flushOtherTypes(t.k);
                    // UI cho tab hiện tại
                    setStayOnChooseByType(p => ({ ...p, [t.k]: false }));
                    setEditingDayByType(p => ({ ...p, [t.k]: null }));
                    if (swiperRef.current?.slideTo) swiperRef.current.slideTo(0);
                  }}
                className={`relative z-10 px-4 py-2 text-sm rounded-lg transition ${orderType === t.k ? "text-emerald-800 font-semibold" : "text-slate-600 hover:text-slate-800"}`}
                style={{ minWidth: 120 }}>
                {t.label}
                {orderType === t.k && (
                  <motion.span layoutId="pill-orderType" className="absolute inset-0 -z-10 rounded-lg bg-white shadow"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ĐÃ ĐẶT (tóm tắt) */}
      {hasOrderedForType && !resetMode && !stayOnChooseByType[orderType] ? (
        <div className="relative bg-white/70 backdrop-blur rounded-2xl border border-white/40 shadow-xl p-4 sm:p-6 mx-2 sm:mx-[10px]">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-slate-800">Bạn đã đặt cơm tuần này</h3>
          <ul className="space-y-2 sm:space-y-3">
            {sortedDays.map((day) => {
              const dayEntries = isSec
                ? Object.keys(selectedSec[day] || {}).map(Number).sort(cmpByPositionId)
                : [selected[day]].filter((v) => v !== undefined && v !== null);

              const canChangeThisDay = canModifyDayByMode(Number(day));

                // Thông tin phục vụ nút Huỷ (chỉ áp dụng user thường)
  const chosenEid = !isSec ? (selected[day] ?? null) : null;
  const chosenEntry = (!isSec && chosenEid)
    ? (weeklyMenu?.entries || []).find(x => x.weeklyMenuEntryId === chosenEid)
    : null;
  const canCancelThisDay = canCancelDay(Number(day));


              return (
                <li key={day} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="sm:col-span-2 flex items-center">
                    <button onClick={() => startEditDay(day)}
                      className="inline-flex shrink-0 px-2 py-1 rounded-md border text-sm font-medium bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      title="Sửa ngày này">
                      {dayNameVN(day)}
                    </button>
                  </div>

                  <div className="sm:col-span-8 min-w-0">
                    {isSec && (skipSecDays[day] === true) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-sm">Không chọn</span>
                    ) : dayEntries.length > 0 ? (
                      <div className="flex flex-wrap gap-2 -m-1 max-w-full">
                        {dayEntries.map((eid) => {
                          const e = (weeklyMenu?.entries ?? []).find((x) => x.weeklyMenuEntryId === eid);
                          if (!e || (e.statusType || "re").toLowerCase() !== orderType) return null;

                          if (!isSec) {
  const pick = Number(userPick[day]?.[eid]) || 0;
  const br = pick > 0 ? (e.branches || []).find(x => x.branchId === pick) : null;

  return (
    <span
      key={eid}
      className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm"
    >
      <span className="font-medium text-slate-700">{e?.foodName}</span>
      {pick > 0 && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          {br?.branchName || br?.branchCode || `#${pick}`}
        </span>
      )}
    </span>
  );
}

                          // Thư ký – giữ chip cũ
                          const brMap = selectedBr[day]?.[eid] || {};
                          const qMap = qtyBr[day]?.[eid] || {};
                          const list = Object.keys(brMap).map(Number);
                          const qCommon = qtyEntry[day]?.[eid];

                          return (
                            <div key={eid} className="m-1">
                              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200 shadow-sm">
                                <span className="font-medium text-slate-700">{e?.foodName}</span>
                                {(Number.isFinite(qCommon) && qCommon > 0) && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                    SL: {qCommon}
                                  </span>
                                )}
                                {list.map(bid => {
                                  const br = (e.branches || []).find(x => x.branchId === bid);
                                  const label = br?.branchName || br?.branchCode || `#${bid}`;
                                  return (
                                    <span key={bid} className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {label} ×{qMap[bid] ?? 1}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Không chọn</span>
                    )}
                  </div>

                  <div className="sm:col-span-2 flex items-start sm:justify-end gap-2">
  {/* Nút Huỷ món (chỉ hiển thị cho user thường) */}
{!isSec && (
  <button
    onClick={() => askCancel(chosenEid, day, chosenEntry?.foodName || "")}
    disabled={!chosenEid || !canCancelThisDay}
    className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap
      shadow-sm transition
      ${(!chosenEid || !canCancelThisDay)
        ? "bg-rose-300 text-white/90 cursor-not-allowed"
        : "bg-rose-500/90 hover:bg-rose-500 text-white hover:shadow"}`}
    title={!chosenEid ? "Chưa chọn món ở ngày này" : (!canCancelThisDay ? "Đã quá hạn huỷ" : "Huỷ món ngày này")}
  >
    Huỷ món
  </button>
)}

{/* Nút Sửa ngày */}
<button
  onClick={() => startEditDay(day)}
  disabled={!canChangeThisDay}
  className={`inline-flex h-10 items-center justify-center rounded-2xl text-sm font-medium px-4 whitespace-nowrap
    shadow-sm transition
    ${canChangeThisDay
      ? "bg-emerald-500/90 hover:bg-emerald-500 text-white hover:shadow"
      : "bg-emerald-300 text-white/90 cursor-not-allowed"}`}
  title={canChangeThisDay ? "Sửa món ngày này" : "Đã quá hạn đổi"}
>
  Sửa ngày
</button>

</div>

                </li>
              );
            })}
          </ul>

          {!weeklyMenu?.isLocked && (
            <div className="mt-4 sm:mt-6 flex">
              <button onClick={enterResetMode}
                className="inline-flex items-center justify-center w-full sm:w-auto sm:ml-auto px-5 sm:px-6 py-3 rounded-xl bg-amber-500/90 hover:bg-amber-500 text-white gap-2 shadow-sm hover:shadow transition-shadow">
                <FaRedo /> Đặt lại
              </button>
            </div>
          )}
        </div>
      ) : (
        // Màn chọn món
        <div className="w-full p-6 mx-[10px]">
          <Swiper
            onSwiper={(s) => (swiperRef.current = s)}
            ref={swiperRef}
            spaceBetween={24}
            slidesPerView={1}
            className="rounded-2xl"
            onSlideChange={(s) => setActiveSlide(s.activeIndex)}
          >
            {daysToRender.map((day) => {
              const items = grouped[day];
              const canChangeThisDay = canModifyDayByMode(Number(day));
              return (
                <SwiperSlide key={day}>
                  <div className="pb-5">
                    <h3 className="text-xl font-semibold text-slate-800 mb-6 text-center">{dayNameVN(day)}</h3>

                    <div className="flex justify-center">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 justify-items-center">
                        {items.map((item) => {
                          const eid = item.weeklyMenuEntryId;
                          const checked = isSec ? !!(selectedSec[day]?.[eid]) : selected[day] === eid;
                          // 🔁 showPanel cho cả user & thư ký khi card được chọn
                          const showPanel = checked;
                          const disabled = weeklyMenu?.isLocked || !canChangeThisDay || isSaving;

                          const userPicked = userPick[day]?.[eid] ?? 0;

                          return (
                            <motion.div
                              key={eid}
                              whileTap={{ scale: 0.97 }}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleCardClick(day, eid, disabled)}
                              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled) handleCardClick(day, eid, disabled); }}
                              className={`toy-card relative w-[220px] text-left cursor-pointer transition
                                ${checked ? "ring-2 ring-emerald-400" : "ring-1 ring-white/50"}
                                ${disabled ? "opacity-50 pointer-events-none" : ""}
                                bg-white/80 backdrop-blur border border-white/60 shadow-sm
                                rounded-[24px] flex flex-col
                              `}
                              style={{ minHeight: showPanel ? 320 : 270 }}
                            >
                              {/* Header */}
                              <div className="px-4 pt-3 pb-2">
                                <div className="flex items-center gap-3">
                                  <div className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-100 shadow-inner text-slate-700">
                                    {getFoodIcon(item.foodName)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[10px] uppercase tracking-widest text-slate-500">Món ăn</div>
                                    <div className="font-semibold text-slate-800 leading-tight line-clamp-2">{item.foodName}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Image */}
                              <div className={`mx-3 rounded-2xl bg-white/70 backdrop-blur border border-white/60 shadow-inner overflow-hidden
                                              ${showPanel ? "h-28" : "h-36"}`}>
                                {item.imageUrl
                                  ? <img src={item.imageUrl} alt={item.foodName} className="w-full h-full object-cover" />
                                  : <div className="text-slate-400 text-sm w-full h-full grid place-items-center">Chưa có hình</div>
                                }
                              </div>

                              {/* Status */}
                              <div className="px-4 pt-2">
                                <div className="flex items-center justify-between">
                                  <div className={`px-3 py-1 rounded-full text-[10px] font-medium
                                    ${checked ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300" : "bg-slate-100 text-slate-500"}`}>
                                    {checked ? (isSec ? "Đang chọn (thư ký)" : "Đã chọn") : "Chọn món"}
                                  </div>
                                  {checked && <FaCheck className="text-emerald-600" />}
                                </div>
                              </div>

                              {/* Panel chọn branch */}
                              {showPanel && (
                                <div className="mt-2 mx-3 mb-3 p-0 flex-1" onClick={(e)=>e.stopPropagation()} onMouseDown={(e)=>e.stopPropagation()}>
                                  {!isSec ? (
                                    // --- Người dùng thường: RADIO [Chung | 1 branch] ---
<div className="flex flex-col gap-2">
  {(item.branches || []).map((br, idx) => {
    const picked = userPick[day]?.[eid];       // undefined = CHUNG
    const active = picked === br.branchId;
    const pal = [
      { bg: "bg-sky-50", border: "border-sky-200", ring: "ring-sky-300/60", text: "text-sky-700" },
      { bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-300/60", text: "text-violet-700" },
      { bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-300/60", text: "text-amber-800" },
      { bg: "bg-teal-50", border: "border-teal-200", ring: "ring-teal-300/60", text: "text-teal-700" },
      { bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-300/60", text: "text-rose-700" },
    ][idx % 5];

    return (
      <button
        key={br.branchId}
        type="button"
        disabled={disabled}
        className={`w-full h-11 rounded-xl border flex items-center justify-center text-[14px] font-semibold transition
          ${active ? `${pal.bg} ${pal.text} ${pal.border} ring-1 ${pal.ring}`
                   : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"}`}
        onClick={() => {
          setUserPickByType(prev => {
            const n = { ...prev };
            const byType = { ...(n[orderType] || {}) };
            const byDay = { ...(byType[day] || {}) };
            // Toggle: nếu đang active → bỏ chọn (về CHUNG = undefined)
            if (byDay[eid] === br.branchId) delete byDay[eid];
            else byDay[eid] = br.branchId;
            if (Object.keys(byDay).length) byType[day] = byDay; else delete byType[day];
            n[orderType] = byType;
            return n;
          });
        }}
      >
        {br.branchName || br.branchCode || "Branch"}
      </button>
    );
  })}
</div>
                                  ) : (
                                    // --- Thư ký: giữ panel cũ (qty chung + nhiều branch + stepper) ---
                                    <div className="flex flex-col gap-2">
                                      {/* Qty chung */}
                                      <div className="flex items-center justify-center">
                                        <QuantityStepper
                                          value={qtyEntry?.[day]?.[eid] ?? 0}
                                          min={0}
                                          disabled={disabled}
                                          onChange={(v) => {
                                            const cur = qtyEntry?.[day]?.[eid] ?? 0;
                                            const next = parseInt(typeof v === "function" ? v(cur) : v, 10);
                                            const nextVal = Number.isFinite(next) ? Math.max(0, next) : 0;
                                            setQtyEntryByType(prev => {
                                              const n = { ...prev };
                                              const byType = { ...(n[orderType] || {}) };
                                              const byDay  = { ...(byType[day] || {}) };
                                              byDay[eid] = nextVal; byType[day] = byDay; n[orderType] = byType; return n;
                                            });
                                          }}
                                        />
                                      </div>

                                      {/* Branches thư ký */}
                                      {(item.branches || []).map((br, idx) => {
                                        const brSel  = !!(selectedBr[day]?.[eid]?.[br.branchId]);
                                        const qtyVal =  qtyBr[day]?.[eid]?.[br.branchId] ?? (brSel ? 1 : 0);
                                        const pal = [
                                          { bg: "bg-emerald-50", border: "border-emerald-200", ring: "ring-emerald-300/60", text: "text-emerald-700" },
                                          { bg: "bg-sky-50",     border: "border-sky-200",     ring: "ring-sky-300/60",     text: "text-sky-700" },
                                          { bg: "bg-violet-50",  border: "border-violet-200",  ring: "ring-violet-300/60",  text: "text-violet-700" },
                                          { bg: "bg-amber-50",   border: "border-amber-200",   ring: "ring-amber-300/60",   text: "text-amber-800" },
                                          { bg: "bg-teal-50",    border: "border-teal-200",    ring: "ring-teal-300/60",    text: "text-teal-700" },
                                          { bg: "bg-rose-50",    border: "border-rose-200",    ring: "ring-rose-300/60",    text: "text-rose-700" },
                                        ][idx % 6];

                                        return (
                                          <div key={br.branchId}
                                            className={`rounded-2xl transition-all p-2
                                              ${brSel ? `${pal.bg} border ${pal.border} ring-1 ${pal.ring}` : "border border-slate-200 bg-white/80"}`}>
                                            <button type="button" disabled={disabled}
                                              className={`w-full h-12 rounded-xl border flex items-center justify-center text-[14px] font-semibold transition
                                                ${brSel ? `bg-white ${pal.text} ${pal.border}` : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"}`}
                                              onClick={() => {
                                                if (disabled) return;
                                                setSelectedBranchesByType(prev => {
                                                  const n = { ...prev };
                                                  const byType = { ...(n[orderType] || {}) };
                                                  const byDay = { ...(byType[day] || {}) };
                                                  const byEntry = { ...(byDay[eid] || {}) };
                                                  if (byEntry[br.branchId]) delete byEntry[br.branchId];
                                                  else byEntry[br.branchId] = true;
                                                  if (!Object.keys(byEntry).length) delete byDay[eid]; else byDay[eid] = byEntry;
                                                  byType[day] = byDay; n[orderType] = byType; return n;
                                                });
                                                if (!brSel) {
                                                  setQtyBranchesByType(prev => {
                                                    const n = { ...prev };
                                                    const byType = { ...(n[orderType] || {}) };
                                                    const byDay = { ...(byType[day] || {}) };
                                                    const byEntry = { ...(byDay[eid] || {}) };
                                                    byEntry[br.branchId] = Math.max(1, parseInt(byEntry[br.branchId] ?? 1, 10));
                                                    byDay[eid] = byEntry; byType[day] = byDay; n[orderType] = byType; return n;
                                                  });
                                                }
                                              }}>
                                              {br.branchName || br.branchCode || "Branch"}
                                            </button>

                                            {brSel && (
                                              <div className="mt-2 flex items-center justify-center">
                                                <QuantityStepper
                                                  value={qtyVal}
                                                  min={1}
                                                  disabled={disabled}
                                                  onChange={(v) => {
                                                    const nextVal = Math.max(1, parseInt(typeof v === "function" ? v(qtyVal) : v, 10));
                                                    setQtyBranchesByType(prev => {
                                                      const n = { ...prev };
                                                      const byType = { ...(n[orderType] || {}) };
                                                      const byDay = { ...(byType[day] || {}) };
                                                      const byEntry = { ...(byDay[eid] || {}) };
                                                      byEntry[br.branchId] = nextVal; byDay[eid] = byEntry; byType[day] = byDay; n[orderType] = byType; return n;
                                                    });
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}

                              <span className="shine" />
                            </motion.div>
                          );
                        })}

                        {/* Không chọn (thư ký có thể skip ngày) */}
                        <motion.button
                          key={`none-${day}`}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleCardClick(day, null, (!canChangeThisDay || weeklyMenu?.isLocked || isSaving))}
                          onDoubleClick={(e) => e.preventDefault()}
                          onContextMenu={(e) => e.preventDefault()}
                          aria-pressed={isSec ? skipSecDays[day] === true : selected[day] === null}
                          title={(isSec ? skipSecDays[day] === true : selected[day] === null) ? "Đã chọn: Không ăn ngày này" : "Chọn: Không ăn ngày này"}
                          className={`toy-card relative w-[220px] h-[270px] rounded-[24px] grid place-items-center cursor-pointer
                            ${(isSec ? skipSecDays[day] === true : selected[day] === null) ? "ring-2 ring-rose-400" : "ring-1 ring-white/50"}
                            ${(!canChangeThisDay || weeklyMenu?.isLocked || isSaving) ? "opacity-50 pointer-events-none" : ""}
                            bg-white/90 backdrop-blur border border-white/60 shadow-sm`}
                        >
                          {(isSec ? skipSecDays[day] === true : selected[day] === null) && (
                            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700 border border-rose-200 shadow">
                              <FaCheck className="text-[9px]" /> Đã chọn
                            </span>
                          )}
                          <div className="text-center">
                            <span className={`text-3xl mx-auto mb-2 ${(isSec ? skipSecDays[day] === true : selected[day] === null) ? "text-rose-500" : "text-slate-400"}`}>🍽️</span>
                            <span className={`font-medium ${(isSec ? skipSecDays[day] === true : selected[day] === null) ? "text-rose-700" : "text-slate-600"}`}>Không chọn</span>
                            {(isSec ? skipSecDays[day] === true : selected[day] === null) && (
                              <div className="mt-1 text-[10px] text-rose-500/90">Sẽ không đặt cơm ngày này</div>
                            )}
                          </div>
                          {(isSec ? skipSecDays[day] === true : selected[day] === null) && <span className="absolute right-2 bottom-2 text-rose-500 opacity-80">✓</span>}
                          <span className="shine" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {(!weeklyMenu?.isLocked) && (activeSlide === daysToRender.length - 1) && (
            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={handleSave}
                disabled={savingAll || !hasChosenRequired}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm hover:shadow transition-shadow disabled:opacity-50"
              >
                {savingAll && <FaSpinner className="animate-spin" />}
                <FaSave /> {isSec ? "Lưu (thư ký)" : "Lưu đặt cơm"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <NoticeModal open={notice.open} title={notice.title} message={notice.message}
        onClose={() => setNotice({ ...notice, open: false })} />
      <ConfirmCancelModal
        open={cancelConfirm.open}
        foodName={cancelConfirm.foodName}
        dayText={cancelConfirm.day ? dayNameVN(cancelConfirm.day) : ""}
        busy={cancelConfirm.busy}
        onCancel={() => !cancelConfirm.busy && setCancelConfirm({ open: false, entryId: null, day: null, foodName: "", busy: false })}
        onConfirm={doCancelOne}
      />
    </div>
  );
}
