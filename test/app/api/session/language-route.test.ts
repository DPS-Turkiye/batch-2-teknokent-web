import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PUT } from "@/app/api/session/language/route";
import { saveSignedInLanguage } from "@/lib/api/auth";
import { Locale } from "@/lib/i18n";

vi.mock("@/lib/api/auth", () => ({ saveSignedInLanguage: vi.fn() }));

function save(body: unknown, authorization = "Bearer token-1") {
  return PUT(
    new NextRequest("http://localhost/api/session/language", {
      method: "PUT",
      headers: { Authorization: authorization },
      body: JSON.stringify(body),
    }),
  );
}

describe("PUT /api/session/language", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(saveSignedInLanguage).mockResolvedValue({
      status: 204,
      data: undefined,
      headers: {},
    });
  });

  it("forwards the language with the caller's own token", async () => {
    const response = await save({ language: Locale.En });

    expect(response.status).toBe(204);
    expect(saveSignedInLanguage).toHaveBeenCalledWith("token-1", Locale.En);
  });

  it("rejects a language the app does not have", async () => {
    const response = await save({ language: "de" });

    expect(response.status).toBe(400);
    expect(saveSignedInLanguage).not.toHaveBeenCalled();
  });

  it("rejects a request without a token", async () => {
    const response = await save({ language: Locale.En }, "");

    expect(response.status).toBe(400);
    expect(saveSignedInLanguage).not.toHaveBeenCalled();
  });
});
