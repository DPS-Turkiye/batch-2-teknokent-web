import { NextRequest, NextResponse } from "next/server";

import { isRegisterRole, registerAccount } from "@/lib/api/auth";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> },
) {
  try {
    const { role } = await params;
    if (!isRegisterRole(role)) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("registerRoleUnknown"),
        },
        { status: 404 },
      );
    }

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

    const payload = await request.json();
    return backendResponse(await registerAccount(role, payload, idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("registrationFailed"),
    });
  }
}
