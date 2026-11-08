import { NextRequest, NextResponse } from "next/server";

import {
  exchangeInstitutionCode,
  finishInstitutionCallback,
} from "@/lib/api/institution-login";
import {
  apiErrorResponse,
  apiText,
  backendResponse,
} from "@/lib/server/api-response";
import { toInstitutionProvider } from "@/lib/server/institution-provider";

type CompleteBody = { state?: unknown; params?: unknown };

function stringParams(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object") return null;
  const entries = Object.entries(value);
  return entries.every(([, item]) => typeof item === "string")
    ? (Object.fromEntries(entries) as Record<string, string>)
    : null;
}

/**
 * Hands what the institution sent back to the backend and trades the one-time code it returns for a Firebase
 * custom token in the same call, so the code never reaches the browser.
 */
export async function POST(
  request: NextRequest,
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
    const body = (await request.json().catch(() => ({}))) as CompleteBody;
    const callbackParams = stringParams(body.params ?? {});
    if (typeof body.state !== "string" || !body.state || !callbackParams) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: await apiText("institutionLoginFailed"),
        },
        { status: 400 },
      );
    }
    const callback = await finishInstitutionCallback(
      provider,
      body.state,
      callbackParams,
    );
    if (callback.status !== 200) return backendResponse(callback);
    return backendResponse(await exchangeInstitutionCode(callback.data.code));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("institutionLoginFailed"),
    });
  }
}
