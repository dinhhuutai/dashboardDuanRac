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
  d.setDate(d.getDate() + (dayOfWeek1to7 - 1));
  return d;
}

export function buildCanModifyDay(weeklyMenu) {
  return (dayOfWeek1to7) => {
    // const mondayISO = weeklyMenu?.weekStartMonday;
    // if (!mondayISO) return false;
    // const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
    // if (!target) return false;
    // const cutoff = new Date(target);
    // cutoff.setHours(9, 0, 0, 0);
    // return new Date() <= cutoff;
    return true;
  };
}

export function buildCanCancelDay(weeklyMenu) {
  return (dayOfWeek1to7) => {
    // const mondayISO = weeklyMenu?.weekStartMonday;
    // if (!mondayISO) return false;
    // const target = getDateFromMonday(mondayISO, dayOfWeek1to7);
    // if (!target) return false;
    // const cutoff = new Date(target);
    // cutoff.setHours(10, 0, 0, 0);
    // return new Date() <= cutoff;
    return true;
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
