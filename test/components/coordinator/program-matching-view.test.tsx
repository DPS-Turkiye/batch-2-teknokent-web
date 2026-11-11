import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramMatchingView } from "@/components/coordinator/program-matching-view";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import {
  MatchNeedSource,
  type MatchCandidate,
  type MatchingOverview,
} from "@/interfaces/program-matching";
import { addCoordinatorNote } from "@/lib/client/coordinator-notes";
import {
  createMatch,
  getCoordinatorProgram,
  getMatching,
  getMatchSuggestions,
} from "@/lib/client/coordinator-programs";
import {
  getMentorshipMeetingProposals,
  proposeMeeting,
} from "@/lib/client/meeting-proposals";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { meetingProposal } from "@test/fixtures/meeting-proposals";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

// Rendered outside the App Router, the real usePathname returns null.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/coordinator/programs/program-1",
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getMatching: vi.fn(),
  getMatchSuggestions: vi.fn(),
  createMatch: vi.fn(),
}));
vi.mock("@/lib/client/meeting-proposals", () => ({
  getMentorshipMeetingProposals: vi.fn(),
  proposeMeeting: vi.fn(),
  remindMeetingProposal: vi.fn(),
  withdrawMeetingProposal: vi.fn(),
}));
vi.mock("@/lib/client/coordinator-notes", () => ({
  addCoordinatorNote: vi.fn(),
}));

const overview: MatchingOverview = {
  waiting: [
    {
      organizationId: "terra",
      name: "Terra",
      sector: "E-ticaret",
      stage: "Erken aşama",
      leadName: "Mert Aydın",
      waitingDays: 4,
      needSource: MatchNeedSource.Request,
      needTopic: "Ürün & UX, Satış",
      needText: "İlk 1.000 kullanıcıya ulaşma kanalları",
    },
    {
      organizationId: "lumen",
      name: "Lumen",
      sector: null,
      stage: null,
      leadName: null,
      waitingDays: 3,
      needSource: MatchNeedSource.None,
      needTopic: null,
      needText: null,
    },
  ],
  active: [
    {
      mentorshipId: "m-1",
      organizationId: "vega",
      teamName: "Vega",
      mentorId: "ayse",
      mentorName: "Ayşe Demir",
      status: MentorshipStatus.Active,
      startDate: "2026-09-01",
      endDate: null,
    },
  ],
  past: [],
};

const nihan: MatchCandidate = {
  mentorId: "nihan",
  fullName: "Nihan Öztürk",
  title: "UX/UI & Ürün stratejisi",
  specialties: ["UX"],
  availability: "Salı öğleden sonra",
  activeTeams: 3,
  capacity: 4,
  reasons: ["Pazarlama stratejisi konusunda 6 girişimle çalıştı"],
};
const kerem: MatchCandidate = {
  ...nihan,
  mentorId: "kerem",
  fullName: "Kerem Sarı",
  activeTeams: 4,
  capacity: 4,
  reasons: [],
};

describe("ProgramMatchingView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getMatching).mockResolvedValue(overview);
    vi.mocked(getMatchSuggestions).mockResolvedValue({
      method: "DETERMINISTIC",
      recommended: [nihan, kerem],
      pool: [nihan, kerem],
    });
    vi.mocked(createMatch).mockResolvedValue({
      ...overview,
      waiting: overview.waiting.slice(1),
    });
  });

  it("opens on the team from the link and shows its need and ranked mentors", async () => {
    renderWithQueryClient(
      <ProgramMatchingView programId="program-1" initialTeamId="lumen" />,
    );

    expect(
      await screen.findByText(/Takım henüz ihtiyaç belirtmedi/),
    ).toBeInTheDocument();
    expect(getMatchSuggestions).toHaveBeenCalledWith("program-1", "lumen");
    expect(await screen.findByText("1. öneri")).toBeInTheDocument();
  });

  it("reads in English, confirmation included", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramMatchingView programId="program-1" />
      </InLocale>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Match with Nihan Öztürk" }),
    );
    const dialog = screen.getByRole("region", { name: "Confirm the match" });
    expect(
      within(dialog).getByText("Load 3/4 → will be 4/4"),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "This match fills Nihan Öztürk's capacity.",
    );
    expect(
      within(dialog).getByLabelText("Propose an intro meeting"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Teams waiting for a match" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText("Need: Product & UX, Sales"),
    ).toBeInTheDocument();
  });

  it("warns when a match fills a mentor's capacity and confirms it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMatchingView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Nihan Öztürk ile eşleştir" }),
    );
    const dialog = screen.getByRole("region", { name: "Eşleşmeyi onayla" });
    expect(
      within(dialog).getByText("Yük 3/4 → 4/4 olacak"),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("alert")).toHaveTextContent("dolacak");

    await user.click(
      within(dialog).getByRole("button", { name: "Eşleşmeyi onayla" }),
    );
    expect(createMatch).toHaveBeenCalledWith("program-1", {
      organizationId: "terra",
      mentorId: "nihan",
    });
    expect(
      await screen.findByText("Terra ↔ Nihan Öztürk eşleşti"),
    ).toBeInTheDocument();
  });

  it("lets a full mentor be matched with a stronger warning, searches the pool and lists active matches", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramMatchingView programId="program-1" />);

    await user.type(
      await screen.findByPlaceholderText(
        "Havuzdan mentor ara ve manuel eşleştir",
      ),
      "kerem",
    );
    const results = screen.getByRole("list", { name: "Havuz arama sonuçları" });
    await user.click(
      within(results).getByRole("button", { name: "Kerem Sarı ile eşleştir" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent("zaten dolu");
    await user.click(screen.getByRole("button", { name: "Kapat" }));

    await user.click(
      screen.getByRole("button", { name: /Aktif eşleşmeler 1/ }),
    );
    expect(screen.getByText("Vega ↔ Ayşe Demir")).toBeInTheDocument();
  });

  it("proposes the introduction, saves a note and opens İlk adımlar after a match", async () => {
    const user = userEvent.setup();
    vi.mocked(createMatch).mockResolvedValue({
      ...overview,
      waiting: overview.waiting.slice(1),
      active: [
        ...overview.active,
        {
          mentorshipId: "m-new",
          organizationId: "terra",
          teamName: "Terra",
          mentorId: "nihan",
          mentorName: "Nihan Öztürk",
          status: MentorshipStatus.Active,
          startDate: "2026-09-27",
          endDate: null,
        },
      ],
    });
    vi.mocked(proposeMeeting).mockResolvedValue(meetingProposal());
    vi.mocked(addCoordinatorNote).mockResolvedValue({
      id: "n-1",
      mentorshipId: "m-new",
      authorName: "Elif Demir",
      body: "Pazarlamaya odaklansınlar",
      createdAt: "2026-09-27T09:00:00Z",
      mine: true,
    });
    vi.mocked(getMentorshipMeetingProposals).mockResolvedValue([
      meetingProposal({ mentorshipId: "m-new" }),
    ]);
    renderWithQueryClient(<ProgramMatchingView programId="program-1" />);

    await user.click(
      await screen.findByRole("button", { name: "Nihan Öztürk ile eşleştir" }),
    );
    const dialog = screen.getByRole("region", { name: "Eşleşmeyi onayla" });
    await user.click(
      within(dialog).getByRole("checkbox", {
        name: "İlk tanışma görüşmesi öner",
      }),
    );
    const when = within(dialog).getByLabelText("Tanışma zamanı");
    await user.clear(when);
    await user.type(when, "2026-10-01T15:00");
    await user.click(
      within(dialog).getByRole("checkbox", { name: "Koordinatör notu ekle" }),
    );
    await user.type(
      within(dialog).getByLabelText("Koordinatör notu"),
      "Pazarlamaya odaklansınlar",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Eşleşmeyi onayla" }),
    );

    const steps = await screen.findByRole("dialog", { name: "İlk adımlar" });
    expect(proposeMeeting).toHaveBeenCalledWith("m-new", {
      scheduledAt: new Date("2026-10-01T15:00").toISOString(),
      durationMinutes: 30,
      agenda: "İlk tanışma görüşmesi",
      replacesMeetingId: null,
    });
    expect(addCoordinatorNote).toHaveBeenCalledWith(
      "m-new",
      "Pazarlamaya odaklansınlar",
    );
    expect(within(steps).getByText("Nihan Öztürk ↔ Terra")).toBeInTheDocument();
    expect(
      await within(steps).findByText(/önerildi · yanıt bekleniyor/),
    ).toBeInTheDocument();
    expect(within(steps).getByText("İlk adımlar · 2/4")).toBeInTheDocument();
    expect(
      within(steps).getByText("Nihan Öztürk, Mert Aydın (yetkili)"),
    ).toBeInTheDocument();
  });
});
