import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchPersonSummary } from "@/lib/api/person-summary";
import { HttpMethod } from "@/lib/http-method";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({ backendRequest: vi.fn() }));

describe("person summary server API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("asks the backend as the session's actor, with the person in the path", async () => {
    await fetchPersonSummary("person/1", "coordinator-1");

    expect(backendRequest).toHaveBeenCalledWith({
      method: HttpMethod.Get,
      url: "/api/users/person%2F1/summary",
      params: { actorId: "coordinator-1" },
    });
  });
});
