import { NextResponse, type NextRequest } from "next/server";

import { transcriptQuerySchema } from "@/lib/assistant-schemas";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";

export async function GET(request: NextRequest) {
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
    const { data, status } = await fetchMeetingTranscript(
      platform,
      nativeMeetingId,
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("transcriptServiceUnavailable"),
    });
  }
}
