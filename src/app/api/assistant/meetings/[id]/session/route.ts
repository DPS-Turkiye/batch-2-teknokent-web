import { NextRequest, NextResponse } from "next/server";
import { getMeetingAssistantSession } from "@/lib/botapi";
import { apiErrorResponse } from "@/lib/server/api-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const idToken = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!idToken)
    return NextResponse.json(
      { message: "Authentication is required" },
      { status: 401 },
    );
  try {
    const { id } = await context.params;
    const { data, status } = await getMeetingAssistantSession(id, idToken);
    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı asistanı yüklenemedi.",
    });
  }
}
