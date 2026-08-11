import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/const";
//backende cevabı gönderir geri alır(controller a)
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${getBackendUrl()}/api/assistant/bots`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "Backend bot isteği başarısız" },
      { status: 502 },
    );
  }
}