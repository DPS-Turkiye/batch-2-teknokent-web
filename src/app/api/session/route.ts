import { NextRequest, NextResponse } from "next/server";

import {
  destroySession,
  findMenteeSessionByEmail,
  getSessionUser,
  saveSessionUser,
} from "@/lib/session";
import { apiErrorResponse } from "@/lib/server/api-response";

export async function GET() {
  try {
    const session = await getSessionUser();
    return session
      ? NextResponse.json(session)
      : NextResponse.json(
          { code: "SESSION_REQUIRED", message: "No active session." },
          { status: 401 },
        );
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Session service is unavailable.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: "Email is required." },
        { status: 400 },
      );
    }

    const session = await findMenteeSessionByEmail(body.email);
    if (!session) {
      return NextResponse.json(
        {
          code: "SESSION_REQUIRED",
          message: "No demo mentee account was found for this email.",
        },
        { status: 404 },
      );
    }
    await saveSessionUser(session);
    return NextResponse.json(session);
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Login could not be completed.",
    });
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiErrorResponse(error, {
      message: "Logout could not be completed.",
    });
  }
}
