import { z } from "zod";

export const assignMentorshipTaskSchema = z.object({
  ownerId: z.uuid(),
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).optional(),
  dueDate: z.iso.date().optional(),
});
