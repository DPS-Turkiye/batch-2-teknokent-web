import type { NextRequest } from "next/server";
import { z } from "zod";

import { submitTrainingAttempt } from "@/lib/api/training";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

/** Each answer is the chosen option's index, keyed by question. */
const attemptSchema = z.object({
  version: z.int(),
  answers: z.record(z.string(), z.int()),
});

/** The backend grades; this only checks the shape and acts as the session's student. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, attemptSchema, {
      invalidMessage: "trainingSubmitFailed",
    });
    if (!body.ok) return body.response;
    return backendResponse(
      await submitTrainingAttempt(
        session.userId,
        body.data.version,
        body.data.answers,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("trainingSubmitFailed"),
    });
  }
}
