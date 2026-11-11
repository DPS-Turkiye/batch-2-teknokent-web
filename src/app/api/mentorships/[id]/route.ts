import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import type { RegularMentorship } from "@/interfaces/regular-mentorship";
import {
  deleteRegularMentorship,
  fetchRegularMentorship,
  updateRegularMentorship,
} from "@/lib/api/mentorships";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readJsonBody, stringOrNullSchema } from "@/lib/server/request-body";
import { getSessionIds, getSessionMentorId } from "@/lib/session";

const updateMentorshipSchema = z.object({
  startDate: z.string().min(1),
  endDate: stringOrNullSchema,
  daysPerWeek: z.number(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { userId, organizationId } = await getSessionIds();
    const { id } = await context.params;
    const response = await fetchRegularMentorship(id);
    const mentorship = response.data as RegularMentorship | undefined;
    if (
      response.status === 200 &&
      mentorship?.mentorId !== userId &&
      mentorship?.organizationId !== organizationId
    ) {
      return NextResponse.json(
        {
          code: "NOT_FOUND",
          message: await apiText("regularMentorshipNotFound"),
        },
        { status: 404 },
      );
    }
    return backendResponse(response);
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("regularMentorshipNotFound"),
    });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    const body = await readJsonBody(request, updateMentorshipSchema, {
      invalidMessage: "startDateAndDaysRequired",
    });
    if (!body.ok) return body.response;
    const { startDate, endDate, daysPerWeek } = body.data;
    return backendResponse(
      await updateRegularMentorship({
        mentorshipId: id,
        actorId,
        startDate,
        endDate,
        daysPerWeek: Math.min(7, Math.max(1, daysPerWeek)),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("regularMentorshipUpdateFailed"),
    });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    return backendResponse(
      await deleteRegularMentorship({ mentorshipId: id, actorId }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("regularMentorshipDeleteFailed"),
    });
  }
}
