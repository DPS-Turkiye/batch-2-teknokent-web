import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileCalendarView } from "@/components/mobile/mobile-calendar-view";
import type { useMobileCalendar } from "@/hooks/use-mobile-calendar";
import { agendaEntries, MobileAgendaKind } from "@/lib/mobile-calendar";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";

type Calendar = ReturnType<typeof useMobileCalendar>;

const [MEETING] = agendaEntries(
  [
    menteeMeetingFixture({
      id: "m1",
      agenda: "Ürün Stratejisi Görüşmesi",
      mentorName: "Nihan Öztürk",
      organizationName: "Atlas AI",
      scheduledAt: new Date(2026, 8, 24, 14, 0).toISOString(),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/abc",
    }),
  ],
  [],
);

const openEntry = vi.fn();
const selectDay = vi.fn();
const pick = vi.fn();
let calendar: Calendar;

vi.mock("@/hooks/use-mobile-calendar", () => ({
  useMobileCalendar: () => calendar,
}));

function detail(canJoin: boolean): NonNullable<Calendar["detail"]> {
  return {
    entry: MEETING!,
    kindLabel: "Mentorluk görüşmesi",
    timeLine: "Perşembe 24 Eylül · 14:00–15:00",
    timeHint: "60 dk · yarın",
    link: {
      href: "https://meet.google.com/abc",
      label: "Google Meet",
      text: "meet.google.com/abc",
    },
    canJoin,
    isOver: false,
    messageHref: "/m/messages/mentorship/r1",
  };
}

function calendarState(overrides: Partial<Calendar> = {}): Calendar {
  return {
    agenda: [
      {
        key: "d24",
        heading: "Yarın · Perşembe 24 Eylül",
        isToday: false,
        entries: [MEETING!],
      },
    ],
    closeEntry: vi.fn(),
    detail: null,
    isError: false,
    isLoading: false,
    month: {
      isOpen: false,
      label: "Eylül 2026",
      cells: [
        {
          date: new Date(2026, 8, 24),
          inMonth: true,
          isToday: false,
          isSelected: false,
          kinds: [MobileAgendaKind.Meeting],
        },
      ],
      open: vi.fn(),
      close: vi.fn(),
      previous: vi.fn(),
      next: vi.fn(),
      pick,
      today: vi.fn(),
    },
    nextId: "meeting:m1",
    nextLabel: "Sıradaki · yarın",
    openEntry,
    retry: vi.fn(),
    selectDay,
    strip: [
      {
        date: new Date(2026, 8, 23),
        weekday: "Çar",
        dayNumber: 23,
        isToday: true,
        isSelected: true,
        isWeekend: false,
        kinds: [],
      },
      {
        date: new Date(2026, 8, 24),
        weekday: "Per",
        dayNumber: 24,
        isToday: false,
        isSelected: false,
        isWeekend: false,
        kinds: [MobileAgendaKind.Meeting],
      },
    ],
    title: "Eylül 2026",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  calendar = calendarState();
});

describe("MobileCalendarView", () => {
  it("shows the week and the agenda with the next item flagged", () => {
    render(<MobileCalendarView />);

    expect(
      screen.getByRole("button", { name: "Çar 23, bugün" }),
    ).toHaveAttribute("aria-pressed", "true");
    const day = screen.getByRole("region", {
      name: "Yarın · Perşembe 24 Eylül",
    });
    expect(within(day).getByText("Sıradaki · yarın")).toBeInTheDocument();
    expect(
      within(day).getByText("Nihan Öztürk ↔ Atlas AI · Online"),
    ).toBeInTheDocument();
  });

  it("selects a day and opens an entry", async () => {
    render(<MobileCalendarView />);

    await userEvent.click(screen.getByRole("button", { name: "Per 24" }));
    await userEvent.click(
      screen.getByRole("button", { name: /Ürün Stratejisi Görüşmesi/ }),
    );

    expect(selectDay).toHaveBeenCalledWith(new Date(2026, 8, 24));
    expect(openEntry).toHaveBeenCalledWith("meeting:m1");
  });

  it("keeps Toplantıya katıl disabled until ten minutes before", () => {
    calendar = calendarState({ detail: detail(false) });
    render(<MobileCalendarView />);

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByRole("button", { name: "Toplantıya katıl" }),
    ).toBeDisabled();
    expect(
      within(sheet).getByText("Bağlantı görüşmeden 10 dk önce aktif olur"),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByRole("link", { name: "Mesaj gönder" }),
    ).toHaveAttribute("href", "/m/messages/mentorship/r1");
  });

  it("opens the meeting link once joining is allowed", () => {
    calendar = calendarState({ detail: detail(true) });
    render(<MobileCalendarView />);

    expect(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: "Toplantıya katıl",
      }),
    ).toHaveAttribute("href", "https://meet.google.com/abc");
  });

  it("offers only the chat for a meeting that is over", () => {
    calendar = calendarState({ detail: { ...detail(false), isOver: true } });
    render(<MobileCalendarView />);

    const sheet = screen.getByRole("dialog");
    expect(within(sheet).queryByText("Toplantıya katıl")).toBeNull();
    expect(
      within(sheet).getByRole("link", { name: "Mesaj gönder" }),
    ).toBeInTheDocument();
  });

  it("picks a day in the month sheet", async () => {
    calendar = calendarState({
      month: { ...calendarState().month, isOpen: true },
    });
    render(<MobileCalendarView />);

    await userEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: /24/ }),
    );

    expect(pick).toHaveBeenCalledWith(new Date(2026, 8, 24));
  });

  it("says when the week is empty", () => {
    calendar = calendarState({ agenda: [] });
    render(<MobileCalendarView />);

    expect(
      screen.getByText("Bu hafta planlı bir şey yok."),
    ).toBeInTheDocument();
  });
});
