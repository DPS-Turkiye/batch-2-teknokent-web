import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProcessView } from "@/components/startup/startup-process-view";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import { UserRole } from "@/interfaces/session";
import {
  StartupStage,
  StartupStageState,
  type ProcessAssignment,
} from "@/interfaces/startup-process";
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

const uploadAssignment = vi.fn();
const toggleShowAll = vi.fn();
const selectStage = vi.fn();

function assignment(
  id: string,
  title: string,
  overrides: Partial<ProcessAssignment> = {},
): ProcessAssignment {
  return {
    id,
    roundId: "round-1",
    stage: StartupStage.Finance,
    title,
    description: null,
    status: ActionItemStatus.Open,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdByName: "Çağrı Yılmaz",
    createdByRole: UserRole.Mentor,
    createdAt: "2026-08-10T09:00:00Z",
    ...overrides,
  };
}

type Process = ReturnType<typeof useStartupProcess>;

function state(overrides: Partial<Process> = {}): Process {
  return {
    assignments: [
      assignment("finance", "Finansal model taslağı", {
        dueDate: "2026-08-30",
      }),
      assignment("model", "B2B2C hipotezi", {
        stage: StartupStage.BusinessModel,
        status: ActionItemStatus.Completed,
        createdByName: "Selin Kaya",
      }),
    ],
    completedStages: [
      {
        stage: StartupStage.Problem,
        startsOn: "2026-06-12",
        endsOn: "2026-07-08",
        completedAssignments: 4,
      },
    ],
    error: null,
    isLoading: false,
    roundName: (roundId) => (roundId === "round-1" ? "MVP test turu" : null),
    selectStage,
    selectedRound: {
      id: "round-1",
      title: "Value proposition & onboarding",
      name: "MVP test turu",
      stage: StartupStage.Mvp,
      startsOn: "2026-08-02",
      endsOn: "2026-08-31",
    },
    selectedStage: StartupStage.Mvp,
    showAll: false,
    stageCards: [
      {
        stage: StartupStage.Problem,
        state: StartupStageState.Completed,
        done: 4,
        total: 4,
        percent: 100,
        action: "completed",
      },
      {
        stage: StartupStage.Mvp,
        state: StartupStageState.Current,
        done: 3,
        total: 4,
        percent: 75,
        action: "current",
      },
      {
        stage: StartupStage.BusinessModel,
        state: StartupStageState.Upcoming,
        done: 0,
        total: 0,
        percent: 0,
        action: "start",
      },
    ],
    toggleShowAll,
    totalAssignments: 7,
    uploadAssignment,
    uploadingAssignmentId: null,
    ...overrides,
  };
}

describe("StartupProcessView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStartupProcess).mockReturnValue(state());
  });

  it("reads in English", () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <StartupProcessView />
      </InLocale>,
    );

    const stages = within(screen.getByRole("region", { name: "Stages" }));
    const mvp = stages.getByRole("button", { name: "MVP · 3 / 4 done" });
    expect(within(mvp).getByText("Current stage")).toBeInTheDocument();
    expect(
      stages.getByRole("button", {
        name: "Business model · No assignments yet",
      }),
    ).toHaveTextContent("Start");
    expect(screen.getByText("2 · Aug 31")).toBeInTheDocument();
  });

  it("shows a card per stage with the chosen stage's round", () => {
    renderWithQueryClient(<StartupProcessView />);

    const stages = within(screen.getByRole("region", { name: "Aşamalar" }));
    const mvp = stages.getByRole("button", { name: "MVP · 3 / 4 tamamlandı" });
    expect(mvp).toHaveAttribute("aria-pressed", "true");
    expect(mvp).toHaveAttribute("aria-current", "step");
    expect(within(mvp).getByText("75%")).toBeInTheDocument();
    expect(within(mvp).getByText("Mevcut aşama")).toBeInTheDocument();
    const problem = stages.getByRole("button", { name: /^Problem/ });
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

  it("opens a stage when its card is clicked", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<StartupProcessView />);

    await user.click(screen.getByRole("button", { name: /^İş Modeli/ }));

    expect(selectStage).toHaveBeenCalledWith(StartupStage.BusinessModel);
  });

  it("lists each Ödev with where it came from, its due date and status", () => {
    renderWithQueryClient(<StartupProcessView />);

    const [open, done] = within(
      screen.getByRole("region", { name: "Bu aşamadaki ödevlerin" }),
    ).getAllByRole("listitem");
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

  it("switches between the stage's Ödevler and every Ödev", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithQueryClient(<StartupProcessView />);

    await user.click(screen.getByRole("button", { name: "Tümü (7) →" }));
    expect(toggleShowAll).toHaveBeenCalled();

    vi.mocked(useStartupProcess).mockReturnValue(state({ showAll: true }));
    rerender(<StartupProcessView />);

    expect(screen.getByRole("button", { name: "Bu aşama →" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("dates the finished stages and counts their Ödevler", () => {
    renderWithQueryClient(<StartupProcessView />);

    const completed = screen.getByRole("region", {
      name: "Tamamlanan aşamalar",
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
        completedStages: [],
        selectedRound: null,
        totalAssignments: 0,
      }),
    );

    renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.getByText("Bu aşama için henüz bir tur planlanmadı."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bu aşama için henüz ödev yok."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Henüz tamamlanan bir aşama yok."),
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
