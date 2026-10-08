"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/utils";

/**
 * Renders a relative timestamp ("3m ago") without reading the clock during
 * server render — the first value arrives in an effect so prerendering stays
 * deterministic.
 */
export function RelativeTime({ at }: { at: Date }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(relativeTime(at));
  }, [at]);

  return <>{label ?? "…"}</>;
}
