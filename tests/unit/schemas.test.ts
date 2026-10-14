import { describe, expect, it } from "vitest";
import {
  addCandidateSchema,
  candidateStatusSchema,
  createPanelSchema,
  createRoomSchema,
  joinRoomSchema,
  pinSchema,
  reorderCandidatesSchema,
  rollNoSchema,
  setRoomMemberRoleSchema,
  updateCandidateSchema,
} from "@/lib/schemas";

describe("rollNoSchema", () => {
  it("accepts numeric roll numbers and trims whitespace", () => {
    expect(rollNoSchema.parse("  210042 ")).toBe("210042");
    expect(rollNoSchema.parse("9001")).toBe("9001");
  });

  it("rejects short, long, or non-numeric roll numbers", () => {
    expect(rollNoSchema.safeParse("12").success).toBe(false);
    expect(rollNoSchema.safeParse("1".repeat(21)).success).toBe(false);
    expect(rollNoSchema.safeParse("ADMIN001").success).toBe(false);
    expect(rollNoSchema.safeParse("has space").success).toBe(false);
    expect(rollNoSchema.safeParse("").success).toBe(false);
  });

  it("surfaces friendly error messages", () => {
    const short = rollNoSchema.safeParse("12");
    expect(short.success).toBe(false);
    if (!short.success) {
      expect(short.error.issues[0].message).toBe("Roll number is too short");
    }
    const letters = rollNoSchema.safeParse("AB1234");
    expect(letters.success).toBe(false);
    if (!letters.success) {
      expect(letters.error.issues[0].message).toBe(
        "Roll number can only contain numbers",
      );
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
  it("requires a room code and a pin", () => {
    const missingPin = joinRoomSchema.safeParse({ code: "DEMO42" });
    expect(missingPin.success).toBe(false);

    const missingCode = joinRoomSchema.safeParse({ pin: "1234" });
    expect(missingCode.success).toBe(false);

    const result = joinRoomSchema.safeParse({ code: "DEMO42", pin: "1234" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("DEMO42");
      expect(result.data.pin).toBe("1234");
    }
  });

  it("trims and accepts mixed-case codes", () => {
    const result = joinRoomSchema.safeParse({ code: "  ab3k9z ", pin: "7331" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.code).toBe("ab3k9z");
  });

  it("rejects codes with symbols or too short", () => {
    expect(
      joinRoomSchema.safeParse({ code: "AB-3K", pin: "1234" }).success,
    ).toBe(false);
    expect(joinRoomSchema.safeParse({ code: "AB", pin: "1234" }).success).toBe(
      false,
    );
  });

  it("requires a valid pin length", () => {
    expect(
      joinRoomSchema.safeParse({ code: "DEMO42", pin: "12" }).success,
    ).toBe(false);
  });
});

describe("createRoomSchema", () => {
  it("accepts a name with two different pins", () => {
    const result = createRoomSchema.safeParse({
      name: "Tech Symposium",
      adminPin: "7331",
      normalPin: "1234",
    });
    expect(result.success).toBe(true);
  });

  it("rejects identical admin and normal pins", () => {
    const result = createRoomSchema.safeParse({
      name: "Tech Symposium",
      adminPin: "1234",
      normalPin: "1234",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Admin and normal PIN must differ",
      );
    }
  });

  it("rejects short room names and short pins", () => {
    expect(
      createRoomSchema.safeParse({
        name: "A",
        adminPin: "7331",
        normalPin: "1234",
      }).success,
    ).toBe(false);
    expect(
      createRoomSchema.safeParse({
        name: "Tech Symposium",
        adminPin: "12",
        normalPin: "1234",
      }).success,
    ).toBe(false);
  });
});

describe("createPanelSchema", () => {
  it("accepts a room id, name, and optional description", () => {
    const result = createPanelSchema.safeParse({
      roomId: "r1",
      name: "Web Development",
      description: "Frontend queue",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Web Development");
      expect(result.data.description).toBe("Frontend queue");
    }
  });

  it("requires a roomId", () => {
    expect(createPanelSchema.safeParse({ name: "Web Dev" }).success).toBe(
      false,
    );
  });

  it("rejects a too-short domain name", () => {
    const result = createPanelSchema.safeParse({ roomId: "r1", name: "a" });
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

describe("setRoomMemberRoleSchema", () => {
  it("only allows the two roles and requires room + user", () => {
    expect(
      setRoomMemberRoleSchema.safeParse({
        roomId: "r1",
        userId: "u1",
        role: "ADMIN",
      }).success,
    ).toBe(true);
    expect(
      setRoomMemberRoleSchema.safeParse({
        roomId: "r1",
        userId: "u1",
        role: "OWNER",
      }).success,
    ).toBe(false);
    expect(
      setRoomMemberRoleSchema.safeParse({ userId: "u1", role: "ADMIN" })
        .success,
    ).toBe(false);
  });
});

describe("addCandidateSchema", () => {
  it("accepts a roll without a name", () => {
    expect(
      addCandidateSchema.safeParse({ panelId: "p1", rollNo: "1001" }).success,
    ).toBe(true);
  });

  it("rejects a malformed roll", () => {
    expect(
      addCandidateSchema.safeParse({ panelId: "p1", rollNo: "a b" }).success,
    ).toBe(false);
  });
});
