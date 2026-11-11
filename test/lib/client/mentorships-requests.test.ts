import { beforeEach, describe, vi } from "vitest";

import { UserRole } from "@/interfaces/session";
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

vi.mock("@/lib/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const start = {
  organizationId: "org-1",
  startDate: "2026-01-05",
  endDate: "2026-06-05",
  daysPerWeek: 2,
};

const calls: ClientCall[] = [
  {
    title: "getRegularMentorships reads a mentee's mentorships with no role",
    call: () => getRegularMentorships(),
    method: "get",
    args: ["/api/mentorships", { params: undefined }],
  },
  {
    title: "getRegularMentorships reads a mentor's mentorships with the role",
    call: () => getRegularMentorships(UserRole.Mentor),
    method: "get",
    args: ["/api/mentorships", { params: { role: UserRole.Mentor } }],
  },
  {
    title: "getRegularMentorship reads one encoded mentorship",
    call: () => getRegularMentorship("ms/1"),
    method: "get",
    args: ["/api/mentorships/ms%2F1"],
  },
  {
    title: "startRegularMentorship posts the new mentorship",
    call: () => startRegularMentorship(start),
    method: "post",
    args: ["/api/mentorships", start],
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
  {
    title: "searchOrganizations lists the startups a mentor may pick",
    call: () => searchOrganizations(),
    method: "get",
    args: ["/api/mentorships/organizations"],
  },
];

describe("regular mentorships client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  itSendsEachClientCall(calls);
});
