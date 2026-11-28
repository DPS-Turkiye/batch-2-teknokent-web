import "server-only";
import { z } from "zod";

import { stringOrNullSchema } from "@/lib/server/request-body";

/** A Süreç hand-in: the uploaded file, or none for an Ödev that asks for no file. */
export const processSubmissionSchema = z.object({
  documentId: stringOrNullSchema,
});
