import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarView } from "@/components/calendar-view";
import type { MeetingItem } from "@/interfaces/meeting";

const mockUseMeetings = vi.fn();
const mockCreateMeeting = vi.fn();

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => mockUseMeetings(),
  useCreateMeeting: () => ({
    mutateAsync: mockCreateMeeting,
    isPending: false,
  }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/google-calendar", () => ({
  authenticateWithGoogle: vi.fn(),
  fetchGoogleCalendarEvents: vi.fn(),
  relayGoogleOAuthTokenFromUrl: vi.fn(() => false),
  getGoogleClientId: vi.fn(() => ""),
}));

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  const scheduledAt = new Date();
  scheduledAt.setHours(11, 0, 0, 0);
  return {
    id: "meeting-1",
    organizationId: "org-1",
    agenda: "Finansal model görüşmesi",
    scheduledAt: scheduledAt.toISOString(),
    durationMinutes: 45,
    meetLink: "https://meet.example.com/abc",
    status: "SCHEDULED",
    ...overrides,
  } as MeetingItem;
}

function meetingsResult(overrides: Record<string, unknown> = {}) {
  return {
    data: [] as MeetingItem[],
    isLoading: false,
    error: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockUseMeetings.mockReset();
  mockCreateMeeting.mockReset();
});

describe("CalendarView", () => {
  it("shows a loading placeholder instead of a grid while meetings load", () => {
    mockUseMeetings.mockReturnValue(meetingsResult({ isLoading: true }));

    render(<CalendarView />);

    expect(screen.getByText("Takvim yükleniyor…")).toBeInTheDocument();
  });

  it("surfaces the backend error message when the query fails", () => {
    mockUseMeetings.mockReturnValue(
      meetingsResult({ error: new Error("boom") }),
    );

    render(<CalendarView />);

    expect(screen.getByText(/Takvim yüklenemedi: boom/)).toBeInTheDocument();
  });

  it("offers Hafta and Ay, starting on Hafta", () => {
    mockUseMeetings.mockReturnValue(meetingsResult());

    render(<CalendarView />);

    const weekButton = screen.getByRole("button", { name: "Hafta" });
    expect(weekButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Ay" })).toBeInTheDocument();
    // Dropped per the 09-03 decision: only Ajanda goes, Ay stays.
    expect(
      screen.queryByRole("button", { name: /Ajanda/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the three filters, matching the mentor calendar", () => {
    mockUseMeetings.mockReturnValue(meetingsResult());

    render(<CalendarView />);

    for (const label of ["Tümü", "Mentorluk", "Program"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("says the Program tab has nothing in it yet, mirroring the mentor calendar", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));

    render(<CalendarView />);
    await user.click(screen.getByRole("button", { name: "Program" }));

    expect(
      screen.getByText("Program etkinlikleri henüz tanımlı değil."),
    ).toBeInTheDocument();
  });

  it("places a meeting in its hour cell on the week grid", () => {
    mockUseMeetings.mockReturnValue(
      meetingsResult({ data: [meeting({ agenda: "Pazarlama görüşmesi" })] }),
    );

    render(<CalendarView />);

    expect(screen.getByText("Pazarlama görüşmesi")).toBeInTheDocument();
  });

  it("switches to the month grid when Ay is chosen", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(
      meetingsResult({ data: [meeting({ agenda: "Pazarlama görüşmesi" })] }),
    );

    render(<CalendarView />);
    await user.click(screen.getByRole("button", { name: "Ay" }));

    expect(
      screen.getByRole("button", { name: /Pazarlama görüşmesi detayını aç/ }),
    ).toBeInTheDocument();
  });

  it("opens a meeting and offers Toplantıya hazırlan and sync actions", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(
      meetingsResult({ data: [meeting({ agenda: "Pazarlama görüşmesi" })] }),
    );

    render(<CalendarView />);
    await user.click(
      screen.getByRole("button", { name: /Pazarlama görüşmesi detayını aç/ }),
    );

    expect(
      screen.getByRole("link", { name: /Toplantıya hazırlan/ }),
    ).toHaveAttribute("href", "/meetings/research/prepare");
    expect(
      screen.getByRole("link", { name: /Google Takvime Ekle/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iCal \(\.ics\) İndir/ }),
    ).toBeInTheDocument();
  });

  it("says the Google integration is not configured rather than faking a sync", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult());

    render(<CalendarView />);
    await user.click(
      screen.getByRole("button", { name: "Google Takvimden Aktar" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "Google ile Oturum Aç ve Takvimimi Aktar",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /yapılandırılmamış/,
    );
    expect(mockCreateMeeting).not.toHaveBeenCalled();
  });

  it("imports a valid .ics file and persists each event", async () => {
    mockUseMeetings.mockReturnValue(meetingsResult());
    mockCreateMeeting.mockResolvedValue(meeting());
    const user = userEvent.setup();

    render(<CalendarView />);
    await user.click(
      screen.getByRole("button", { name: "Google Takvimden Aktar" }),
    );

    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "SUMMARY:Dış Toplantı",
      "DTSTART:20260910T090000Z",
      "DTEND:20260910T093000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const file = new File([ics], "export.ics", { type: "text/calendar" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => expect(mockCreateMeeting).toHaveBeenCalledTimes(1));
    expect(mockCreateMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ agenda: "Dış Toplantı" }),
    );
  });
});
