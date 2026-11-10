import { NextRequest, NextResponse } from "next/server";
import { transcriptQuerySchema } from "@/lib/assistant-schemas";
import { generateMeetingReportBackend } from "@/lib/botapi";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import {
  assistantMeetingRefusal,
  assistantSignInRequired,
} from "@/lib/server/assistant-caller";
import { readBearerToken } from "@/lib/server/bearer-token";
import { getSessionIds } from "@/lib/session";

/** Any body is ignored: the backend reports on the meeting's own transcript with its own model. */
export async function POST(request: NextRequest) {
  try {
    await getSessionIds();
    const idToken = readBearerToken(request);
    if (!idToken) return assistantSignInRequired();
    const { searchParams } = request.nextUrl;
    const query = transcriptQuerySchema.safeParse({
      platform: searchParams.get("platform"),
      nativeMeetingId: searchParams.get("nativeMeetingId"),
    });

    if (!query.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("platformAndMeetingIdRequired"),
        },
        { status: 400 },
      );
    }

    const { platform, nativeMeetingId } = query.data;
    const { data, status } = await generateMeetingReportBackend(
      platform,
      nativeMeetingId,
      idToken,
    );

    return (
      (await assistantMeetingRefusal(status)) ??
      NextResponse.json(data, { status })
    );
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("reportServiceUnavailable"),
    });
  }
}
