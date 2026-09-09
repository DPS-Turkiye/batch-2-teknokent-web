import type { NextRequest } from "next/server";

import {
  createOrganizationMember,
  fetchOrganizationMembers,
} from "@/lib/api/organization-members";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchOrganizationMembers(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Ekip üyeleri yüklenemedi.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organizationId } = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(
      await createOrganizationMember(organizationId, payload),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Ekip üyesi eklenemedi.",
    });
  }
}
