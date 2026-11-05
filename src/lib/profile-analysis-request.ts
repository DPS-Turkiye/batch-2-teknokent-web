import { z } from "zod";

export const startupAnalysisRequestSchema = z.object({
  profile: z.record(z.string(), z.unknown()),
});
