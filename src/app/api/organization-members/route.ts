import type { NextRequest } from "next/server";

import type { OrganizationMemberInput } from "@/interfaces/organization-member";

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
    const { organizationId, userId } = await getSessionIds();
    const { fullName, email, jobTitle } =
      (await request.json()) as OrganizationMemberInput;
    return backendResponse(
      await createOrganizationMember(organizationId, userId, {
        fullName,
        email,
        jobTitle,
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("teamMemberAddFailed"),
    });
  }
}
