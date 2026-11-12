import "server-only";
import { z } from "zod";

import { COORDINATOR_SEARCH_MIN_LENGTH } from "@/lib/coordinator-picker";

/** `?q=` must be long enough that a search never lists everyone; the backend checks the same. */
export const coordinatorSearchSchema = z.object({
  q: z.string().trim().min(COORDINATOR_SEARCH_MIN_LENGTH).max(255),
  programId: z.uuid().optional(),
});
