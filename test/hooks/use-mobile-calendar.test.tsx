import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useMobileCalendar } from "@/hooks/use-mobile-calendar";
import { MeetingProposalStatus } from "@/interfaces/meeting-proposal";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { UserRole } from "@/interfaces/session";
import { getMyMeetingProposals } from "@/lib/client/meeting-proposals";
import { getMentorRequests } from "@/lib/client/mentor-requests";
import { getOrganizationMembersById } from "@/lib/client/organization-members";
import { getMemberProgramEvents } from "@/lib/client/programs";
import { itemAt } from "@test/fixtures/list-assertions";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import {
  menteeMeetingFixture,
  menteeRequestFixture,
} from "@test/fixtures/mentee-home";
import { memberFixture } from "@test/fixtures/startup-team";
import { createTestQueryClient } from "@test/test-utils";

let search = new URLSearchParams();
let meetings = [menteeMeetingFixture()];
let role = UserRole.Mentee;

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
vi.mock("@/lib/client/mentor-requests", () => ({ getMentorRequests: vi.fn() }));
vi.mock("@/lib/client/meeting-proposals", () => ({
  getMyMeetingProposals: vi.fn(),
}));
vi.mock("@/lib/client/organization-members", () => ({
  getOrganizationMembersById: vi.fn(),
}));
vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({
    session: { userId: "mentor-1", fullName: "Nihan Öztürk", role },
  }),
}));

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
  vi.clearAllMocks();
  search = new URLSearchParams();
  role = UserRole.Mentee;
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
  vi.mocked(getMyMeetingProposals).mockResolvedValue([]);
  vi.mocked(getMentorRequests).mockResolvedValue([
    menteeRequestFixture({
      id: "r1",
      organizationId: "org-1",
      organizationName: "Döngü",
      requesterName: "Gülse Buran",
      supportArea: "Positioning",
    }),
  ]);
  vi.mocked(getOrganizationMembersById).mockResolvedValue([
    memberFixture("u1", { fullName: "Gülse Buran", founder: true }),
    memberFixture("u2", { fullName: "Can Er" }),
    memberFixture("u3", { fullName: "Ada Su" }),
  ]);
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

  it("does not load mentor requests for a mentee", async () => {
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    await waitFor(() => expect(result.current.agenda).toHaveLength(1));
    expect(result.current.isMentor).toBe(false);
    expect(getMentorRequests).not.toHaveBeenCalled();
  });

  it("shows mentors each meeting by startup and topic", async () => {
    role = UserRole.Mentor;
    meetings = [
      menteeMeetingFixture({
        id: "m1",
        mentorshipRequestId: "r1",
        organizationId: "org-1",
        organizationName: "Döngü",
        scheduledAt: new Date(2026, 8, 23, 16, 30).toISOString(),
        durationMinutes: 45,
        meetLink: "https://meet.google.com/abc",
        agenda: "Değer önerisi",
      }),
    ];
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    await waitFor(() =>
      expect(result.current.agenda[0]?.entries[0]?.detail).toBe(
        "Positioning · Gülse Buran · Online",
      ),
    );
    expect(result.current.agenda[0]?.entries[0]).toMatchObject({
      title: "Döngü",
      startup: { name: "Döngü", initials: "D" },
    });

    act(() => result.current.openEntry("meeting:m1"));

    await waitFor(() =>
      expect(result.current.detail?.mentor?.startup.people).toBe(
        "Gülse Buran (yetkili) + 2 üye",
      ),
    );
    expect(getOrganizationMembersById).toHaveBeenCalledWith("org-1");
    expect(result.current.detail?.mentor).toMatchObject({
      title: "Döngü · Positioning",
      startsIn: "3 saat sonra",
      timeLine: "Bugün · 16:30–17:15",
      timeHint: "45 dk",
      self: { name: "Nihan Öztürk", initials: "NÖ" },
      topic: {
        title: "Positioning · 1. görüşme",
        agenda: "Gündem: Değer önerisi",
      },
    });
  });

  it("puts times waiting for the mentor's approval on the agenda without making them the next meeting", async () => {
    role = UserRole.Mentor;
    vi.mocked(getMentorRequests).mockResolvedValue([
      menteeRequestFixture({
        id: "r2",
        status: MentorshipRequestStatus.Pending,
        organizationName: "Lumen",
        supportArea: "Finansal model",
        requesterMessage: "preferredSlots:2026-09-23T15:00,2026-09-22T10:00",
      }),
    ]);
    const proposal = (id: string, canRespond: boolean) =>
      meetingProposal({
        id,
        organizationName: "Atlas AI",
        scheduledAt: new Date(2026, 8, 24, 11, 0).toISOString(),
        durationMinutes: 30,
        agenda: "Yeni saat",
        status: MeetingProposalStatus.Pending,
        canRespond,
      });
    vi.mocked(getMyMeetingProposals).mockResolvedValue([
      proposal("p1", true),
      proposal("p2", false),
    ]);
    const { result } = renderHook(() => useMobileCalendar(), { wrapper });

    await waitFor(() =>
      expect(
        result.current.agenda[0]?.entries.map((entry) => entry.id),
      ).toEqual([expect.stringMatching(/^request:r2:/)]),
    );
    expect(result.current.agenda[0]?.entries[0]).toMatchObject({
      title: "Lumen",
      detail: "Finansal model · önerilen saat · onay bekliyor",
      awaitingApproval: true,
    });
    expect(result.current.nextId).toBe("meeting:m1");

    act(() => result.current.selectDay(new Date(2026, 8, 24)));
    expect(result.current.agenda[0]?.entries.map((entry) => entry.id)).toEqual([
      "proposal:p1",
      "meeting:m1",
    ]);

    act(() => result.current.openEntry("proposal:p1"));
    expect(result.current.detail).toMatchObject({
      kindLabel: "Onay bekliyor",
      canJoin: false,
      messageHref: null,
    });

    act(() => result.current.selectDay(new Date(2026, 8, 23)));
    const pending = itemAt(itemAt(result.current.agenda, 0).entries, 0).id;
    act(() => result.current.openEntry(pending));
    expect(result.current.detail?.messageHref).toContain("r2");
  });
});
