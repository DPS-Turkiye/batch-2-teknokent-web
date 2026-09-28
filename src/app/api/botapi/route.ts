import { NextRequest, NextResponse } from "next/server";
import {
  addBotBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import { createMeetingBot, stopMeetingBotBackend } from "@/lib/botapi";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function POST(request: NextRequest) {
  try {
    const idToken = bearerToken(request);
    if (!idToken)
      return NextResponse.json(
        { message: "Authentication is required" },
        { status: 401 },
      );
    const body = await request.json();
    const parsed = addBotBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Geçerli bir toplantı bağlantısı gerekli.",
        },
        { status: 400 },
      );
    }

    const { data, status } = await createMeetingBot(parsed.data, idToken);
    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı asistanı hizmetine ulaşılamıyor.",
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const idToken = bearerToken(request);
    if (!idToken)
      return NextResponse.json(
        { message: "Authentication is required" },
        { status: 401 },
      );
    const { searchParams } = request.nextUrl;
    const parsed = transcriptQuerySchema.safeParse({
      sessionId: searchParams.get("sessionId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Assistant session is required.",
        },
        { status: 400 },
      );
    }

    const { sessionId } = parsed.data;
    const { data, status } = await stopMeetingBotBackend(sessionId, idToken);

    if (status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(data ?? { ok: true }, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı asistanı hizmetine ulaşılamıyor.",
    });
  }
}

function bearerToken(request: NextRequest) {
  const value = request.headers.get("authorization");
  return value?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
}
