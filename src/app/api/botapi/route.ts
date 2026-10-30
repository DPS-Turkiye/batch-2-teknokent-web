import { NextRequest, NextResponse } from "next/server";
import {
  addBotBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import { createMeetingBot, stopMeetingBotBackend } from "@/lib/botapi";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

// The backend also passes on the provider's own 409 (a bot is already in that meeting), so match the cap's text.
const RECORDING_SLOTS_FULL_DETAIL = "All recording slots are in use.";

export async function POST(request: NextRequest) {
  try {
    await getSessionIds();
    const body = await request.json();
    const parsed = addBotBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("meetingLinkRequired"),
        },
        { status: 400 },
      );
    }

    const { data, status } = await createMeetingBot(parsed.data);
    if (
      status === 409 &&
      (data as { detail?: unknown } | null)?.detail ===
        RECORDING_SLOTS_FULL_DETAIL
    ) {
      return NextResponse.json(
        {
          code: "RECORDING_SLOTS_FULL",
          message: await apiText("recordingSlotsFull"),
        },
        { status },
      );
    }
    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("assistantUnavailable"),
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await getSessionIds();
    const { searchParams } = request.nextUrl;
    const parsed = transcriptQuerySchema.safeParse({
      platform: searchParams.get("platform"),
      nativeMeetingId: searchParams.get("nativeMeetingId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("platformAndMeetingIdRequired"),
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
      message: await apiText("assistantUnavailable"),
    });
  }
}
