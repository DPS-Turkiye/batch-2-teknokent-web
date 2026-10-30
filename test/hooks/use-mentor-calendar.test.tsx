import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorCalendar } from "@/hooks/use-mentor-calendar";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { Weekday } from "@/interfaces/mentor";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { CalendarFilter } from "@/lib/calendar";
import { getMeetings, postMeeting } from "@/lib/client/meetings";
import {
  getAvailabilityRules,
  getMentorAvailability,
} from "@/lib/client/mentor-profile";
import { createTestQueryClient } from "@test/test-utils";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { userId: "mentor-1" } }),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
  mentorshipRequestsQueryKey: (role: string) => ["mentorship-requests", role],
}));
vi.mock("@/hooks/use-programs", () => ({
  usePrograms: () => ({ data: [] }),
}));
vi.mock("@/hooks/use-mentor-profile", () => ({
  useMentorAvailabilitySettings: () => ({ data: { exceptions: [] } }),
}));
vi.mock("@/components/mentorships/regular-mentorships-tab", () => ({
  REGULAR_MENTORSHIPS_QUERY_KEY: ["regular-mentorships"],
}));
vi.mock("@/lib/client/mentorships", () => ({
  getRegularMentorships: vi.fn().mockResolvedValue([]),
}));
vi.mock("@/lib/client/meetings", () => ({
  getMeetings: vi.fn(),
  postMeeting: vi.fn(),
  postMeetingGuest: vi.fn(),
  deleteMeeting: vi.fn(),
}));
vi.mock("@/lib/client/mentor-profile", () => ({
  getAvailabilityRules: vi.fn(),
  getMentorAvailability: vi.fn(),
  createAvailabilityRule: vi.fn(),
  deleteAvailabilityRule: vi.fn(),
}));

// Wednesday 21 Oct 2026, so the browsed week is Mon 19 – Fri 23.
const NOW = new Date(2026, 9, 21, 10, 0);
const at = (day: number, hour: number) =>
  new Date(2026, 9, day, hour, 0).toISOString();

function meeting(id: string, scheduledAt: string) {
  return {
    id,
    organizationId: "org-1",
    scheduledAt,
    durationMinutes: 45,
    status: "SCHEDULED",
  };
}

function slot(id: string, startsAt: string, booked = false) {
  return { id, startsAt, durationMinutes: 30, booked };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

async function renderCalendar() {
  const hook = renderHook(() => useMentorCalendar(), { wrapper });
  await waitFor(() => expect(hook.result.current.isLoading).toBe(false));
  await waitFor(() => expect(hook.result.current.rules).toHaveLength(3));
  return hook;
}

describe("useMentorCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    vi.mocked(getMeetings).mockResolvedValue([
      meeting("last-week", at(16, 14)),
      meeting("this-week", at(20, 14)),
      meeting("next-week", at(27, 14)),
    ] as never);
    vi.mocked(getMentorAvailability).mockResolvedValue([
      slot("next-week-free", at(27, 10)),
      slot("this-week-booked", at(22, 11), true),
      slot("this-week-free", at(22, 10)),
    ]);
    vi.mocked(getAvailabilityRules).mockResolvedValue([
      {
        id: "fri",
        dayOfWeek: Weekday.Friday,
        startTime: "14:00",
        endTime: "16:00",
        slotMinutes: 30,
      },
      {
        id: "mon-10",
        dayOfWeek: Weekday.Monday,
        startTime: "10:00",
        endTime: "12:00",
        slotMinutes: 30,
      },
      {
        id: "mon-09",
        dayOfWeek: Weekday.Monday,
        startTime: "09:00",
        endTime: "10:00",
        slotMinutes: 30,
      },
    ]);
    vi.mocked(useMentorshipRequests).mockReturnValue({
      data: [
        { id: "accepted", status: MentorshipRequestStatus.Accepted },
        { id: "pending", status: MentorshipRequestStatus.Pending },
      ],
    } as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows only the browsed week's meetings and free slots", async () => {
    const { result } = await renderCalendar();

    expect(result.current.meetings.map((m) => m.id)).toEqual(["this-week"]);
    expect(result.current.slots.map((s) => s.id)).toEqual(["this-week-free"]);
    expect(result.current.freeSlotCount).toBe(1);
    expect(result.current.days).toHaveLength(5);
  });

  it("offers the next seven days of free slots in order, whatever week is browsed", async () => {
    const { result } = await renderCalendar();
    act(() => result.current.nextWeek());

    expect(result.current.upcomingSlots.map((s) => s.id)).toEqual([
      "this-week-free",
      "next-week-free",
    ]);
  });

  it("orders availability rules by weekday, then start time", async () => {
    const { result } = await renderCalendar();

    expect(result.current.rules.map((r) => r.id)).toEqual([
      "mon-09",
      "mon-10",
      "fri",
    ]);
  });

  it("lists only accepted mentorships", async () => {
    const { result } = await renderCalendar();

    expect(result.current.mentorships.map((m) => m.id)).toEqual(["accepted"]);
  });

  it("filters what the grid shows by tab", async () => {
    const { result } = await renderCalendar();

    act(() => result.current.setFilter(CalendarFilter.Mentorship));
    expect(result.current.meetings).toHaveLength(1);
    expect(result.current.slots).toEqual([]);

    act(() => result.current.setFilter(CalendarFilter.Availability));
    expect(result.current.meetings).toEqual([]);
    expect(result.current.slots).toHaveLength(1);

    act(() => result.current.setFilter(CalendarFilter.Program));
    expect(result.current.meetings).toEqual([]);
    expect(result.current.slots).toEqual([]);
  });

  it("moves between weeks and back to this one", async () => {
    const { result } = await renderCalendar();

    act(() => result.current.nextWeek());
    expect(result.current.meetings.map((m) => m.id)).toEqual(["next-week"]);

    act(() => {
      result.current.previousWeek();
      result.current.previousWeek();
    });
    expect(result.current.meetings.map((m) => m.id)).toEqual(["last-week"]);

    act(() => result.current.thisWeek());
    expect(result.current.meetings.map((m) => m.id)).toEqual(["this-week"]);
  });

  it("creates meetings as scheduled", async () => {
    vi.mocked(postMeeting).mockResolvedValue({} as never);
    const { result } = await renderCalendar();

    await act(() =>
      result.current.addMeeting({
        scheduledAt: at(22, 10),
        durationMinutes: 30,
        agenda: "Yol haritası",
      }),
    );

    expect(vi.mocked(postMeeting).mock.calls[0][0]).toEqual({
      scheduledAt: at(22, 10),
      durationMinutes: 30,
      agenda: "Yol haritası",
      status: "SCHEDULED",
    });
  });
});
