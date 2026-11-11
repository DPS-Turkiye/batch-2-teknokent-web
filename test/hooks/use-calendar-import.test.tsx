import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCalendarImport } from "@/hooks/use-calendar-import";
import { MeetingStatus } from "@/interfaces/meeting";
import { postMeeting } from "@/lib/client/meetings";
import {
  authenticateWithGoogle,
  fetchGoogleCalendarEvents,
  getGoogleClientId,
} from "@/lib/google-calendar";
import { menteeMeetingFixture } from "@test/fixtures/mentee-home";
import { queryWrapper } from "@test/fixtures/query-wrapper";

vi.mock("@/lib/google-calendar", () => ({
  authenticateWithGoogle: vi.fn(),
  fetchGoogleCalendarEvents: vi.fn(),
  getGoogleClientId: vi.fn(),
}));
vi.mock("@/lib/client/meetings", () => ({ postMeeting: vi.fn() }));

/** One event as fetchGoogleCalendarEvents turns it into a calendar meeting. */
function googleEvent(
  id: string,
  overrides: {
    durationMinutes?: number;
    agenda?: string;
    meetLink?: string | undefined;
  } = {},
) {
  return {
    id,
    organizationId: "google-oauth",
    scheduledAt: "2026-03-02T09:00:00.000Z",
    durationMinutes: 60,
    agenda: `Etkinlik ${id}`,
    notes: undefined,
    meetLink: "https://meet.google.com/a",
    status: MeetingStatus.GoogleCalendar,
    ...overrides,
  };
}

function icsFile(body: string) {
  return new File([body], "takvim.ics", { type: "text/calendar" });
}

const ICS = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "SUMMARY:Yatırımcı sunumu",
  "DTSTART:20260302T090000Z",
  "DTEND:20260302T100000Z",
  "LOCATION:https://meet.google.com/xyz",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

function renderImport() {
  return renderHook(() => useCalendarImport(), queryWrapper());
}

describe("useCalendarImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGoogleClientId).mockReturnValue("client-1");
    vi.mocked(authenticateWithGoogle).mockResolvedValue({ token: "ya29" });
    vi.mocked(postMeeting).mockResolvedValue(menteeMeetingFixture());
  });

  it("says Google is not configured instead of pretending to sync", async () => {
    vi.mocked(getGoogleClientId).mockReturnValue("");
    const { result } = renderImport();

    await act(() => result.current.syncWithGoogle());

    expect(result.current.error).toMatch(/yapılandırılmamış/);
    expect(authenticateWithGoogle).not.toHaveBeenCalled();
    expect(result.current.importing).toBe(false);
  });

  it("imports the Google events, saves each one and reports how many", async () => {
    vi.mocked(fetchGoogleCalendarEvents).mockResolvedValue([
      googleEvent("a"),
      googleEvent("b", { durationMinutes: 0, agenda: "", meetLink: undefined }),
    ]);
    const { result } = renderImport();

    await act(() => result.current.syncWithGoogle());

    expect(fetchGoogleCalendarEvents).toHaveBeenCalledWith("ya29");
    expect(result.current.importedMeetings.map(({ id }) => id)).toEqual([
      "a",
      "b",
    ]);
    expect(
      vi.mocked(postMeeting).mock.calls.map(([payload]) => payload),
    ).toEqual([
      {
        scheduledAt: "2026-03-02T09:00:00.000Z",
        durationMinutes: 60,
        agenda: "Etkinlik a",
        meetLink: "https://meet.google.com/a",
        status: "SCHEDULED",
      },
      {
        scheduledAt: "2026-03-02T09:00:00.000Z",
        durationMinutes: 45,
        agenda: "Google Takvim Etkinliği",
        meetLink: undefined,
        status: "SCHEDULED",
      },
    ]);
    expect(result.current.successMessage).toBe(
      "Google Takvim bağlandı, 2 etkinlik aktarıldı.",
    );
    expect(result.current.error).toBeNull();
  });

  it("keeps importing the rest when one event cannot be saved", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(fetchGoogleCalendarEvents).mockResolvedValue([
      googleEvent("a"),
      googleEvent("b"),
    ]);
    vi.mocked(postMeeting).mockRejectedValueOnce(new Error("409"));
    const { result } = renderImport();

    await act(() => result.current.syncWithGoogle());

    expect(postMeeting).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(result.current.successMessage).toMatch(/2 etkinlik/);
  });

  it("does not list an event twice when it is imported again", async () => {
    vi.mocked(fetchGoogleCalendarEvents).mockResolvedValue([googleEvent("a")]);
    const { result } = renderImport();

    await act(() => result.current.syncWithGoogle());
    vi.mocked(fetchGoogleCalendarEvents).mockResolvedValue([
      googleEvent("a", { agenda: "Güncel" }),
      googleEvent("b"),
    ]);
    await act(() => result.current.syncWithGoogle());

    expect(
      result.current.importedMeetings.map(({ id, agenda }) => [id, agenda]),
    ).toEqual([
      ["a", "Güncel"],
      ["b", "Etkinlik b"],
    ]);
  });

  it("shows Google's failure and clears an earlier success", async () => {
    vi.mocked(fetchGoogleCalendarEvents).mockResolvedValueOnce([]);
    const { result } = renderImport();
    await act(() => result.current.syncWithGoogle());
    expect(result.current.successMessage).not.toBeNull();

    vi.mocked(authenticateWithGoogle).mockRejectedValue(
      new Error("The Google sign-in window was closed."),
    );
    await act(() => result.current.syncWithGoogle());

    expect(result.current.successMessage).toBeNull();
    expect(result.current.error).toBe("The Google sign-in window was closed.");
    expect(result.current.importing).toBe(false);
  });

  it("falls back to its own wording when the Google failure is not an Error", async () => {
    vi.mocked(authenticateWithGoogle).mockRejectedValue("blocked");
    const { result } = renderImport();

    await act(() => result.current.syncWithGoogle());

    expect(result.current.error).toBe("Google Takvim ile bağlantı kurulamadı.");
  });

  it("imports the events of an .ics file", async () => {
    const { result } = renderImport();

    await act(() => result.current.importFile(icsFile(ICS)));

    expect(result.current.importedMeetings).toHaveLength(1);
    expect(result.current.importedMeetings[0]).toMatchObject({
      agenda: "Yatırımcı sunumu",
      scheduledAt: "2026-03-02T09:00:00.000Z",
      durationMinutes: 60,
    });
    expect(postMeeting).toHaveBeenCalledTimes(1);
    expect(result.current.successMessage).toBe("1 etkinlik içe aktarıldı.");
  });

  it("asks for a real export when the file holds no events", async () => {
    const { result } = renderImport();

    await act(() =>
      result.current.importFile(icsFile("BEGIN:VCALENDAR\nEND:VCALENDAR")),
    );

    expect(result.current.error).toMatch(/Geçerli bir etkinlik bulunamadı/);
    expect(result.current.importedMeetings).toEqual([]);
    expect(postMeeting).not.toHaveBeenCalled();
    expect(result.current.importing).toBe(false);
  });

  it("says the file could not be read when reading it fails", async () => {
    const unreadable = icsFile(ICS);
    vi.spyOn(unreadable, "text").mockRejectedValue(new Error("NotReadable"));
    const { result } = renderImport();

    await act(() => result.current.importFile(unreadable));

    expect(result.current.error).toBe("Dosya okunamadı.");
    expect(result.current.importing).toBe(false);
  });
});
