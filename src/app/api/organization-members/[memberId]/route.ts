import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/api/organization-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

const memberUpdateSchema = z.object({
  fullName: z.string(),
  jobTitle: z.string().optional(),
});

type Context = { params: Promise<{ memberId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { memberId } = await params;
    const { organizationId, userId } = await getSessionIds();
    const body = await readJsonBody(request, memberUpdateSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await updateOrganizationMember(
        organizationId,
        memberId,
        userId,
        body.data,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMemberUpdateFailed"),
    });
  }
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    const { memberId } = await params;
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(
      await removeOrganizationMember(organizationId, memberId, userId),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMemberRemoveFailed"),
    });
  }
}
