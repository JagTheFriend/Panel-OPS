import posthog from "posthog-js";

const key =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
  process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const uiHost =
  process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com";

// Only initialize when a key is configured — keeps local dev a silent no-op.
if (key) {
  // Route traffic through the Next.js rewrites in next.config.ts so ad-blockers
  // don't swallow events (see PostHog's reverse-proxy docs).
  const proxied = /^https:\/\/(us|eu)\.i\.posthog\.com$/.test(host);

  posthog.init(key, {
    api_host: proxied ? "/ingest" : host,
    ui_host: uiHost,
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    capture_heatmaps: true,
    capture_pageview: "history_change",
    capture_pageleave: true,
  });
}
