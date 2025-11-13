"use client";
import { useEffect } from "react";

export default function PresenceManager() {
  useEffect(() => {
    const isAuthCallback = typeof window !== "undefined" && window.location.pathname.startsWith("/auth/callback");
    const sendStatus = async (status: "online" | "offline") => {
      if (isAuthCallback) return; // skip during OAuth callback to avoid race conditions
      try {
        const body = JSON.stringify({ status });
        if (status === "offline" && navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          navigator.sendBeacon("/api/private/profile/set-status", blob);
          return;
        }
        await fetch("/api/private/profile/set-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          keepalive: true,
          body,
        });
      } catch (e) {
        // Swallow transient errors (navigation/unload/network) to avoid console noise
      }
    };

    // Go online on mount
    sendStatus("online");

    // Heartbeat to keep session online
    const heartbeat = setInterval(() => sendStatus("online"), 30000);

    // Idle detection: go offline after no activity for a period
    const IDLE_MS = 120000; // 2 minutes
    let idleTimer: number | undefined;
    const resetIdle = () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => sendStatus("offline"), IDLE_MS);
      // ensure we mark online on user activity
      sendStatus("online");
    };
    const activityEvents = ["mousemove", "keydown", "scroll", "click", "touchstart"]; 
    activityEvents.forEach((ev) => window.addEventListener(ev, resetIdle, { passive: true }));
    resetIdle();

    // On unload, mark offline
    const handleUnload = () => {
      const body = JSON.stringify({ status: "offline" });
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/private/profile/set-status", blob);
      } else {
        fetch("/api/private/profile/set-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          keepalive: true,
          body,
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      sendStatus("offline");
      clearInterval(heartbeat);
      if (idleTimer) window.clearTimeout(idleTimer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetIdle));
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return null;
}
