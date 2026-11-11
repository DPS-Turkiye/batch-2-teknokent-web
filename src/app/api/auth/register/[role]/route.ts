import { NextResponse, type NextRequest } from "next/server";

import { isRegisterRole, registerAccount } from "@/lib/api/auth";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { readBearerToken } from "@/lib/server/bearer-token";
import { jsonObjectSchema, readJsonBody } from "@/lib/server/request-body";

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

    const payload = await readJsonBody(request, jsonObjectSchema);
    if (!payload.ok) return payload.response;
    return backendResponse(await registerAccount(role, payload.data, idToken));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("registrationFailed"),
    });
  }
}
