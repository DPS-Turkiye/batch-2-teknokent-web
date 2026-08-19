import { NextRequest, NextResponse } from "next/server";
import { transcriptQuerySchema } from "@/lib/assistant-schemas";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function GET(request: NextRequest) {
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
    const { data, status } = await fetchMeetingTranscript(
      platform,
      nativeMeetingId,
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Meeting transcript service is unavailable.",
    });
  }
}
