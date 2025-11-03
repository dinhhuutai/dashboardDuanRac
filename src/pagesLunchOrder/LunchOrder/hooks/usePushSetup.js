// src/pages/Lunch/hooks/usePushSetup.js
import { useEffect, useState } from "react";
import { registerPush } from "~/push/registerPush";
import { apiUnsubscribePush } from "../api/lunchApi";

export default function usePushSetup() {
  const [notifPerm, setNotifPerm] = useState("unknown");
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [pushReady, setPushReady] = useState(false);
  const [pushChecking, setPushChecking] = useState(true);
  const [pushError, setPushError] = useState("");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushStatus, setPushStatus] = useState("");

  useEffect(() => {
    try {
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsStandalone(window.navigator.standalone === true);
      const hasNoti = typeof window !== "undefined" && "Notification" in window;
      setNotifPerm(hasNoti ? Notification.permission : "unsupported");

      const supported =
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        hasNoti;

      if (!supported) {
        setPushReady(false);
        setPushChecking(false);
        return;
      }
      (async () => {
        let hasSub = false;
        if (Notification.permission === "granted") {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            hasSub = !!sub;
          } catch {}
        }
        setPushReady(Notification.permission === "granted" && hasSub);
        setPushChecking(false);
      })();
    } catch {
      setPushReady(false);
      setPushChecking(false);
      setNotifPerm("unsupported");
    }
  }, []);

  async function enablePush() {
    if (pushBusy) return;
    setPushError(""); setPushStatus(""); setPushBusy(true);
    try {
      await registerPush();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setPushReady(!!sub);
      setPushStatus("Đã bật thông báo");
    } catch (e) {
      setPushError(e?.message || "Không thể bật thông báo");
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushStatus(""), 2500);
    }
  }

  async function disablePush() {
    if (pushBusy) return;
    setPushError(""); setPushStatus(""); setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try { await apiUnsubscribePush(sub.endpoint); } catch {}
        await sub.unsubscribe();
      }
      setPushReady(false);
      setPushStatus("Đã tắt thông báo");
    } catch (e) {
      setPushError(e?.message || "Không thể tắt thông báo");
    } finally {
      setPushBusy(false);
      setTimeout(() => setPushStatus(""), 2500);
    }
  }

  return {
    notifPerm, isIOS, isStandalone,
    pushReady, pushChecking, pushError, pushBusy, pushStatus,
    enablePush, disablePush,
  };
}
