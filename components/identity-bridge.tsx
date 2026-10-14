"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

/**
 * Binds the browser session to the signed-in account so PostHog events are
 * attributed to a person (and heatmaps/funnels can be filtered by name/email).
 */
export function IdentityBridge({
  id,
  name,
  email,
}: {
  id: string;
  name: string;
  email: string;
}) {
  useEffect(() => {
    if (!id) return;
    posthog.identify(`user:${id}`, {
      email,
      name,
    });
  }, [id, name, email]);

  return null;
}
