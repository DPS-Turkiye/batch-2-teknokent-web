import { NextRequest, NextResponse } from "next/server";
import { addBotBodySchema, transcriptQuerySchema } from "@/lib/assistant-schemas";
import { createMeetingBot, stopMeetingBotBackend } from "@/lib/botapi";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addBotBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "meetingUrl is required and must be a valid URL.",
        },
        { status: 400 },
      );
    }

    const { data, status } = await createMeetingBot(parsed.data);
    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting assistant service is unavailable.",
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = transcriptQuerySchema.safeParse({
      platform: searchParams.get("platform"),
      nativeMeetingId: searchParams.get("nativeMeetingId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "platform and nativeMeetingId are required.",
        },
        { status: 400 },
      );
    }

    const { platform, nativeMeetingId } = parsed.data;
    const { data, status } = await stopMeetingBotBackend(
      platform,
      nativeMeetingId,
    );

    if (status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(data ?? { ok: true }, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting assistant service is unavailable.",
    });
  }
}
