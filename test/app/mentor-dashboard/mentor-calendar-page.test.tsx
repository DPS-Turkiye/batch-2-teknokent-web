import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorCalendarPage from "@/app/mentor-dashboard/calendar/page";
import { useMentorCalendar } from "@/hooks/use-mentor-calendar";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { Weekday, type MentorAvailabilityRule } from "@/interfaces/mentor";
import { CalendarFilter } from "@/lib/calendar";
import { weeklyAvailabilityRows } from "@/lib/mentor-profile-overview";

vi.mock("@/components/reschedule-meeting-button", () => ({
  RescheduleMeetingButton: () => <button type="button">Yeni saat öner</button>,
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({
    userId: "mentor-1",
    fullName: "Leyla Aksoy",
    role: "MENTOR",
  }),
}));

vi.mock("@/lib/google-calendar", () => ({
  ensureGoogleCalendarToken: vi.fn(async () => ({ token: "ya29.test" })),
  createGoogleMeetEvent: vi.fn(
    async () => "https://meet.google.com/abc-defg-hij",
  ),
}));

vi.mock("@/components/mentor-dashboard/create-meeting-dialog", () => ({
  CreateMeetingDialog: () => <div data-testid="create-meeting-dialog" />,
}));

vi.mock("@/components/mentor-dashboard/regular-mentorship-week-checks", () => ({
  RegularMentorshipWeekChecksPanel: () => (
    <div data-testid="regular-week-checks" />
  ),
}));

vi.mock("@/hooks/use-mentor-calendar", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/hooks/use-mentor-calendar")>();
  return { ...actual, useMentorCalendar: vi.fn() };
});

const WEEK = [14, 15, 16, 17, 18].map((d) => new Date(`2026-09-${d}T00:00:00`));

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    organizationName: "Döngü",
    scheduledAt: "2026-09-14T14:00:00",
    durationMinutes: 45,
    agenda: "UX Research Review",
    status: MeetingStatus.Scheduled,
    meetLink: "https://meet.example/abc",
    ...overrides,
  };
}

const setFilter = vi.fn();
const nextWeek = vi.fn();
const previousWeek = vi.fn();
const thisWeek = vi.fn();
const removeMeeting = vi.fn().mockResolvedValue(undefined);

function mockCalendar(overrides: Record<string, unknown> = {}) {
  const value = {
    days: WEEK,
    meetings: [meeting()],
    slots: [
      {
        id: "slot-1",
        startsAt: "2026-09-15T11:00:00",
        durationMinutes: 60,
        booked: false,
      },
    ],
    rules: [
      {
        id: "rule-1",
        dayOfWeek: Weekday.Monday,
        startTime: "09:00:00",
        endTime: "12:00:00",
        slotMinutes: 60,
      },
    ],
    weekExceptionLabels: [],
    programs: [{ id: "p1", name: "METU Stars 2026" }],
    mentorships: [],
    regularMentorships: [],
    freeSlotCount: 3,
    filter: CalendarFilter.All,
    setFilter,
    isLoading: false,
    isSavingMeeting: false,
    meetingError: null,
    nextWeek,
    previousWeek,
    thisWeek,
    removeMeeting,
    addMeeting: vi.fn(),
    ...overrides,
  };
  const withRows = {
    ...value,
    availabilityRows: weeklyAvailabilityRows(
      value.rules as MentorAvailabilityRule[],
    ),
  };
  vi.mocked(useMentorCalendar).mockReturnValue(
    withRows as unknown as ReturnType<typeof useMentorCalendar>,
  );
  return withRows;
}

function grid() {
  return screen
    .getByRole("heading", { name: "14–18 Eylül" })
    .closest("section") as HTMLElement;
}

describe("MentorCalendarPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("summarises the week from real counts", () => {
    mockCalendar();
    render(<MentorCalendarPage />);

    expect(screen.getByRole("heading", { name: "Takvim" })).toBeInTheDocument();
    expect(
      screen.getByText("Bu hafta 1 görüşme · 1 program · 3 boş slot"),
    ).toBeInTheDocument();
  });

  it("labels the browsed week and its days", () => {
    mockCalendar();
    render(<MentorCalendarPage />);

    const week = grid();
    expect(within(week).getByText("Pzt")).toBeInTheDocument();
    expect(within(week).getByText("Cum")).toBeInTheDocument();
    expect(within(week).getByText("14")).toBeInTheDocument();
  });

  it("places a booked meeting in its hour cell", () => {
    mockCalendar();
    render(<MentorCalendarPage />);

    expect(
      within(grid()).getByRole("button", { name: /Döngü/ }),
    ).toBeInTheDocument();
  });

  it("shows an availability slot with its duration", () => {
    mockCalendar();
    render(<MentorCalendarPage />);

    const week = grid();
    expect(within(week).getByText("Müsait")).toBeInTheDocument();
    expect(within(week).getByText("60 dk")).toBeInTheDocument();
  });

  it("reports loading while the calendar queries run", () => {
    mockCalendar({ isLoading: true });
    render(<MentorCalendarPage />);

    expect(screen.getByText("Yükleniyor...")).toBeInTheDocument();
  });

  it("offers every calendar filter and forwards the choice", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    for (const name of ["Tümü", "Mentorluk", "Program", "Müsaitlik"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "Müsaitlik" }));
    expect(setFilter).toHaveBeenCalledWith(CalendarFilter.Availability);
  });

  it("lists the mentor's programmes under the Program filter", () => {
    mockCalendar({ filter: CalendarFilter.Program, meetings: [], slots: [] });
    render(<MentorCalendarPage />);

    expect(
      screen.getByText(/1 programa katılıyorsunuz: METU Stars 2026/),
    ).toBeInTheDocument();
  });

  it("browses between weeks", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    await user.click(screen.getByRole("button", { name: "Sonraki hafta" }));
    await user.click(screen.getByRole("button", { name: "Önceki hafta" }));
    await user.click(screen.getByRole("button", { name: "Bugün" }));

    expect(nextWeek).toHaveBeenCalled();
    expect(previousWeek).toHaveBeenCalled();
    expect(thisWeek).toHaveBeenCalled();
  });

  it("opens a meeting with its own detail", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    await user.click(within(grid()).getByRole("button", { name: /Döngü/ }));

    const dialog = screen.getByRole("dialog", { name: "UX Research Review" });
    expect(within(dialog).getByText("Döngü")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Toplantıya katıl" }),
    ).toHaveAttribute("href", "https://meet.example/abc");
  });

  it("says when a meeting has no notes yet", async () => {
    const user = userEvent.setup();
    mockCalendar({
      meetings: [meeting({ agenda: undefined, meetLink: undefined })],
    });
    render(<MentorCalendarPage />);

    await user.click(within(grid()).getByRole("button", { name: /Döngü/ }));

    expect(
      screen.getByText("Bu görüşme için henüz not eklenmedi."),
    ).toBeInTheDocument();
    expect(screen.getByText("Toplantı bağlantısı yok")).toBeInTheDocument();
  });

  it("deletes the opened meeting", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    await user.click(within(grid()).getByRole("button", { name: /Döngü/ }));
    await user.click(screen.getByRole("button", { name: "Görüşmeyi sil" }));

    expect(removeMeeting).toHaveBeenCalledWith("meeting-1");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the meeting detail", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    await user.click(within(grid()).getByRole("button", { name: /Döngü/ }));
    await user.click(screen.getByRole("button", { name: "Kapat" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists the recurring availability rules in Turkish without seconds", () => {
    mockCalendar();
    render(<MentorCalendarPage />);

    expect(screen.getByText("Pazartesi")).toBeInTheDocument();
    expect(screen.getByText("09:00–12:00")).toBeInTheDocument();
    expect(screen.queryByText("MONDAY")).not.toBeInTheDocument();
    expect(screen.getByText("3 boş slot")).toBeInTheDocument();
  });

  it("explains a week the mentor marked as unavailable", () => {
    mockCalendar({ weekExceptionLabels: ["14–18 Eylül · İzin"] });
    render(<MentorCalendarPage />);

    expect(screen.getByText("Bu hafta müsait değilsin")).toBeInTheDocument();
    expect(screen.getByText("14–18 Eylül · İzin")).toBeInTheDocument();
  });

  it("notes when no availability rule is defined", () => {
    mockCalendar({ rules: [] });
    render(<MentorCalendarPage />);

    expect(
      screen.getByText("Tanımlı bir uygunluk kuralı yok."),
    ).toBeInTheDocument();
  });

  it("lists the week's meetings in the side panel", () => {
    mockCalendar();
    render(<MentorCalendarPage />);

    const panel = screen
      .getByRole("heading", { name: "Sıradaki görüşmeler" })
      .closest("section") as HTMLElement;
    expect(
      within(panel).getByRole("button", { name: /UX Research Review/ }),
    ).toBeInTheDocument();
  });

  it("notes when the week has no meetings", () => {
    mockCalendar({ meetings: [] });
    render(<MentorCalendarPage />);

    expect(
      screen.getByText("Bu hafta planlanmış görüşme yok."),
    ).toBeInTheDocument();
  });

  it("opens the create-meeting dialog", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni toplantı oluştur" }),
    );

    expect(screen.getByTestId("create-meeting-dialog")).toBeInTheDocument();
  });

  it("opens the create-meeting dialog from a free availability slot", async () => {
    const user = userEvent.setup();
    mockCalendar();
    render(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", {
        name: /15 11:00 için toplantı oluştur/,
      }),
    );

    expect(screen.getByTestId("create-meeting-dialog")).toBeInTheDocument();
  });
});
