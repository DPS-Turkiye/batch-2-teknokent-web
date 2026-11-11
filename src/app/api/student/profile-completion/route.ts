import type { NextRequest } from "next/server";
import { z } from "zod";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import {
  fetchStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/api/student-profile-completion";
import { isEnumValue } from "@/lib/enum";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

const profileCompletionSchema = z.object({
  // A topic the board no longer offers (say, from an old draft) is dropped, not refused.
  // The page sends the GET's answer back on skip; a student who never saved may have nulls there.
  topics: z
    .array(z.string())
    .nullish()
    .transform((topics) =>
      (topics ?? []).filter((topic) => isEnumValue(PeerTopicCategory, topic)),
    ),
  subtopics: z
    .array(z.string())
    .nullish()
    .transform((subtopics) => subtopics ?? []),
  goal: z
    .string()
    .nullish()
    .transform((goal) => goal ?? ""),
  completed: z
    .boolean()
    .nullish()
    .transform((completed) => completed ?? false),
  skipped: z
    .boolean()
    .nullish()
    .transform((skipped) => skipped ?? false),
});

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return backendResponse(await fetchStudentProfileCompletion(session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("studentProfileCompletionLoadFailed"),
    });
  }
}

/** The whole set is replaced; anything that isn't one of the board's categories is dropped before it is sent. */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = await readJsonBody(request, profileCompletionSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await saveStudentProfileCompletion(session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("studentProfileCompletionSaveFailed"),
    });
  }
}
