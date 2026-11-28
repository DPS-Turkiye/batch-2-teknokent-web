import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import { UserRole } from "@/interfaces/session";
import { backendHttp } from "@/lib/client/backend-http";
import {
  addRegularMentorshipGoal,
  deleteRegularMentorship,
  getMentorshipWeekChecks,
  getRegularMentorship,
  getRegularMentorships,
  searchOrganizations,
  setMentorshipWeekCheck,
  setRegularMentorshipGoalDone,
  startRegularMentorship,
  updateRegularMentorship,
} from "@/lib/client/mentorships";
import {
  itSendsEachClientCall,
  type ClientCall,
} from "@test/fixtures/client-calls";
import { createMentorResponse } from "@test/fixtures/mentors";
import { SIGNED_IN_USER_ID } from "@test/mocks/backend-http";

vi.mock("@/lib/client/backend-http", async () =>
  (await import("@test/mocks/backend-http")).backendHttpMock(),
);

const start = {
  organizationId: "org-1",
  startDate: "2026-01-05",
  endDate: "2026-06-05",
  daysPerWeek: 2,
};

const calls: ClientCall[] = [
  {
    title:
      "getRegularMentorships reads the team's running mentorships, naming no team",
    call: () => getRegularMentorships(),
    method: "get",
    args: ["/api/mentorships", { params: { activeOnly: true } }],
  },
  {
    title:
      "getRegularMentorships reads the signed-in mentor's running mentorships",
    call: () => getRegularMentorships(UserRole.Mentor),
    method: "get",
    args: [
      "/api/mentorships",
      { params: { activeOnly: true, mentorId: SIGNED_IN_USER_ID } },
    ],
  },
  {
    title: "getRegularMentorship reads one encoded mentorship",
    call: () => getRegularMentorship("ms/1"),
    method: "get",
    args: ["/api/mentorships/ms%2F1"],
  },
  {
    title: "startRegularMentorship posts the new running mentorship",
    call: () => startRegularMentorship(start),
    method: "post",
    args: ["/api/mentorships", { ...start, status: MentorshipStatus.Active }],
  },
  {
    title:
      "updateRegularMentorship patches only the schedule, keeping an open end",
    call: () =>
      updateRegularMentorship({
        mentorshipId: "ms/1",
        startDate: "2026-01-05",
        endDate: null,
        daysPerWeek: 3,
      }),
    method: "patch",
    args: [
      "/api/mentorships/ms%2F1",
      { startDate: "2026-01-05", endDate: null, daysPerWeek: 3 },
    ],
  },
  {
    title: "deleteRegularMentorship deletes the encoded mentorship",
    call: () => deleteRegularMentorship("ms/1"),
    method: "delete",
    args: ["/api/mentorships/ms%2F1"],
    returnsNothing: true,
  },
  {
    title: "addRegularMentorshipGoal posts the goal's title",
    call: () =>
      addRegularMentorshipGoal({ mentorshipId: "ms/1", title: "MVP" }),
    method: "post",
    args: ["/api/mentorships/ms%2F1/goals", { title: "MVP" }],
  },
  {
    title: "setRegularMentorshipGoalDone patches the encoded goal",
    call: () =>
      setRegularMentorshipGoalDone({
        mentorshipId: "ms/1",
        goalId: "g/1",
        done: true,
      }),
    method: "patch",
    args: ["/api/mentorships/ms%2F1/goals/g%2F1", { done: true }],
  },
  {
    title: "getMentorshipWeekChecks reads the week's checks",
    call: () => getMentorshipWeekChecks("2026-03-02"),
    method: "get",
    args: [
      "/api/mentorships/week-checks",
      { params: { weekStart: "2026-03-02" } },
    ],
  },
  {
    title: "setMentorshipWeekCheck puts the week's check",
    call: () =>
      setMentorshipWeekCheck({
        mentorshipId: "ms/1",
        weekStart: "2026-03-02",
        completed: false,
      }),
    method: "put",
    args: [
      "/api/mentorships/ms%2F1/week-checks",
      { weekStart: "2026-03-02", completed: false },
    ],
  },
];

describe("regular mentorships client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls, backendHttp);

  it("lists the startups a mentor may pick, by name only", async () => {
    vi.mocked(backendHttp.get).mockResolvedValue(
      createMentorResponse([
        { id: "org-1", name: "Kargo AI", sector: "Lojistik" },
      ]),
    );

    await expect(searchOrganizations()).resolves.toEqual([
      { id: "org-1", name: "Kargo AI" },
    ]);
    expect(backendHttp.get).toHaveBeenCalledWith("/api/organizations");
  });

  it("keeps the days a week between one and seven", async () => {
    vi.mocked(backendHttp.post).mockResolvedValue(createMentorResponse({}));

    await startRegularMentorship({ ...start, daysPerWeek: 9 });

    expect(backendHttp.post).toHaveBeenCalledWith(
      "/api/mentorships",
      expect.objectContaining({ daysPerWeek: 7 }),
    );
  });
});
