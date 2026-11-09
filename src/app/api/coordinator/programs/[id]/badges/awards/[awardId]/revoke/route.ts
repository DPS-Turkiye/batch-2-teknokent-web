import { NextResponse, type NextRequest } from "next/server";

import { revokeGateBadge } from "@/lib/api/badges";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { requireCoordinatorSession } from "@/lib/server/require-coordinator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; awardId: string }> },
) {
  try {
    const auth = await requireCoordinatorSession();
    if (!auth.ok) return auth.response;
    const { id, awardId } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      reason?: unknown;
    };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!reason) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("badgeRevokeReasonRequired"),
        },
        { status: 400 },
      );
    }
    return backendResponse(
      await revokeGateBadge(auth.session.userId, id, awardId, reason),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("badgeRevokeFailed"),
    });
  }
}
