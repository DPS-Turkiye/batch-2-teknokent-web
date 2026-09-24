import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CoordinatorHomeView } from "@/components/coordinator/home-view";
import {
  CoordinatorAgendaKind,
  type CoordinatorOverview,
} from "@/interfaces/coordinator-overview";
import { ProgramLifecycle } from "@/interfaces/coordinator-program";
import { getCoordinatorOverview } from "@/lib/client/coordinator-overview";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-overview", () => ({
  getCoordinatorOverview: vi.fn(),
}));

function overview(
  overrides: Partial<CoordinatorOverview> = {},
): CoordinatorOverview {
  const inTwoDays = new Date(Date.now() + 2 * 86_400_000).toISOString();
  return {
    programs: [
      {
        id: "program-1",
        name: "METU Stars 2026",
        lifecycle: ProgramLifecycle.Active,
      },
    ],
    metrics: {
      activeMentorships: 64,
      mentoredTeams: 36,
      activeMentors: 28,
      staleMentorships: 6,
      overdueActions: 9,
      openBottlenecks: 4,
      slowMentors: 3,
    },
    nextMeeting: {
      meetingId: "meeting-1",
      title: "Mentorluk Görüşmesi — Ürün Stratejisi",
      scheduledAt: inTwoDays,
      durationMinutes: 60,
      meetLink: "https://meet.google.com/abc-defg-hij",
      sequence: 3,
      mentorId: "mentor-1",
      mentorName: "Nihan Öztürk",
      mentorTitle: "UX/UI",
      organizationId: "org-1",
      organizationName: "Atlas AI",
      founderName: "Gamze Kozak",
    },
    agenda: [
      {
        kind: CoordinatorAgendaKind.Deadline,
        title: "Ara Rapor Teslimi",
        subtitle: "METU Stars 2026",
        at: inTwoDays,
        allDay: false,
      },
    ],
    actions: {
      pendingMentors: [],
      awaitingTeams: [
        {
          organizationId: "org-2",
          name: "Terra",
          programId: "program-1",
          programName: "METU Stars 2026",
          waitingDays: 4,
        },
      ],
      missingNotes: [],
    },
    ...overrides,
  };
}

describe("CoordinatorHomeView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the metrics, the next meeting and the week's agenda", async () => {
    vi.mocked(getCoordinatorOverview).mockResolvedValue(overview());

    renderWithQueryClient(<CoordinatorHomeView />);

    expect(await screen.findByText("Aktif mentorluk")).toBeInTheDocument();
    expect(screen.getByText("36 takım · 28 mentor")).toBeInTheDocument();
    expect(
      screen.getByText("Mentorluk Görüşmesi — Ürün Stratejisi"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Online · Google Meet · 3. görüşme"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Görüşmeye katıl" }),
    ).toHaveAttribute("href", "https://meet.google.com/abc-defg-hij");
    expect(screen.getByText("Ara Rapor Teslimi")).toBeInTheDocument();
    expect(screen.getByText("Deadline")).toBeInTheDocument();
  });

  it("switches to today's agenda", async () => {
    vi.mocked(getCoordinatorOverview).mockResolvedValue(overview());
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorHomeView />);

    await user.click(await screen.findByRole("button", { name: /^Bugün/ }));

    expect(
      screen.getByText("Bu aralıkta planlanmış bir şey yok."),
    ).toBeInTheDocument();
  });

  it("lists teams waiting for a mentor when the row is opened", async () => {
    vi.mocked(getCoordinatorOverview).mockResolvedValue(overview());
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorHomeView />);

    const row = await screen.findByRole("button", {
      name: /Eşleşme bekleyen takım/,
    });
    expect(row).toHaveTextContent("en eskisi 4 gün önce");
    expect(screen.queryByText("Terra")).not.toBeInTheDocument();
    await user.click(row);

    expect(screen.getByText("Terra")).toBeInTheDocument();
    expect(screen.getByText("4 gündür bekliyor")).toBeInTheDocument();
  });

  it("reloads for the chosen program", async () => {
    vi.mocked(getCoordinatorOverview).mockResolvedValue(overview());
    const user = userEvent.setup();
    renderWithQueryClient(<CoordinatorHomeView />);

    await user.selectOptions(await screen.findByRole("combobox"), "program-1");

    expect(getCoordinatorOverview).toHaveBeenCalledWith("program-1");
  });

  it("says so when nothing needs a decision", async () => {
    vi.mocked(getCoordinatorOverview).mockResolvedValue(
      overview({
        nextMeeting: null,
        actions: { pendingMentors: [], awaitingTeams: [], missingNotes: [] },
      }),
    );

    renderWithQueryClient(<CoordinatorHomeView />);

    expect(
      await screen.findByText("Şu an bekleyen bir aksiyon yok."),
    ).toBeInTheDocument();
    expect(screen.getByText("Planlanmış bir görüşme yok.")).toBeInTheDocument();
  });
});
