import { z } from "zod";

export const saveMeetingNoteBodySchema = z.object({
  content: z.string().max(200000),
});

export const publishAssistantShareBodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("TRANSCRIPT"),
    transcript: z
      .array(
        z.object({
          id: z.string(),
          speaker: z.string(),
          text: z.string(),
          at: z.string(),
        }),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal("REPORT"),
    report: z.object({
      title: z.string(),
      meetingDate: z.string().nullable().optional(),
      topic: z.string().nullable().optional(),
      summary: z.string(),
      topicsDiscussed: z.array(z.string()).optional(),
      decisions: z.array(z.string()).optional(),
      actionItems: z
        .array(
          z.object({
            owner: z.string().nullable().optional(),
            task: z.string(),
            due: z.string().nullable().optional(),
          }),
        )
        .optional(),
      risksOrBlockers: z.array(z.string()).optional(),
      nextSteps: z.array(z.string()).optional(),
      model: z.string().optional(),
    }),
  }),
]);

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
