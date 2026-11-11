import type { NextRequest } from "next/server";
import { z } from "zod";

import { PeerTopicCategory } from "@/interfaces/peer-mentoring";
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
import { readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

const peerRequestSchema = z.object({
  mentorId: z.string(),
  category: z.enum(PeerTopicCategory),
  message: z.string(),
});

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
    const body = await readJsonBody(request, peerRequestSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createPeerMentoringRequest(session.userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringRequestFailed"),
    });
  }
}
