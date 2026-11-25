import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Toaster } from "@/components/common/toaster";
import { MeetingBotButton } from "@/components/meeting-bot-button";
import { MeetingStatus, type MeetingItem } from "@/interfaces/meeting";
import { MeetingBotState } from "@/interfaces/meeting-bot";
import { addMeetingBot, fetchMeetingBotStatus } from "@/lib/assistant";
import { updateMeeting } from "@/lib/client/meetings";
import { createTestQueryClient, InLocale } from "@test/test-utils";

vi.mock("@/lib/assistant", () => ({
  addMeetingBot: vi.fn(),
  fetchMeetingBotStatus: vi.fn(),
}));
vi.mock("@/lib/client/meetings", () => ({ updateMeeting: vi.fn() }));

const LINK = "https://meet.google.com/abc-defg-hij";
const ADD = "Kayıt botu ekle";

function meeting(overrides: Partial<MeetingItem> = {}): MeetingItem {
  return {
    id: "meeting-1",
    organizationId: "org-1",
    scheduledAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    durationMinutes: 45,
    status: MeetingStatus.Scheduled,
    meetLink: LINK,
    ...overrides,
  };
}

function renderButton(item: MeetingItem) {
  return render(
    <InLocale locale="tr">
      <QueryClientProvider client={createTestQueryClient()}>
        <MeetingBotButton meeting={item} className="" noticeClassName="" />
        <Toaster />
      </QueryClientProvider>
    </InLocale>,
  );
}

function botIs(state: MeetingBotState) {
  vi.mocked(fetchMeetingBotStatus).mockResolvedValue({
    platform: "google_meet",
    nativeMeetingId: "abc-defg-hij",
    state,
    endReason: null,
    requestedAt: null,
  });
}

describe("MeetingBotButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(addMeetingBot).mockResolvedValue({
      platform: "google_meet",
      nativeMeetingId: "abc-defg-hij",
      status: "joining",
      title: "",
    });
    vi.mocked(updateMeeting).mockResolvedValue(
      meeting({ transcribeRequested: true }),
    );
    botIs(MeetingBotState.Joining);
  });

  afterEach(() => vi.restoreAllMocks());

  it("sends the bot, marks the meeting as recorded but never as already sent, and shows how it goes", async () => {
    renderButton(meeting());

    await userEvent.click(screen.getByRole("button", { name: ADD }));

    expect(addMeetingBot).toHaveBeenCalledWith(LINK);
    expect(updateMeeting).toHaveBeenCalledWith("meeting-1", {
      transcribeRequested: true,
    });
    expect(
      await screen.findByText("Kayıt botu toplantıya bağlanıyor…"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADD })).toBeDisabled();
  });

  it("changes nothing on a meeting that is already recorded", async () => {
    renderButton(meeting({ transcribeRequested: true }));

    await userEvent.click(screen.getByRole("button", { name: ADD }));

    await waitFor(() => expect(addMeetingBot).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText("Kayıt botu görüşmeye gönderildi."),
    ).toBeInTheDocument();
    expect(updateMeeting).not.toHaveBeenCalled();
  });

  it("says why the bot could not be sent and records nothing", async () => {
    vi.mocked(addMeetingBot).mockRejectedValue(
      new Error("Tüm kayıt yerleri dolu."),
    );
    renderButton(meeting());

    await userEvent.click(screen.getByRole("button", { name: ADD }));

    expect(
      await screen.findByText("Tüm kayıt yerleri dolu."),
    ).toBeInTheDocument();
    expect(updateMeeting).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: ADD })).toBeEnabled();
  });

  it("still counts the bot as sent when the recording mark is refused", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(updateMeeting).mockRejectedValue(new Error("Dolu."));
    renderButton(meeting());

    await userEvent.click(screen.getByRole("button", { name: ADD }));

    expect(
      await screen.findByText("Kayıt botu görüşmeye gönderildi."),
    ).toBeInTheDocument();
  });

  it("shows the bot that joined by itself during the meeting", async () => {
    botIs(MeetingBotState.Active);
    renderButton(
      meeting({ scheduledAt: new Date(Date.now() - 60_000).toISOString() }),
    );

    expect(
      await screen.findByText("Kayıt botu toplantıda, kayıt sürüyor."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADD })).toBeDisabled();
  });

  it("can send a new bot after the last one left", async () => {
    botIs(MeetingBotState.Completed);
    renderButton(
      meeting({ scheduledAt: new Date(Date.now() - 60_000).toISOString() }),
    );

    expect(
      await screen.findByText("Kayıt botu toplantıdan ayrıldı."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: ADD })).toBeEnabled();
  });

  it.each([
    ["has no Meet link", { meetLink: null }],
    ["has a link the bot cannot join", { meetLink: "https://zoom.us/j/1" }],
    ["was cancelled", { status: MeetingStatus.Cancelled }],
    ["is over", { scheduledAt: "2026-01-01T10:00:00.000Z" }],
  ])("is not offered when the meeting %s", (_, overrides) => {
    renderButton(meeting(overrides));

    expect(screen.queryByRole("button", { name: ADD })).not.toBeInTheDocument();
    expect(fetchMeetingBotStatus).not.toHaveBeenCalled();
  });
});
