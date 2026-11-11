import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  createOrganizationMember,
  fetchOrganizationMembers,
} from "@/lib/api/organization-members";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds } from "@/lib/session";

const memberSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  jobTitle: z.string().optional(),
});

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
    const { organizationId, userId } = await getSessionIds();
    const body = await readJsonBody(request, memberSchema);
    if (!body.ok) return body.response;
    return backendResponse(
      await createOrganizationMember(organizationId, userId, body.data),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMemberAddFailed"),
    });
  }
}
