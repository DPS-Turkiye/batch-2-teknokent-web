import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/const";
import { getSessionIds } from "@/lib/server-session";

function backendHeaders() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function GET() {
  try {
    const { organizationId } = await getSessionIds();
    const response = await fetch(
      `${getBackendUrl()}/api/meetings?organizationId=${organizationId}`,
      {
        headers: backendHeaders(),
        cache: "no-store",
      },
    );
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Toplantı servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getSessionIds();
    const payload = await request.json();
    const response = await fetch(`${getBackendUrl()}/api/meetings`, {
      method: "POST",
      headers: backendHeaders(),
      body: JSON.stringify({ ...payload, organizationId }),
      cache: "no-store",
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Toplantı oluşturulamadı." },
      { status: 502 },
    );
  }
}
