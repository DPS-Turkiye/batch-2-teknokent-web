import { NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

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

export type PathDay =
  { ok: true; day: string } | { ok: false; response: NextResponse };

/** A calendar day ("2026-11-12") from the URL; an impossible one ("2026-02-30") answers 400 like a malformed one. */
export async function readIsoDayParam(
  value: string,
  message: ApiTextKey = "dateInvalid",
): Promise<PathDay> {
  if (z.iso.date().safeParse(value).success) return { ok: true, day: value };
  return {
    ok: false,
    response: NextResponse.json(
      { code: INVALID_REQUEST, message: await apiText(message), fields: [] },
      { status: 400 },
    ),
  };
}
