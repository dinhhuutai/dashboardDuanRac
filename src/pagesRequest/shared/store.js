// Trạng thái dùng chung của module 18 (không qua Redux): dữ liệu khởi động, danh bạ, huy hiệu,
// máy chủ tệp đã cấu hình chưa. Mọi trang trong module đọc chung → chuyển trang không tải lại.
import { useSyncExternalStore } from "react";
import { rqApi } from "./api";

let snap = {
  boot: null,          // { me, myHeads, groups, types, counts, files, pushPublicKey }
  bootError: null,
  dir: null,           // { users, departments, teams, userById, deptById, teamById }
  counts: { inbox: 0, returned: 0, minePending: 0, unreadNotifications: 0, lastNotificationId: 0, unreadChat: 0 },
  fileState: "unknown", // đính kèm tệp: unknown (chưa bootstrap) | ready | disabled (API chưa cấu hình máy chủ tệp)
};
const listeners = new Set();

export const rqStore = {
  get: () => snap,
  set(patch) {
    snap = { ...snap, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/** const counts = useRq((s) => s.counts) — selector phải trả về giá trị có sẵn trong snap (không tạo object mới) */
export function useRq(selector) {
  return useSyncExternalStore(rqStore.subscribe, () => selector(snap));
}

/* ------------------------------ Sự kiện trong module ------------------------------ */
const bus = new Map();
export const rqEvents = {
  on(name, fn) {
    if (!bus.has(name)) bus.set(name, new Set());
    bus.get(name).add(fn);
    return () => bus.get(name)?.delete(fn);
  },
  emit(name, payload) {
    bus.get(name)?.forEach((fn) => { try { fn(payload); } catch { /* bỏ qua */ } });
  },
};

/* ------------------------------ Khởi động ------------------------------ */
let bootPromise = null;
export function ensureBoot(force = false) {
  if (snap.boot && !force) return Promise.resolve(snap.boot);
  if (bootPromise) return bootPromise;
  bootPromise = rqApi
    .bootstrap()
    .then((b) => {
      rqStore.set({ boot: b, bootError: null, counts: b.counts || snap.counts, fileState: b.files?.enabled ? "ready" : "disabled" });
      return b;
    })
    .catch((e) => {
      rqStore.set({ bootError: e });
      throw e;
    })
    .finally(() => { bootPromise = null; });
  return bootPromise;
}

/* ------------------------------ Danh bạ ------------------------------ */
const DIR_KEY = "rq_dir_v1";
const DIR_TTL = 5 * 60 * 1000;

function indexDir(d) {
  return {
    ...d,
    userById: new Map(d.users.map((u) => [u.id, u])),
    deptById: new Map(d.departments.map((x) => [x.id, x])),
    teamById: new Map(d.teams.map((x) => [x.id, x])),
  };
}

let dirPromise = null;
export function ensureDirectory(force = false) {
  if (snap.dir && !force) return Promise.resolve(snap.dir);
  if (!force) {
    // mở lại tab trong vòng 5 phút → dùng ngay bản lưu, tải mới ngầm
    try {
      const raw = sessionStorage.getItem(DIR_KEY);
      if (raw) {
        const { at, data } = JSON.parse(raw);
        if (Date.now() - at < DIR_TTL && data?.users) {
          rqStore.set({ dir: indexDir(data) });
          setTimeout(() => ensureDirectory(true).catch(() => {}), 1500);
          return Promise.resolve(snap.dir);
        }
      }
    } catch { /* không có sessionStorage */ }
  }
  if (dirPromise) return dirPromise;
  dirPromise = rqApi
    .directory()
    .then((d) => {
      try { sessionStorage.setItem(DIR_KEY, JSON.stringify({ at: Date.now(), data: d })); } catch { /* đầy bộ nhớ */ }
      rqStore.set({ dir: indexDir(d) });
      return snap.dir;
    })
    .finally(() => { dirPromise = null; });
  return dirPromise;
}

/** Tên hiển thị của user (danh bạ → fallback) */
export function userName(id, fallback) {
  return snap.dir?.userById.get(id)?.name || fallback || (id ? `Người dùng #${id}` : "");
}

/** "Phòng SX · Tổ 1" của user */
export function userOrg(u) {
  if (!u || !snap.dir) return "";
  return [snap.dir.deptById.get(u.d)?.name, snap.dir.teamById.get(u.t)?.name].filter(Boolean).join(" · ");
}

/* ------------------------------ Huy hiệu ------------------------------ */
let pulsing = false;
export async function refreshCounts() {
  if (pulsing) return;
  pulsing = true;
  try {
    const c = await rqApi.pulse();
    const prev = snap.counts;
    rqStore.set({ counts: c });
    if (c.lastNotificationId > (prev.lastNotificationId || 0)) rqEvents.emit("notifications", c);
    if (c.unreadChat !== prev.unreadChat) rqEvents.emit("chat", c);
    if (c.inbox !== prev.inbox) rqEvents.emit("changed", { reason: "pulse" });
  } catch { /* bỏ qua — lần sau thử lại */ } finally {
    pulsing = false;
  }
}
