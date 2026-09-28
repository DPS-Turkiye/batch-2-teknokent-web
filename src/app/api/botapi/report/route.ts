import { NextRequest, NextResponse } from "next/server";
import {
  generateMeetingReportBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import { generateMeetingReportBackend } from "@/lib/botapi";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function POST(request: NextRequest) {
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
    const query = transcriptQuerySchema.safeParse({
      sessionId: searchParams.get("sessionId"),
    });

    if (!query.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Assistant session is required.",
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
          message: "Rapor isteği geçersiz.",
        },
        { status: 400 },
      );
    }

    const { sessionId } = query.data;
    const { data, status } = await generateMeetingReportBackend(
      sessionId,
      parsedBody.data,
      idToken,
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı raporu hizmetine ulaşılamıyor.",
    });
  }
}
