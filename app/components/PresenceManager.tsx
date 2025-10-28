"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase"; // ✅ Sửa lại đúng tên file

export default function PresenceManager() {
  useEffect(() => {
    const setStatus = async (status: "online" | "offline") => {
      await fetch("/api/private/profile/set-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    };

    // Khi user mở app → online
    setStatus("online");

    // Khi user đóng tab → offline
    const handleUnload = () => {
      navigator.sendBeacon(
        "/api/private/profile/set-status",
        JSON.stringify({ status: "offline" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return null;
}
