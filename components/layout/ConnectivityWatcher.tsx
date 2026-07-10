"use client";

/**
 * components/layout/ConnectivityWatcher.tsx
 * Status toast on RTT > 3s / offline, visible >=5s or until connectivity
 * is restored, without interrupting content. (Req 17.5)
 */

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

const RTT_CHECK_INTERVAL_MS = 15000;
const RTT_THRESHOLD_MS = 3000;
const MIN_TOAST_VISIBLE_MS = 5000;

export function ConnectivityWatcher() {
  const { push } = useToast();
  const lastNotifiedAt = useRef(0);

  useEffect(() => {
    function notifyOnce(message: string) {
      const now = Date.now();
      if (now - lastNotifiedAt.current < MIN_TOAST_VISIBLE_MS) return;
      lastNotifiedAt.current = now;
      push({ kind: "error", message });
    }

    function handleOffline() {
      notifyOnce("You're offline. Some features may be unavailable.");
    }

    function handleOnline() {
      push({ kind: "success", message: "Back online." });
    }

    async function checkRtt() {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return;
      const start = performance.now();
      try {
        await fetch("/api/smoke", { cache: "no-store", method: "GET" });
        const rtt = performance.now() - start;
        if (rtt > RTT_THRESHOLD_MS) {
          notifyOnce("Your connection seems slow right now.");
        }
      } catch {
        notifyOnce("Having trouble reaching the server.");
      }
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    const interval = setInterval(checkRtt, RTT_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [push]);

  return null;
}
