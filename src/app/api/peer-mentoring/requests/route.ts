import type { NextRequest } from "next/server";

import type { CreatePeerMentoringRequestInput } from "@/interfaces/peer-mentoring";
import { UserRole } from "@/interfaces/session";
import {
  createPeerMentoringRequest,
  fetchPeerMentoringRequests,
} from "@/lib/api/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const side =
      request.nextUrl.searchParams.get("as") === UserRole.Mentor
        ? UserRole.Mentor
        : UserRole.Mentee;
    return backendResponse(
      await fetchPeerMentoringRequests(session.userId, side),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringLoadFailed"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const body =
      (await request.json()) as Partial<CreatePeerMentoringRequestInput>;
    return backendResponse(
      await createPeerMentoringRequest(session.userId, {
        mentorId: String(body.mentorId ?? ""),
        category: body.category as CreatePeerMentoringRequestInput["category"],
        message: String(body.message ?? ""),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringRequestFailed"),
    });
  }
}
