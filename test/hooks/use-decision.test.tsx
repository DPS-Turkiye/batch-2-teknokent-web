import {
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDecision } from "@/hooks/use-decision";
import {
  useMentorAvailability,
  useMentorRequestDecision,
} from "@/hooks/use-mentorship-requests";
import { MentorDecisionMode } from "@/interfaces/mentorship-request";
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

const request = {
  id: "req-1",
  requesterId: "mentee-1",
  organizationId: "org-1",
  mentorId: "mentor-1",
  mentorName: "Ece Demir",
  supportArea: "Yazılım",
  status: "PENDING",
  mentorMessage: null,
  rejectionReason: null,
  createdAt: "2026-08-15T00:00:00.000Z",
  messages: [],
} as const;

describe("useDecision", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorAvailability).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useQuery>);
  });

  it("starts with no request selected", () => {
    vi.mocked(useMentorRequestDecision).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);

    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });

    expect(result.current.selectedRequest).toBeNull();
  });

  it("selects a request and resets mode/availability step", () => {
    vi.mocked(useMentorRequestDecision).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);

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
    vi.mocked(useMentorRequestDecision).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);

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
    vi.mocked(useMentorRequestDecision).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useMutation>);

    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.selectRequest(request));
    act(() => result.current.setDecisionMode(MentorDecisionMode.Decline));

    await act(() => result.current.submitDecision());

    expect(result.current.actionError).toBe("network down");
  });
});
