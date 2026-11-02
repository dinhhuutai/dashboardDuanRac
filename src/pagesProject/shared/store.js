// Trạng thái dùng chung của module 3 (không qua Redux): khởi động (vai trò, cấu hình tệp), huy hiệu, danh bạ.
// Mọi trang trong module đọc chung → chuyển trang không tải lại.
import { useSyncExternalStore } from "react";
import { pjApi } from "./api";

let snap = {
  boot: null,       // { me: { userId, fullName, isAdmin }, counts, files: { enabled, maxMb }, today }
  bootError: null,
  counts: { todo: 0, overdue: 0, waiting: 0, unread: 0, chatUnread: 0, lastNotificationId: 0, isAssigner: false },
  dir: null,        // [{ id, name, msnv, avatar, dept }]
};
const listeners = new Set();

export const pjStore = {
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

/** const counts = usePj((s) => s.counts) — selector trả về giá trị có sẵn trong snap */
export function usePj(selector) {
  return useSyncExternalStore(pjStore.subscribe, () => selector(snap));
}

let bootPromise = null;
export function ensureBoot(force = false) {
  if (snap.boot && !force) return Promise.resolve(snap.boot);
  if (bootPromise) return bootPromise;
  bootPromise = pjApi.bootstrap()
    .then((b) => { pjStore.set({ boot: b, bootError: null, counts: b.counts || snap.counts }); return b; })
    .catch((e) => { pjStore.set({ bootError: e }); throw e; })
    .finally(() => { bootPromise = null; });
  return bootPromise;
}

let pulsing = false;
export async function refreshCounts() {
  if (pulsing) return;
  pulsing = true;
  try { pjStore.set({ counts: await pjApi.pulse() }); } catch { /* lần sau thử lại */ } finally { pulsing = false; }
}

let dirPromise = null;
export function ensureDirectory() {
  if (snap.dir) return Promise.resolve(snap.dir);
  if (!dirPromise) {
    dirPromise = pjApi.directory()
      .then((d) => { pjStore.set({ dir: d }); return d; })
      .finally(() => { dirPromise = null; });
  }
  return dirPromise;
}
