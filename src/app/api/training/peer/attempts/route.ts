import { NextResponse, type NextRequest } from "next/server";

import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";
import { submitTrainingAttempt } from "@/lib/api/training";

function answersOf(value: unknown): Record<string, number> | null {
  if (!value || typeof value !== "object") return null;
  const entries = Object.entries(value);
  return entries.every(([, option]) => Number.isInteger(option))
    ? (Object.fromEntries(entries) as Record<string, number>)
    : null;
}

/** The backend grades; this only checks the shape and acts as the session's student. */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = (await request.json().catch(() => ({}))) as {
      version?: unknown;
      answers?: unknown;
    };
    const answers = answersOf(body.answers);
    if (!Number.isInteger(body.version) || !answers) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("trainingSubmitFailed"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await submitTrainingAttempt(
        session.userId,
        body.version as number,
        answers,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("trainingSubmitFailed"),
    });
  }
}
