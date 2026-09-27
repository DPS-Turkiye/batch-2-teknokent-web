import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramMatchingView } from "@/components/coordinator/program-matching-view";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import {
  type MatchCandidate,
  type MatchingOverview,
  MatchNeedSource,
} from "@/interfaces/program-matching";
import {
  createMatch,
  getCoordinatorProgram,
  getMatching,
  getMatchSuggestions,
} from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getMatching: vi.fn(),
  getMatchSuggestions: vi.fn(),
  createMatch: vi.fn(),
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
      needTopic: "Pazarlama stratejisi",
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
});
