export type CandidateStatus = "WAITING" | "IN_INTERVIEW" | "DONE";

export type CandidateSnapshot = {
  status: CandidateStatus;
  startedAt: Date | null;
  completedAt: Date | null;
};

export const CANDIDATE_STATUSES: CandidateStatus[] = [
  "WAITING",
  "IN_INTERVIEW",
  "DONE",
];

/**
 * Pure status transition: computes the next candidate state.
 * - starting an interview stamps startedAt
 * - moving back to waiting clears timestamps
 * - completing stamps completedAt
 * - an already-started candidate keeps their original startedAt
 */
export function applyStatusTransition(
  current: CandidateSnapshot,
  next: CandidateStatus,
): { ok: true; value: CandidateSnapshot } | { ok: false; error: string } {
  if (current.status === next) {
    return { ok: true, value: current };
  }

  if (next === "IN_INTERVIEW") {
    return {
      ok: true,
      value: {
        status: "IN_INTERVIEW",
        startedAt: current.startedAt ?? new Date(),
        completedAt: null,
      },
    };
  }

  if (next === "WAITING") {
    return {
      ok: true,
      value: {
        status: "WAITING",
        startedAt: null,
        completedAt: null,
      },
    };
  }

  // DONE
  return {
    ok: true,
    value: {
      status: "DONE",
      startedAt: current.startedAt ?? new Date(),
      completedAt: new Date(),
    },
  };
}
