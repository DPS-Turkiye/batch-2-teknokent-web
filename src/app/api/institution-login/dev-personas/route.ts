import { NextResponse } from "next/server";

import { InstitutionProvider } from "@/interfaces/institution-login";
import { fetchDevPersonas } from "@/lib/api/institution-login";
import { isOdtuDevLoginEnabled } from "@/lib/const";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";

export async function GET() {
  try {
    if (!isOdtuDevLoginEnabled()) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: await apiText("institutionUnknown") },
        { status: 404 },
      );
    }
    return backendResponse(await fetchDevPersonas(InstitutionProvider.Odtu));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("institutionLoginFailed"),
    });
  }
}
