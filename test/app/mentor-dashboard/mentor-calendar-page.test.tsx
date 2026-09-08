import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MentorCalendarPage from "@/app/mentor-dashboard/calendar/page";
import { CalendarFilter, useMentorCalendar } from "@/hooks/use-mentor-calendar";
import { Weekday } from "@/interfaces/mentor";
import {
  createGoogleMeetEvent,
  ensureGoogleCalendarToken,
} from "@/lib/google-calendar";
import { renderWithQueryClient } from "@test/test-utils";

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

vi.mock("@/lib/client/meetings", () => ({
  getMeetingRoom: vi.fn(async () => []),
}));

vi.mock("@/lib/google-calendar", async () => {
  const actual = await vi.importActual<typeof import("@/lib/google-calendar")>(
    "@/lib/google-calendar",
  );
  return {
    ...actual,
    relayGoogleOAuthTokenFromUrl: vi.fn(() => false),
    ensureGoogleCalendarToken: vi.fn(),
    createGoogleMeetEvent: vi.fn(),
  };
});

const addRule = vi.fn();
const addMeeting = vi.fn();
const inviteGuest = vi.fn();
const removeMeeting = vi.fn();
const removeRule = vi.fn();
const setFilter = vi.fn();
const nextWeek = vi.fn();

const monday = new Date("2026-08-24T00:00:00");

/** A free slot two days out, so the "next 7 days" strip has something to show. */
const upcomingSlotStart = new Date("2026-08-26T10:00:00");

function mock(overrides: Record<string, unknown> = {}) {
  vi.mocked(useMentorCalendar).mockReturnValue({
    addMeeting,
    inviteGuest,
    removeMeeting,
    addRule,
    isSavingMeeting: false,
    meetingError: null,
    programs: [],
    upcomingSlots: [
      {
        id: "slot-1",
        startsAt: upcomingSlotStart.toISOString(),
        durationMinutes: 45,
        booked: false,
      },
    ],
    mentorships: [
      {
        id: "req-1",
        organizationId: "org-1",
        organizationName: "Döngü",
        requesterName: "Gülse",
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(ensureGoogleCalendarToken).mockResolvedValue({
    token: "ya29.test",
  });
  vi.mocked(createGoogleMeetEvent).mockResolvedValue(
    "https://meet.google.com/abc-defg-hij",
  );
});

describe("MentorCalendarPage", () => {
  it("shows the week range and the three filters", () => {
    mock();
    renderWithQueryClient(<MentorCalendarPage />);

    expect(screen.getByText("24–28 Ağustos")).toBeInTheDocument();
    for (const label of ["Tümü", "Mentorluk", "Program"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("lets the calendar grid shrink to the mobile viewport", () => {
    mock();
    renderWithQueryClient(<MentorCalendarPage />);

    expect(screen.getByRole("table").closest("section")).toHaveClass("min-w-0");
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
    renderWithQueryClient(<MentorCalendarPage />);

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
    renderWithQueryClient(<MentorCalendarPage />);

    expect(screen.getByText("UX/UI Mentorluk")).toBeInTheDocument();
  });

  it("opens a booked meeting and offers its Meet link", async () => {
    const at = new Date(monday);
    at.setDate(at.getDate() + 2);
    at.setHours(11, 0, 0, 0);
    mock({
      meetings: [
        {
          id: "m1",
          scheduledAt: at.toISOString(),
          durationMinutes: 60,
          agenda: "Mentor: Nihan Öztürk",
          meetLink: "https://meet.google.com/abc-defg-hij",
          status: "SCHEDULED",
          organizationId: "org-1",
          organizationName: "Döngü",
          mentorName: "Nihan Öztürk",
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(screen.getByRole("button", { name: /Döngü detayını aç/ }));

    expect(screen.getByText("Katılımcılar")).toBeInTheDocument();
    expect(screen.getByText("Startup")).toBeInTheDocument();
    expect(screen.getAllByText("Döngü").length).toBeGreaterThan(0);
    expect(screen.getByText("Mentee")).toBeInTheDocument();
    expect(screen.getByText("Gülse")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Google Meet’e katıl/ }),
    ).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
    expect(
      screen.getByRole("link", {
        name: "https://meet.google.com/abc-defg-hij",
      }),
    ).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
  });

  it("lets the mentor delete the opened meeting", async () => {
    const at = new Date(monday);
    at.setDate(at.getDate() + 2);
    at.setHours(11, 0, 0, 0);
    removeMeeting.mockResolvedValue(undefined);
    mock({
      meetings: [
        {
          id: "m1",
          scheduledAt: at.toISOString(),
          durationMinutes: 60,
          agenda: "Mentor: Nihan Öztürk",
          meetLink: "https://meet.google.com/abc-defg-hij",
          status: "SCHEDULED",
          organizationId: "org-1",
          organizationName: "Döngü",
        },
      ],
    });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(screen.getByRole("button", { name: /Döngü detayını aç/ }));
    await user.click(screen.getByRole("button", { name: "Toplantıyı sil" }));

    expect(removeMeeting).toHaveBeenCalledWith("m1");
  });

  it("says a booked meeting has no link yet when none was saved", async () => {
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
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /UX\/UI Mentorluk detayını aç/ }),
    );

    expect(
      screen.getByText(/henüz bir görüşme bağlantısı yok/),
    ).toBeInTheDocument();
  });

  it("says the Program tab has nothing in it yet", () => {
    mock({ filter: CalendarFilter.Program });
    renderWithQueryClient(<MentorCalendarPage />);

    expect(
      screen.getByText("Program etkinlikleri henüz tanımlı değil."),
    ).toBeInTheDocument();
  });

  it("creates a recurring availability rule", async () => {
    addRule.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

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
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(screen.getByRole("button", { name: "Kaldır" }));

    expect(removeRule).toHaveBeenCalledWith("r1");
  });

  it("asks for a date when the dialog is opened without a slot", async () => {
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Start up seç")).toBeInTheDocument();
    expect(screen.getByText("Tarih Seç")).toBeInTheDocument();
    expect(screen.getByText("Önümüzdeki 7 gün")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "10:00" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByDisplayValue("Mentor: Nihan Öztürk"),
    ).toBeInTheDocument();
  });

  it("skips the date picker when an empty calendar cell is clicked", async () => {
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Start up seç")).toBeInTheDocument();
    expect(screen.queryByText("Tarih Seç")).not.toBeInTheDocument();
  });

  it("creates the meeting at the clicked cell", async () => {
    addMeeting.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    const clicked = new Date(monday);
    clicked.setDate(clicked.getDate() + 1);
    clicked.setHours(11, 0, 0, 0);
    expect(addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorshipRequestId: "req-1",
        scheduledAt: clicked.toISOString(),
        durationMinutes: 60,
        agenda: "Mentor: Nihan Öztürk",
        meetLink: "https://meet.google.com/abc-defg-hij",
        transcribeRequested: false,
      }),
    );
  });

  it("sends a transcript bot when the mentor checks the box", async () => {
    addMeeting.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );

    expect(
      screen.getByRole("checkbox", {
        name: /Toplantının transkriptinin çıkarılmasını istiyorum/,
      }),
    ).not.toBeChecked();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: /Toplantının transkriptinin çıkarılmasını istiyorum/,
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /toplantı raporunu ve transkripti menteelerinize gönderebilirsiniz/i,
    );

    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        transcribeRequested: true,
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
    );
  });

  it("creates the meeting at a picked hour from the next days", async () => {
    addMeeting.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );
    await user.click(screen.getAllByRole("button", { name: "10:00" })[0]);
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        mentorshipRequestId: "req-1",
        durationMinutes: 60,
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
    );
    const scheduledAt = new Date(addMeeting.mock.calls[0][0].scheduledAt);
    expect(scheduledAt.getHours()).toBe(10);
  });

  it("does not save the meeting when Google Meet cannot be created", async () => {
    vi.mocked(createGoogleMeetEvent).mockRejectedValue(
      new Error("Google Meet oluşturulamadı."),
    );
    addMeeting.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Otomatik Google Meet oluşturulamadı/,
    );
    expect(addMeeting).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Google Meet linki")).toBeInTheDocument();
  });

  it("saves a pasted Meet link after automatic creation fails", async () => {
    vi.mocked(createGoogleMeetEvent).mockRejectedValue(
      new Error("Google Meet oluşturulamadı."),
    );
    addMeeting.mockResolvedValue(undefined);
    mock();
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));
    await screen.findByLabelText("Google Meet linki");
    await user.type(
      screen.getByLabelText("Google Meet linki"),
      "https://meet.google.com/aaa-bbbb-ccc",
    );
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({
        meetLink: "https://meet.google.com/aaa-bbbb-ccc",
      }),
    );
    expect(createGoogleMeetEvent).toHaveBeenCalledTimes(1);
  });

  it("groups a startup under its program", async () => {
    mock({
      programs: [
        {
          id: "prog-1",
          name: "Metu Stars",
          startups: [{ id: "org-1", name: "Döngü" }],
          mentors: [],
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );

    expect(
      screen.getByRole("button", { name: "Metu Stars" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Döngü · Gülse")).toBeInTheDocument();
  });

  it("lets a program mentor invite every startup in a selected program", async () => {
    addMeeting.mockResolvedValue(undefined);
    mock({
      mentorships: [],
      programs: [
        {
          id: "prog-1",
          name: "Metu Stars",
          startups: [
            { id: "org-9", name: "NovaMed" },
            { id: "org-8", name: "GreenLoop" },
          ],
          mentors: [],
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );

    expect(screen.getByText("NovaMed")).toBeInTheDocument();
    expect(screen.getByText("GreenLoop")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(createGoogleMeetEvent).toHaveBeenCalledTimes(1);
    expect(addMeeting).toHaveBeenCalledTimes(2);
    expect(addMeeting).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        programId: "prog-1",
        organizationId: "org-9",
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
    );
    expect(addMeeting).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        programId: "prog-1",
        organizationId: "org-8",
        meetLink: "https://meet.google.com/abc-defg-hij",
      }),
    );
  });

  it("lets the mentor drop a startup from a selected program", async () => {
    addMeeting.mockResolvedValue(undefined);
    mock({
      mentorships: [],
      programs: [
        {
          id: "prog-1",
          name: "Metu Stars",
          startups: [
            { id: "org-9", name: "NovaMed" },
            { id: "org-8", name: "GreenLoop" },
          ],
          mentors: [],
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: /25 11:00 için toplantı oluştur/ }),
    );
    await user.click(screen.getByText("GreenLoop"));
    await user.click(screen.getByRole("button", { name: "Gönder" }));

    expect(addMeeting).toHaveBeenCalledTimes(1);
    expect(addMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-9" }),
    );
  });

  it("explains that a meeting needs a mentorship or program startup first", async () => {
    mock({ mentorships: [] });
    const user = userEvent.setup();
    renderWithQueryClient(<MentorCalendarPage />);

    await user.click(
      screen.getByRole("button", { name: "Yeni Toplantı Oluştur" }),
    );

    expect(
      screen.getByText(/katıldığınız programdaki bir startup gerekir/),
    ).toBeInTheDocument();
  });
});
