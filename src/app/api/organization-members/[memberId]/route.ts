import type { NextRequest } from "next/server";

import type { OrganizationMemberUpdate } from "@/interfaces/organization-member";

import {
  removeOrganizationMember,
  updateOrganizationMember,
} from "@/lib/api/organization-members";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

type Context = { params: Promise<{ memberId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const { memberId } = await params;
    const { organizationId, userId } = await getSessionIds();
    const { fullName, jobTitle } =
      (await request.json()) as OrganizationMemberUpdate;
    return backendResponse(
      await updateOrganizationMember(organizationId, memberId, userId, {
        fullName,
        jobTitle,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, { message: "Ekip üyesi güncellenemedi." });
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
    return apiErrorResponse(error, { message: "Ekip üyesi çıkarılamadı." });
  }
}
