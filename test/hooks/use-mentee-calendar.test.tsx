import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMeetings } from "@/hooks/use-meetings";
import { useMenteeCalendar } from "@/hooks/use-mentee-calendar";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { CalendarFilter } from "@/lib/calendar";
import { getActionItems } from "@/lib/client/action-items";
import { getStartupProcess } from "@/lib/client/startup-process";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-meetings", () => ({ useMeetings: vi.fn() }));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));
vi.mock("@/lib/client/action-items", () => ({ getActionItems: vi.fn() }));
vi.mock("@/lib/client/startup-process", () => ({ getStartupProcess: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

const meeting = {
  id: "m-1",
  organizationId: "org-1",
  mentorName: "Nihan Öztürk",
  mentorshipRequestId: "req-1",
  agenda: "Ürün konumlandırma kararları",
  scheduledAt: new Date(2026, 7, 28, 14, 0).toISOString(),
  durationMinutes: 45,
  status: MeetingStatus.Scheduled,
};

describe("useMenteeCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 7, 26, 9, 0));
    vi.mocked(useMeetings).mockReturnValue({
      data: [meeting],
      isLoading: false,
      error: null,
    } as never);
    vi.mocked(useMentorshipRequests).mockReturnValue({
      data: [{ id: "req-1", status: MentorshipRequestStatus.Accepted }],
    } as never);
    vi.mocked(getActionItems).mockResolvedValue([
      {
        id: "ai-1",
        title: "User Flow dosyasını yükle",
        dueDate: "2026-08-27",
        status: ActionItemStatus.Open,
      },
    ] as never);
    vi.mocked(getStartupProcess).mockResolvedValue({
      assignments: [
        {
          id: "as-1",
          title: "Finansal model",
          dueDate: "2026-08-25",
          status: ActionItemStatus.InProgress,
        },
      ],
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows Monday to Friday of this week and moves a week at a time", () => {
    const { result } = renderHook(() => useMenteeCalendar(), { wrapper });

    expect(result.current.rangeLabel).toBe("24–28 Ağustos 2026");
    act(() => result.current.next());
    expect(result.current.rangeLabel).toBe("31–4 Eylül 2026");
    act(() => result.current.today());
    expect(result.current.rangeLabel).toBe("24–28 Ağustos 2026");
  });

  it("lays out meetings and deliverables by day and summarises the week", async () => {
    const { result } = renderHook(() => useMenteeCalendar(), { wrapper });

    await waitFor(() =>
      expect(result.current.summary).toBe(
        "Bu hafta 1 mentorluk görüşmesi · 2 teslim",
      ),
    );
    const labels = result.current.entriesByDay.map((day) =>
      day.map((entry) => entry.gridLabel),
    );
    expect(labels).toEqual([[], ["Teslim"], [], ["Teslim"], ["Nihan Öztürk"]]);
  });

  it("filters the grid without changing the summary", async () => {
    const { result } = renderHook(() => useMenteeCalendar(), { wrapper });
    await waitFor(() => expect(result.current.summary).toContain("2 teslim"));

    act(() => result.current.setFilter(CalendarFilter.Mentorship));

    expect(
      result.current.entriesByDay.flat().map((entry) => entry.gridLabel),
    ).toEqual(["Nihan Öztürk"]);
    expect(result.current.summary).toContain("2 teslim");
  });

  it("prepares for the next mentorship meeting with its open action items", async () => {
    const { result } = renderHook(() => useMenteeCalendar(), { wrapper });

    await waitFor(() => expect(result.current.prep?.items).toHaveLength(1));
    expect(result.current.prep?.meeting.id).toBe("m-1");
    expect(result.current.upcoming.map((entry) => entry.title)).toEqual([
      "User Flow dosyasını yükle",
      "Ürün konumlandırma kararları",
    ]);
  });
});
