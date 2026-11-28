import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientApiError } from "@/lib/client/api";
import { backendHttp } from "@/lib/client/backend-http";
import { getPersonSummary } from "@/lib/client/person-summary";
import { createAxiosResponse } from "@test/fixtures/health";
import { mentorSummary } from "@test/fixtures/person-summary";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

describe("getPersonSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks this app's route for the person, with the id encoded", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createAxiosResponse(mentorSummary(), 200),
    );

    await expect(getPersonSummary("a/b")).resolves.toEqual(mentorSummary());
    expect(backendHttp.get).toHaveBeenCalledWith("/api/users/a%2Fb/summary");
  });

  it("surfaces a 404 as a ClientApiError the page can recognise", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createAxiosResponse({ message: "User not found" }, 404),
    );

    await expect(getPersonSummary("u1")).rejects.toMatchObject({
      name: ClientApiError.name,
      status: 404,
    });
  });
});
