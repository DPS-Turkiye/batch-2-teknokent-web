import { NextResponse } from "next/server";
import {
  fetchMeetingTranscript,
  transcriptQuerySchema,
} from "@/lib/transcriptapi";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsed = transcriptQuerySchema.safeParse({
      platform: searchParams.get("platform"),
      nativeMeetingId: searchParams.get("nativeMeetingId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { detail: "platform and nativeMeetingId are required" },
        { status: 400 },
      );
    }

    const { platform, nativeMeetingId } = parsed.data;
    const { data, status } = await fetchMeetingTranscript(
      platform,
      nativeMeetingId,
    );

    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { detail: "Failed to reach backend for transcript request" },
      { status: 502 },
    );
  }
}
