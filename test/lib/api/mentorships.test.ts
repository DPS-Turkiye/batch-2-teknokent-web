import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createMentorshipGoal,
  createRegularMentorship,
  deleteRegularMentorship,
  fetchMentorshipWeekChecks,
  fetchOrganizationsDirectory,
  fetchRegularMentorship,
  fetchRegularMentorships,
  updateMentorshipGoal,
  updateRegularMentorship,
  upsertMentorshipWeekCheck,
} from "@/lib/api/mentorships";
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
    "reads one mentorship at its encoded path",
    () => fetchRegularMentorship("ms/1"),
    { method: "GET", url: "/api/mentorships/ms%2F1" },
  ],
  [
    "creates a mentorship with the payload as the body",
    () =>
      createRegularMentorship({
        mentorId: "mentor-1",
        organizationId: "org-1",
        status: "ACTIVE",
        startDate: "2026-01-05",
        endDate: "2026-06-01",
        daysPerWeek: 2,
      }),
    {
      method: "POST",
      url: "/api/mentorships",
      data: {
        mentorId: "mentor-1",
        organizationId: "org-1",
        status: "ACTIVE",
        startDate: "2026-01-05",
        endDate: "2026-06-01",
        daysPerWeek: 2,
      },
    },
  ],
  [
    "updates the schedule with the actor in the query and an open end kept as null",
    () =>
      updateRegularMentorship({
        mentorshipId: "ms/1",
        actorId: "mentor-1",
        startDate: "2026-01-05",
        endDate: null,
        daysPerWeek: 3,
      }),
    {
      method: "PATCH",
      url: "/api/mentorships/ms%2F1",
      params: { actorId: "mentor-1" },
      data: { startDate: "2026-01-05", endDate: null, daysPerWeek: 3 },
    },
  ],
  [
    "ends a mentorship with the actor in the query",
    () => deleteRegularMentorship({ mentorshipId: "ms/1", actorId: "admin-1" }),
    {
      method: "DELETE",
      url: "/api/mentorships/ms%2F1",
      params: { actorId: "admin-1" },
    },
  ],
  [
    "adds a goal with only its title in the body",
    () =>
      createMentorshipGoal({
        mentorshipId: "ms/1",
        actorId: "mentor-1",
        title: "MVP",
      }),
    {
      method: "POST",
      url: "/api/mentorships/ms%2F1/goals",
      params: { actorId: "mentor-1" },
      data: { title: "MVP" },
    },
  ],
  [
    "ticks a goal off at its encoded path",
    () =>
      updateMentorshipGoal({
        mentorshipId: "ms/1",
        goalId: "goal 2",
        actorId: "mentor-1",
        done: true,
      }),
    {
      method: "PATCH",
      url: "/api/mentorships/ms%2F1/goals/goal%202",
      params: { actorId: "mentor-1" },
      data: { done: true },
    },
  ],
  [
    "reads a mentor's week checks for one week",
    () =>
      fetchMentorshipWeekChecks({
        mentorId: "mentor-1",
        weekStart: "2026-11-09",
      }),
    {
      method: "GET",
      url: "/api/mentorships/week-checks",
      params: { mentorId: "mentor-1", weekStart: "2026-11-09" },
    },
  ],
  [
    "saves one week's check with the week and state in the body",
    () =>
      upsertMentorshipWeekCheck({
        mentorshipId: "ms/1",
        actorId: "mentor-1",
        weekStart: "2026-11-09",
        completed: false,
      }),
    {
      method: "PUT",
      url: "/api/mentorships/ms%2F1/week-checks",
      params: { actorId: "mentor-1" },
      data: { weekStart: "2026-11-09", completed: false },
    },
  ],
  [
    "lists the organizations directory",
    () => fetchOrganizationsDirectory(),
    { method: "GET", url: "/api/organizations" },
  ],
];

describe("mentorships server API", () => {
  beforeEach(() => {
    vi.mocked(backendRequest).mockReset();
  });

  it.each(cases)("%s", async (_description, call, request) => {
    await call();
    expect(backendRequest).toHaveBeenCalledWith(request);
  });

  describe("fetchRegularMentorships", () => {
    it("asks only for active mentorships when no scope is given", async () => {
      await fetchRegularMentorships({});

      expect(backendRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "/api/mentorships",
        params: { activeOnly: true },
      });
    });

    it("narrows to the mentor and the startup when both are given", async () => {
      await fetchRegularMentorships({
        mentorId: "mentor-1",
        organizationId: "org-1",
      });

      expect(backendRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "/api/mentorships",
        params: {
          activeOnly: true,
          mentorId: "mentor-1",
          organizationId: "org-1",
        },
      });
    });

    it("leaves empty ids out of the query instead of filtering by an empty string", async () => {
      await fetchRegularMentorships({ mentorId: "", organizationId: "" });

      expect(backendRequest).toHaveBeenCalledWith({
        method: "GET",
        url: "/api/mentorships",
        params: { activeOnly: true },
      });
    });
  });
});
