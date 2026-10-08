// src/utils/lazyPage.js
import { lazy } from "react";
import loadingBar from "./loadingBar";

const RELOAD_KEY = "chunk_reload_at";

/**
 * React.lazy + tự tải lại trang 1 lần khi không tải được chunk.
 * Sau mỗi lần deploy, tên file chunk đổi (hash mới) → tab đang mở từ bản cũ
 * sẽ lỗi ChunkLoadError khi chuyển trang. Reload để lấy index.html mới.
 *
 * - Khi đang tải chunk: hiện thanh tiến trình đầu trang (utils/loadingBar) — React Router chuyển
 *   trang trong startTransition nên giao diện cũ đứng yên, không có thanh này thì như "bấm không ăn".
 * - Component trả về có `.preload()` — gọi trước (lúc rảnh / khi rê chuột) để bấm là mở ngay.
 *   Gọi nhiều lần chỉ tải 1 lần.
 */
export default function lazyPage(factory) {
  let promise = null;
  let settled = false;
  // withBar = true khi người dùng đang chờ (render trang); tải trước lúc rảnh thì không hiện thanh
  const load = (withBar) => {
    if (!promise) {
      settled = false;
      promise = factory()
        .then((m) => { settled = true; return m; })
        .catch((err) => {
          promise = null; // lần sau thử lại
          throw err;
        });
    }
    if (withBar && !settled) {
      loadingBar.start();
      promise.then(loadingBar.done, loadingBar.done);
    }
    return promise;
  };

  const Component = lazy(() =>
    load(true).catch((err) => {
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      } catch {}

      // Chỉ reload nếu 10s gần nhất chưa reload — tránh vòng lặp khi mất mạng thật
      if (Date.now() - last > 10000) {
        try {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        } catch {}
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    })
  );
  Component.preload = () => load(false).catch(() => {});
  return Component;
}

/** Tải trước các trang khi trình duyệt rảnh (không tranh băng thông với việc đang làm) */
export function preloadWhenIdle(...components) {
  const run = () => components.forEach((c) => c?.preload?.());
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 4000 });
  else setTimeout(run, 1500);
}
