import { describe, expect, it } from "vitest";

import { readUuidParam } from "@/lib/server/path-params";

describe("readUuidParam", () => {
  it("passes a uuid through unchanged", async () => {
    await expect(
      readUuidParam("00000000-0000-0000-0000-0000000000ab", "personIdInvalid"),
    ).resolves.toEqual({
      ok: true,
      id: "00000000-0000-0000-0000-0000000000ab",
    });
  });

  it("answers 400 INVALID_REQUEST with the given text for anything else", async () => {
    const result = await readUuidParam("..", "personIdInvalid");

    expect(result.ok).toBe(false);
    const response = result.ok ? null : result.response;
    expect(response?.status).toBe(400);
    expect(await response?.json()).toEqual({
      code: "INVALID_REQUEST",
      message: "Geçerli bir kişi seçin.",
      fields: [],
    });
  });
});
