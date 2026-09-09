import { NextRequest, NextResponse } from "next/server";
import {
  generateMeetingReportBodySchema,
  transcriptQuerySchema,
} from "@/lib/assistant-schemas";
import { generateMeetingReportBackend } from "@/lib/botapi";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = transcriptQuerySchema.safeParse({
      platform: searchParams.get("platform"),
      nativeMeetingId: searchParams.get("nativeMeetingId"),
    });

    if (!query.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Platform ve toplantı kimliği gerekli.",
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

    const { platform, nativeMeetingId } = query.data;
    const { data, status } = await generateMeetingReportBackend(
      platform,
      nativeMeetingId,
      parsedBody.data,
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Toplantı raporu hizmetine ulaşılamıyor.",
    });
  }
}
