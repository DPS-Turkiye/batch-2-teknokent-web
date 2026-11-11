import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

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
import { readJsonBody } from "@/lib/server/request-body";

/** What the institution sent back to the callback page: the state, and its other query parameters if any. */
const completeSchema = z.object({
  state: z.string().min(1),
  params: z
    .record(z.string(), z.string())
    .nullish()
    .transform((params) => params ?? {}),
});

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
    const body = await readJsonBody(request, completeSchema, {
      invalidMessage: "institutionLoginFailed",
    });
    if (!body.ok) return body.response;
    const callback = await finishInstitutionCallback(
      provider,
      body.data.state,
      body.data.params,
    );
    if (callback.status !== 200) return backendResponse(callback);
    return backendResponse(await exchangeInstitutionCode(callback.data.code));
  } catch (error) {
    return apiErrorResponse(error, {
      message: await apiText("institutionLoginFailed"),
    });
  }
}
