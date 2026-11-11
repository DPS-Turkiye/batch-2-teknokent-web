import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDecision } from "@/hooks/use-decision";
import {
  useMentorAvailability,
  useMentorRequestDecision,
} from "@/hooks/use-mentorship-requests";
import { MentorDecisionMode } from "@/interfaces/mentorship-request";
import { mentorshipRequest } from "@test/fixtures/mentorship-requests";
import { idleMutation, successQuery } from "@test/mocks/query-results";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-mentorship-requests", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-mentorship-requests")>();
  return {
    ...actual,
    useMentorAvailability: vi.fn(),
    useMentorRequestDecision: vi.fn(),
  };
});

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const request = mentorshipRequest();

describe("useDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorAvailability).mockReturnValue(successQuery([]));
  });

  it("starts with no request selected", () => {
    vi.mocked(useMentorRequestDecision).mockReturnValue(idleMutation());

    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });

    expect(result.current.selectedRequest).toBeNull();
  });

  it("selects a request and resets mode/availability step", () => {
    vi.mocked(useMentorRequestDecision).mockReturnValue(idleMutation());

    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.selectRequest(request));

    expect(result.current.selectedRequest).toEqual(request);
    expect(result.current.decisionMode).toBeNull();
    expect(result.current.showAvailabilityStep).toBe(false);
  });

  it("submits a decision and reveals the availability step on accept", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(request);
    vi.mocked(useMentorRequestDecision).mockReturnValue(
      idleMutation({ mutateAsync }),
    );

    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.selectRequest(request));
    act(() => result.current.setDecisionMode(MentorDecisionMode.Accept));

    await act(() => result.current.submitDecision());

    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ id: "req-1", status: "ACCEPTED" }),
    );
    await waitFor(() => expect(result.current.showAvailabilityStep).toBe(true));
  });

  it("surfaces a mutation error instead of throwing", async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error("network down"));
    vi.mocked(useMentorRequestDecision).mockReturnValue(
      idleMutation({ mutateAsync }),
    );

    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.selectRequest(request));
    act(() => result.current.setDecisionMode(MentorDecisionMode.Decline));

    await act(() => result.current.submitDecision());

    expect(result.current.actionError).toBe("network down");
  });
});
