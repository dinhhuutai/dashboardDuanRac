// // src/pages/Lunch/helpers/lunchHelpers.js
// import React from "react";
// import { MdOutlineRestaurant, MdOutlineSoupKitchen } from "react-icons/md";
// import { GiForkKnifeSpoon, GiChopsticks } from "react-icons/gi";

// /* ===== Ngày tiếng Việt ===== */
// export function dayNameVN(day) {
//   const map = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
//   return map[day];
// }

// /* ===== Icon món ăn ===== */
// export function getFoodIcon(name = "") {
//   const n = String(name || "").toLowerCase();
//   if (/(soup|canh)/.test(n)) return <MdOutlineSoupKitchen className="text-2xl" />;
//   if (/(cơm|rice|bento)/.test(n)) return <MdOutlineRestaurant className="text-2xl" />;
//   if (/(bún|phở|mì|noodle)/.test(n)) return <GiChopsticks className="text-2xl" />;
//   return <GiForkKnifeSpoon className="text-2xl" />;
// }

// /* ===== Date helpers ===== */
// export function getDateFromMonday(mondayISO, dayOfWeek1to7) {
//   if (!mondayISO) return null;
//   const base = new Date(mondayISO);
//   if (Number.isNaN(base.getTime())) return null;
//   const d = new Date(base);
//   d.setHours(0, 0, 0, 0);
//   d.setDate(d.getDate() + (dayOfWeek1to7 - 1));
//   return d;
// }

// export function buildCanModifyDay(weeklyMenu) {
//   return (dayOfWeek1to7) => {
//     // const mondayISO = weeklyMenu?.weekStartMonday;
//     // if (!mondayISO) return false;
//     // const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
//     // if (!target) return false;
//     // const cutoff = new Date(target);
//     // cutoff.setHours(9, 0, 0, 0);
//     // return new Date() <= cutoff;
//     return true;
//   };
// }

// export function buildCanCancelDay(weeklyMenu) {
//   return (dayOfWeek1to7) => {
//     // const mondayISO = weeklyMenu?.weekStartMonday;
//     // if (!mondayISO) return false;
//     // const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
//     // if (!target) return false;
//     // const cutoff = new Date(target);
//     // cutoff.setHours(10, 0, 0, 0);
//     // return new Date() <= cutoff;
//     return true;
//   };
// }

// /* ===== Sắp xếp theo position ===== */
// export function buildEntriesById(weeklyMenu) {
//   const m = {};
//   (weeklyMenu?.entries || []).forEach((e) => { m[e.weeklyMenuEntryId] = e; });
//   return m;
// }
// export function getPos(entry) {
//   if (!entry) return 0;
//   return Number(entry.position ?? entry.sortOrder ?? entry.order ?? entry.weeklyMenuEntryId ?? 0);
// }
// export function getPosById(entriesById, id) {
//   const e = entriesById[id];
//   if (!e) return Number(id) || 0;
//   return getPos(e);
// }
// export function cmpByPositionEntry(a, b) {
//   const pa = getPos(a);
//   const pb = getPos(b);
//   if (pa !== pb) return pa - pb;
//   return Number(a?.weeklyMenuEntryId) - Number(b?.weeklyMenuEntryId);
// }
// export function buildCmpByPositionId(entriesById) {
//   return (a, b) => {
//     const pa = getPosById(entriesById, a);
//     const pb = getPosById(entriesById, b);
//     if (pa !== pb) return pa - pb;
//     return Number(a) - Number(b);
//   };
// }



// src/pages/Lunch/helpers/lunchHelpers.js
import React from "react";
import { MdOutlineRestaurant, MdOutlineSoupKitchen } from "react-icons/md";
import { GiForkKnifeSpoon, GiChopsticks } from "react-icons/gi";

/* ===== Ngày tiếng Việt ===== */
export function dayNameVN(day) {
  const map = { 1: "Thứ 2", 2: "Thứ 3", 3: "Thứ 4", 4: "Thứ 5", 5: "Thứ 6", 6: "Thứ 7", 7: "Chủ nhật" };
  return map[day];
}

/* ===== Icon món ăn ===== */
export function getFoodIcon(name = "") {
  const n = String(name || "").toLowerCase();
  if (/(soup|canh)/.test(n)) return <MdOutlineSoupKitchen className="text-2xl" />;
  if (/(cơm|rice|bento)/.test(n)) return <MdOutlineRestaurant className="text-2xl" />;
  if (/(bún|phở|mì|noodle)/.test(n)) return <GiChopsticks className="text-2xl" />;
  return <GiForkKnifeSpoon className="text-2xl" />;
}

/* ===== Date helpers ===== */
export function getDateFromMonday(mondayISO, dayOfWeek1to7) {
  if (!mondayISO) return null;
  const base = new Date(mondayISO);
  if (Number.isNaN(base.getTime())) return null;

  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + (Number(dayOfWeek1to7) - 1));
  return d;
}

function parseTimeToHourMinute(timeValue) {
  if (!timeValue) return null;

  const s = String(timeValue).trim();

  // Case 1: HH:mm hoặc HH:mm:ss
  let m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const hh = Number(m[1]);
    const mm = Number(m[2]);

    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;

    return { hh, mm };
  }

  // Case 2: ISO datetime, ví dụ 1970-01-01T09:00:00.000Z
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return {
      hh: d.getUTCHours(),
      mm: d.getUTCMinutes(),
    };
  }

  return null;
}

function getConfigByOrderType(settings, orderType) {
  const type = String(orderType || "re").toLowerCase();

  if (type === "ws") {
    return {
      isActive: !!settings?.isActiveWS,
      timeModify: settings?.timeModifyWS,
      timeCancel: settings?.timeCancelWS,
      dayOffset: 1,
    };
  }

  if (type === "ot") {
    return {
      isActive: !!settings?.isActiveOT,
      timeModify: settings?.timeModifyOT,
      timeCancel: settings?.timeCancelOT,
      dayOffset: 1,
    };
  }

  return {
    isActive: !!settings?.isActiveRE,
    timeModify: settings?.timeModifyRE,
    timeCancel: settings?.timeCancelRE,
    dayOffset: 0,
  };
}

function buildCutoffDate(
  weeklyMenu,
  dayOfWeek1to7,
  timeValue,
  dayOffset = 0
) {
  const mondayISO = weeklyMenu?.weekStartMonday;
  if (!mondayISO) return null;

  const target = getDateFromMonday(
    mondayISO,
    dayOfWeek1to7
  );
  if (!target) return null;

  if (dayOffset) {
    let finalOffset = dayOffset;

    // ✅ Nếu WS / OT và là Thứ 7 → nhảy qua Chủ nhật → sang Thứ 2
    if (
      dayOffset === 1 &&
      Number(dayOfWeek1to7) === 6 // Thứ 7
    ) {
      finalOffset = 2;
    }

    target.setDate(
      target.getDate() + finalOffset
    );
  }

  const parsed = parseTimeToHourMinute(
    timeValue
  );
  if (!parsed) return null;

  target.setHours(
    parsed.hh,
    parsed.mm,
    0,
    0
  );

  return target;
}

export function buildCanModifyDay(weeklyMenu, settings, orderType) {
  return (dayOfWeek1to7) => {
    const cfg = getConfigByOrderType(settings, orderType);

    // ❗ Nếu không active → cho phép luôn
    if (!cfg.isActive) return true;

    const cutoff = buildCutoffDate(
      weeklyMenu,
      dayOfWeek1to7,
      cfg.timeModify,
      cfg.dayOffset
    );

    // ❗ Nếu không có config giờ → cũng cho phép luôn
    if (!cutoff) return true;

    return new Date().getTime() <= cutoff.getTime();
  };
}

export function buildCanCancelDay(weeklyMenu, settings, orderType) {
  return (dayOfWeek1to7) => {
    const cfg = getConfigByOrderType(settings, orderType);

    // ❗ Nếu không active → cho phép luôn
    if (!cfg.isActive) return true;

    const cutoff = buildCutoffDate(
      weeklyMenu,
      dayOfWeek1to7,
      cfg.timeCancel,
      cfg.dayOffset
    );

    // ❗ Nếu không có config giờ → cũng cho phép luôn
    if (!cutoff) return true;

    return new Date().getTime() <= cutoff.getTime();
  };
}

/* ===== Sắp xếp theo position ===== */
export function buildEntriesById(weeklyMenu) {
  const m = {};
  (weeklyMenu?.entries || []).forEach((e) => { m[e.weeklyMenuEntryId] = e; });
  return m;
}
export function getPos(entry) {
  if (!entry) return 0;
  return Number(entry.position ?? entry.sortOrder ?? entry.order ?? entry.weeklyMenuEntryId ?? 0);
}
export function getPosById(entriesById, id) {
  const e = entriesById[id];
  if (!e) return Number(id) || 0;
  return getPos(e);
}
export function cmpByPositionEntry(a, b) {
  const pa = getPos(a);
  const pb = getPos(b);
  if (pa !== pb) return pa - pb;
  return Number(a?.weeklyMenuEntryId) - Number(b?.weeklyMenuEntryId);
}
export function buildCmpByPositionId(entriesById) {
  return (a, b) => {
    const pa = getPosById(entriesById, a);
    const pb = getPosById(entriesById, b);
    if (pa !== pb) return pa - pb;
    return Number(a) - Number(b);
  };
}
