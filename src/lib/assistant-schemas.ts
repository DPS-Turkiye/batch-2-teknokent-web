import { z } from "zod";

export const addBotBodySchema = z.object({
  meetingUrl: z.string().trim().url(),
});

export const transcriptQuerySchema = z.object({
  platform: z.string().trim().min(1),
  nativeMeetingId: z.string().trim().min(1),
});
