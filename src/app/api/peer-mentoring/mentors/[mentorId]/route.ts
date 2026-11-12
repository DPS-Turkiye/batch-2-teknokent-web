import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchPeerMentor } from "@/lib/api/peer-mentoring";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mentorId: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    const { mentorId } = await params;
    if (!z.uuid().safeParse(mentorId).success) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("personIdInvalid") },
        { status: 400 },
      );
    }
    return backendResponse(await fetchPeerMentor(session.userId, mentorId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("peerMentoringLoadFailed"),
    });
  }
}
