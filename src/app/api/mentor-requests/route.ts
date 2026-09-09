import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  createMentorRequest,
  fetchMentorRequests,
} from "@/lib/api/mentor-requests";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const role =
      request.nextUrl.searchParams.get("role") === UserRole.Mentor
        ? UserRole.Mentor
        : UserRole.Mentee;
    if (role === UserRole.Mentor) {
      return backendResponse(
        await fetchMentorRequests({
          requesterId: await getSessionMentorId(),
          role,
        }),
      );
    }
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchMentorRequests({ organizationId, role }));
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
