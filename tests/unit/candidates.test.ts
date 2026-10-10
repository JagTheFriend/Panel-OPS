import { describe, expect, it } from "vitest";
import {
  applyStatusTransition,
  type CandidateSnapshot,
} from "@/lib/logic/candidates";

const waiting: CandidateSnapshot = {
  status: "WAITING",
  startedAt: null,
  completedAt: null,
};

const inInterview = (startedAt: Date | null): CandidateSnapshot => ({
  status: "IN_INTERVIEW",
  startedAt,
  completedAt: null,
});

const done = (
  startedAt: Date | null,
  completedAt: Date | null,
): CandidateSnapshot => ({
  status: "DONE",
  startedAt,
  completedAt,
});

describe("applyStatusTransition", () => {
  it("treats a same-status transition as a no-op", () => {
    const current = inInterview(new Date("2026-01-01T10:00:00Z"));
    const result = applyStatusTransition(current, "IN_INTERVIEW");
    expect(result).toEqual({ ok: true, value: current });
    expect(result.ok && result.value).toBe(current);
  });

  it("starting an interview stamps startedAt", () => {
    const result = applyStatusTransition(waiting, "IN_INTERVIEW");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("IN_INTERVIEW");
    expect(result.value.startedAt).toBeInstanceOf(Date);
    expect(result.value.completedAt).toBeNull();
  });

  it("moving back to waiting clears timestamps", () => {
    const current = inInterview(new Date("2026-01-01T10:00:00Z"));
    const result = applyStatusTransition(current, "WAITING");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      status: "WAITING",
      startedAt: null,
      completedAt: null,
    });
  });

  it("completing keeps the original startedAt and stamps completedAt", () => {
    const startedAt = new Date("2026-01-01T10:00:00Z");
    const current = inInterview(startedAt);
    const result = applyStatusTransition(current, "DONE");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("DONE");
    expect(result.value.startedAt).toBe(startedAt);
    expect(result.value.completedAt).toBeInstanceOf(Date);
    expect(result.value.completedAt?.getTime()).toBeGreaterThanOrEqual(
      startedAt.getTime(),
    );
  });

  it("completing a never-started waiting candidate stamps both timestamps", () => {
    const result = applyStatusTransition(waiting, "DONE");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.startedAt).toBeInstanceOf(Date);
    expect(result.value.completedAt).toBeInstanceOf(Date);
  });

  it("reopening a completed interview returns to waiting cleanly", () => {
    const current = done(
      new Date("2026-01-01T10:00:00Z"),
      new Date("2026-01-01T10:20:00Z"),
    );
    const result = applyStatusTransition(current, "WAITING");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({
      status: "WAITING",
      startedAt: null,
      completedAt: null,
    });
  });

  it("re-interviewing a completed candidate clears completedAt", () => {
    const current = done(
      new Date("2026-01-01T10:00:00Z"),
      new Date("2026-01-01T10:20:00Z"),
    );
    const result = applyStatusTransition(current, "IN_INTERVIEW");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.completedAt).toBeNull();
  });
});
