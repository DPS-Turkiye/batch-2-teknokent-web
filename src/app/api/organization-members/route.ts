import type { NextRequest } from "next/server";

import {
  createOrganizationMember,
  fetchOrganizationMembers,
} from "@/lib/api/organization-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchOrganizationMembers(organizationId));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMembersLoadFailed"),
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
      message: await apiText("teamMemberAddFailed"),
    });
  }
}
