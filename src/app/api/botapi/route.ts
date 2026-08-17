import { NextResponse } from "next/server";
import { addBotBodySchema, createMeetingBot } from "@/lib/botapi";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = addBotBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { detail: "meetingUrl is required and must be a valid URL" },
        { status: 400 },
      );
    }

    const { data, status } = await createMeetingBot(parsed.data);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach backend for bot request" },
      { status: 502 },
    );
  }
}
