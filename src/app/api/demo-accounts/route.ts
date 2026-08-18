import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/const";

export async function GET() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  try {
    const response = await fetch(`${getBackendUrl()}/api/users?role=MENTEE`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Demo hesapları yüklenemedi." },
      { status: 502 },
    );
  }
}
