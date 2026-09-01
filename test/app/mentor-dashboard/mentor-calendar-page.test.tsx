import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorCalendarPage from "@/app/mentor-dashboard/calendar/page";
import { CalendarFilter, useMentorCalendar } from "@/hooks/use-mentor-calendar";
import { Weekday } from "@/interfaces/mentor";

vi.mock("@/components/providers/session-provider", () => ({
  useSession: () => ({ session: { fullName: "Nihan Öztürk" } }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-mentor-calendar", async () => {
  const actual = await vi.importActual<
    typeof import("@/hooks/use-mentor-calendar")
  >("@/hooks/use-mentor-calendar");
  return { ...actual, useMentorCalendar: vi.fn() };
});

const addRule = vi.fn();
const addMeeting = vi.fn();
const removeRule = vi.fn();
const setFilter = vi.fn();
const nextWeek = vi.fn();

const monday = new Date("2026-08-24T00:00:00");

function mock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useMentorCalendar).mockReturnValue({
    addMeeting,
    addRule,
    isSavingMeeting: false,
    meetingError: null,
    mentorships: [
      {
        id: "req-1",
        organizationName: "Döngü",
        supportArea: "UX/UI Mentorluk",
      },
    ],
    days: Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    }),
    filter: CalendarFilter.All,
    freeSlotCount: 2,
    isLoading: false,
    isSavingRule: false,
    meetings: [],
    nextWeek,
    previousWeek: vi.fn(),
    removeRule,
    ruleError: null,
    rules: [],
    setFilter,
    slots: [],
    thisWeek: vi.fn(),
    weekStart: monday,
    ...overrides,
  } as unknown as ReturnType<typeof useMentorCalendar>);
}

beforeEach(() => vi.clearAllMocks());

describe("MentorCalendarPage", () => {
  it("shows the week range and the three filters", () => {
    mock();
    render(<MentorCalendarPage />);

    expect(screen.getByText("24–28 Ağustos")).toBeInTheDocument();
    for (const label of ["Tümü", "Mentorluk", "Program"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("renders recurring availability and this week's capacity", () => {
    mock({
      rules: [
        {
          id: "r1",
          dayOfWeek: Weekday.Tuesday,
          startTime: "14:00:00",
          endTime: "17:00:00",
          slotMinutes: 60,
        },
      ],
      freeSlotCount: 3,
    });
    render(<MentorCalendarPage />);

    expect(screen.getByText("Salı")).toBeInTheDocument();
    expect(screen.getByText("14:00–17:00")).toBeInTheDocument();
    expect(screen.getByText("3 boş slot")).toBeInTheDocument();
  });

  it("places a meeting in its hour cell", () => {
    const at = new Date(monday);
    at.setDate(at.getDate() + 2);
    at.setHours(11, 0, 0, 0);
    mock({
      meetings: [
        {
          id: "m1",
          scheduledAt: at.toISOString(),
          durationMinutes: 60,
          agenda: "UX/UI Mentorluk",
          status: "SCHEDULED",
          organizationId: "o1",
        },
      ],
    });
    render(<MentorCalendarPage />);

    expect(screen.getByText("UX/UI Mentorluk")).toBeInTheDocument();
  });

  it("says the Program tab has nothing in it yet", () => {
    mock({ filter: CalendarFilter.Program });
    render(<MentorCalendarPage />);

    expect(
      screen.getByText("Program etkinlikleri henüz tanımlı değil."),
    ).toBeInTheDocument();
  });

  it("creates a recurring availability rule", async () => {
    addRule.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(screen.getByRole("button", { name: "Düzenle" }));
    await user.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(addRule).toHaveBeenCalledWith({
      dayOfWeek: Weekday.Tuesday,
      startTime: "14:00",
      endTime: "17:00",
      slotMinutes: 60,
    });
  });

  it("removes a rule", async () => {
    mock({
      rules: [
        {
          id: "r1",
          dayOfWeek: Weekday.Friday,
          startTime: "15:00:00",
          endTime: "18:00:00",
          slotMinutes: 60,
        },
      ],
    });
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(screen.getByRole("button", { name: "Kaldır" }));

    expect(removeRule).toHaveBeenCalledWith("r1");
  });

  it("opens the meeting dialog from the Yeni Toplantı Oluştur button", async () => {
    mock();
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Start up seç")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Mentor: Nihan Öztürk"),
    ).toBeInTheDocument();
  });

  it("opens the dialog prefilled when an empty slot is clicked", async () => {
    mock();
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("creates the meeting against the chosen mentorship", async () => {
    addMeeting.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Toplantıyı oluştur" }),
    );

    expect(addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorshipRequestId: "req-1",
        durationMinutes: 60,
        agenda: "Mentor: Nihan Öztürk",
      }),
    );
  });

  it("explains that a meeting needs an accepted mentorship first", async () => {
    mock({ mentorships: [] });
    const user = userEvent.setup();
    render(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );

    expect(
      screen.getByText(/önce bir mentorluk talebini kabul etmeniz/),
    ).toBeInTheDocument();
  });
});
