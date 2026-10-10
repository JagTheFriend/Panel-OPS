import { z } from "zod";

export const rollNoSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "Roll number can only contain numbers")
  .min(3, "Roll number is too short")
  .max(20, "Roll number is too long");

export const pinSchema = z
  .string()
  .trim()
  .min(4, "PIN must be 4–12 characters")
  .max(12, "PIN must be 4–12 characters");

export const joinRoomSchema = z.object({
  rollNo: rollNoSchema,
  pin: pinSchema,
  name: z.string().trim().min(1, "Name is required").max(60),
  panelIds: z.array(z.string()).max(25),
});

export const createPanelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Domain name is too short")
    .max(60, "Domain name is too long"),
  description: z.string().trim().max(300).optional(),
});

export const updatePanelSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(2, "Domain name is too short")
    .max(60, "Domain name is too long"),
  description: z.string().trim().max(300).optional(),
  isActive: z.boolean(),
});

export const panelIdSchema = z.object({ panelId: z.string().min(1) });

export const removeMemberSchema = z.object({
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
  index: z.coerce.number().int().min(0).max(500).optional(),
});

export const reorderCandidatesSchema = z.object({
  panelId: z.string().min(1),
  orderedIds: z.array(z.string().min(1)).min(1).max(500),
});

export const updateCandidateSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
});

export const removeCandidateSchema = z.object({
  id: z.string().min(1),
});

export const setUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "USER"]),
});

export const deleteUserSchema = z.object({
  userId: z.string().min(1),
});
