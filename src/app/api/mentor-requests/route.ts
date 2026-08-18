import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/const";
import { getSessionIds } from "@/lib/server-session";

function backendHeaders() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    Accept: "application/json",
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await getSessionIds();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const targetUrl =
      role === "mentor"
        ? `${getBackendUrl()}/api/mentorship-requests`
        : `${getBackendUrl()}/api/mentorship-requests?requesterId=${userId}`;

    const response = await fetch(targetUrl, {
      headers: backendHeaders(),
      cache: "no-store",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Talep servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, organizationId } = await getSessionIds();
    const submission = await request.json();
    const backendResponse = await fetch(
      `${getBackendUrl()}/api/mentorship-requests`,
      {
        method: "POST",
        headers: {
          ...backendHeaders(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ...submission,
          requesterId: userId,
          organizationId,
        }),
        cache: "no-store",
      },
    );

    const body = await backendResponse.text();
    return new NextResponse(body, {
      status: backendResponse.status,
      headers: {
        "Content-Type":
          backendResponse.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Talep servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}
