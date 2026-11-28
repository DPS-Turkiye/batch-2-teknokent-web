import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/email-unsubscribe/route";
import { unsubscribeEmail } from "@/lib/api/email-center";
import { backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/api/email-center");

const TOKEN = "abcdefghijklmnopqrstuvwxyz_-0123";

function unsubscribe(query: string) {
  return POST(
    new NextRequest(`http://localhost/api/email-unsubscribe${query}`, {
      method: "POST",
    }),
  );
}

describe("POST /api/email-unsubscribe", () => {
  beforeEach(() => {
    vi.mocked(unsubscribeEmail)
      .mockReset()
      .mockResolvedValue(backendResponse(null, 204));
  });

  it("passes the link's token on and answers what the backend did", async () => {
    const response = await unsubscribe(`?t=${TOKEN}`);

    expect(unsubscribeEmail).toHaveBeenCalledWith(TOKEN);
    expect(response.status).toBe(204);
  });

  it.each([
    ["no token", ""],
    ["a token of the wrong shape", "?t=kısa"],
  ])("refuses %s without asking the backend", async (_, query) => {
    const response = await unsubscribe(query);

    expect(response.status).toBe(400);
    expect(unsubscribeEmail).not.toHaveBeenCalled();
  });

  it("answers 502 when the backend cannot be reached", async () => {
    vi.mocked(unsubscribeEmail).mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await unsubscribe(`?t=${TOKEN}`);

    expect(response.status).toBe(502);
  });
});
