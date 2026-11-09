import { NextResponse, type NextRequest } from "next/server";

import { awardGateBadge } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      userId?: unknown;
    };
    if (typeof body.userId !== "string" || !body.userId) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("badgeAwardFailed") },
        { status: 400 },
      );
    }
    return backendResponse(
      await awardGateBadge(auth.session.userId, id, body.userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgeAwardFailed"),
    });
  }
}
