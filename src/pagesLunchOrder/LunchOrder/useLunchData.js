// src/pages/Lunch/UserOrderSlide/useLunchData.js
import { useEffect, useState } from "react";
import { apiGetWeeklyMenuLatest, apiGetSelections } from "./api/lunchApi";
import { makeLastSavedInit } from "./constants";

export function useLunchData({ userId, weekStartMonday }) {
  const [weeklyMenu, setWeeklyMenu] = useState(null);
  const [pageLoading, setPageLoading] = useState(false);

  const [selectedByType, setSelectedByType] = useState({ re: {}, ws: {}, ot: {} });
  const [selectedSecByType, setSelectedSecByType] = useState({ re: {}, ws: {}, ot: {} });
  const [selectedBranchesByType, setSelectedBranchesByType] = useState({ re: {}, ws: {}, ot: {} });
  const [qtyBranchesByType, setQtyBranchesByType] = useState({ re: {}, ws: {}, ot: {} });
  const [qtyEntryByType, setQtyEntryByType] = useState({ re: {}, ws: {}, ot: {} });
  const [skipSecByType, setSkipSecByType] = useState({ re: {}, ws: {}, ot: {} });

  // userPickByType[type][day][entryId] = branchId (>0) ; undefined => CHUNG
  const [userPickByType, setUserPickByType] = useState({ re: {}, ws: {}, ot: {} });

  const [lastSavedByType, setLastSavedByType] = useState(makeLastSavedInit());

  function formatYMD(date) {
    if (!date) return undefined;

    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${y}-${m}-${day}`;
  }

  useEffect(() => {
    async function load() {
      setPageLoading(true);
      try {
        const mondayStr = formatYMD(weekStartMonday);

        const menu = await apiGetWeeklyMenuLatest(mondayStr);
        if (!menu) {
          setWeeklyMenu(null);
          return;
        }
        setWeeklyMenu(menu);

        const rows = await apiGetSelections(menu.weeklyMenuId, userId);

        const entryMap = {};
        (menu.entries || []).forEach((e) => (entryMap[e.weeklyMenuEntryId] = e));

        const activeByType = { re: {}, ws: {}, ot: {} };
        const secByType = { re: {}, ws: {}, ot: {} };
        const selBrByType = { re: {}, ws: {}, ot: {} };
        const qtyBrByType = { re: {}, ws: {}, ot: {} };
        const qtyEntryInit = { re: {}, ws: {}, ot: {} };

        // userPick hiện tại bạn chưa đọc từ rows (rows có branchId thì thực tế là thư ký),
        // nên cứ init rỗng để user thường toggle branch ở UI.
        const userPickInit = { re: {}, ws: {}, ot: {} };

        rows.forEach(([entryId, isAction, q, branchId]) => {
          const entry = entryMap[entryId];
          if (!entry) return;
          if (!isAction) return;

          const day = entry.dayOfWeek;
          const type = (entry.statusType || "re").toLowerCase();

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
        });

        // đảm bảo mở panel có qty/chung
        Object.keys(secByType).forEach((t) => {
          Object.keys(secByType[t] || {}).forEach((day) => {
            (qtyEntryInit[t][day] ||= {});
            Object.keys(secByType[t][day] || {}).forEach((eidStr) => {
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
        setUserPickByType((prev) => ({ ...prev, ...userPickInit }));
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

    if (userId) load();
  }, [userId, weekStartMonday]);

  return {
    weeklyMenu,
    pageLoading,

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

    lastSavedByType,
    setLastSavedByType,
  };
}
