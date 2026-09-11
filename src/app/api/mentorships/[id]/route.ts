import type { NextRequest } from "next/server";

import {
  deleteRegularMentorship,
  fetchRegularMentorship,
  updateRegularMentorship,
} from "@/lib/api/mentorships";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionMentorId } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    return backendResponse(await fetchRegularMentorship(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Düzenli mentorlük bulunamadı.",
    });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const actorId = await getSessionMentorId();
    const body = (await request.json()) as {
      startDate?: string;
      endDate?: string | null;
      daysPerWeek?: number;
    };
    if (!body.startDate || body.daysPerWeek == null) {
      return apiErrorResponse(new Error("missing fields"), {
        message: "Başlangıç tarihi ve haftalık gün sayısı gerekli.",
        status: 400,
      });
    }
    return backendResponse(
      await updateRegularMentorship({
        mentorshipId: id,
        actorId,
        startDate: body.startDate,
        endDate: body.endDate ?? null,
        daysPerWeek: Math.min(7, Math.max(1, body.daysPerWeek)),
      }),
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Düzenli mentorlük güncellenemedi.",
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
      message: "Düzenli mentorlük silinemedi.",
    });
  }
}
