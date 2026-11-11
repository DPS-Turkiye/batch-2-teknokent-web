import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";

import tr from "@/messages/tr.json";
import { backendResponse } from "@test/fixtures/route-handlers";

/** A request carrying `body` as JSON; a string goes as it is, so a test can send malformed JSON. */
export function jsonRequest(
  body: unknown,
  method = "POST",
  url = "http://localhost/api/test",
  token?: string,
  cookie?: string,
) {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (cookie) headers.set("Cookie", cookie);
  return new NextRequest(url, {
    method,
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** One route's body check: a valid body reaches the backend as before; each invalid one is refused. */
export type BodyCase = {
  route: string;
  send: (request: NextRequest) => Promise<Response>;
  method?: string;
  /** For routes that also read the query string. */
  url?: string;
  /** A Firebase ID token, for routes used before there is a session. */
  token?: string;
  /** A `Cookie` header, for routes that also need a cookie the browser holds. */
  cookie?: string;
  valid: unknown;
  /** The mocked `lib/api` (or other backend) function the route calls. */
  backend: (...args: never[]) => unknown;
  expected: unknown[];
  invalid: Record<string, unknown>;
};

/** Makes every mocked function of the given modules answer 200 with an empty body. */
export function answerAllWith200(...modules: Record<string, unknown>[]) {
  for (const exports of modules) {
    for (const value of Object.values(exports)) {
      if (vi.isMockFunction(value))
        value.mockResolvedValue(backendResponse({}));
    }
  }
}

/** The tests every BodyCase runs; call it inside `describe.each(cases)`. */
export function itChecksTheBody({
  send,
  method = "POST",
  url,
  token,
  cookie,
  valid,
  backend,
  expected,
  invalid,
}: BodyCase) {
  it("passes a valid body on to the backend", async () => {
    const response = await send(jsonRequest(valid, method, url, token, cookie));

    expect(response.status).toBe(200);
    expect(backend).toHaveBeenCalledWith(...expected);
  });

  it("refuses malformed JSON", async () => {
    const response = await send(
      jsonRequest("{not json", method, url, token, cookie),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_REQUEST",
      message: tr.apiErrors.invalidRequestBody,
    });
    expect(backend).not.toHaveBeenCalled();
  });

  it.each(Object.entries(invalid))("refuses %s", async (_case, body) => {
    const response = await send(jsonRequest(body, method, url, token, cookie));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_REQUEST" });
    expect(backend).not.toHaveBeenCalled();
  });
}
