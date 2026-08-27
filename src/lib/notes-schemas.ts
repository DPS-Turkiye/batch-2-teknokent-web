import { z } from "zod";

export const saveMeetingNoteBodySchema = z.object({
  content: z.string().max(200000),
});

export const createMeetingTodoBodySchema = z.object({
  title: z.string().trim().min(1).max(1000),
});

export const updateMeetingTodoBodySchema = z
  .object({
    title: z.string().trim().min(1).max(1000).optional(),
    done: z.boolean().optional(),
  })
  .refine((body) => body.title !== undefined || body.done !== undefined, {
    message: "Provide a title or a done flag.",
  });
