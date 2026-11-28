import { beforeEach, describe, expect, it, vi } from "vitest";

import { unsubscribeEmail } from "@/lib/api/email-center";
import { backendRequest } from "@/lib/server/backend-client";
import { backendResponse } from "@test/fixtures/route-handlers";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

beforeEach(() => {
  vi.mocked(backendRequest).mockReset().mockResolvedValue(backendResponse({}));
});

describe("email center backend calls", () => {
  it("unsubscribes with the link's token alone", async () => {
    await unsubscribeEmail("t");

    expect(backendRequest).toHaveBeenCalledWith({
      method: "POST",
      url: "/api/email-center/unsubscribe",
      data: { token: "t" },
    });
  });
});
