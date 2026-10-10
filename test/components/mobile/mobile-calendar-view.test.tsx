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
    mentor: null,
  };
}

const MENTOR_ENTRY = {
  ...MEETING!,
  title: "Atlas AI",
  detail: "Ürün stratejisi · Gamze Kozak · Online",
  startup: { name: "Atlas AI", initials: "AA" },
};

function mentorDetail(): NonNullable<Calendar["detail"]> {
  return {
    ...detail(true),
    entry: MENTOR_ENTRY,
    mentor: {
      title: "Atlas AI · Ürün stratejisi",
      startsIn: "5 dk sonra",
      timeLine: "Bugün · 14:00–15:00",
      timeHint: "60 dk",
      startup: {
        name: "Atlas AI",
        initials: "AA",
        people: "Gamze Kozak (yetkili) + 2 üye",
      },
      self: { name: "Nihan Öztürk", initials: "NÖ" },
      topic: {
        title: "Ürün stratejisi · 4. görüşme",
        agenda: "Gündem: değer önerisi",
      },
    },
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
    isMentor: false,
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

  it("shows mentors the startup on each card", () => {
    calendar = calendarState({
      isMentor: true,
      agenda: [
        {
          key: "d24",
          heading: "Bugün · Perşembe 24 Eylül",
          isToday: true,
          entries: [MENTOR_ENTRY],
        },
      ],
    });
    render(<MobileCalendarView />);

    const card = screen.getByRole("button", { name: /Atlas AI/ });
    expect(within(card).getByText("AA")).toBeInTheDocument();
    expect(
      within(card).getByText("Ürün stratejisi · Gamze Kozak · Online"),
    ).toBeInTheDocument();
    expect(within(card).getByText("Sıradaki · yarın")).toHaveClass(
      "text-[#1583d6]",
    );
  });

  it("tags a time waiting for the mentor's approval and offers only the chat", () => {
    const pending = {
      ...MENTOR_ENTRY,
      id: "request:r2:2026-09-26T08:00:00.000Z",
      title: "Lumen",
      detail: "Finansal model · önerilen saat · onay bekliyor",
      startup: { name: "Lumen", initials: "L" },
      meeting: null,
      awaitingApproval: true,
      requestId: "r2",
    };
    calendar = calendarState({
      isMentor: true,
      nextId: null,
      agenda: [
        {
          key: "d26",
          heading: "Cumartesi 26 Eylül",
          isToday: false,
          entries: [pending],
        },
      ],
      detail: {
        ...detail(false),
        entry: pending,
        kindLabel: "Onay bekliyor",
        link: null,
        messageHref: "/m/messages/mentorship/r2",
      },
    });
    render(<MobileCalendarView />);

    const card = screen.getByRole("button", { name: /Lumen/ });
    expect(within(card).getByText("Onay bekliyor")).toHaveClass(
      "text-[#b7791f]",
    );
    const sheet = screen.getByRole("dialog");
    expect(within(sheet).queryByText("Toplantıya katıl")).toBeNull();
    expect(
      within(sheet).getByRole("link", { name: "Mesaj gönder" }),
    ).toHaveAttribute("href", "/m/messages/mentorship/r2");
  });

  it("gives mentors the startup, themselves and the topic in the sheet", () => {
    calendar = calendarState({ isMentor: true, detail: mentorDetail() });
    render(<MobileCalendarView />);

    const sheet = screen.getByRole("dialog");
    expect(
      within(sheet).getByRole("heading", {
        name: "Atlas AI · Ürün stratejisi",
      }),
    ).toBeInTheDocument();
    expect(within(sheet).getByText("5 dk sonra")).toBeInTheDocument();
    expect(within(sheet).getByText("Bugün · 14:00–15:00")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Gamze Kozak (yetkili) + 2 üye"),
    ).toBeInTheDocument();
    expect(within(sheet).getByText("Sen · Mentor")).toBeInTheDocument();
    expect(
      within(sheet).getByText("Ürün stratejisi · 4. görüşme"),
    ).toBeInTheDocument();
    expect(
      within(sheet).getByRole("link", { name: "Toplantıya katıl" }),
    ).toHaveAttribute("href", "https://meet.google.com/abc");
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
