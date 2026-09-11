import type { NextRequest } from "next/server";

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
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(
      await updateOrganizationMember(organizationId, memberId, userId, payload),
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
