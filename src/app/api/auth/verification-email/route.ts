import { NextResponse, type NextRequest } from "next/server";

import { sendVerificationEmail } from "@/lib/api/auth-email";
import { apiErrorResponse, apiText } from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function POST(request: NextRequest) {
  try {
    const idToken = readBearerToken(request);
    if (!idToken) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("firebaseTokenRequired"),
        },
        { status: 400 },
      );
    }
    const response = await sendVerificationEmail(idToken);
    return new NextResponse(null, { status: response.status });
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("authEmailFailed"),
    });
  }
}
