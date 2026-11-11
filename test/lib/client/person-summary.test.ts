import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientApiError } from "@/lib/client/api";
import { getPersonSummary } from "@/lib/client/person-summary";
import { httpClient } from "@/lib/http-client";
import { createAxiosResponse } from "@test/fixtures/health";
import { mentorSummary } from "@test/fixtures/person-summary";

vi.mock("@/lib/http-client", () => ({ httpClient: { get: vi.fn() } }));

describe("getPersonSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks this app's route for the person, with the id encoded", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse(mentorSummary(), 200),
    );

    await expect(getPersonSummary("a/b")).resolves.toEqual(mentorSummary());
    expect(httpClient.get).toHaveBeenCalledWith("/api/users/a%2Fb/summary");
  });

  it("surfaces a 404 as a ClientApiError the page can recognise", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createAxiosResponse({ message: "User not found" }, 404),
    );

    await expect(getPersonSummary("u1")).rejects.toMatchObject({
      name: ClientApiError.name,
      status: 404,
    });
  });
});
