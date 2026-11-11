import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarView } from "@/components/calendar-view";
import { useMentorshipRequests } from "@/hooks/use-mentorship-requests";
import { ActionItemStatus } from "@/interfaces/action-item";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";
import { getActionItems } from "@/lib/client/action-items";
import { getStartupProcess } from "@/lib/client/startup-process";
import { menteeRequestFixture } from "@test/fixtures/mentee-home";
import { startupProcess } from "@test/fixtures/startup-process";
import { successQuery } from "@test/mocks/query-results";
import { renderWithQueryClient } from "@test/test-utils";

const mockUseMeetings = vi.fn();
const mockCreateMeeting = vi.fn();

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => mockUseMeetings(),
  useCreateMeeting: () => ({
    mutateAsync: mockCreateMeeting,
    isPending: false,
  }),
}));
vi.mock("@/hooks/use-mentorship-requests", () => ({
  useMentorshipRequests: vi.fn(),
}));
vi.mock("@/lib/client/action-items", () => {
  const getActionItems = vi.fn();
  return {
    getActionItems,
    // The hooks batch through getActionItemsForRequests; it answers from the per-request fixtures,
    // tagging each item with its request so the hooks can group them.
    getActionItemsForRequests: vi.fn(async (ids: string[]) =>
      (
        await Promise.all(
          ids.map(async (id) =>
            ((await getActionItems(id)) ?? []).map((item: object) => ({
              ...item,
              mentorshipRequestId: id,
            })),
          ),
        )
      ).flat(),
    ),
  };
});
vi.mock("@/lib/client/startup-process", () => ({ getStartupProcess: vi.fn() }));
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
  return {
    id: "meeting-1",
    organizationId: "org-1",
    mentorName: "Nihan Öztürk",
    mentorshipRequestId: "req-1",
    agenda: "Ürün konumlandırma kararları",
    scheduledAt: new Date(2026, 7, 28, 14, 0).toISOString(),
    durationMinutes: 45,
    meetLink: "https://meet.example.com/abc",
    status: MeetingStatus.Scheduled,
    ...overrides,
  };
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
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 7, 26, 9, 0));
  mockUseMeetings.mockReset();
  mockCreateMeeting.mockReset();
  vi.mocked(useMentorshipRequests).mockReturnValue(
    successQuery([
      menteeRequestFixture({
        id: "req-1",
        status: MentorshipRequestStatus.Accepted,
      }),
    ]),
  );
  vi.mocked(getActionItems).mockResolvedValue([]);
  vi.mocked(getStartupProcess).mockResolvedValue(startupProcess());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("CalendarView", () => {
  it("shows a loading placeholder instead of a grid while meetings load", () => {
    mockUseMeetings.mockReturnValue(meetingsResult({ isLoading: true }));

    renderWithQueryClient(<CalendarView />);

    expect(screen.getByText("Takvim yükleniyor…")).toBeInTheDocument();
  });

  it("surfaces the backend error message when the query fails", () => {
    mockUseMeetings.mockReturnValue(
      meetingsResult({ error: new Error("boom") }),
    );

    renderWithQueryClient(<CalendarView />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Takvim yüklenemedi: boom",
    );
  });

  it("summarises the week and offers to request a meeting", () => {
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));

    renderWithQueryClient(<CalendarView />);

    expect(screen.getByRole("heading", { name: "Takvim" })).toBeInTheDocument();
    expect(
      screen.getByText("Bu hafta 1 mentorluk görüşmesi · 0 teslim"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görüşme talep et" }),
    ).toHaveAttribute("href", "/mentor-request");
  });

  it("shows the four filters and an honest empty state for Program", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));

    renderWithQueryClient(<CalendarView />);
    for (const label of ["Tümü", "Mentorluk", "Program", "Teslim"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    await user.click(screen.getByRole("button", { name: "Program" }));

    expect(
      screen.getByText("Program etkinlikleri henüz tanımlı değil."),
    ).toBeInTheDocument();
  });

  it("puts a meeting on the Monday–Friday grid under its mentor's name and moves between weeks", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));

    renderWithQueryClient(<CalendarView />);
    const week = screen.getByRole("region", { name: "24–28 Ağustos 2026" });

    expect(
      within(week).getByRole("button", {
        name: "Ürün konumlandırma kararları detayını aç",
      }),
    ).toHaveTextContent("Nihan Öztürk");
    await user.click(screen.getByRole("button", { name: "Sonraki hafta" }));
    expect(
      screen.getByRole("heading", { name: /^31 Ağustos\s–\s4 Eylül 2026$/ }),
    ).toBeInTheDocument();
  });

  it("opens a meeting and offers Toplantıya hazırlan and sync actions", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));

    renderWithQueryClient(<CalendarView />);
    await user.click(
      screen.getByRole("button", {
        name: "Ürün konumlandırma kararları detayını aç",
      }),
    );

    expect(
      screen.getByRole("link", { name: /Toplantıya hazırlan/ }),
    ).toHaveAttribute("href", "/notes/meeting-1");
    expect(
      screen.getByRole("link", { name: /Google Takvime Ekle/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iCal \(\.ics\) İndir/ }),
    ).toBeInTheDocument();
  });

  it("opens the meeting's notes when nothing is waiting to be prepared", async () => {
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));
    vi.mocked(getActionItems).mockResolvedValue([]);

    renderWithQueryClient(<CalendarView />);

    const prep = await screen.findByRole("region", {
      name: "Hazırlık bekleyen",
    });
    expect(
      await within(prep).findByText(
        "Bu görüşme için bekleyen bir hazırlık yok.",
      ),
    ).toBeInTheDocument();
    expect(
      within(prep).getByRole("link", { name: "Toplantı notlarını aç" }),
    ).toHaveAttribute("href", "/notes/meeting-1");
  });

  it("shows what to prepare for the next meeting and what is coming up", async () => {
    mockUseMeetings.mockReturnValue(meetingsResult({ data: [meeting()] }));
    vi.mocked(getActionItems).mockResolvedValue([
      {
        id: "ai-1",
        organizationId: "org-1",
        ownerId: "u-1",
        title: "User Flow dosyasını yükle",
        status: ActionItemStatus.Open,
        dueDate: "2026-08-25",
        createdAt: "2026-08-20T09:00:00Z",
        updatedAt: "2026-08-20T09:00:00Z",
      },
    ]);

    renderWithQueryClient(<CalendarView />);

    const prep = await screen.findByRole("region", {
      name: "Hazırlık bekleyen",
    });
    await waitFor(() =>
      expect(
        within(prep).getByText("User Flow dosyasını yükle"),
      ).toBeInTheDocument(),
    );
    expect(
      within(prep).getByText("28 Ağustos Cuma · Nihan Öztürk görüşmesi"),
    ).toBeInTheDocument();
    expect(within(prep).getByText("Gecikti")).toBeInTheDocument();
    expect(
      within(prep).getByRole("link", { name: "Hazırlığı tamamla" }),
    ).toHaveAttribute("href", "/notes/meeting-1");

    const upcoming = screen.getByRole("region", {
      name: "Sıradaki etkinlikler",
    });
    expect(within(upcoming).getByText("Cum 28 · 14:00")).toBeInTheDocument();
  });

  it("says the Google integration is not configured rather than faking a sync", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult());

    renderWithQueryClient(<CalendarView />);
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

    renderWithQueryClient(<CalendarView />);
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
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("No file input");
    await user.upload(input, file);

    await waitFor(() => expect(mockCreateMeeting).toHaveBeenCalledTimes(1));
    expect(mockCreateMeeting).toHaveBeenCalledWith(
      expect.objectContaining({ agenda: "Dış Toplantı" }),
    );
  });

  it("does not turn a meeting link that is not a web address into a link", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(
      meetingsResult({ data: [meeting({ meetLink: "javascript:alert(1)" })] }),
    );

    renderWithQueryClient(<CalendarView />);
    await user.click(
      screen.getByRole("button", {
        name: "Ürün konumlandırma kararları detayını aç",
      }),
    );

    expect(screen.queryByText("javascript:alert(1)")).not.toBeInTheDocument();
    expect(
      screen.getByText("Bu toplantı için henüz bir görüşme bağlantısı yok."),
    ).toBeInTheDocument();
  });
});
