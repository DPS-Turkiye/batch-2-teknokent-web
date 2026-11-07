import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramsListView } from "@/components/coordinator/programs-list-view";
import {
  type CoordinatorProgram,
  ProgramLifecycle,
} from "@/interfaces/coordinator-program";
import { ProgramStatus, ProgramType } from "@/interfaces/program";
import { getCoordinatorPrograms } from "@/lib/client/coordinator-programs";
import { coordinatorProgram, phase } from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorPrograms: vi.fn(),
}));

function mockPrograms(programs: CoordinatorProgram[]) {
  vi.mocked(getCoordinatorPrograms).mockResolvedValue(programs);
}

describe("ProgramsListView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an active program's counts, actions and phase bar", async () => {
    const phases = [
      phase("p1", "Başvuru", 0),
      phase("p2", "Mentorluk dönemi", 1),
    ];
    mockPrograms([coordinatorProgram({ phases, currentPhase: phases[1] })]);

    renderWithQueryClient(<ProgramsListView />);

    const card = await screen.findByRole("article");
    expect(within(card).getByText("METU Stars 2026")).toBeInTheDocument();
    expect(within(card).getByText("14 aksiyon bekliyor")).toBeInTheDocument();
    expect(within(card).getByText("37 takım mentorlu")).toBeInTheDocument();
    expect(within(card).getByText("en eskisi 4 gün")).toBeInTheDocument();
    expect(within(card).getByText("Hafta 6 / 16")).toBeInTheDocument();
    expect(
      within(card).getByText("Mentorluk dönemi").closest("li"),
    ).toHaveAttribute("aria-current", "step");
    expect(
      within(card).getByRole("link", { name: "Programı aç" }),
    ).toHaveAttribute("href", "/coordinator/programs/program-1");
  });

  it("reads in English", async () => {
    mockPrograms([coordinatorProgram()]);

    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramsListView />
      </InLocale>,
    );

    const card = await screen.findByRole("article");
    expect(within(card).getByText("14 actions waiting")).toBeInTheDocument();
    expect(
      within(card).getByText("37 teams have a mentor"),
    ).toBeInTheDocument();
    expect(within(card).getByText("the oldest 4 days")).toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: "Open the program" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Launch a program/ }),
    ).toBeInTheDocument();
  });

  it("shows how long until an upcoming program starts", async () => {
    mockPrograms([
      coordinatorProgram({
        lifecycle: ProgramLifecycle.Upcoming,
        startDate: "2099-01-01",
      }),
    ]);

    renderWithQueryClient(<ProgramsListView />);

    expect(await screen.findByText("Başlangıca")).toBeInTheDocument();
    expect(screen.getByText("program başlamadı")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yaklaşan 1" }),
    ).toBeInTheDocument();
  });

  it("collapses a completed program into one line", async () => {
    mockPrograms([
      coordinatorProgram({
        name: "METU Stars 2025",
        lifecycle: ProgramLifecycle.Completed,
        status: "COMPLETED",
        startDate: "2025-02-01",
        endDate: "2025-12-15",
        teamCount: 38,
        mentorCount: 24,
      }),
    ]);

    renderWithQueryClient(<ProgramsListView />);

    expect(await screen.findByText("Tamamlandı")).toBeInTheDocument();
    expect(
      screen.getByText("Şub 2025 – Ara 2025 · 38 takım · 24 mentor"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Program raporu" }),
    ).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/coordinator\/programs\/.+\/report$/),
    );
  });

  it("labels a draft program and its type", async () => {
    mockPrograms([
      coordinatorProgram({
        name: "ODTÜ Akran 2027",
        lifecycle: ProgramLifecycle.Draft,
        status: ProgramStatus.Draft,
        type: ProgramType.PeerMentoring,
      }),
    ]);

    renderWithQueryClient(<ProgramsListView />);

    const card = await screen.findByRole("article");
    expect(within(card).getByText("Taslak")).toBeInTheDocument();
    expect(within(card).getByText("Akran Mentörlüğü")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Taslak 1" }),
    ).toBeInTheDocument();
  });

  it("filters the programs by type", async () => {
    mockPrograms([
      coordinatorProgram({ id: "girisim", name: "METU Stars 2026" }),
      coordinatorProgram({
        id: "office",
        name: "ODTÜ Office Hours",
        type: ProgramType.OfficeHours,
      }),
    ]);

    renderWithQueryClient(<ProgramsListView />);

    expect(await screen.findAllByRole("article")).toHaveLength(2);
    await userEvent.click(screen.getByRole("button", { name: "Office Hours" }));
    expect(screen.getByRole("article")).toHaveTextContent("ODTÜ Office Hours");
  });

  it("says so when the coordinator has no programs", async () => {
    mockPrograms([]);

    renderWithQueryClient(<ProgramsListView />);

    expect(
      await screen.findByText("Henüz yönettiğin bir program yok."),
    ).toBeInTheDocument();
  });
});
