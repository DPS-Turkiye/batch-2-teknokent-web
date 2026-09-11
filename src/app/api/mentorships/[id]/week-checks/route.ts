import type { NextRequest } from "next/server";

import { upsertMentorshipWeekCheck } from "@/lib/api/mentorships";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    const body = (await request.json()) as {
      weekStart?: string;
      completed?: boolean;
    };
    if (!body.weekStart) {
      return apiErrorResponse(new Error("weekStart required"), {
        message: "Hafta başlangıcı gerekli.",
        status: 400,
      });
    }
    return backendResponse(
      await upsertMentorshipWeekCheck({
        mentorshipId: id,
        actorId,
        weekStart: body.weekStart,
        completed: Boolean(body.completed),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Haftalık işaret güncellenemedi.",
    });
  }
}
