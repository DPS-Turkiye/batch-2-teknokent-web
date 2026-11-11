import { NextResponse, type NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { updateActionItem } from "@/lib/api/action-items";
import { hasPermission } from "@/lib/permissions";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import { SessionRequiredError } from "@/lib/server/session-error";
import { getSessionUser } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session) throw new SessionRequiredError();
    if (!hasPermission(session, UserRole.Mentee) || !session.organizationId) {
      return NextResponse.json(
        {
          code: "FORBIDDEN",
          message: await apiText("actionItemsStartupMembersOnly"),
        },
        { status: 403 },
      );
    }
    const { id } = await params;
    const body = await readJsonBody(request, jsonObjectSchema);
    if (!body.ok) return body.response;

    return backendResponse(
      await updateActionItem(id, session.organizationId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("actionItemUpdateFailed"),
    });
  }
}
