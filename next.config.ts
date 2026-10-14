import type { NextConfig } from "next";

const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

const posthogProxied = /^https:\/\/(us|eu)\.i\.posthog\.com$/.test(posthogHost);
const posthogAssetsHost = posthogHost.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com",
);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  // PostHog's capture endpoint uses a trailing slash (/e/…).
  skipTrailingSlashRedirect: posthogProxied,
  async redirects() {
    return [
      { source: "/board/:path*", destination: "/rooms", permanent: true },
      { source: "/panels", destination: "/rooms", permanent: true },
      { source: "/admin/panels", destination: "/rooms", permanent: true },
      { source: "/admin/members", destination: "/rooms", permanent: true },
    ];
  },
  async rewrites() {
    if (!posthogProxied) return [];
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
