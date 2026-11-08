import { NextResponse } from "next/server";

import { startInstitutionLogin } from "@/lib/api/institution-login";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { toInstitutionProvider } from "@/lib/server/institution-provider";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const provider = toInstitutionProvider((await params).provider);
    if (!provider) {
      return NextResponse.json(
        { code: "NOT_FOUND", message: await apiText("institutionUnknown") },
        { status: 404 },
      );
    }
    return backendResponse(await startInstitutionLogin(provider));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("institutionLoginFailed"),
    });
  }
}
