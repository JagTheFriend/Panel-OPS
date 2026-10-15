import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePublicOrigin, SITE_URL } from "@/lib/site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolvePublicOrigin", () => {
  it("keeps a non-localhost configured origin", () => {
    expect(resolvePublicOrigin("https://panelops.example")).toBe(
      "https://panelops.example",
    );
  });

  it("prefers the Vercel production host over a localhost value", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "panel-ops-three.vercel.app");
    expect(resolvePublicOrigin("http://localhost:3000")).toBe(
      "https://panel-ops-three.vercel.app",
    );
  });

  it("falls back to the deployment host when nothing is configured", () => {
    vi.stubEnv("VERCEL_URL", "app-abc123.vercel.app");
    expect(resolvePublicOrigin(undefined)).toBe(
      "https://app-abc123.vercel.app",
    );
  });

  it("stays on the local fallback when no deployment is present", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolvePublicOrigin(undefined)).toBe("http://localhost:3000");
    expect(resolvePublicOrigin("http://localhost:3110")).toBe(
      "http://localhost:3110",
    );
  });

  it("exports SITE_URL from the resolved origin chain", () => {
    expect(SITE_URL).toMatch(/^https?:\/\//);
  });
});
