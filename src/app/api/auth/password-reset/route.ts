import { NextRequest, NextResponse } from "next/server";

import { sendPasswordResetEmail } from "@/lib/api/auth-email";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";

// Public: "Şifremi unuttum" is used signed out. The backend answers the same for known and unknown addresses.
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown;
    };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json(
        { code: "INVALID_REQUEST", message: await apiText("authEmailFailed") },
        { status: 400 },
      );
    }
    const response = await sendPasswordResetEmail(email);
    return new NextResponse(null, { status: response.status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("authEmailFailed"),
    });
  }
}
