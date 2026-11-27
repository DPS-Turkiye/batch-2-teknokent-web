import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProcessView } from "@/components/startup/startup-process-view";
import { useSoftwareDevelopmentCard } from "@/hooks/use-software-development-card";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import { UserRole } from "@/interfaces/session";
import {
  StartupStageState,
  type ProcessAssignment,
} from "@/interfaces/startup-process";
import { MENTORSHIPS_ACTIVE_HREF } from "@/lib/const";
import { expectLength } from "@test/fixtures/list-assertions";
import { processPhase } from "@test/fixtures/startup-process";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/startup/startup-page-frame", () => ({
  StartupPageFrame: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  startupPrimaryActionClass: "",
  startupSecondaryActionClass: "",
}));

vi.mock("@/hooks/use-startup-process", () => ({
  useStartupProcess: vi.fn(),
}));

vi.mock("@/hooks/use-software-development-card", () => ({
  useSoftwareDevelopmentCard: vi.fn(),
}));

type SoftwareCard = NonNullable<ReturnType<typeof useSoftwareDevelopmentCard>>;

function softwareCard(overrides: Partial<SoftwareCard> = {}): SoftwareCard {
  return {
    state: StartupStageState.Current,
    dates: { startsOn: "2026-10-05", endsOn: "2026-12-27" },
    mentorshipsHref: MENTORSHIPS_ACTIVE_HREF,
    ...overrides,
  };
}

const uploadAssignment = vi.fn();
const markDone = vi.fn();
const toggleShowAll = vi.fn();
const selectPhase = vi.fn();
const selectUnphased = vi.fn();

function assignment(
  id: string,
  title: string,
  overrides: Partial<ProcessAssignment> = {},
): ProcessAssignment {
  return {
    id,
    roundId: "round-1",
    phaseId: "mvp",
    title,
    description: null,
    status: ActionItemStatus.Open,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdByName: "Çağrı Yılmaz",
    createdByRole: UserRole.Mentor,
    createdAt: "2026-08-10T09:00:00Z",
    programAssignmentId: null,
    fileRequired: true,
    ...overrides,
  };
}

type Process = ReturnType<typeof useStartupProcess>;

const PROBLEM = processPhase("problem", "Problemi Keşfet", {
  startDate: "2026-06-12",
  endDate: "2026-07-08",
  state: StartupStageState.Completed,
});
const MVP = processPhase("mvp", "MVP", { state: StartupStageState.Current });
const MODEL = processPhase("model", "İş Modeli");

function state(overrides: Partial<Process> = {}): Process {
  return {
    assignments: [
      assignment("finance", "Finansal model taslağı", {
        dueDate: "2026-08-30",
      }),
      assignment("model", "B2B2C hipotezi", {
        phaseId: "model",
        status: ActionItemStatus.Completed,
        createdByName: "Selin Kaya",
      }),
    ],
    assignmentsTitle: "Bu fazdaki ödevlerin",
    completedPhases: [
      {
        phase: PROBLEM,
        completedAssignments: 4,
      },
    ],
    error: null,
    focusedAssignmentId: null,
    isLoading: false,
    roundName: (roundId) => (roundId === "round-1" ? "MVP test turu" : null),
    hasPhases: true,
    phaseCards: [
      { phase: PROBLEM, done: 4, total: 4, percent: 100, action: "completed" },
      { phase: MVP, done: 3, total: 4, percent: 75, action: "current" },
      { phase: MODEL, done: 0, total: 0, percent: 0, action: "start" },
    ],
    selectPhase,
    selectUnphased,
    selectedRound: {
      id: "round-1",
      title: "Value proposition & onboarding",
      name: "MVP test turu",
      phaseId: "mvp",
      startsOn: "2026-08-02",
      endsOn: "2026-08-31",
    },
    selectedPhaseId: "mvp",
    showAll: false,
    showUnphased: false,
    toggleShowAll,
    unphasedCount: 0,
    totalAssignments: 7,
    uploadAssignment,
    uploadingAssignmentId: null,
    markDone,
    markingAssignmentId: null,
    ...overrides,
  };
}

describe("StartupProcessView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStartupProcess).mockReturnValue(state());
    vi.mocked(useSoftwareDevelopmentCard).mockReturnValue(null);
  });

  describe("Yazılım geliştirme", () => {
    function softwareSection() {
      return screen.getByRole("region", { name: "Yazılım geliştirme" });
    }

    it("runs over the program's dates while the program is on, linking to the mentorships", () => {
      vi.mocked(useSoftwareDevelopmentCard).mockReturnValue(softwareCard());
      renderWithQueryClient(<StartupProcessView />);

      const card = within(softwareSection());
      expect(
        card.getByText(
          "Program boyunca ürününü/yazılımını geliştir. İlerlemeni mentorunla görüşmelerinde takip edin.",
        ),
      ).toBeVisible();
      expect(card.getByText("5 Eki – 27 Ara 2026")).toBeVisible();
      expect(card.getByText("Devam ediyor")).toBeVisible();
      expect(
        card.getByRole("link", { name: "Mentorluklarım →" }),
      ).toHaveAttribute("href", "/mentorships?tab=active");
    });

    it("is done once the program has ended", () => {
      vi.mocked(useSoftwareDevelopmentCard).mockReturnValue(
        softwareCard({ state: StartupStageState.Completed }),
      );
      renderWithQueryClient(<StartupProcessView />);

      expect(within(softwareSection()).getByText("Tamamlandı")).toBeVisible();
    });

    it("is shown without dates when the program has none", () => {
      vi.mocked(useSoftwareDevelopmentCard).mockReturnValue(
        softwareCard({ dates: null }),
      );
      renderWithQueryClient(<StartupProcessView />);

      const card = within(softwareSection());
      expect(card.queryByText(/2026/)).not.toBeInTheDocument();
      expect(card.getByText("Devam ediyor")).toBeVisible();
    });

    it("is not shown to a team in no program", () => {
      renderWithQueryClient(<StartupProcessView />);

      expect(
        screen.queryByRole("region", { name: "Yazılım geliştirme" }),
      ).not.toBeInTheDocument();
    });

    it("reads in English", () => {
      vi.mocked(useSoftwareDevelopmentCard).mockReturnValue(
        softwareCard({ state: StartupStageState.Upcoming }),
      );
      renderWithQueryClient(
        <InLocale locale="en">
          <StartupProcessView />
        </InLocale>,
      );

      const card = within(
        screen.getByRole("region", { name: "Software development" }),
      );
      expect(card.getByText("Not started yet")).toBeVisible();
      expect(
        card.getByRole("link", { name: "My mentorships →" }),
      ).toBeVisible();
    });
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StartupProcessView />
      </InLocale>,
    );

    const phases = within(screen.getByRole("region", { name: "Phases" }));
    const mvp = phases.getByRole("button", { name: "MVP · 3 / 4 done" });
    expect(within(mvp).getByText("Current phase")).toBeInTheDocument();
    expect(
      phases.getByRole("button", {
        name: "İş Modeli · No assignments yet",
      }),
    ).toHaveTextContent("Start");
    expect(screen.getByText("2 · Aug 31")).toBeInTheDocument();
  });

  it("shows a card per program phase with the chosen phase's round", () => {
    renderWithQueryClient(<StartupProcessView />);

    const stages = within(screen.getByRole("region", { name: "Fazlar" }));
    const mvp = stages.getByRole("button", { name: "MVP · 3 / 4 tamamlandı" });
    expect(mvp).toHaveAttribute("aria-pressed", "true");
    expect(mvp).toHaveAttribute("aria-current", "step");
    expect(within(mvp).getByText("75%")).toBeInTheDocument();
    expect(within(mvp).getByText("Mevcut faz")).toBeInTheDocument();
    const problem = stages.getByRole("button", { name: /^Problemi Keşfet/ });
    expect(problem).toHaveAttribute("aria-pressed", "false");
    expect(within(problem).getByText("Tamamlandı")).toBeInTheDocument();
    expect(
      stages.getByRole("button", { name: "İş Modeli · Henüz ödev yok" }),
    ).toHaveTextContent("Başla");
    expect(
      screen.getByRole("heading", { name: "Value proposition & onboarding" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 · 31 Ağu")).toBeInTheDocument();
  });

  it("opens a phase when its card is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupProcessView />);

    await user.click(screen.getByRole("button", { name: /^İş Modeli/ }));

    expect(selectPhase).toHaveBeenCalledWith("model");
  });

  it("offers the Ödevler no phase covers when there are any", async () => {
    vi.mocked(useStartupProcess).mockReturnValue(state({ unphasedCount: 2 }));
    const user = userEvent.setup();
    renderWithQueryClient(<StartupProcessView />);

    await user.click(
      screen.getByRole("button", { name: "Fazsız görevler (2)" }),
    );

    expect(selectUnphased).toHaveBeenCalled();
  });

  it("says the program has no phases yet and lists every Ödev without cards", () => {
    vi.mocked(useStartupProcess).mockReturnValue(
      state({
        hasPhases: false,
        phaseCards: [],
        selectedPhaseId: null,
        selectedRound: null,
        completedPhases: [],
        assignmentsTitle: "Ödevlerin",
      }),
    );
    renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.getByText("Programın fazları henüz eklenmedi. Ödevlerin aşağıda."),
    ).toBeVisible();
    expect(screen.queryByRole("button", { name: /^MVP/ })).toBeNull();
    expect(screen.queryByRole("region", { name: "Odak turu" })).toBeNull();
    expect(screen.getByRole("region", { name: "Ödevlerin" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Tümü/ })).toBeNull();
  });

  it("lists each Ödev with where it came from, its due date and status", () => {
    renderWithQueryClient(<StartupProcessView />);

    const items = within(
      screen.getByRole("region", { name: "Bu fazdaki ödevlerin" }),
    ).getAllByRole("listitem");
    expectLength(items, 2);
    const [open, done] = items;
    expect(
      within(open).getByText("Çağrı Yılmaz · mentorluk ödevi · MVP test turu"),
    ).toBeInTheDocument();
    expect(within(open).getByText("Teslim 30 Ağu")).toBeInTheDocument();
    expect(within(open).getByText("Yüklenmedi")).toBeInTheDocument();
    expect(within(done).getByText("Tamamlandı")).toBeInTheDocument();
    expect(
      screen.queryByLabelText("B2B2C hipotezi için ödev yükle"),
    ).not.toBeInTheDocument();
  });

  it("opens on the Ödev a link points at and brings its row into view", () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    vi.mocked(useStartupProcess).mockReturnValue(
      state({ focusedAssignmentId: "finance" }),
    );

    renderWithQueryClient(<StartupProcessView focusAssignmentId="finance" />);

    expect(useStartupProcess).toHaveBeenLastCalledWith("finance");
    const [focused] = within(
      screen.getByRole("region", { name: "Bu fazdaki ödevlerin" }),
    ).getAllByRole("listitem");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(focused);
    expect(focused).toHaveAttribute("aria-current", "true");
    expect(focused).toHaveFocus();
    scrollIntoView.mockRestore();
  });

  it("uploads an open Ödev and shows the upload in progress on its row", async () => {
    const user = userEvent.setup();
    const file = new File(["%PDF-1.4"], "model.pdf", {
      type: "application/pdf",
    });
    const { rerender } = renderWithQueryClient(<StartupProcessView />);

    await user.upload(
      screen.getByLabelText("Finansal model taslağı için ödev yükle"),
      file,
    );
    expect(uploadAssignment).toHaveBeenCalledWith("finance", file);

    vi.mocked(useStartupProcess).mockReturnValue(
      state({ uploadingAssignmentId: "finance" }),
    );
    rerender(<StartupProcessView />);

    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Finansal model taslağı için ödev yükle"),
    ).toBeDisabled();
  });

  it("hands in a program Ödev that asks for no file with one click, a file still optional", async () => {
    const user = userEvent.setup();
    vi.mocked(useStartupProcess).mockReturnValue(
      state({
        assignments: [
          assignment("market", "Pazar araştırması", {
            createdByName: "Elif Demir",
            createdByRole: UserRole.Coordinator,
            description: "Hedef pazarı anlat.",
            programAssignmentId: "program-odev-1",
            fileRequired: false,
          }),
        ],
      }),
    );
    const { rerender } = renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.getByText("Elif Demir · program ödevi · MVP test turu"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hedef pazarı anlat.")).toBeInTheDocument();
    expect(screen.getByText("Dosya ekle")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Teslim et" }));
    expect(markDone).toHaveBeenCalledWith("market");

    vi.mocked(useStartupProcess).mockReturnValue(
      state({
        assignments: [
          assignment("market", "Pazar araştırması", { fileRequired: false }),
        ],
        markingAssignmentId: "market",
      }),
    );
    rerender(<StartupProcessView />);
    expect(
      screen.getByRole("button", { name: "Teslim ediliyor…" }),
    ).toBeDisabled();
  });

  it("offers only the upload when the Ödev asks for a file", () => {
    renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.queryByRole("button", { name: "Teslim et" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Ödev yükle").length).toBeGreaterThan(0);
  });

  it("switches between the phase's Ödevler and every Ödev", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithQueryClient(<StartupProcessView />);

    await user.click(screen.getByRole("button", { name: "Tümü (7) →" }));
    expect(toggleShowAll).toHaveBeenCalled();

    vi.mocked(useStartupProcess).mockReturnValue(state({ showAll: true }));
    rerender(<StartupProcessView />);

    expect(screen.getByRole("button", { name: "Bu faz →" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("dates the finished phases and counts their Ödevler", () => {
    renderWithQueryClient(<StartupProcessView />);

    const completed = screen.getByRole("region", {
      name: "Tamamlanan fazlar",
    });
    expect(
      within(completed).getByText("12 Haz – 8 Tem 2026"),
    ).toBeInTheDocument();
    expect(
      within(completed).getByText("4 ödev tamamlandı"),
    ).toBeInTheDocument();
  });

  it("says when nothing is planned or finished yet", () => {
    vi.mocked(useStartupProcess).mockReturnValue(
      state({
        assignments: [],
        completedPhases: [],
        selectedRound: null,
        totalAssignments: 0,
      }),
    );

    renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.getByText("Bu faz için henüz bir tur planlanmadı."),
    ).toBeInTheDocument();
    expect(screen.getByText("Burada henüz ödev yok.")).toBeInTheDocument();
    expect(
      screen.getByText("Henüz tamamlanan bir faz yok."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Tümü/ }),
    ).not.toBeInTheDocument();
  });

  it("reports a process that could not be loaded", () => {
    vi.mocked(useStartupProcess).mockReturnValue(
      state({ error: new Error("Startup süreci yüklenemedi.") }),
    );

    renderWithQueryClient(<StartupProcessView />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Startup süreci yüklenemedi.",
    );
  });
});
