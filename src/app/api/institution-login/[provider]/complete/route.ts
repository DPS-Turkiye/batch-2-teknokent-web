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
import {
  endSession,
  forgetInstitutionLogin,
  pendingInstitutionLogin,
} from "@/lib/server/institution-login-cookie";
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
 * custom token in the same call, so the code never reaches the browser. Only the browser that started the login
 * may finish it, and only once: the binding cookie is cleared whatever the outcome.
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
    const pending = pendingInstitutionLogin(request, provider, body.state);
    if (!pending) {
      return forgetInstitutionLogin(
        NextResponse.json(
          {
            code: "INVALID_REQUEST",
            message: await apiText("institutionLoginExpired"),
          },
          { status: 400 },
        ),
      );
    }
    const callback = await finishInstitutionCallback(
      provider,
      body.state,
      callbackParams,
    );
    if (callback.status !== 200) {
      return forgetInstitutionLogin(backendResponse(callback));
    }
    const exchange = await exchangeInstitutionCode(callback.data.code);
    if (exchange.status !== 200) {
      return forgetInstitutionLogin(backendResponse(exchange));
    }
    // Whoever was signed in on this browser before is not who signs in now; a newcomer sent on to /signup
    // would otherwise be turned back to the old account's workspace.
    return endSession(
      forgetInstitutionLogin(
        backendResponse({
          ...exchange,
          data: { ...exchange.data, next: pending.next },
        }),
      ),
    );
  } catch (error) {
    return forgetInstitutionLogin(
      await apiErrorResponse(error, {
        message: await apiText("institutionLoginFailed"),
      }),
    );
  }
}
