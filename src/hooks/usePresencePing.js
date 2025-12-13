// src/hooks/usePresencePing.js
import { useEffect, useRef } from "react";
import http from "~/api/http";

export default function usePresencePing(isLoggedIn) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    const ping = async () => {
      try {
        await http.post("/api/presence/ping");
      } catch (e) {
        // ignore: mất mạng / token hết hạn...
      }
    };

    ping();
    timerRef.current = setInterval(ping, 30000); // 30s

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isLoggedIn]);
}
