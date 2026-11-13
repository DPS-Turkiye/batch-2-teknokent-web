import { beforeEach, describe, expect, it, vi } from "vitest";

import { bearerHeader, optionalBearerHeader } from "@/lib/client/bearer";
import { currentIdToken } from "@/lib/firebase/auth";

vi.mock("@/lib/firebase/auth", () => ({ currentIdToken: vi.fn() }));
vi.mock("@/i18n/client-texts", () => ({
  clientText: (key: string) => key,
}));

beforeEach(() => {
  vi.mocked(currentIdToken).mockReset();
});

describe("bearer headers", () => {
  it("sends the signed-in person's token", async () => {
    vi.mocked(currentIdToken).mockResolvedValue("token-1");

    await expect(bearerHeader()).resolves.toEqual({
      Authorization: "Bearer token-1",
    });
    await expect(optionalBearerHeader()).resolves.toEqual({
      Authorization: "Bearer token-1",
    });
  });

  it("asks for a new sign-in when a call needs the token and there is none", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(bearerHeader()).rejects.toThrow("sessionExpired");
  });

  it("sends no header when the token is optional and there is none, so the proxy uses its own credentials", async () => {
    vi.mocked(currentIdToken).mockResolvedValue(null);

    await expect(optionalBearerHeader()).resolves.toEqual({});
  });
});
