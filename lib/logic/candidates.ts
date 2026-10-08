export type CandidateStatus = "WAITING" | "IN_INTERVIEW" | "DONE";

export type CandidateSnapshot = {
  status: CandidateStatus;
  seatNumber: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

export const CANDIDATE_STATUSES: CandidateStatus[] = [
  "WAITING",
  "IN_INTERVIEW",
  "DONE",
];

/** Seats currently held by candidates in interview (station occupancy). */
export function occupiedSeats(
  candidates: { seatNumber: number | null; status: CandidateStatus }[],
): Set<number> {
  const taken = new Set<number>();
  for (const candidate of candidates) {
    if (candidate.status === "IN_INTERVIEW" && candidate.seatNumber !== null) {
      taken.add(candidate.seatNumber);
    }
  }
  return taken;
}

/** Lowest free station number in 1..seatCount, or null when all are occupied. */
export function nextFreeSeat(
  taken: Set<number>,
  seatCount: number,
): number | null {
  for (let seat = 1; seat <= seatCount; seat++) {
    if (!taken.has(seat)) return seat;
  }
  return null;
}

/**
 * Pure status transition: computes the next candidate state.
 * - starting an interview stamps startedAt and claims a free station
 * - moving back to waiting releases the station and clears timestamps
 * - completing stamps completedAt and releases the station for the next person
 * - an already-started candidate keeps their original startedAt
 *
 * `freeSeat` is only needed when transitioning into IN_INTERVIEW.
 * Returns an error string when the transition cannot be applied.
 */
export function applyStatusTransition(
  current: CandidateSnapshot,
  next: CandidateStatus,
  freeSeat: number | null,
): { ok: true; value: CandidateSnapshot } | { ok: false; error: string } {
  if (current.status === next) {
    return { ok: true, value: current };
  }

  if (next === "IN_INTERVIEW") {
    // Always claim a currently-free station (a stale seatNumber from a finished
    // interview may already be held by somebody else).
    if (freeSeat === null) {
      return { ok: false, error: "All stations are occupied right now." };
    }
    return {
      ok: true,
      value: {
        status: "IN_INTERVIEW",
        seatNumber: freeSeat,
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
        seatNumber: null,
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
      seatNumber: current.seatNumber,
      startedAt: current.startedAt ?? new Date(),
      completedAt: new Date(),
    },
  };
}
