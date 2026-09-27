import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useMeetingProposals,
  useMentorshipMeetingProposals,
} from "@/hooks/use-meeting-proposals";
import { MeetingProposalStatus } from "@/interfaces/meeting-proposal";
import {
  acceptMeetingProposal,
  declineMeetingProposal,
  getMentorshipMeetingProposals,
  getMyMeetingProposals,
  proposeMeeting,
  remindMeetingProposal,
  withdrawMeetingProposal,
} from "@/lib/client/meeting-proposals";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/meeting-proposals", () => ({
  acceptMeetingProposal: vi.fn(),
  declineMeetingProposal: vi.fn(),
  getMentorshipMeetingProposals: vi.fn(),
  getMyMeetingProposals: vi.fn(),
  proposeMeeting: vi.fn(),
  remindMeetingProposal: vi.fn(),
  withdrawMeetingProposal: vi.fn(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("useMeetingProposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyMeetingProposals).mockResolvedValue([meetingProposal()]);
    vi.mocked(acceptMeetingProposal).mockResolvedValue(meetingProposal());
    vi.mocked(declineMeetingProposal).mockResolvedValue(meetingProposal());
  });

  it("accepts a proposal", async () => {
    const { result } = renderHook(() => useMeetingProposals(), { wrapper });
    await waitFor(() => expect(result.current.proposals).toHaveLength(1));

    act(() => result.current.accept("proposal-1"));

    await waitFor(() =>
      expect(acceptMeetingProposal).toHaveBeenCalledWith(
        "proposal-1",
        expect.anything(),
      ),
    );
  });

  it("declines with the typed reason and closes the form", async () => {
    const { result } = renderHook(() => useMeetingProposals(), { wrapper });
    await waitFor(() => expect(result.current.proposals).toHaveLength(1));

    act(() => result.current.startDecline("proposal-1"));
    act(() => result.current.setReason("O gün seyahatteyim"));
    act(() => result.current.confirmDecline());

    await waitFor(() => expect(result.current.decliningId).toBeNull());
    expect(declineMeetingProposal).toHaveBeenCalledWith(
      "proposal-1",
      "O gün seyahatteyim",
    );
    expect(result.current.reason).toBe("");
  });
});

describe("useMentorshipMeetingProposals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMentorshipMeetingProposals).mockResolvedValue([]);
    vi.mocked(proposeMeeting).mockResolvedValue(meetingProposal());
    vi.mocked(remindMeetingProposal).mockResolvedValue(undefined);
    vi.mocked(withdrawMeetingProposal).mockResolvedValue(undefined);
  });

  it("proposes the picked local time as an instant and closes the dialog", async () => {
    const { result } = renderHook(
      () => useMentorshipMeetingProposals("mentorship-1"),
      { wrapper },
    );
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));

    act(() => result.current.openComposer());
    act(() => result.current.setStartsAt("2026-10-01T10:30"));
    act(() => result.current.setDuration(60));
    act(() => result.current.setAgenda("  Tanışma  "));
    act(() => result.current.propose());

    await waitFor(() => expect(result.current.composing).toBe(false));
    expect(proposeMeeting).toHaveBeenCalledWith("mentorship-1", {
      scheduledAt: new Date("2026-10-01T10:30").toISOString(),
      durationMinutes: 60,
      agenda: "Tanışma",
      replacesMeetingId: null,
    });
  });

  it("reminds and withdraws the open proposal, and shows only a newest decline", async () => {
    vi.mocked(getMentorshipMeetingProposals).mockResolvedValue([
      meetingProposal(),
      meetingProposal({ id: "old", status: MeetingProposalStatus.Declined }),
    ]);
    const { result } = renderHook(
      () => useMentorshipMeetingProposals("mentorship-1"),
      { wrapper },
    );
    await waitFor(() => expect(result.current.open?.id).toBe("proposal-1"));
    expect(result.current.declined).toBeNull();

    act(() => result.current.remind());
    act(() => result.current.withdraw());

    await waitFor(() =>
      expect(withdrawMeetingProposal).toHaveBeenCalledWith(
        "proposal-1",
        expect.anything(),
      ),
    );
    expect(remindMeetingProposal).toHaveBeenCalledWith(
      "proposal-1",
      expect.anything(),
    );
  });
});
