import { describe, expect, it } from "vitest";
import {
  applyStatusTransition,
  type CandidateSnapshot,
  nextFreeSeat,
  occupiedSeats,
} from "@/lib/logic/candidates";

const waiting: CandidateSnapshot = {
  status: "WAITING",
  seatNumber: null,
  startedAt: null,
  completedAt: null,
};

const inInterview = (
  seat: number,
  startedAt: Date | null,
): CandidateSnapshot => ({
  status: "IN_INTERVIEW",
  seatNumber: seat,
  startedAt,
  completedAt: null,
});

const done = (
  seat: number | null,
  startedAt: Date | null,
  completedAt: Date | null,
): CandidateSnapshot => ({
  status: "DONE",
  seatNumber: seat,
  startedAt,
  completedAt,
});

describe("occupiedSeats", () => {
  it("counts only in-interview candidates holding a seat", () => {
    const taken = occupiedSeats([
      { status: "IN_INTERVIEW", seatNumber: 2 },
      { status: "IN_INTERVIEW", seatNumber: null },
      { status: "WAITING", seatNumber: null },
      { status: "DONE", seatNumber: 1 },
      { status: "IN_INTERVIEW", seatNumber: 5 },
    ]);
    expect(taken).toEqual(new Set([2, 5]));
  });

  it("returns an empty set when nobody is in interview", () => {
    expect(occupiedSeats([]).size).toBe(0);
    expect(occupiedSeats([{ status: "WAITING", seatNumber: 7 }]).size).toBe(0);
  });

  it("deduplicates shared seat numbers", () => {
    const taken = occupiedSeats([
      { status: "IN_INTERVIEW", seatNumber: 3 },
      { status: "IN_INTERVIEW", seatNumber: 3 },
    ]);
    expect(taken.size).toBe(1);
  });
});

describe("nextFreeSeat", () => {
  it("returns the lowest free station in range", () => {
    expect(nextFreeSeat(new Set<number>(), 6)).toBe(1);
    expect(nextFreeSeat(new Set([1, 3, 4]), 6)).toBe(2);
    expect(nextFreeSeat(new Set([2, 3]), 3)).toBe(1);
  });

  it("returns null when every station is taken", () => {
    expect(nextFreeSeat(new Set([1, 2, 3]), 3)).toBeNull();
    expect(nextFreeSeat(new Set<number>(), 0)).toBeNull();
  });

  it("ignores out-of-range entries in taken", () => {
    expect(nextFreeSeat(new Set([99]), 2)).toBe(1);
  });
});

describe("applyStatusTransition", () => {
  it("treats a same-status transition as a no-op", () => {
    const current = inInterview(4, new Date("2026-01-01T10:00:00Z"));
    const result = applyStatusTransition(current, "IN_INTERVIEW", null);
    expect(result).toEqual({ ok: true, value: current });
    expect(result.ok && result.value).toBe(current);
  });

  it("starting an interview claims the offered station and stamps startedAt", () => {
    const result = applyStatusTransition(waiting, "IN_INTERVIEW", 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("IN_INTERVIEW");
    expect(result.value.seatNumber).toBe(3);
    expect(result.value.startedAt).toBeInstanceOf(Date);
    expect(result.value.completedAt).toBeNull();
  });

  it("starting an interview with no free station fails with a clear error", () => {
    const result = applyStatusTransition(waiting, "IN_INTERVIEW", null);
    expect(result).toEqual({
      ok: false,
      error: "All stations are occupied right now.",
    });
  });

  it("moving back to waiting releases the station and clears timestamps", () => {
    const current = inInterview(5, new Date("2026-01-01T10:00:00Z"));
    const result = applyStatusTransition(current, "WAITING", null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      status: "WAITING",
      seatNumber: null,
      startedAt: null,
      completedAt: null,
    });
  });

  it("completing keeps the original startedAt and stamps completedAt", () => {
    const startedAt = new Date("2026-01-01T10:00:00Z");
    const current = inInterview(2, startedAt);
    const result = applyStatusTransition(current, "DONE", null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("DONE");
    expect(result.value.seatNumber).toBe(2);
    expect(result.value.startedAt).toBe(startedAt);
    expect(result.value.completedAt).toBeInstanceOf(Date);
    expect(result.value.completedAt?.getTime()).toBeGreaterThanOrEqual(
      startedAt.getTime(),
    );
  });

  it("completing a never-started waiting candidate stamps both timestamps", () => {
    const result = applyStatusTransition(waiting, "DONE", null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.startedAt).toBeInstanceOf(Date);
    expect(result.value.completedAt).toBeInstanceOf(Date);
    expect(result.value.seatNumber).toBeNull();
  });

  it("reopening a completed interview returns to waiting cleanly", () => {
    const current = done(
      4,
      new Date("2026-01-01T10:00:00Z"),
      new Date("2026-01-01T10:20:00Z"),
    );
    const result = applyStatusTransition(current, "WAITING", null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      status: "WAITING",
      seatNumber: null,
      startedAt: null,
      completedAt: null,
    });
  });

  it("re-interviewing a completed candidate claims a fresh free station", () => {
    const current = done(
      1,
      new Date("2026-01-01T10:00:00Z"),
      new Date("2026-01-01T10:20:00Z"),
    );
    const result = applyStatusTransition(current, "IN_INTERVIEW", 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.seatNumber).toBe(3);
    expect(result.value.completedAt).toBeNull();
  });
});
