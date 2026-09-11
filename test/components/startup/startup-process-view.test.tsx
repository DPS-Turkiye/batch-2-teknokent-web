import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StartupProcessView } from "@/components/startup/startup-process-view";
import { useStartupProcess } from "@/hooks/use-startup-process";
import { ActionItemStatus } from "@/interfaces/action-item";
import {
  StartupStage,
  StartupStageState,
  type ProcessAssignment,
} from "@/interfaces/startup-process";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-process", () => ({
  useStartupProcess: vi.fn(),
}));

const uploadAssignment = vi.fn();

function assignment(
  id: string,
  stage: StartupStage,
  title: string,
  status = ActionItemStatus.Open,
): ProcessAssignment {
  return {
    id,
    roundId: "round-1",
    stage,
    title,
    description: null,
    status,
    dueDate: null,
    submissionDocumentId: null,
    submissionFilename: null,
    createdAt: "2026-08-10T09:00:00Z",
  };
}

type Process = ReturnType<typeof useStartupProcess>;

function state(overrides: Partial<Process> = {}): Process {
  return {
    assignments: [
      assignment("finance", StartupStage.Finance, "Finansal model"),
      assignment(
        "model",
        StartupStage.BusinessModel,
        "B2B2C hipotezi",
        ActionItemStatus.Completed,
      ),
    ],
    currentRound: {
      id: "round-1",
      title: "Value proposition & onboarding",
      name: "MVP test turu",
      stage: StartupStage.Mvp,
      startsOn: "2026-08-02",
      endsOn: "2026-08-31",
    },
    error: null,
    isLoading: false,
    stages: [
      { stage: StartupStage.Problem, state: StartupStageState.Completed },
      { stage: StartupStage.Solution, state: StartupStageState.Completed },
      { stage: StartupStage.Mvp, state: StartupStageState.Current },
      { stage: StartupStage.BusinessModel, state: StartupStageState.Upcoming },
    ],
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

  it("shows the focus round and where the startup stands", () => {
    renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.getByRole("heading", { name: "Value proposition & onboarding" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 · 31 Ağu")).toBeInTheDocument();
    const journey = screen.getByRole("region", { name: "Startup süreci" });
    expect(within(journey).getByText("MVP").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(
      within(journey).getByText("Problem").closest("li"),
    ).not.toHaveAttribute("aria-current");
  });

  it("uploads an open Ödev and marks a finished one", async () => {
    const user = userEvent.setup();
    const file = new File(["%PDF-1.4"], "model.pdf", {
      type: "application/pdf",
    });
    renderWithQueryClient(<StartupProcessView />);

    const [firstUpload] = screen.getAllByLabelText(
      "Finansal model için ödev yükle",
    );
    await user.upload(firstUpload, file);

    expect(uploadAssignment).toHaveBeenCalledWith("finance", file);
    expect(screen.getAllByText("Tamamlandı")).toHaveLength(2);
    expect(screen.getAllByText("B2B2C hipotezi")[0].closest("div")).toHaveClass(
      "line-through",
    );
  });

  it("shows the upload in progress on its row", () => {
    vi.mocked(useStartupProcess).mockReturnValue(
      state({ uploadingAssignmentId: "finance" }),
    );

    renderWithQueryClient(<StartupProcessView />);

    expect(screen.getAllByText("Yükleniyor…")).toHaveLength(2);
    expect(
      screen.getAllByLabelText("Finansal model için ödev yükle")[0],
    ).toBeDisabled();
  });

  it("says when nothing is planned yet", () => {
    vi.mocked(useStartupProcess).mockReturnValue(
      state({ assignments: [], currentRound: null }),
    );

    renderWithQueryClient(<StartupProcessView />);

    expect(
      screen.getByText("Henüz bir odak turu planlanmadı."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Bu tur için henüz ödev yok.")).toHaveLength(2);
    expect(screen.getAllByText("Tüm ödevler")).toHaveLength(2);
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
