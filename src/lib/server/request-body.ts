import { NextResponse } from "next/server";
import "server-only";
import { z } from "zod";

import { apiText, type ApiTextKey } from "@/lib/server/api-response";

export type JsonBody<T> =
  { ok: true; data: T } | { ok: false; response: NextResponse };

type ReadJsonBodyOptions = {
  /** The text for a body that is JSON but not the expected shape; a generic one by default. */
  invalidMessage?: ApiTextKey;
};

/** Any JSON object, for routes that hand the body on to the backend unchanged. */
export const jsonObjectSchema = z.record(z.string(), z.unknown());

/** A string or null; a left-out field reads as null. */
export const stringOrNullSchema = z.string().nullable().default(null);

/** A left-out body reaches the schema as `undefined`, so a schema with a default can accept it. */
async function parseJson(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  const text = await request.text();
  if (text === "") return { ok: true, value: undefined };
  try {
    const value: unknown = JSON.parse(text);
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

/** "teams.0.leadEmail" for each field the schema refused, so the caller sees what to fix. */
function invalidFields(error: z.ZodError) {
  const fields = error.issues
    .filter((issue) => issue.path.length > 0)
    .map((issue) => issue.path.map(String).join("."));
  return [...new Set(fields)];
}

export async function invalidRequest(
  message: ApiTextKey,
  fields: string[] = [],
) {
  return NextResponse.json(
    { code: "INVALID_REQUEST", message: await apiText(message), fields },
    { status: 400 },
  );
}

/**
 * Reads a route's JSON body and checks it against `schema`. Malformed JSON or a body of the wrong shape answers
 * 400 instead of reaching the backend with guessed values; unknown fields are dropped by object schemas.
 */
export async function readJsonBody<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
  options: ReadJsonBodyOptions = {},
): Promise<JsonBody<z.output<Schema>>> {
  const json = await parseJson(request);
  if (!json.ok) {
    return { ok: false, response: await invalidRequest("invalidRequestBody") };
  }
  const parsed = schema.safeParse(json.value);
  if (!parsed.success) {
    return {
      ok: false,
      response: await invalidRequest(
        options.invalidMessage ?? "invalidRequestFields",
        invalidFields(parsed.error),
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Checks a route's query parameters against `schema`, the same way `readJsonBody` checks a body: a left-out
 * parameter reaches the schema as `undefined`, and anything invalid answers 400 before the backend is called.
 */
export async function readSearchParams<Schema extends z.ZodType>(
  params: URLSearchParams,
  schema: Schema,
): Promise<JsonBody<z.output<Schema>>> {
  const parsed = schema.safeParse(Object.fromEntries(params));
  if (!parsed.success) {
    return {
      ok: false,
      response: await invalidRequest(
        "invalidRequestFields",
        invalidFields(parsed.error),
      ),
    };
  }
  return { ok: true, data: parsed.data };
}
