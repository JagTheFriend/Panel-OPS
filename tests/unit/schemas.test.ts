import { describe, expect, it } from "vitest";
import {
  addCandidateSchema,
  candidateStatusSchema,
  createPanelSchema,
  joinRoomSchema,
  pinSchema,
  reorderCandidatesSchema,
  rollNoSchema,
  setUserRoleSchema,
  updateCandidateSchema,
} from "@/lib/schemas";

describe("rollNoSchema", () => {
  it("accepts typical roll numbers and trims whitespace", () => {
    expect(rollNoSchema.parse("  CS-01_2.a ")).toBe("CS-01_2.a");
    expect(rollNoSchema.parse("ADMIN001")).toBe("ADMIN001");
  });

  it("rejects short, long, or malformed roll numbers", () => {
    expect(rollNoSchema.safeParse("ab").success).toBe(false);
    expect(rollNoSchema.safeParse("a".repeat(21)).success).toBe(false);
    expect(rollNoSchema.safeParse("has space").success).toBe(false);
    expect(rollNoSchema.safeParse("semi;colon").success).toBe(false);
    expect(rollNoSchema.safeParse("").success).toBe(false);
  });

  it("surfaces friendly error messages", () => {
    const result = rollNoSchema.safeParse("ab");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Roll number is too short");
    }
  });
});

describe("pinSchema", () => {
  it("accepts 4-12 character pins and trims", () => {
    expect(pinSchema.parse(" 1234 ")).toBe("1234");
    expect(pinSchema.parse("123456789012")).toBe("123456789012");
  });

  it("rejects pins outside the length bounds", () => {
    expect(pinSchema.safeParse("123").success).toBe(false);
    expect(pinSchema.safeParse("1234567890123").success).toBe(false);
  });
});

describe("joinRoomSchema", () => {
  it("defaults panelIds to an empty array", () => {
    const result = joinRoomSchema.safeParse({
      rollNo: "ADMIN001",
      pin: "7331",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.panelIds).toEqual([]);
      expect(result.data.name).toBeUndefined();
    }
  });

  it("rejects an oversized panelIds list", () => {
    const result = joinRoomSchema.safeParse({
      rollNo: "ADMIN001",
      pin: "7331",
      panelIds: Array.from({ length: 26 }, (_, i) => `p${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("requires a valid roll number", () => {
    expect(joinRoomSchema.safeParse({ rollNo: "x", pin: "1234" }).success).toBe(
      false,
    );
  });
});

describe("createPanelSchema", () => {
  it("coerces a string seatCount to an integer", () => {
    const result = createPanelSchema.safeParse({
      name: "Web Development",
      seatCount: "6",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seatCount).toBe(6);
      expect(result.data.description).toBeUndefined();
    }
  });

  it("rejects out-of-range or fractional seat counts", () => {
    expect(
      createPanelSchema.safeParse({ name: "AI", seatCount: 0 }).success,
    ).toBe(false);
    expect(
      createPanelSchema.safeParse({ name: "AI", seatCount: 31 }).success,
    ).toBe(false);
    expect(
      createPanelSchema.safeParse({ name: "AI", seatCount: 2.5 }).success,
    ).toBe(false);
  });

  it("rejects a too-short domain name", () => {
    const result = createPanelSchema.safeParse({ name: "a", seatCount: 6 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Domain name is too short");
    }
  });
});

describe("candidateStatusSchema", () => {
  it("accepts the three board columns with a coerced index", () => {
    for (const status of ["WAITING", "IN_INTERVIEW", "DONE"] as const) {
      expect(
        candidateStatusSchema.safeParse({ id: "c1", status, index: "2" })
          .success,
      ).toBe(true);
    }
  });

  it("rejects unknown statuses and invalid indexes", () => {
    expect(
      candidateStatusSchema.safeParse({ id: "c1", status: "ARCHIVED" }).success,
    ).toBe(false);
    expect(
      candidateStatusSchema.safeParse({ id: "c1", status: "DONE", index: -1 })
        .success,
    ).toBe(false);
    expect(
      candidateStatusSchema.safeParse({ id: "", status: "DONE" }).success,
    ).toBe(false);
  });
});

describe("reorderCandidatesSchema", () => {
  it("accepts a non-empty list of ids", () => {
    const result = reorderCandidatesSchema.safeParse({
      panelId: "p1",
      orderedIds: ["a", "b"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty id lists", () => {
    expect(
      reorderCandidatesSchema.safeParse({ panelId: "p1", orderedIds: [] })
        .success,
    ).toBe(false);
  });
});

describe("updateCandidateSchema", () => {
  it("trims the candidate name", () => {
    const result = updateCandidateSchema.safeParse({
      id: "c1",
      name: "  Ada  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ada");
  });

  it("rejects blank names", () => {
    expect(
      updateCandidateSchema.safeParse({ id: "c1", name: "   " }).success,
    ).toBe(false);
  });
});

describe("setUserRoleSchema", () => {
  it("only allows the two roles", () => {
    expect(
      setUserRoleSchema.safeParse({ userId: "u1", role: "ADMIN" }).success,
    ).toBe(true);
    expect(
      setUserRoleSchema.safeParse({ userId: "u1", role: "OWNER" }).success,
    ).toBe(false);
  });
});

describe("addCandidateSchema", () => {
  it("accepts a roll without a name", () => {
    expect(
      addCandidateSchema.safeParse({ panelId: "p1", rollNo: "CS001" }).success,
    ).toBe(true);
  });

  it("rejects a malformed roll", () => {
    expect(
      addCandidateSchema.safeParse({ panelId: "p1", rollNo: "a b" }).success,
    ).toBe(false);
  });
});
