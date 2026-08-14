import { NextResponse } from "next/server";

import { getBackendUrl } from "@/lib/const";
import { getSessionIds } from "@/lib/server-session";

function headers() {
  const username = process.env.BACKEND_USERNAME ?? "teknokent";
  const password = process.env.BACKEND_PASSWORD ?? "change-me";
  return {
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getSessionIds();
    const response = await fetch(
      `${getBackendUrl()}/api/profile-analyses/manual?organizationId=${organizationId}`,
      {
        method: "POST",
        headers: headers(),
        body: await request.text(),
        cache: "no-store",
      },
    );
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Profil servisine ulaşılamadı." },
      { status: 502 },
    );
  }
}
