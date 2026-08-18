import { NextRequest, NextResponse } from "next/server";
import { addBotBodySchema } from "@/lib/assistant-schemas";
import { createMeetingBot } from "@/lib/botapi";
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
