import "server-only";
import { z } from "zod";

import { stringOrNullSchema } from "@/lib/server/request-body";

/** "Ödev ver": what the coordinator gives every team of the program. */
export const createProgramAssignmentSchema = z.object({
  title: z.string(),
  description: stringOrNullSchema,
  dueDate: stringOrNullSchema,
  phaseId: stringOrNullSchema,
  fileRequired: z.boolean().default(false),
});

/** A Süreç hand-in: the uploaded file, or none for an Ödev that asks for no file. */
export const processSubmissionSchema = z.object({
  documentId: stringOrNullSchema,
});
