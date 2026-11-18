import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDecision } from "@/hooks/use-decision";
import {
  useMentorAvailability,
  useMentorRequestDecision,
} from "@/hooks/use-mentorship-requests";
import {
  MentorDecisionMode,
  MentorshipRequestStatus,
} from "@/interfaces/mentorship-request";
import { mentorshipRequest } from "@test/fixtures/mentorship-requests";
import { idleMutation, successQuery } from "@test/mocks/query-results";
import { createTestQueryClient, freezeDate } from "@test/test-utils";

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

describe("useDecision time choice", () => {
  const withTimes = mentorshipRequest({
    requesterMessage: [
      "Tercih edilen saatler: 24 Kasım Salı · 10:00, 25 Kasım Çarşamba · 14:00, 10 Kasım Salı · 09:00",
      "preferredSlots:2026-11-24T10:00,2026-11-25T14:00,2026-11-10T09:00",
    ].join("\n"),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    freezeDate("2026-11-18T09:00:00");
    vi.mocked(useMentorAvailability).mockReturnValue(successQuery([]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderDecision(mutateAsync = vi.fn().mockResolvedValue(withTimes)) {
    vi.mocked(useMentorRequestDecision).mockReturnValue(
      idleMutation({ mutateAsync }),
    );
    const view = renderHook(() => useDecision(), { wrapper: createWrapper() });
    act(() => view.result.current.selectRequest(withTimes));
    return { ...view, mutateAsync };
  }

  it("offers the mentee's times with none picked, a passed one unavailable", () => {
    const { result } = renderDecision();

    expect(result.current.slotOptions.map((option) => option.label)).toEqual([
      "24 Kas 10:00–10:45",
      "25 Kas 14:00–14:45",
      "10 Kas 09:00–09:45",
    ]);
    expect(
      result.current.slotOptions.map((option) => option.available),
    ).toEqual([true, true, false]);
    expect(result.current.selectedSlot).toBeNull();
    expect(result.current.canAccept).toBe(false);
  });

  it("refuses to accept before a time is picked", async () => {
    const { result, mutateAsync } = renderDecision();

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.submitDecision(MentorDecisionMode.Accept);
    });

    expect(accepted).toBe(false);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("sends exactly the picked time", async () => {
    const { result, mutateAsync } = renderDecision();

    act(() => result.current.selectSlot("2026-11-25T14:00"));
    expect(result.current.selectedSlot?.label).toBe("25 Kas 14:00–14:45");
    expect(result.current.canAccept).toBe(true);
    await act(() => result.current.submitDecision(MentorDecisionMode.Accept));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "req-1",
      status: MentorshipRequestStatus.Accepted,
      message: "Görüşme saati: 2026-11-25T14:00",
    });
  });

  it("can't pick a time that has passed", () => {
    const { result } = renderDecision();

    act(() => result.current.selectSlot("2026-11-10T09:00"));

    expect(result.current.selectedSlot).toBeNull();
    expect(result.current.canAccept).toBe(false);
  });

  it("forgets the picked time when another request is opened", () => {
    const { result } = renderDecision();

    act(() => result.current.selectSlot("2026-11-24T10:00"));
    act(() => result.current.selectRequest(withTimes));

    expect(result.current.selectedSlot).toBeNull();
  });

  it("accepts a request without preferred times as before", async () => {
    const mutateAsync = vi.fn().mockResolvedValue(request);
    vi.mocked(useMentorRequestDecision).mockReturnValue(
      idleMutation({ mutateAsync }),
    );
    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.selectRequest(request));

    expect(result.current.canAccept).toBe(true);
    await act(() => result.current.submitDecision(MentorDecisionMode.Accept));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "req-1",
      status: MentorshipRequestStatus.Accepted,
      message: "Talebiniz kabul edildi.",
    });
  });
});

describe("useDecision when no time is left to pick", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMentorAvailability).mockReturnValue(successQuery([]));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts without a time when every preferred time has passed", async () => {
    freezeDate("2026-11-30T09:00:00");
    const passed = mentorshipRequest({
      requesterMessage: "preferredSlots:2026-11-24T10:00",
    });
    const mutateAsync = vi.fn().mockResolvedValue(passed);
    vi.mocked(useMentorRequestDecision).mockReturnValue(
      idleMutation({ mutateAsync }),
    );
    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.selectRequest(passed));

    expect(result.current.canAccept).toBe(true);
    await act(() => result.current.submitDecision(MentorDecisionMode.Accept));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: "req-1",
      status: MentorshipRequestStatus.Accepted,
      message: "Talebiniz kabul edildi.",
    });
  });

  it("refuses a picked time that started while the drawer was open", async () => {
    freezeDate("2026-11-24T09:55:00");
    const soon = mentorshipRequest({
      requesterMessage: "preferredSlots:2026-11-24T10:00,2026-11-25T10:00",
    });
    const mutateAsync = vi.fn().mockResolvedValue(soon);
    vi.mocked(useMentorRequestDecision).mockReturnValue(
      idleMutation({ mutateAsync }),
    );
    const { result } = renderHook(() => useDecision(), {
      wrapper: createWrapper(),
    });
    act(() => result.current.selectRequest(soon));
    act(() => result.current.selectSlot("2026-11-24T10:00"));
    freezeDate("2026-11-24T10:01:00");

    let accepted: boolean | undefined;
    await act(async () => {
      accepted = await result.current.submitDecision(MentorDecisionMode.Accept);
    });

    expect(accepted).toBe(false);
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(result.current.actionError).toBe(
      "Seçtiğin saat geçti. Başka bir saat seç.",
    );
  });
});
