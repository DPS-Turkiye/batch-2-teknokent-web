import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/const";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const nativeMeetingId = searchParams.get("nativeMeetingId");

    if (!platform || !nativeMeetingId) {
      return NextResponse.json(
        { detail: "platform ve nativeMeetingId gerekli" },
        { status: 400 },
      );
    }

    const url =
      `${getBackendUrl()}/api/assistant/transcripts/` +
      `${encodeURIComponent(platform)}/${encodeURIComponent(nativeMeetingId)}`;
//springe get komutu ile gider
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Backend transcript isteği başarısız" },
      { status: 502 },
    );
  }
}