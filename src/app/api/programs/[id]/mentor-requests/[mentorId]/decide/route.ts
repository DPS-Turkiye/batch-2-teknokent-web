import { NextRequest, NextResponse } from "next/server";

import { decideProgramMentorRequest } from "@/lib/api/programs";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-program-access";

type RouteContext = { params: Promise<{ id: string; mentorId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, mentorId } = await context.params;
    const body = (await request.json()) as { accepted?: boolean };
    if (typeof body.accepted !== "boolean") {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("decisionRequired") },
        { status: 400 },
      );
    }
    return backendResponse(
      await decideProgramMentorRequest(
        auth.session.userId,
        id,
        mentorId,
        body.accepted,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorJoinAnswerFailed"),
    });
  }
}
