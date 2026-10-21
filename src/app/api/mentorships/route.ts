import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import {
  createRegularMentorship,
  fetchRegularMentorships,
} from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const role =
      request.nextUrl.searchParams.get("role") === UserRole.Mentor
        ? UserRole.Mentor
        : UserRole.Mentee;
    if (role === UserRole.Mentor) {
      return backendResponse(
        await fetchRegularMentorships({
          mentorId: await getSessionMentorId(),
        }),
      );
    }
    const { organizationId } = await getSessionIds();
    return backendResponse(await fetchRegularMentorships({ organizationId }));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("regularMentorshipsUnavailable"),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const mentorId = await getSessionMentorId();
    const body = (await request.json()) as {
      organizationId?: string;
      startDate?: string;
      endDate?: string;
      daysPerWeek?: number;
    };
    if (!body.organizationId || !body.startDate || !body.endDate) {
      return apiErrorResponse(new Error("Eksik alanlar"), {
        message: await apiText("regularMentorshipFieldsRequired"),
        status: 400,
      });
    }
    return backendResponse(
      await createRegularMentorship({
        mentorId,
        organizationId: body.organizationId,
        status: "ACTIVE",
        startDate: body.startDate,
        endDate: body.endDate,
        daysPerWeek: Math.min(7, Math.max(1, body.daysPerWeek ?? 1)),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("regularMentorshipStartFailed"),
    });
  }
}
