// src/utils/lazyPage.js
import { lazy } from "react";

const RELOAD_KEY = "chunk_reload_at";

/**
 * React.lazy + tự tải lại trang 1 lần khi không tải được chunk.
 * Sau mỗi lần deploy, tên file chunk đổi (hash mới) → tab đang mở từ bản cũ
 * sẽ lỗi ChunkLoadError khi chuyển trang. Reload để lấy index.html mới.
 */
export default function lazyPage(factory) {
  return lazy(() =>
    factory().catch((err) => {
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
}
