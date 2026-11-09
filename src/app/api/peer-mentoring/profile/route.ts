import type { NextRequest } from "next/server";

import type { SavePeerMentorProfileInput } from "@/interfaces/peer-mentoring";
import {
  fetchPeerMentorProfile,
  savePeerMentorProfile,
} from "@/lib/api/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    return backendResponse(await fetchPeerMentorProfile(session.userId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringLoadFailed"),
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body = (await request.json()) as Partial<SavePeerMentorProfileInput>;
    return backendResponse(
      await savePeerMentorProfile(session.userId, {
        categories: strings(
          body.categories,
        ) as SavePeerMentorProfileInput["categories"],
        subTopics: strings(body.subTopics),
        strongCourses: strings(body.strongCourses),
        projects: strings(body.projects),
        erasmus: String(body.erasmus ?? ""),
        helpWith: String(body.helpWith ?? ""),
        linkedinUrl: String(body.linkedinUrl ?? ""),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentorProfileSaveFailed"),
    });
  }
}
