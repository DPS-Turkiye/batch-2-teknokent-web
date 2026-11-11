import "server-only";

import { NextResponse } from "next/server";

import {
  apiText,
  type ApiErrorCode,
  type ApiTextKey,
} from "@/lib/server/api-response";
import { isUuid } from "@/lib/utils";

export type PathId =
  { ok: true; id: string } | { ok: false; response: NextResponse };

const INVALID_REQUEST: ApiErrorCode = "INVALID_REQUEST";

/**
 * A backend id taken from the URL. Anything that is not a uuid (say `..`, which axios would resolve into another
 * backend path) answers 400 before a backend call is made.
 */
export async function readUuidParam(
  value: string,
  message: ApiTextKey,
): Promise<PathId> {
  if (isUuid(value)) return { ok: true, id: value };
  return {
    ok: false,
    response: NextResponse.json(
      { code: INVALID_REQUEST, message: await apiText(message), fields: [] },
      { status: 400 },
    ),
  };
}
