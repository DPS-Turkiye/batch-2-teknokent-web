import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { updateActionItem } from "@/lib/api/action-items";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    if (session.role !== UserRole.Mentee || !session.organizationId) {
      return NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("actionItemsStartupMembersOnly"),
        },
        { status: 403 },
      );
    }
    const { id } = await params;
    const payload = (await request.json()) as Record<string, unknown>;

    return backendResponse(
      await updateActionItem(id, session.organizationId, payload),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("actionItemUpdateFailed"),
    });
  }
}
