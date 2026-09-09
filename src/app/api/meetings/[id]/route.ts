import type { NextRequest } from "next/server";

import { UserRole } from "@/interfaces/session";
import { deleteMeeting, updateMeeting } from "@/lib/api/meetings";
import { requireOwnedMeeting } from "@/lib/server/mentor-meeting";
import { apiErrorResponse, backendResponse } from "@/lib/server/api-response";
import { getSessionUser } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    return backendResponse(await updateMeeting(id, payload));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı güncellenemedi.",
    });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (session?.role !== UserRole.Mentor) {
      return Response.json(
        { code: "FORBIDDEN", message: "Toplantıyı yalnızca mentör silebilir." },
        { status: 403 },
      );
    }
    const { id } = await context.params;
    const owned = await requireOwnedMeeting(session.userId, id);
    if ("error" in owned) return owned.error;
    return backendResponse(await deleteMeeting(id));
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı silinemedi.",
    });
  }
}
