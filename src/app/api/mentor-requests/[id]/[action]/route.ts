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

async function forward(request: Request, id: string, action: string) {
  const { userId } = await getSessionIds();
  const method = request.method;
  const body = method === "GET" ? undefined : await request.json();
  const response = await fetch(
    `${getBackendUrl()}/api/mentorship-requests/${id}/${action}`,
    {
      method,
      headers: headers(),
      body:
        body === undefined
          ? undefined
          : JSON.stringify(
              action === "withdrawal" ||
                action === "messages" ||
                action === "meeting"
                ? { ...body, requesterId: userId }
                : body,
            ),
      cache: "no-store",
    },
  );
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  return forward(request, id, action);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  return forward(request, id, action);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; action: string }> },
) {
  const { id, action } = await params;
  return forward(request, id, action);
}
