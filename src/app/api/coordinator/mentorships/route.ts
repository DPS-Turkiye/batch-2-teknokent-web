import type { NextRequest } from "next/server";

import { fetchCoordinatorMentorships } from "@/lib/api/coordinator-mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const programId = request.nextUrl.searchParams.get("programId");
    return backendResponse(
      await fetchCoordinatorMentorships(auth.session.userId, programId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorshipsLoadFailed"),
    });
  }
}
