import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMenteeMessages } from "@/hooks/use-mentee-messages";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";

const requests = [
  menteeRequestFixture({
    id: "pending",
    status: MentorshipRequestStatus.Pending,
  }),
  menteeRequestFixture({
    id: "more-info",
    status: MentorshipRequestStatus.MoreInfoRequested,
  }),
  menteeRequestFixture({
    id: "counter",
    status: MentorshipRequestStatus.CounterProposed,
  }),
  menteeRequestFixture({
    id: "accepted",
    status: MentorshipRequestStatus.Accepted,
  }),
  menteeRequestFixture({
    id: "declined",
    status: MentorshipRequestStatus.Declined,
  }),
  menteeRequestFixture({
    id: "withdrawn",
    status: MentorshipRequestStatus.Withdrawn,
  }),
];

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentee-1" } }),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: () => ({
    data: requests,
    error: null,
    isLoading: false,
  }),
  useReplyForm: vi.fn(),
  useRequestFileUpload: vi.fn(),
}));
vi.mock("@/hooks/use-program-announcements", () => ({
  useMyAnnouncements: vi.fn(),
}));
vi.mock("@/hooks/use-program-threads", () => ({
  useProgramThreads: vi.fn(() => ({})),
}));

describe("useMenteeMessages", () => {
  it("opens a chat for a request the mentor has not accepted yet, but not for a closed one", () => {
    const { result } = renderHook(() => useMenteeMessages());

    expect(result.current.conversations.map((request) => request.id)).toEqual([
      "pending",
      "more-info",
      "counter",
      "accepted",
    ]);
    expect(result.current.activeId).toBe("pending");
  });
});
