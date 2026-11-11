import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchMentorDirectory, fetchMentorRating } from "@/lib/api/mentors";
import { backendRequest } from "@/lib/server/backend-client";

vi.mock("@/lib/server/backend-client", () => ({
  backendRequest: vi.fn(),
}));

type RequestCase = [
  description: string,
  call: () => Promise<unknown>,
  request: AxiosRequestConfig,
];

const cases: RequestCase[] = [
  [
    "lists the mentor directory the actor may see",
    () => fetchMentorDirectory("member-1"),
    { method: "GET", url: "/api/mentors", params: { actorId: "member-1" } },
  ],
  [
    "reads an encoded mentor's rating",
    () => fetchMentorRating("mentor/1"),
    { method: "GET", url: "/api/mentors/mentor%2F1/rating" },
  ],
];

describe("mentors server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
