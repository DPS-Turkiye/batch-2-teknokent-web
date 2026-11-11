import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorMessages } from "@/hooks/use-mentor-messages";
import type { MeetingItem } from "@/interfaces/meeting";
import {
  MentorshipRequestStatus,
  type MentorshipRequest,
} from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { programThreadsStub } from "@test/fixtures/coordinator-conversations";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { myAnnouncementsStub } from "@test/fixtures/program-announcements";

type ViewState = {
  requests: MentorshipRequest[];
  meetings: MeetingItem[];
  requestsError: Error | null;
  requestsLoading: boolean;
  userId: string | null;
};

const state = vi.hoisted((): ViewState => ({
  requests: [],
  meetings: [],
  requestsError: null,
  requestsLoading: false,
  userId: "mentor-1",
}));
const hooks = vi.hoisted(() => ({
  useMentorshipRequests: vi.fn((_role: string) => ({
    data: state.requests,
    error: state.requestsError,
    isLoading: state.requestsLoading,
  })),
  useMentorMessageForm: vi.fn((id: string | null) => ({ formFor: id })),
  useRequestFileUpload: vi.fn((id: string | null, role: string) => ({
    uploadFor: id,
    role,
  })),
}));
const threads = programThreadsStub();
const announcements = myAnnouncementsStub();

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: state.userId === null ? null : { userId: state.userId },
  }),
}));
vi.mock("@/hooks/use-mentorship-requests", () => hooks);
vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({ data: state.meetings }),
}));
vi.mock("@/hooks/use-program-threads", () => ({
  useProgramThreads: vi.fn(() => threads),
}));
vi.mock("@/hooks/use-program-announcements", () => ({
  useMyAnnouncements: () => announcements,
}));

const accepted = menteeRequestFixture({
  id: "accepted",
  organizationId: "org-a",
  status: MentorshipRequestStatus.Accepted,
});
const pending = menteeRequestFixture({
  id: "pending",
  organizationId: "org-p",
  status: MentorshipRequestStatus.Pending,
});
const declined = menteeRequestFixture({
  id: "declined",
  status: MentorshipRequestStatus.Declined,
});

describe("useMentorMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.requests = [declined, pending, accepted];
    state.meetings = [];
    state.requestsError = null;
    state.requestsLoading = false;
    state.userId = "mentor-1";
  });

  it("reads the mentor's side of the requests", () => {
    renderHook(() => useMentorMessages());

    expect(hooks.useMentorshipRequests).toHaveBeenCalledWith(UserRole.Mentor);
  });

  it("lists only requests that still allow messaging and opens the first", () => {
    const { result } = renderHook(() => useMentorMessages());

    expect(result.current.conversations.map(({ id }) => id)).toEqual([
      "pending",
      "accepted",
    ]);
    expect(result.current.activeId).toBe("pending");
    expect(result.current.active).toBe(pending);
    expect(result.current.viewerUserId).toBe("mentor-1");
  });

  it("opens the preferred conversation from the link", () => {
    const { result } = renderHook(() => useMentorMessages("accepted"));

    expect(result.current.activeId).toBe("accepted");
  });

  it("ignores a preferred conversation that is closed for messaging", () => {
    const { result } = renderHook(() => useMentorMessages("declined"));

    expect(result.current.activeId).toBe("pending");
  });

  it("keeps the mentor's own pick over the link, until the link changes", () => {
    const { result, rerender } = renderHook(
      ({ preferred }) => useMentorMessages(preferred),
      { initialProps: { preferred: "pending" } },
    );

    act(() => result.current.select("accepted"));
    expect(result.current.activeId).toBe("accepted");

    rerender({ preferred: "pending" });
    expect(result.current.activeId).toBe("accepted");

    rerender({ preferred: "accepted" });
    rerender({ preferred: "pending" });
    expect(result.current.activeId).toBe("pending");
  });

  it("hands the active conversation to the message form and the mentor's file upload", () => {
    renderHook(() => useMentorMessages("accepted"));

    expect(hooks.useMentorMessageForm).toHaveBeenLastCalledWith("accepted");
    expect(hooks.useRequestFileUpload).toHaveBeenLastCalledWith(
      "accepted",
      UserRole.Mentor,
    );
  });

  it("has no active conversation, meeting or label when there are none", () => {
    state.requests = [declined];
    state.userId = null;

    const { result } = renderHook(() => useMentorMessages());

    expect(result.current.activeId).toBeNull();
    expect(result.current.active).toBeNull();
    expect(result.current.activeMeeting).toBeNull();
    expect(result.current.meetingLabel).toBeNull();
    expect(result.current.viewerUserId).toBe("");
  });

  it("labels the active conversation's past meeting as its last one", () => {
    const meeting = menteeMeetingFixture({
      id: "met",
      organizationId: "org-a",
      mentorId: "mentor-1",
      mentorshipRequestId: "accepted",
      scheduledAt: "2020-01-01T10:00:00Z",
    });
    state.meetings = [meeting];

    const { result } = renderHook(() => useMentorMessages("accepted"));

    expect(result.current.activeMeeting).toEqual(meeting);
    expect(result.current.meetingLabel).toMatch(/^Son görüşme /);
  });

  it("passes the requests' loading state and error through", () => {
    state.requestsLoading = true;
    state.requestsError = new Error("offline");

    const { result } = renderHook(() => useMentorMessages());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toEqual(new Error("offline"));
  });

  it("closes the program thread and announcements when a conversation is picked", () => {
    const { result } = renderHook(() => useMentorMessages());

    act(() => result.current.select("accepted"));

    expect(threads.close).toHaveBeenCalledTimes(1);
    expect(announcements.close).toHaveBeenCalledTimes(1);
  });

  it("opens a program thread in place of the announcements, and the reverse", () => {
    const { result } = renderHook(() => useMentorMessages());

    result.current.openProgramThread("thread-1");
    expect(announcements.close).toHaveBeenCalledTimes(1);
    expect(threads.open).toHaveBeenCalledWith("thread-1");

    result.current.openAnnouncements("program-1");
    expect(threads.close).toHaveBeenCalledTimes(1);
    expect(announcements.open).toHaveBeenCalledWith("program-1");
  });
});
