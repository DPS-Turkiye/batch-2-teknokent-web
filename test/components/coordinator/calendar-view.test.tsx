import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorCalendarView } from "@/components/coordinator/calendar-view";
import { ProgramEventKind } from "@/interfaces/coordinator-program";
import { getCoordinatorCalendar } from "@/lib/client/coordinator-calendar";
import {
  createCoordinatorProgramEvent,
  getCoordinatorPrograms,
} from "@/lib/client/coordinator-programs";
import {
  getCoordinatorMeetingProposals,
  getMentorshipMeetingProposals,
  proposeMeeting,
} from "@/lib/client/meeting-proposals";
import {
  at,
  calendarMeeting,
  coordinatorCalendar,
} from "@test/fixtures/coordinator-calendar";
import { coordinatorProgram } from "@test/fixtures/coordinator-programs";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-calendar", () => ({
  getCoordinatorCalendar: vi.fn(),
}));

vi.mock("@/lib/client/meeting-proposals", () => ({
  getCoordinatorMeetingProposals: vi.fn(),
  getMentorshipMeetingProposals: vi.fn(),
  proposeMeeting: vi.fn(),
  remindMeetingProposal: vi.fn(),
  withdrawMeetingProposal: vi.fn(),
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorPrograms: vi.fn(),
  createCoordinatorProgramEvent: vi.fn(),
}));

describe("CoordinatorCalendarView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 15, 9, 0));
    vi.mocked(getCoordinatorPrograms).mockResolvedValue([coordinatorProgram()]);
    vi.mocked(getCoordinatorCalendar).mockResolvedValue(coordinatorCalendar());
    vi.mocked(getCoordinatorMeetingProposals).mockResolvedValue([
      meetingProposal({ scheduledAt: at(4, 10, 30) }),
    ]);
    vi.mocked(getMentorshipMeetingProposals).mockResolvedValue([]);
    vi.mocked(proposeMeeting).mockResolvedValue(meetingProposal());
  });

  afterEach(() => vi.useRealTimers());

  it("loads this week and shows the grid, the conflict and the week's counts", async () => {
    renderWithQueryClient(<CoordinatorCalendarView />);

    expect(
      await screen.findByRole("button", {
        name: "Nihan Öztürk ↔ Atlas AI Çar 16 Eyl · 14:00–15:00",
      }),
    ).toBeInTheDocument();
    expect(getCoordinatorCalendar).toHaveBeenCalledWith({
      from: "2026-09-14",
      to: "2026-09-20",
      programId: null,
    });
    expect(screen.getByText("14–20 Eylül 2026")).toBeInTheDocument();
    expect(screen.getByText("2 çakışma")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Nova Robotics (11:00) ve Vega (11:30) görüşmeleri üst üste bindi.",
      ),
    ).toBeInTheDocument();
    const week = screen.getByRole("article", { name: "Bu hafta" });
    expect(within(week).getByText("4 kayıt")).toBeInTheDocument();
    expect(within(week).getByText("Planlanmamış (riskli)")).toBeInTheDocument();
  });

  it("reads in English", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <CoordinatorCalendarView />
      </InLocale>,
    );

    const meeting = await screen.findByRole("button", {
      name: /^Nihan Öztürk ↔ Atlas AI Wed Sep 16 · 2:00\s–\s3:00\sPM$/,
    });
    expect(screen.getByText(/^September 14\s–\s20, 2026$/)).toBeInTheDocument();
    expect(screen.getByText("2 conflicts")).toBeInTheDocument();
    const week = screen.getByRole("article", { name: "This week" });
    expect(within(week).getByText("4 items")).toBeInTheDocument();
    expect(
      within(week).getByText("Not scheduled (at risk)"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reschedule" }),
    ).toBeInTheDocument();

    await user.click(meeting);
    const card = screen.getByRole("article", { name: "Item details" });
    expect(
      within(card).getByText("Topic: Ürün stratejisi · Meeting 5"),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Open the mentorship" }),
    ).toBeInTheDocument();
  });

  it("opens a meeting's popover with links to the mentorship and a message", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorCalendarView />);

    await user.click(
      await screen.findByRole("button", {
        name: "Nihan Öztürk ↔ Atlas AI Çar 16 Eyl · 14:00–15:00",
      }),
    );

    const card = screen.getByRole("article", { name: "Kayıt detayı" });
    expect(within(card).getByText("Online · Google Meet")).toBeInTheDocument();
    expect(
      within(card).getByText("Konu: Ürün stratejisi · 5. görüşme"),
    ).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Mentorluğu aç" }),
    ).toHaveAttribute(
      "href",
      "/coordinator/mentorships?mentorship=mentorship-1",
    );
    expect(within(card).getByRole("link", { name: "Mesaj" })).toHaveAttribute(
      "href",
      "/coordinator/messages?program=program-1&mentor=mentor-1",
    );
  });

  it("warns when the recording bot is full at a meeting's time", async () => {
    const user = userEvent.setup();
    vi.mocked(getCoordinatorCalendar).mockResolvedValue(
      coordinatorCalendar({
        items: [calendarMeeting({ recordingLoad: 2 })],
        conflicts: [],
      }),
    );
    renderWithQueryClient(<CoordinatorCalendarView />);

    expect(
      await screen.findByText("Kayıt botu kapasitesi dolu"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Nihan Öztürk ↔ Atlas AI Çar 16 Eyl · 14:00–15:00",
      }),
    );
    const card = screen.getByRole("article", { name: "Kayıt detayı" });
    expect(within(card).getByText("Kayıt botu 2/2 · dolu")).toBeInTheDocument();
  });

  it("moves to the next week and to the month view", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorCalendarView />);
    await screen.findByText("2 çakışma");

    await user.click(screen.getByRole("button", { name: "Sonraki" }));
    expect(getCoordinatorCalendar).toHaveBeenLastCalledWith({
      from: "2026-09-21",
      to: "2026-09-27",
      programId: null,
    });

    await user.click(screen.getByRole("button", { name: "Ay" }));
    expect(getCoordinatorCalendar).toHaveBeenLastCalledWith({
      from: "2026-08-31",
      to: "2026-10-04",
      programId: null,
    });
  });

  it("lists the week by day", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorCalendarView />);

    await user.click(
      await screen.findByRole("button", { name: /Liste görünümünde aç/ }),
    );

    const wednesday = screen
      .getByRole("heading", { name: "16 Eylül Çarşamba" })
      .closest("section")!;
    expect(within(wednesday).getAllByText("Çakışma")).toHaveLength(2);
    expect(
      within(wednesday).getByText("Nihan Öztürk ↔ Atlas AI"),
    ).toBeInTheDocument();
  });

  it("adds a deadline and reloads the calendar", async () => {
    vi.mocked(createCoordinatorProgramEvent).mockResolvedValue({
      id: "event-2",
      programId: "program-1",
      title: "Ara rapor teslimi",
      kind: ProgramEventKind.Deadline,
      startsAt: "2026-09-17T20:59:00.000Z",
      endsAt: null,
      description: null,
    });
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorCalendarView />);
    await screen.findByText("2 çakışma");

    await user.click(screen.getByRole("button", { name: "+ Etkinlik ekle" }));
    const form = screen.getByRole("dialog", { name: "Etkinlik ekle" });
    await user.click(within(form).getByRole("button", { name: "Kaydet" }));
    expect(within(form).getByRole("alert")).toHaveTextContent("Başlık girin.");

    await user.type(within(form).getByLabelText("Başlık"), "Ara rapor teslimi");
    await user.click(within(form).getByLabelText("Deadline"));
    await user.click(within(form).getByRole("button", { name: "Kaydet" }));

    expect(createCoordinatorProgramEvent).toHaveBeenCalledWith(
      "program-1",
      expect.objectContaining({
        title: "Ara rapor teslimi",
        kind: ProgramEventKind.Deadline,
        endsAt: null,
      }),
    );
    expect(await screen.findByText("2 çakışma")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getCoordinatorCalendar).toHaveBeenCalledTimes(2);
  });

  it("draws a pending proposal as an Önerilen slot", async () => {
    renderWithQueryClient(<CoordinatorCalendarView />);

    const slot = await screen.findByRole("button", {
      name: "Ayşe Demir ↔ Lumen Cum 18 Eyl · 10:30–11:15",
    });
    expect(within(slot).getByText("10:30 · Önerilen slot")).toBeInTheDocument();
  });

  it("proposes a new time for the later conflicting meeting", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorCalendarView />);

    await user.click(
      await screen.findByRole("button", { name: "Yeniden planla" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Yeni saat öner" });
    const when = within(dialog).getByLabelText("Tarih ve saat");
    await user.clear(when);
    await user.type(when, "2026-09-17T15:00");
    await user.click(
      within(dialog).getByRole("button", { name: "İki tarafa öner" }),
    );

    expect(proposeMeeting).toHaveBeenCalledWith("mentorship-1", {
      scheduledAt: new Date("2026-09-17T15:00").toISOString(),
      durationMinutes: 45,
      agenda: null,
      replacesMeetingId: "vega",
    });
    expect(
      screen.queryByRole("dialog", { name: "Yeni saat öner" }),
    ).not.toBeInTheDocument();
  });
});
