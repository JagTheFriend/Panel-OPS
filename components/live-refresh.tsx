"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Server-rendered live updates: periodically re-fetches the current route's RSC
 * payload so every board shows the latest data without websockets.
 * Skips refreshes while the tab is hidden to avoid needless renders.
 */
export function LiveRefresh({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };

    const id = window.setInterval(refresh, intervalMs);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
