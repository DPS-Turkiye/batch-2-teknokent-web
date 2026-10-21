import { NextRequest, NextResponse } from "next/server";
import {
  generateMeetingReportBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import { generateMeetingReportBackend } from "@/lib/botapi";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { getSessionIds } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    await getSessionIds();
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

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsedBody = generateMeetingReportBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("reportRequestInvalid"),
        },
        { status: 400 },
      );
    }

    const { platform, nativeMeetingId } = query.data;
    const { data, status } = await generateMeetingReportBackend(
      platform,
      nativeMeetingId,
      parsedBody.data,
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("reportServiceUnavailable"),
    });
  }
}
