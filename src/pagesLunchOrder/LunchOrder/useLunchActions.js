// src/pages/Lunch/UserOrderSlide/useLunchActions.js
import { useCallback, useRef } from "react";
import { ALL_TYPES, EMPTY_SNAPSHOT } from "./constants";
import { apiSaveSelections } from "./api/lunchApi";

export function useLunchActions({
  // context
  isSec,
  user,
  weeklyMenu,

  // type/ui
  orderType,
  swiperRef,
  setNotice,

  // states
  selectedByType,
  setSelectedByType,
  selectedSecByType,
  setSelectedSecByType,
  selectedBranchesByType,
  setSelectedBranchesByType,
  qtyBranchesByType,
  setQtyBranchesByType,
  qtyEntryByType,
  setQtyEntryByType,
  skipSecByType,
  setSkipSecByType,
  userPickByType,
  setUserPickByType,

  // draft/backup
  resetModeByType,
  setResetModeByType,
  backupByType,
  setBackupByType,
  stayOnChooseByType,
  setStayOnChooseByType,
  editingDayByType, // chỉ để tránh auto next khi đang edit
  lastSavedByType,
  setLastSavedByType,

  // saving
  savingAll,
  setSavingAll,
}) {
  const clickGuardRef = useRef(0);

  const buildSelectionsSec = useCallback(
    (typeKey, onlyDay = null) => {
      const openCards = selectedSecByType[typeKey] || {};
      const selBr = selectedBranchesByType[typeKey] || {};
      const qBr = qtyBranchesByType[typeKey] || {};
      const qEntry = qtyEntryByType[typeKey] || {};

      const days = onlyDay ? [onlyDay] : Object.keys(openCards);
      const selections = [];

      for (const d of days) {
        const entriesOfDay = openCards[d] || {};
        for (const eidStr of Object.keys(entriesOfDay)) {
          const eid = Number(eidStr);
          const brMap = selBr?.[d]?.[eid] || {};
          const qMap = qBr?.[d]?.[eid] || {};
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
    },
    [selectedSecByType, selectedBranchesByType, qtyBranchesByType, qtyEntryByType]
  );

  // ✅ dọn nháp 2 tab còn lại, KHÔNG xoá trắng, mà restore theo lastSaved
  const flushOtherTypes = useCallback(
    (keepType) => {
      const others = ALL_TYPES.filter((t) => t !== keepType);

      setSelectedByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.user || {}) }));
        return n;
      });
      setUserPickByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.userPick || {}) }));
        return n;
      });

      setSelectedSecByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.sec || {}) }));
        return n;
      });
      setSelectedBranchesByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.selBr || {}) }));
        return n;
      });
      setQtyBranchesByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.qtyBr || {}) }));
        return n;
      });
      setQtyEntryByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.qtyEntry || {}) }));
        return n;
      });
      setSkipSecByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...(lastSavedByType[t]?.skip || {}) }));
        return n;
      });

      // chỉ reset UI flags/backup
      setResetModeByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = false));
        return n;
      });
      setStayOnChooseByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = false));
        return n;
      });
      setBackupByType((p) => {
        const n = { ...p };
        others.forEach((t) => (n[t] = { ...EMPTY_SNAPSHOT }));
        return n;
      });
    },
    [
      lastSavedByType,
      setSelectedByType,
      setUserPickByType,
      setSelectedSecByType,
      setSelectedBranchesByType,
      setQtyBranchesByType,
      setQtyEntryByType,
      setSkipSecByType,
      setResetModeByType,
      setStayOnChooseByType,
      setBackupByType,
    ]
  );

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
      setSelectedBranchesByType((p) => ({ ...p, [orderType]: {} }));
      setQtyBranchesByType((p) => ({ ...p, [orderType]: {} }));
      setQtyEntryByType((p) => ({ ...p, [orderType]: {} }));
      setSkipSecByType((p) => ({ ...p, [orderType]: {} }));
    } else {
      setSelectedByType((p) => ({ ...p, [orderType]: {} }));
      setUserPickByType((p) => ({ ...p, [orderType]: {} }));
    }

    setResetModeByType((p) => ({ ...p, [orderType]: true }));
    if (swiperRef.current?.slideTo) swiperRef.current.slideTo(0);
  }, [
    orderType,
    isSec,
    selectedByType,
    selectedSecByType,
    selectedBranchesByType,
    qtyBranchesByType,
    qtyEntryByType,
    skipSecByType,
    userPickByType,
    setBackupByType,
    setSelectedSecByType,
    setSelectedBranchesByType,
    setQtyBranchesByType,
    setQtyEntryByType,
    setSkipSecByType,
    setSelectedByType,
    setUserPickByType,
    setResetModeByType,
    swiperRef,
  ]);

  const exitResetMode = useCallback(
    (restore = true) => {
      if (restore) {
        const b =
          backupByType[orderType] || {
            user: {},
            sec: {},
            selBr: {},
            qtyBr: {},
            qtyEntry: {},
            skip: {},
            userPick: {},
          };

        if (isSec) {
          setSelectedSecByType((p) => ({ ...p, [orderType]: { ...(b.sec || {}) } }));
          setSelectedBranchesByType((p) => ({ ...p, [orderType]: { ...(b.selBr || {}) } }));
          setQtyBranchesByType((p) => ({ ...p, [orderType]: { ...(b.qtyBr || {}) } }));
          setQtyEntryByType((p) => ({ ...p, [orderType]: { ...(b.qtyEntry || {}) } }));
          setSkipSecByType((p) => ({ ...p, [orderType]: { ...(b.skip || {}) } }));
        } else {
          setSelectedByType((p) => ({ ...p, [orderType]: { ...(b.user || {}) } }));
          setUserPickByType((p) => ({ ...p, [orderType]: { ...(b.userPick || {}) } }));
        }
      }
      setResetModeByType((p) => ({ ...p, [orderType]: false }));
      setStayOnChooseByType((p) => ({ ...p, [orderType]: false }));
    },
    [
      backupByType,
      orderType,
      isSec,
      setSelectedSecByType,
      setSelectedBranchesByType,
      setQtyBranchesByType,
      setQtyEntryByType,
      setSkipSecByType,
      setSelectedByType,
      setUserPickByType,
      setResetModeByType,
      setStayOnChooseByType,
    ]
  );

  const choose = useCallback(
    (day, entryId) => {
      if (weeklyMenu?.isLocked) return;

      // thư ký: giữ nguyên logic cũ
      if (isSec) {
        setStayOnChooseByType((p) => ({ ...p, [orderType]: true }));

        if (entryId === null) {
          setSelectedSecByType((prev) => {
            const next = { ...prev };
            const cur = { ...(next[orderType] || {}) };
            if (cur[day]) delete cur[day];
            next[orderType] = cur;
            return next;
          });
          setSelectedBranchesByType((prev) => {
            const next = { ...prev };
            const cur = { ...(next[orderType] || {}) };
            if (cur[day]) delete cur[day];
            next[orderType] = cur;
            return next;
          });
          setQtyBranchesByType((prev) => {
            const next = { ...prev };
            const cur = { ...(next[orderType] || {}) };
            if (cur[day]) delete cur[day];
            next[orderType] = cur;
            return next;
          });
          setQtyEntryByType((prev) => {
            const next = { ...prev };
            const cur = { ...(next[orderType] || {}) };
            if (cur[day]) delete cur[day];
            next[orderType] = cur;
            return next;
          });
          setSkipSecByType((prev) => {
            const next = { ...prev };
            next[orderType] = { ...(next[orderType] || {}), [day]: true };
            return next;
          });
          return;
        }

        setSkipSecByType((prev) => {
          const next = { ...prev };
          const cur = { ...(next[orderType] || {}) };
          if (cur[day]) delete cur[day];
          next[orderType] = cur;
          return next;
        });

        setSelectedSecByType((prev) => {
          const next = { ...prev };
          const cur = { ...(next[orderType] || {}) };
          const dayMap = { ...(cur[day] || {}) };

          if (dayMap[entryId]) {
            delete dayMap[entryId];
            if (!Object.keys(dayMap).length) delete cur[day];
            else cur[day] = dayMap;
          } else {
            dayMap[entryId] = true;
            cur[day] = dayMap;

            setQtyEntryByType((prev2) => {
              const n = { ...prev2 };
              const byType = { ...(n[orderType] || {}) };
              const byDay = { ...(byType[day] || {}) };
              if (!Number.isFinite(byDay[entryId])) byDay[entryId] = 0;
              byType[day] = byDay;
              n[orderType] = byType;
              return n;
            });
          }

          next[orderType] = cur;
          return next;
        });

        return;
      }

      // user thường
      setStayOnChooseByType((p) => ({ ...p, [orderType]: true }));

      setSelectedByType((prev) => {
        const next = { ...prev };
        next[orderType] = { ...(next[orderType] || {}), [day]: entryId };
        return next;
      });

      // đảm bảo có object day để lưu pick
      setUserPickByType((prev) => {
        const n = { ...prev };
        const byType = { ...(n[orderType] || {}) };
        const byDay = { ...(byType[day] || {}) };
        byType[day] = byDay;
        n[orderType] = byType;
        return n;
      });

      const swiper = swiperRef.current;
      const editingDay = editingDayByType?.[orderType];
      if (swiper && typeof swiper.activeIndex === "number") {
        const isLast = swiper.activeIndex >= swiper.slides.length - 1;
        if (!isLast && !editingDay) setTimeout(() => swiper.slideNext(), 250);
      }
    },
    [
      weeklyMenu,
      isSec,
      orderType,
      swiperRef,
      setStayOnChooseByType,
      setSelectedSecByType,
      setSelectedBranchesByType,
      setQtyBranchesByType,
      setQtyEntryByType,
      setSkipSecByType,
      setSelectedByType,
      setUserPickByType,
      editingDayByType,
    ]
  );

  const handleCardClick = useCallback(
    (day, eid, disabled) => {
      if (disabled) return;
      const now = Date.now();
      if (now - clickGuardRef.current < 350) return;
      clickGuardRef.current = now;
      choose(day, eid);
    },
    [choose]
  );

  const handleSave = useCallback(async () => {
    if (!weeklyMenu || weeklyMenu?.isLocked) return;
    if (savingAll) return;

    setSavingAll(true);
    try {
      let selections;

      if (isSec) {
        selections = buildSelectionsSec(orderType);
      } else {
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

      // update snapshot đã LƯU
      setLastSavedByType((prev) => {
        const next = { ...prev };
        next[orderType] = isSec
          ? {
              user: {},
              sec: { ...(selectedSecByType[orderType] || {}) },
              selBr: { ...(selectedBranchesByType[orderType] || {}) },
              qtyBr: { ...(qtyBranchesByType[orderType] || {}) },
              qtyEntry: { ...(qtyEntryByType[orderType] || {}) },
              skip: { ...(skipSecByType[orderType] || {}) },
              userPick: {},
            }
          : {
              user: { ...(selectedByType[orderType] || {}) },
              sec: {},
              selBr: {},
              qtyBr: {},
              qtyEntry: {},
              skip: {},
              userPick: { ...(userPickByType[orderType] || {}) },
            };
        return next;
      });

      setNotice({ open: true, title: "Thành công", message: "Lưu đặt cơm thành công!" });
      if (resetModeByType?.[orderType]) setResetModeByType((p) => ({ ...p, [orderType]: false }));
      setStayOnChooseByType((p) => ({ ...p, [orderType]: false }));
    } catch {
      setNotice({ open: true, title: "Lỗi", message: "Không thể lưu đặt cơm." });
    } finally {
      setSavingAll(false);
    }
  }, [
    weeklyMenu,
    savingAll,
    isSec,
    orderType,
    selectedByType,
    userPickByType,
    buildSelectionsSec,
    user,
    setSavingAll,
    setNotice,
    setLastSavedByType,
    selectedSecByType,
    selectedBranchesByType,
    qtyBranchesByType,
    qtyEntryByType,
    skipSecByType,
    resetModeByType,
    setResetModeByType,
    setStayOnChooseByType,
  ]);

  return {
    buildSelectionsSec,
    flushOtherTypes,

    enterResetMode,
    exitResetMode,

    handleCardClick,
    choose,
    handleSave,
  };
}
