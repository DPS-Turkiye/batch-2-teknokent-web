import { expect, it, vi } from "vitest";

import { ClientApiError } from "@/lib/client/api";
import { httpClient } from "@/lib/http-client";
import { createMentorResponse } from "@test/fixtures/mentors";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** One `lib/client` function and the exact request it should send through `httpClient`. */
export type ClientCall = {
  title: string;
  call: () => Promise<unknown>;
  method: HttpMethod;
  args: unknown[];
  /** The function answers nothing, even when the server sends a body back. */
  returnsNothing?: boolean;
};

/** A plain JSON document, so a function that hands `data` through can be told apart from one that drops it. */
const SERVER_BODY = { answered: "by-server" };

/** A refusal in Turkish, which `requireSuccess` shows to a Turkish reader as is. */
const REFUSAL = "Bu programda değişiklik yapma yetkin yok.";

/**
 * Registers, for every call, one test that checks the request it sends and what it answers, and one that
 * checks it turns a refusal into a ClientApiError. Expects the calling file to mock `@/lib/http-client`.
 */
export function itSendsEachClientCall(calls: ClientCall[]) {
  it.each(calls)(
    "$title, answering the server's body",
    async ({ call, method, args, returnsNothing }) => {
      vi.mocked(httpClient[method]).mockResolvedValue(
        createMentorResponse(SERVER_BODY),
      );

      const answer = await call();

      expect(httpClient[method]).toHaveBeenCalledTimes(1);
      expect(httpClient[method]).toHaveBeenCalledWith(...args);
      expect(answer).toEqual(returnsNothing ? undefined : SERVER_BODY);
    },
  );

  it.each(calls)(
    "$title, rejecting with the server's reason when it refuses",
    async ({ call, method }) => {
      vi.mocked(httpClient[method]).mockResolvedValue(
        createMentorResponse({ message: REFUSAL, code: "FORBIDDEN" }, 403),
      );

      const failure = call();

      await expect(failure).rejects.toBeInstanceOf(ClientApiError);
      await expect(failure).rejects.toMatchObject({
        status: 403,
        code: "FORBIDDEN",
        message: REFUSAL,
      });
    },
  );
}
