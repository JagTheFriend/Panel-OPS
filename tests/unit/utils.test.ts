import { afterEach, describe, expect, it, vi } from "vitest";
import { cn, formatClock, formatDuration, relativeTime } from "@/lib/utils";

afterEach(() => {
  vi.useRealTimers();
});

describe("cn", () => {
  it("merges conditional classes and dedupes conflicting utilities", () => {
    expect(cn("p-2", false && "p-8", "p-4")).toBe("p-4");
    expect(cn("btn", undefined, null, "active")).toBe("btn active");
  });
});

describe("formatDuration", () => {
  it("formats hours, minutes and seconds", () => {
    expect(formatDuration(3_723_000)).toBe("1h 2m");
    expect(formatDuration(65_000)).toBe("1m 5s");
    expect(formatDuration(9_000)).toBe("9s");
    expect(formatDuration(0)).toBe("0s");
  });

  it("returns an em dash for invalid input", () => {
    expect(formatDuration(-1)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("relativeTime", () => {
  it("describes recency against the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    expect(relativeTime(new Date("2026-03-10T11:59:45Z"))).toBe("just now");
    expect(relativeTime(new Date("2026-03-10T11:55:00Z"))).toBe("5m ago");
    expect(relativeTime(new Date("2026-03-10T10:30:00Z"))).toBe("1h ago");
    expect(relativeTime(new Date("2026-03-07T12:00:00Z"))).toBe("3d ago");
  });

  it("accepts ISO strings as well as Date instances", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    expect(relativeTime("2026-03-10T11:40:00Z")).toBe("20m ago");
  });
});

describe("formatClock", () => {
  it("renders a time-like HH:MM string", () => {
    expect(formatClock(new Date("2026-03-10T09:05:00Z"))).toMatch(
      /\d{1,2}:\d{2}/,
    );
    expect(formatClock("2026-03-10T09:05:00Z")).toMatch(/\d{1,2}:\d{2}/);
  });
});
