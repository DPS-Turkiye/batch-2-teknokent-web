import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MEETINGS_QUERY_KEY } from "@/hooks/use-meetings";
import {
  mentorshipRequestsQueryKey,
  useAcceptProposedSlot,
  useAlternativeMentors,
  useMentorAvailability,
  useMentorRequestDecision,
  useMentorshipRequest,
  useScheduleMeeting,
  useWithdrawMentorRequest,
} from "@/hooks/use-mentorship-requests";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import {
  acceptProposedMentorSlot,
  decideMentorRequest,
  getAlternativeMentors,
  getMentorAvailability,
  getMentorRequest,
  scheduleMeeting,
  withdrawMentorRequest,
} from "@/lib/client/mentor-requests";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { mentorProfile } from "@test/fixtures/mentors";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/client/mentor-requests", () => ({
  acceptProposedMentorSlot: vi.fn(),
  decideMentorRequest: vi.fn(),
  getAlternativeMentors: vi.fn(),
  getMentorAvailability: vi.fn(),
  getMentorRequest: vi.fn(),
  getMentorRequests: vi.fn(),
  postMentorMessage: vi.fn(),
  replyToMentorRequest: vi.fn(),
  scheduleMeeting: vi.fn(),
  withdrawMentorRequest: vi.fn(),
}));
vi.mock("@/lib/client/documents", () => ({ uploadDocument: vi.fn() }));

const request = menteeRequestFixture({ id: "req-1" });

describe("mentorship request queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMentorRequest).mockResolvedValue(request);
    vi.mocked(getMentorAvailability).mockResolvedValue([]);
    vi.mocked(getAlternativeMentors).mockResolvedValue([mentorProfile]);
  });

  it("asks for nothing without a request", () => {
    const wrapped = queryWrapper();
    renderHook(() => useMentorshipRequest(null), wrapped);
    renderHook(() => useMentorAvailability(null, true), wrapped);
    renderHook(() => useAlternativeMentors(null, true), wrapped);

    expect(getMentorRequest).not.toHaveBeenCalled();
    expect(getMentorAvailability).not.toHaveBeenCalled();
    expect(getAlternativeMentors).not.toHaveBeenCalled();
  });

  it("waits to read availability and alternatives until they are wanted", () => {
    const wrapped = queryWrapper();
    renderHook(() => useMentorAvailability("req-1", false), wrapped);
    renderHook(() => useAlternativeMentors("req-1", false), wrapped);

    expect(getMentorAvailability).not.toHaveBeenCalled();
    expect(getAlternativeMentors).not.toHaveBeenCalled();
  });

  it("reads the request, its slots and alternative mentors once wanted", async () => {
    const wrapped = queryWrapper();
    const single = renderHook(() => useMentorshipRequest("req-1"), wrapped);
    renderHook(() => useMentorAvailability("req-1", true), wrapped);
    const alternatives = renderHook(
      () => useAlternativeMentors("req-1", true),
      wrapped,
    );

    await waitFor(() => expect(single.result.current.data).toEqual(request));
    await waitFor(() =>
      expect(alternatives.result.current.data).toEqual([mentorProfile]),
    );
    expect(getMentorAvailability).toHaveBeenCalledWith("req-1");
  });
});

describe("mentorship request mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("caches the withdrawn request and refreshes the mentee's list", async () => {
    const withdrawn = { ...request, status: MentorshipRequestStatus.Withdrawn };
    vi.mocked(withdrawMentorRequest).mockResolvedValue(withdrawn);
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useWithdrawMentorRequest("req-1"), {
      wrapper,
    });

    await act(() => result.current.mutateAsync());

    expect(withdrawMentorRequest).toHaveBeenCalledWith("req-1");
    expect(queryClient.getQueryData(["mentorship-request", "req-1"])).toEqual(
      withdrawn,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
    });
  });

  it("books a slot and refreshes the slots and the mentee's list", async () => {
    vi.mocked(scheduleMeeting).mockResolvedValue({
      id: "meeting-1",
      mentorshipRequestId: "req-1",
      scheduledAt: "2026-09-20T10:00:00Z",
      durationMinutes: 45,
      meetLink: null,
      status: "SCHEDULED",
    });
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useScheduleMeeting("req-1"), {
      wrapper,
    });

    await act(() => result.current.mutateAsync("slot-1"));

    expect(scheduleMeeting).toHaveBeenCalledWith({
      id: "req-1",
      slotId: "slot-1",
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["mentor-availability", "req-1"],
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
    });
  });

  it("refreshes the mentor's list after a decision", async () => {
    const accepted = { ...request, status: MentorshipRequestStatus.Accepted };
    vi.mocked(decideMentorRequest).mockResolvedValue(accepted);
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMentorRequestDecision(), {
      wrapper,
    });

    await act(() =>
      result.current.mutateAsync({
        id: "req-1",
        message: "Memnuniyetle",
        status: MentorshipRequestStatus.Accepted,
      }),
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mentorshipRequestsQueryKey(UserRole.Mentor),
    });
  });

  it("caches the request with the accepted slot and refreshes the list and meetings", async () => {
    const accepted = { ...request, status: MentorshipRequestStatus.Accepted };
    vi.mocked(acceptProposedMentorSlot).mockResolvedValue(accepted);
    const { queryClient, wrapper } = queryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useAcceptProposedSlot("req-1"), {
      wrapper,
    });

    await act(() => result.current.mutateAsync("2026-09-20T10:00:00Z"));

    expect(acceptProposedMentorSlot).toHaveBeenCalledWith({
      id: "req-1",
      selectedSlot: "2026-09-20T10:00:00Z",
    });
    expect(queryClient.getQueryData(["mentorship-request", "req-1"])).toEqual(
      accepted,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mentorshipRequestsQueryKey(UserRole.Mentee),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: MEETINGS_QUERY_KEY });
  });
});
