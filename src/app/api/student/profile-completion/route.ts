import type { NextRequest } from "next/server";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
import type { StudentProfileCompletion } from "@/interfaces/student-profile-completion";
import {
  fetchStudentProfileCompletion,
  saveStudentProfileCompletion,
} from "@/lib/api/student-profile-completion";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

const CATEGORIES = new Set<string>(Object.values(PeerTopicCategory));

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

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
    const body = (await request.json()) as Partial<StudentProfileCompletion>;
    return backendResponse(
      await saveStudentProfileCompletion(session.userId, {
        topics: strings(body.topics).filter((topic) =>
          CATEGORIES.has(topic),
        ) as PeerTopicCategory[],
        subtopics: strings(body.subtopics),
        goal: String(body.goal ?? ""),
        completed: body.completed === true,
        skipped: body.skipped === true,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("studentProfileCompletionSaveFailed"),
    });
  }
}
