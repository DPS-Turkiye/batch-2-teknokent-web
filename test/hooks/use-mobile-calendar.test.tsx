import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileCalendar } from "@/hooks/use-mobile-calendar";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { createTestQueryClient } from "@test/test-utils";

let search = new URLSearchParams();
let meetings = [menteeMeetingFixture()];

vi.mock("next/navigation", () => ({ useSearchParams: () => search }));
vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => ({
    data: meetings,
    error: null,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/lib/client/programs", () => ({ getMemberProgramEvents: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 23, 14, 0));
  search = new URLSearchParams();
  meetings = [
    menteeMeetingFixture({
      id: "m1",
      mentorshipRequestId: "r1",
      scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/abc",
    }),
  ];
  vi.mocked(getMemberProgramEvents).mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useMobileCalendar", () => {
  it("shows this week from today and flags the next meeting", async () => {
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    await waitFor(() => expect(result.current.agenda).toHaveLength(1));
    expect(result.current.agenda[0]?.heading).toBe("Yarın · Perşembe 24 Eylül");
    expect(result.current.nextId).toBe("meeting:m1");
    expect(result.current.title).toBe("Eylül 2026");
  });

  it("opens a meeting's sheet with the chat link, but no join yet", async () => {
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    act(() => result.current.openEntry("meeting:m1"));

    expect(result.current.detail).toMatchObject({
      kindLabel: "Mentorluk görüşmesi",
      canJoin: false,
      messageHref: "/m/messages/mentorship/r1",
    });
    expect(result.current.detail?.link?.label).toBe("Google Meet");
  });

  it("opens the meeting a Home link points to", async () => {
    search = new URLSearchParams("meeting=m1");
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    await waitFor(() => expect(result.current.detail).not.toBeNull());
    expect(result.current.strip.find((day) => day.isSelected)?.dayNumber).toBe(
      24,
    );
  });

  it("picks a day from the month sheet and closes it", () => {
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    act(() => result.current.month.open());
    act(() => result.current.month.pick(new Date(2026, 9, 7)));

    expect(result.current.month.isOpen).toBe(false);
    expect(result.current.title).toBe("Ekim 2026");
    expect(result.current.strip.find((day) => day.isSelected)?.dayNumber).toBe(
      7,
    );
  });

  it("loads program events for the weeks around the shown month", async () => {
    renderHook(() => useMobileCalendar(), { wrapper });

    await waitFor(() => expect(getMemberProgramEvents).toHaveBeenCalled());
    expect(vi.mocked(getMemberProgramEvents).mock.calls[0]?.[0]).toEqual({
      from: new Date(2026, 7, 25),
      to: new Date(2026, 9, 8),
    });
  });
});
