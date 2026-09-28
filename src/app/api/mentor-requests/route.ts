import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  createMentorRequest,
  fetchMentorRequests,
  fetchMentorRequestsPage,
} from "@/lib/api/mentor-requests";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
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
            actorId: await getSessionMentorId(),
            requesterId: await getSessionMentorId(),
            role,
            tab,
            page,
            size,
          }),
        );
      }
      const { organizationId, userId } = await getSessionIds();
      return backendResponse(
        await fetchMentorRequestsPage({
          actorId: userId,
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
          actorId: await getSessionMentorId(),
          requesterId: await getSessionMentorId(),
          role,
        }),
      );
    }
    const { organizationId, userId } = await getSessionIds();
    return backendResponse(
      await fetchMentorRequests({ actorId: userId, organizationId, role }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentorluk talebi hizmetine ulaşılamıyor.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionIds();
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await createMentorRequest(session, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Mentorluk talebi oluşturulamadı.",
    });
  }
}
