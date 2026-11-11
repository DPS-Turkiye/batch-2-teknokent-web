import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  createMentorRequest,
  fetchMentorRequests,
  fetchMentorRequestsPage,
} from "@/lib/api/mentor-requests";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";
import {
  emptyListWithoutOrganization,
  emptyPageWithoutOrganization,
} from "@/lib/server/without-organization";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const role =
      request.nextUrl.searchParams.get("role") === UserRole.Mentor
        ? UserRole.Mentor
        : UserRole.Mentee;
    const tab = request.nextUrl.searchParams.get("tab");
    const pageParam = request.nextUrl.searchParams.get("page");
    const sizeParam = request.nextUrl.searchParams.get("size");

    if (tab) {
      const page = Math.max(0, Number(pageParam ?? "0") || 0);
      const size = Math.max(1, Number(sizeParam ?? "7") || 7);
      if (role === UserRole.Mentor) {
        return backendResponse(
          await fetchMentorRequestsPage({
            requesterId: await getSessionMentorId(),
            role,
            tab,
            page,
            size,
          }),
        );
      }
      const { organizationId } = await getSessionIds();
      if (!organizationId) return emptyPageWithoutOrganization(page, size);
      return backendResponse(
        await fetchMentorRequestsPage({
          organizationId,
          role,
          tab,
          page,
          size,
        }),
      );
    }

    if (role === UserRole.Mentor) {
      return backendResponse(
        await fetchMentorRequests({
          requesterId: await getSessionMentorId(),
          role,
        }),
      );
    }
    const { organizationId } = await getSessionIds();
    if (!organizationId) return emptyListWithoutOrganization();
    return backendResponse(await fetchMentorRequests({ organizationId, role }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorRequestServiceUnavailable"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionIds();
    const body = await readJsonBody(request, jsonObjectSchema);
    if (!body.ok) return body.response;
    return backendResponse(await createMentorRequest(session, body.data));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("mentorRequestCreateFailed"),
    });
  }
}
