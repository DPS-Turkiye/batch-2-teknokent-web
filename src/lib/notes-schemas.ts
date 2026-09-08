import { z } from "zod";

export const saveMeetingNoteBodySchema = z.object({
  content: z.string().max(200000),
});

const textField = z
  .union([z.string(), z.number(), z.boolean(), z.null()])
  .optional()
  .transform((value) => (value == null ? "" : String(value)));

const nullableText = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  });

const textList = z
  .array(z.union([z.string(), z.number(), z.null()]))
  .optional()
  .transform(
    (items) =>
      items
        ?.map((item) => (item == null ? "" : String(item)))
        .filter((item) => item.trim().length > 0) ?? [],
  );

export const publishAssistantShareBodySchema = z.union([
  z.object({
    kind: z.literal("TRANSCRIPT"),
    transcript: z
      .array(
        z
          .object({
            id: textField,
            speaker: textField,
            text: textField,
            at: textField,
          })
          .transform((line) => ({
            id: line.id.trim() || `${line.at}-${line.text}` || "line",
            speaker: line.speaker.trim() || "Speaker",
            text: line.text,
            at: line.at,
          })),
      )
      .min(1),
  }),
  z.object({
    kind: z.literal("PROVIDER_TRANSCRIPT"),
    platform: z.string().trim().min(1),
    nativeMeetingId: z.string().trim().min(1),
  }),
  z.object({
    kind: z.literal("TRANSCRIPT_S3"),
  }),
  z.object({
    kind: z.literal("REPORT_S3"),
  }),
  z.object({
    kind: z.literal("REPORT"),
    report: z.object({
      title: textField,
      meetingDate: nullableText,
      topic: nullableText,
      summary: textField,
      topicsDiscussed: textList,
      decisions: textList,
      actionItems: z
        .array(
          z.object({
            owner: nullableText,
            task: textField,
            due: nullableText,
          }),
        )
        .optional()
        .transform((items) => items ?? []),
      risksOrBlockers: textList,
      nextSteps: textList,
      model: textField,
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
    message: "Bir başlık veya tamamlanma durumu girin.",
  });
