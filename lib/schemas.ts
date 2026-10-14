import { z } from "zod";

export const pinSchema = z
  .string()
  .trim()
  .min(4, "PIN must be 4–12 characters")
  .max(12, "PIN must be 4–12 characters");

export const roomCodeSchema = z
  .string()
  .trim()
  .min(4, "Room code is too short")
  .max(12, "Room code is too long")
  .regex(/^[a-zA-Z0-9]+$/, "Room code is alphanumeric");

export const createRoomSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Room name is too short")
      .max(60, "Room name is too long"),
    adminPin: pinSchema,
    normalPin: pinSchema,
  })
  .refine((values) => values.adminPin !== values.normalPin, {
    message: "Admin and normal PIN must differ",
    path: ["normalPin"],
  });

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  pin: pinSchema,
});

export const roomIdSchema = z.object({ roomId: z.string().min(1) });

export const rollNoSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Roll number can only contain numbers")
  .min(3, "Roll number is too short")
  .max(20, "Roll number is too long");

export const createPanelSchema = z.object({
  roomId: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, "Domain name is too short")
    .max(60, "Domain name is too long"),
  description: z.string().trim().max(300).optional(),
});

export const updatePanelSchema = z.object({
  roomId: z.string().min(1),
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, "Domain name is too short")
    .max(60, "Domain name is too long"),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean(),
});

export const panelRefSchema = z.object({
  roomId: z.string().min(1),
  panelId: z.string().min(1),
});

export const removePanelMemberSchema = z.object({
  panelId: z.string().min(1),
  userId: z.string().min(1),
});

export const addCandidateSchema = z.object({
  panelId: z.string().min(1),
  rollNo: rollNoSchema,
  name: z.string().trim().max(60).optional(),
});

export const candidateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["WAITING", "IN_INTERVIEW", "DONE"]),
  index: z.coerce.number().int().min(0).max(10_000).optional(),
});

export const reorderCandidatesSchema = z.object({
  panelId: z.string().min(1),
  orderedIds: z
    .array(z.string().min(1))
    .min(1)
    .max(10_000)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids"),
});

export const updateCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
});

export const removeCandidateSchema = z.object({
  id: z.string().min(1),
});

export const setRoomMemberRoleSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
});

export const removeRoomMemberSchema = z.object({
  roomId: z.string().min(1),
  userId: z.string().min(1),
});
