"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");
  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${minutes}:${paddedSeconds}`;
}

/**
 * Ticks once a second so interviews show a live mm:ss counter. The clock is
 * only read after mount, so the server-rendered value stays deterministic.
 */
export function ElapsedTimer({
  startedAt,
  className,
}: {
  startedAt: Date;
  className?: string;
}) {
  const [now, setNow] = useState(() => startedAt.getTime());

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const seconds = Math.max(0, Math.floor((now - startedAt.getTime()) / 1000));

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatElapsed(seconds)}
    </span>
  );
}
