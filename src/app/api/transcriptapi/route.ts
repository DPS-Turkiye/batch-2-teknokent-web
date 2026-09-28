import { NextRequest, NextResponse } from "next/server";
import { transcriptQuerySchema } from "@/lib/assistant-schemas";
import { fetchMeetingTranscript } from "@/lib/transcriptapi";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function GET(request: NextRequest) {
  try {
    const idToken = request.headers
      .get("authorization")
      ?.match(/^Bearer\s+(.+)$/i)?.[1];
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
    const { data, status } = await fetchMeetingTranscript(sessionId, idToken);

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı transkript hizmetine ulaşılamıyor.",
    });
  }
}
