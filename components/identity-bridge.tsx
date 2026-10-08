"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * Binds the browser session to the room participant's roll number so PostHog
 * events are attributed to a person (and heatmaps/funnels can be filtered by role).
 */
export function IdentityBridge({
  rollNo,
  name,
  role,
}: {
  rollNo: string;
  name: string | null;
  role: string;
}) {
  useEffect(() => {
    if (!rollNo) return;
    posthog.identify(`roll:${rollNo}`, {
      roll: rollNo,
      name: name ?? undefined,
      role,
    });
  }, [rollNo, name, role]);

  return null;
}
