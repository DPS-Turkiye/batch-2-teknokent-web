import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CalendarView } from "@/components/calendar-view";
import type { MeetingItem } from "@/interfaces/meeting";

const mockUseMeetings = vi.fn();

vi.mock("@/hooks/use-meetings", () => ({
  useMeetings: () => mockUseMeetings(),
  useCreateMeeting: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/lib/google-calendar", () => ({
  authenticateWithGoogle: vi.fn(),
  fetchGoogleCalendarEvents: vi.fn(),
}));

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    agenda: "Finansal model görüşmesi",
    scheduledAt: new Date().toISOString(),
    durationMinutes: 45,
    meetLink: "https://meet.example.com/abc",
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
});

describe("CalendarView", () => {
  it("shows a loading placeholder instead of a grid while meetings load", () => {
    mockUseMeetings.mockReturnValue(meetingsResult({ isLoading: true }));

    render(<CalendarView />);

    expect(screen.getByText("Takvim yükleniyor...")).toBeInTheDocument();
  });

  it("surfaces the backend error message when the query fails", () => {
    mockUseMeetings.mockReturnValue(
      meetingsResult({ error: new Error("boom") }),
    );

    render(<CalendarView />);

    expect(
      screen.getByText(/Takvim verileri yüklenemedi: boom/),
    ).toBeInTheDocument();
  });

  it("offers all three calendar modes and starts on the month grid", () => {
    mockUseMeetings.mockReturnValue(meetingsResult());

    render(<CalendarView />);

    const monthButton = screen.getByRole("button", { name: "Aylık Grid" });
    expect(monthButton).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Haftalık" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajanda / Liste" }),
    ).toBeInTheDocument();

    // month is the default selection
    expect(monthButton.className).toContain("bg-white");
  });

  it("switches to the weekly programme when Haftalık is chosen", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(meetingsResult());

    render(<CalendarView />);
    await user.click(screen.getByRole("button", { name: "Haftalık" }));

    expect(
      screen.getByText("Bu Haftanın Görüşme Programı"),
    ).toBeInTheDocument();
  });

  it("lists scheduled meetings in the agenda view", async () => {
    const user = userEvent.setup();
    mockUseMeetings.mockReturnValue(
      meetingsResult({ data: [meeting({ agenda: "Pazarlama görüşmesi" })] }),
    );

    render(<CalendarView />);
    await user.click(screen.getByRole("button", { name: "Ajanda / Liste" }));

    expect(screen.getAllByText(/Pazarlama görüşmesi/).length).toBeGreaterThan(
      0,
    );
  });
});
