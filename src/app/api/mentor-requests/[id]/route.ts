import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/const";

function headers() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    Accept: "application/json",
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const response = await fetch(
      `${getBackendUrl()}/api/mentorship-requests/${id}`,
      { headers: headers(), cache: "no-store" },
    );
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
