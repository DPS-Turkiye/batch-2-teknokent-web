import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import {
  apiErrorResponse,
  apiText,
  backendResponse,
  type ApiTextKey,
} from "@/lib/server/api-response";
import { backendRequest } from "@/lib/server/backend-client";

type Method = "GET" | "POST";

type Context<P> = { params: Promise<P & { path: string[] }> };

export type AllowlistedProxyOptions<P> = {
  /** Who the call is made for; throws SessionRequiredError when nobody is signed in. */
  requireUserId: () => Promise<string>;
  /** Matched against the joined catch-all path, so the route can never reach anything else on the backend. */
  allowedPaths: readonly RegExp[];
  backendUrl: (userId: string, params: P, path: string) => string;
  failureMessage: ApiTextKey;
};

/**
 * A catch-all route that passes a fixed set of paths on to the backend for the signed-in person. The checks live
 * here rather than in each route, so a new feature gets the same allowlist, session and error handling by
 * passing its own paths and URL.
 */
export function allowlistedProxy<P>(options: AllowlistedProxyOptions<P>) {
  async function forward(
    request: NextRequest,
    context: Context<P>,
    method: Method,
  ) {
    const { path, ...params } = await context.params;
    const joined = path.join("/");
    if (!options.allowedPaths.some((pattern) => pattern.test(joined))) {
      return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    }
    try {
      const userId = await options.requireUserId();
      const body = method === "POST" ? await request.text() : "";
      return backendResponse(
        await backendRequest({
          method,
          url: options.backendUrl(userId, params as P, joined),
          data: body ? JSON.parse(body) : undefined,
        }),
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          {
            code: "INVALID_REQUEST",
            message: await apiText("invalidRequestBody"),
          },
          { status: 400 },
        );
      }
      return apiErrorResponse(error, {
        message: await apiText(options.failureMessage),
      });
    }
  }

  return {
    GET: (request: NextRequest, context: Context<P>) =>
      forward(request, context, "GET"),
    POST: (request: NextRequest, context: Context<P>) =>
      forward(request, context, "POST"),
  };
}
