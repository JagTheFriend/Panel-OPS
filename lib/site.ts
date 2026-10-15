const LOCAL_FALLBACK = "http://localhost:3000";

export function resolvePublicOrigin(configured: string | undefined): string {
  const configuredOk = configured && !configured.includes("localhost");
  if (configuredOk) return configured;
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (host) return `https://${host}`;
  return configured ?? LOCAL_FALLBACK;
}

export const SITE_URL = resolvePublicOrigin(process.env.NEXT_PUBLIC_APP_URL);

export const SITE_NAME = "PanelOps";

export const SITE_DESCRIPTION =
  "Live kanban boards for recruitment rooms: PIN-based access, queues, and interview progress by domain panel.";

export const SITE_TAGLINE = "Every panel. One live board.";
