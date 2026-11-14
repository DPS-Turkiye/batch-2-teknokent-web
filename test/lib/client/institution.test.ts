import { describe, expect, it, vi } from "vitest";

import {
  fetchAdviseeProfile,
  fetchInstitutionAdvisees,
  fetchInstitutionRecord,
} from "@/lib/client/institution";
import { httpClient } from "@/lib/http-client";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const STUDENT = "0b9e2f4a-1c3d-4e5f-8a6b-7c8d9e0f1a2b";

const calls: ClientCall[] = [
  {
    title: "reads the signed-in person's institution record",
    call: () => fetchInstitutionRecord(),
    method: "get",
    args: ["/api/institution/me"],
  },
  {
    title: "lists the academician's advisees",
    call: () => fetchInstitutionAdvisees(),
    method: "get",
    args: ["/api/institution/me/advisees"],
  },
  {
    title: "reads one advisee's interests and goal",
    call: () => fetchAdviseeProfile(STUDENT),
    method: "get",
    args: [`/api/institution/me/advisees/${STUDENT}/profile`],
  },
];

describe("institution client", () => {
  itSendsEachClientCall(calls);

  it("answers no profile for a student who is not the academician's advisee", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse({ message: "Advisee not found." }, 404),
    );

    expect(await fetchAdviseeProfile(STUDENT)).toBeNull();
  });

  it("keeps the id inside its own path segment", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(
      createMentorResponse({ interests: { topics: [], subtopics: [] } }),
    );

    await fetchAdviseeProfile("../me");

    expect(httpClient.get).toHaveBeenLastCalledWith(
      "/api/institution/me/advisees/..%2Fme/profile",
    );
  });
});
