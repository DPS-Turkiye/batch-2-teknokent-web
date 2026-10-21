import type { NextRequest } from "next/server";

import { removePendingMember } from "@/lib/api/organization-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type Context = { params: Promise<{ pendingId: string }> };

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { pendingId } = await params;
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(
      await removePendingMember(organizationId, pendingId, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("pendingMemberRemoveFailed"),
    });
  }
}
