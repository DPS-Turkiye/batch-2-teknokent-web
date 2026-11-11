import type { NextRequest } from "next/server";
import { z } from "zod";

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
import { readJsonBody } from "@/lib/server/request-body";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

const createMentorshipSchema = z.object({
  organizationId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  daysPerWeek: z.number(),
});

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
    const body = await readJsonBody(request, createMentorshipSchema, {
      invalidMessage: "regularMentorshipFieldsRequired",
    });
    if (!body.ok) return body.response;
    const { organizationId, startDate, endDate, daysPerWeek } = body.data;
    return backendResponse(
      await createRegularMentorship({
        mentorId,
        organizationId,
        status: "ACTIVE",
        startDate,
        endDate,
        daysPerWeek: Math.min(7, Math.max(1, daysPerWeek)),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("regularMentorshipStartFailed"),
    });
  }
}
