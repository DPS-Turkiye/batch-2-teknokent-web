import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAppSession } from "@/components/providers/session-provider";
import { useMentorDashboard } from "@/hooks/use-mentor-dashboard";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole, type AppSession } from "@/interfaces/session";
import { getActionItemsForRequests } from "@/lib/client/action-items";
import { getMyMeetingProposals } from "@/lib/client/meeting-proposals";
import { getMeetings } from "@/lib/client/meetings";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import {
  menteeActionItemFixture,
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: vi.fn(),
}));
vi.mock("@/hooks/use-decision", () => ({
  useDecision: () => ({ decisionFor: "mentor" }),
}));
vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/meetings", () => ({ getMeetings: vi.fn() }));
vi.mock("@/lib/client/meeting-proposals", () => ({
  getMyMeetingProposals: vi.fn(),
}));
vi.mock("@/lib/client/action-items", () => ({
  getActionItemsForRequests: vi.fn(),
}));

const mentor: AppSession = {
  userId: "mentor-1",
  email: "nihan@menton.test",
  fullName: "  Nihan   Öztürk ",
  jobTitle: "",
  role: UserRole.Mentor,
};

const acceptedA = menteeRequestFixture({
  id: "req-a",
  status: MentorshipRequestStatus.Accepted,
});
const acceptedB = menteeRequestFixture({
  id: "req-b",
  status: MentorshipRequestStatus.Accepted,
});
const pending = menteeRequestFixture({
  id: "req-p",
  status: MentorshipRequestStatus.Pending,
});
const declined = menteeRequestFixture({
  id: "req-d",
  status: MentorshipRequestStatus.Declined,
});

const lateTask = menteeActionItemFixture({
  id: "late",
  mentorshipRequestId: "req-a",
  status: ActionItemStatus.Open,
  dueDate: "2026-09-10",
});
const soonTask = menteeActionItemFixture({
  id: "soon",
  mentorshipRequestId: "req-a",
  status: ActionItemStatus.InProgress,
  dueDate: "2026-09-20",
});
const doneTask = menteeActionItemFixture({
  id: "done",
  mentorshipRequestId: "req-a",
  status: ActionItemStatus.Completed,
});
const cancelledTask = menteeActionItemFixture({
  id: "cancelled",
  mentorshipRequestId: "req-a",
  status: ActionItemStatus.Cancelled,
});
const otherTask = menteeActionItemFixture({
  id: "other",
  mentorshipRequestId: "req-b",
  status: ActionItemStatus.Open,
  dueDate: "2026-09-12",
});

const unreviewed = menteeMeetingFixture({
  id: "past",
  scheduledAt: "2026-09-14T09:00:00Z",
  status: MeetingStatus.Scheduled,
});
const upcoming = menteeMeetingFixture({
  id: "upcoming",
  scheduledAt: "2026-09-16T09:00:00Z",
  status: MeetingStatus.Scheduled,
});

async function renderDashboard() {
  const view = renderHook(() => useMentorDashboard(), queryWrapper());
  await waitFor(() => {
    expect(view.result.current.isLoadingTop).toBe(false);
    expect(view.result.current.isLoadingActionItems).toBe(false);
  });
  return view;
}

describe("useMentorDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-15T10:00:00+03:00"));
    vi.mocked(useAppSession).mockReturnValue(mentor);
    vi.mocked(getMentorRequests).mockResolvedValue([
      pending,
      acceptedA,
      declined,
      acceptedB,
    ]);
    vi.mocked(getMeetings).mockResolvedValue([upcoming, unreviewed]);
    vi.mocked(getMyMeetingProposals).mockResolvedValue([]);
    vi.mocked(getActionItemsForRequests).mockResolvedValue([
      soonTask,
      doneTask,
      lateTask,
      cancelledTask,
      otherTask,
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reads the mentor's requests and asks for every accepted mentorship's tasks at once", async () => {
    await renderDashboard();

    expect(getMentorRequests).toHaveBeenCalledWith(UserRole.Mentor);
    expect(getActionItemsForRequests).toHaveBeenCalledWith(["req-a", "req-b"]);
  });

  it("greets the mentor by first name for the time of day", async () => {
    const { result } = await renderDashboard();

    expect(result.current.firstName).toBe("Nihan");
    expect(result.current.greeting).toBe("Günaydın");
  });

  it("greets with a fallback name when the session has none", async () => {
    vi.mocked(useAppSession).mockReturnValue({ ...mentor, fullName: "  " });

    const { result } = await renderDashboard();

    expect(result.current.firstName).toBe("Mentor");
  });

  it("splits the requests into pending and accepted mentorships", async () => {
    const { result } = await renderDashboard();

    expect(result.current.pending.map(({ id }) => id)).toEqual(["req-p"]);
    expect(result.current.accepted.map(({ id }) => id)).toEqual([
      "req-a",
      "req-b",
    ]);
  });

  it("lists every open task across mentorships, soonest due first", async () => {
    const { result } = await renderDashboard();

    expect(result.current.openActionItems.map(({ id }) => id)).toEqual([
      "late",
      "other",
      "soon",
    ]);
  });

  it("summarises each mentorship's tasks, leaving cancelled ones out of the progress", async () => {
    const { result } = await renderDashboard();

    const [first, second] = result.current.mentorships;
    expect(first).toMatchObject({
      request: acceptedA,
      openCount: 2,
      overdueCount: 1,
      progress: 33,
      ratio: { done: 1, total: 3 },
    });
    expect(first?.actionItems).toHaveLength(4);
    expect(second).toMatchObject({
      request: acceptedB,
      openCount: 1,
      overdueCount: 1,
      progress: 0,
      ratio: { done: 0, total: 1 },
    });
  });

  it("puts past meetings without notes up for review and picks the next meeting", async () => {
    const { result } = await renderDashboard();

    expect(result.current.awaitingReview.map(({ id }) => id)).toEqual(["past"]);
    expect(result.current.nextMeeting?.id).toBe("upcoming");
    expect(result.current.weekMeetingCount).toBe(2);
    expect(result.current.todayActions.length).toBeGreaterThan(0);
  });

  it("asks for no tasks and shows an empty board for a mentor with no mentorships", async () => {
    vi.mocked(getMentorRequests).mockResolvedValue([]);
    vi.mocked(getMeetings).mockResolvedValue([]);

    const { result } = await renderDashboard();

    expect(getActionItemsForRequests).not.toHaveBeenCalled();
    expect(result.current.mentorships).toEqual([]);
    expect(result.current.openActionItems).toEqual([]);
    expect(result.current.nextMeeting).toBeUndefined();
    expect(result.current.todayActions).toEqual([]);
  });

  it("holds the top blocks back until the meetings and proposals load", () => {
    vi.mocked(getMyMeetingProposals).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMentorDashboard(), queryWrapper());

    expect(result.current.isLoadingTop).toBe(true);
  });
});
