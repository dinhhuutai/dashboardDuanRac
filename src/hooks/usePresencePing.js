// src/hooks/usePresencePing.js
import { useEffect, useRef } from "react";
import http from "~/api/http";

// Backend: coi online nếu có ping trong 2 phút (ONLINE_MINUTES) và cộng dồn
// tối đa 120s mỗi khoảng (MAX_GAP_SECONDS) → chu kỳ phải < 120s.
const PING_INTERVAL_MS = 60000;

export default function usePresencePing(isLoggedIn) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const ping = async () => {
      try {
        await http.post("/api/presence/ping");
      } catch (e) {
        // ignore: mất mạng / token hết hạn...
      }
    };

    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };

    const start = () => {
      stop();
      ping();
      timerRef.current = setInterval(ping, PING_INTERVAL_MS);
    };

    // Tab ẩn / app chạy nền → không ping (mỗi ping là 1 lượt ghi DB)
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [isLoggedIn]);
}
