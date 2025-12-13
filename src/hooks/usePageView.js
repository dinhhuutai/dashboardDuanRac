import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import http from "~/api/http";
import { resolveRouteKey } from "~/utils/resolveRouteKey";
import { ROUTE_KEY_TO_NAME } from "~/utils/routeNameMap";

export default function usePageView(isLoggedIn) {
  const location = useLocation();
  const lastPathRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const path = location.pathname;

    // tránh log trùng
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;

    const routeKey = resolveRouteKey(path); // ✅ hỗ trợ /:id
    const pageName = (routeKey && ROUTE_KEY_TO_NAME[routeKey]) || null;

    (async () => {
      try {
        // Nếu BE mount /api/pageview thì đổi thành "/api/pageview"
        await http.post("/pageview", { path, routeKey, pageName });
      } catch (e) {}
    })();
  }, [location.pathname, isLoggedIn]);
}
