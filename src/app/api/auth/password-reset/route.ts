import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { sendPasswordResetEmail } from "@/lib/api/auth-email";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { readJsonBody } from "@/lib/server/request-body";

const passwordResetSchema = z.object({ email: z.string().trim().min(1) });

// Public: "Şifremi unuttum" is used signed out. The backend answers the same for known and unknown addresses.
export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request, passwordResetSchema, {
      invalidMessage: "authEmailFailed",
    });
    if (!body.ok) return body.response;
    const response = await sendPasswordResetEmail(body.data.email);
    return new NextResponse(null, { status: response.status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("authEmailFailed"),
    });
  }
}
