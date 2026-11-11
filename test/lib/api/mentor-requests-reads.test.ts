import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@/interfaces/session";
import {
  createMentorRequest,
  fetchMentorRequest,
  fetchMentorRequestsPage,
} from "@/lib/api/mentor-requests";
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
    "pages a mentor's requests by the mentor id",
    () =>
      fetchMentorRequestsPage({
        requesterId: "mentor-1",
        organizationId: "org-ignored",
        role: UserRole.Mentor,
        tab: "pending",
        page: 2,
        size: 10,
      }),
    {
      method: "GET",
      url: "/api/mentorship-requests",
      params: { mentorId: "mentor-1", tab: "pending", page: 2, size: 10 },
    },
  ],
  [
    "pages a startup's requests by the organization",
    () =>
      fetchMentorRequestsPage({
        requesterId: "member-1",
        organizationId: "org-1",
        role: UserRole.Mentee,
        tab: "all",
        page: 0,
        size: 20,
      }),
    {
      method: "GET",
      url: "/api/mentorship-requests",
      params: { organizationId: "org-1", tab: "all", page: 0, size: 20 },
    },
  ],
  [
    "reads one encoded request",
    () => fetchMentorRequest("req/1"),
    { method: "GET", url: "/api/mentorship-requests/req%2F1" },
  ],
  [
    "creates a request as the session's user and startup, whatever the payload says",
    () =>
      createMentorRequest(
        { organizationId: "org-1", userId: "member-1" },
        { summary: "Fon", requesterId: "x", organizationId: "y" },
      ),
    {
      method: "POST",
      url: "/api/mentorship-requests",
      data: {
        summary: "Fon",
        requesterId: "member-1",
        organizationId: "org-1",
      },
    },
  ],
];

describe("mentor requests server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });
});
