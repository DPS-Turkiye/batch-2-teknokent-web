import type { NextRequest } from "next/server";

import { createMentorshipGoal } from "@/lib/api/mentorships";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    const body = (await request.json()) as { title?: string };
    if (!body.title?.trim()) {
      return apiErrorResponse(new Error("title required"), {
        message: "Hedef metni gerekli.",
        status: 400,
      });
    }
    return backendResponse(
      await createMentorshipGoal({
        mentorshipId: id,
        actorId,
        title: body.title.trim(),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Hedef eklenemedi.",
    });
  }
}
