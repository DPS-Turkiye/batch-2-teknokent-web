import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramAssignmentsView } from "@/components/coordinator/program-assignments-view";
import {
  useProgramAssignments,
  type ProgramAssignments,
} from "@/hooks/use-program-assignments";
import {
  ProgramLifecycle,
  type CoordinatorProgramDetail,
} from "@/interfaces/coordinator-program";
import { ProgramAssignmentSubmissionState } from "@/interfaces/program-assignment";
import {
  AssignmentDraftProblem,
  EMPTY_ASSIGNMENT_DRAFT,
  phaseNameOf,
} from "@/lib/program-assignments";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import {
  programAssignment,
  programAssignmentTeam,
} from "@test/fixtures/program-assignments";
import { renderWithQueryClient } from "@test/test-utils";

let detail: CoordinatorProgramDetail = coordinatorProgramDetail();
vi.mock("@/components/coordinator/program-detail-frame", () => ({
  ProgramDetailFrame: ({
    children,
  }: {
    children: (detail: CoordinatorProgramDetail) => ReactNode;
  }) => <div>{children(detail)}</div>,
}));
vi.mock("@/hooks/use-program-assignments", () => ({
  useProgramAssignments: vi.fn(),
}));
const startEdit = vi.fn();
vi.mock("@/hooks/use-program-assignment-edit", () => ({
  useProgramAssignmentEdit: () => ({
    editing: null,
    draft: null,
    minDueDate: "2026-11-16",
    start: startEdit,
    cancel: vi.fn(),
    setField: vi.fn(),
    problem: null,
    canSave: false,
    save: vi.fn(),
    saving: false,
  }),
}));

const startDelete = vi.fn();
vi.mock("@/hooks/use-program-assignment-delete", () => ({
  useProgramAssignmentDelete: () => ({
    deleting: null,
    teamsWithFiles: 0,
    start: startDelete,
    cancel: vi.fn(),
    confirm: vi.fn(),
    removing: false,
  }),
}));

const openForm = vi.fn();
const closeForm = vi.fn();
const setField = vi.fn();
const submit = vi.fn();
const toggle = vi.fn();
const openSubmission = vi.fn();

function state(
  overrides: Partial<ProgramAssignments> = {},
): ProgramAssignments {
  return {
    assignments: [programAssignment()],
    isLoading: false,
    error: null,
    today: "2026-11-16",
    formOpen: false,
    openForm,
    closeForm,
    draft: EMPTY_ASSIGNMENT_DRAFT,
    setField,
    problem: null,
    canSubmit: false,
    submit,
    submitting: false,
    expandedId: null,
    toggle,
    openSubmission,
    phaseName: phaseNameOf,
    ...overrides,
  };
}

describe("ProgramAssignmentsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    detail = coordinatorProgramDetail();
    vi.mocked(useProgramAssignments).mockReturnValue(state());
  });

  it("lists each Ödev with its due date, phase, file rule and how the teams stand", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    expect(screen.getByText("Pazar araştırması")).toBeInTheDocument();
    expect(
      screen.getByText("Teslim 1 Ara · Başvuru · Dosya gerekli · Elif Demir"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "1 teslim etti · 0 geç teslim · 0 teslim etmedi · 1 bekleniyor",
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: /Pazar araştırması/,
        expanded: false,
      }),
    );
    expect(toggle).toHaveBeenCalledWith("odev-1");
  });

  it("shows every team's standing and opens a handed-in file", async () => {
    const user = userEvent.setup();
    vi.mocked(useProgramAssignments).mockReturnValue(
      state({
        expandedId: "odev-1",
        assignments: [
          programAssignment({
            teams: [
              programAssignmentTeam({
                state: ProgramAssignmentSubmissionState.Late,
                submittedAt: "2026-12-02T10:00:00Z",
                documentId: "doc-1",
                filename: "pazar.pdf",
              }),
              programAssignmentTeam({
                organizationId: "org-2",
                organizationName: "Küme",
                assignmentId: "copy-2",
                state: ProgramAssignmentSubmissionState.Overdue,
              }),
            ],
          }),
        ],
      }),
    );
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    expect(screen.getByText("Hedef pazarı anlat.")).toBeInTheDocument();
    const rows = within(
      screen
        .getByRole("button", { name: /Pazar araştırması/, expanded: true })
        .closest("li")!,
    ).getAllByRole("listitem");
    expect(within(rows[0]!).getByText("Geç teslim")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Teslim etmedi")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Döngü takımının teslim ettiği dosyayı aç",
      }),
    );
    expect(openSubmission).toHaveBeenCalledWith("doc-1");
  });

  it("opens the edit dialog on an Ödev from its Düzenle button", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    await user.click(
      screen.getByRole("button", { name: "Pazar araştırması ödevini düzenle" }),
    );
    expect(startEdit).toHaveBeenCalledWith(programAssignment());
    expect(toggle).not.toHaveBeenCalled();
  });

  it("asks before deleting an Ödev from its Sil button", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    await user.click(
      screen.getByRole("button", { name: "Pazar araştırması ödevini sil" }),
    );
    expect(startDelete).toHaveBeenCalledWith(programAssignment());
    expect(toggle).not.toHaveBeenCalled();
  });

  it("opens the form from Ödev ver", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    await user.click(screen.getByRole("button", { name: "Ödev ver" }));
    expect(openForm).toHaveBeenCalled();
  });

  it("fills in the Ödev for all teams and sends it", async () => {
    const user = userEvent.setup();
    vi.mocked(useProgramAssignments).mockReturnValue(
      state({ formOpen: true, canSubmit: true }),
    );
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    const form = within(screen.getByRole("form", { name: "Ödev ver" }));
    expect(
      form.getByText(/Bu ödev programdaki tüm takımlara verilir/),
    ).toBeInTheDocument();
    await user.type(form.getByLabelText("Başlık"), "P");
    expect(setField).toHaveBeenCalledWith("title", "P");
    await user.type(form.getByLabelText("Açıklama"), "H");
    expect(setField).toHaveBeenCalledWith("description", "H");
    await user.selectOptions(form.getByLabelText("Faz"), "phase-2");
    expect(setField).toHaveBeenCalledWith("phaseId", "phase-2");
    await user.click(form.getByLabelText("Dosya yüklenmesi gerekli"));
    expect(setField).toHaveBeenCalledWith("fileRequired", true);
    expect(form.getByLabelText("Teslim tarihi")).toHaveAttribute(
      "min",
      "2026-11-16",
    );
    await user.click(
      form.getByRole("button", { name: "Tüm takımlara gönder" }),
    );
    expect(submit).toHaveBeenCalled();
    await user.click(form.getByRole("button", { name: "Vazgeç" }));
    expect(closeForm).toHaveBeenCalled();
  });

  it("says what is wrong with the draft and holds the button", () => {
    vi.mocked(useProgramAssignments).mockReturnValue(
      state({
        formOpen: true,
        problem: AssignmentDraftProblem.DuePassed,
        canSubmit: false,
      }),
    );
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Teslim tarihi bugünden önce olamaz.",
    );
    expect(
      screen.getByRole("button", { name: "Tüm takımlara gönder" }),
    ).toBeDisabled();
  });

  it("offers no Ödev ver on an archived program and says when there is nothing yet", () => {
    detail = coordinatorProgramDetail();
    detail.program.lifecycle = ProgramLifecycle.Completed;
    vi.mocked(useProgramAssignments).mockReturnValue(
      state({ assignments: [] }),
    );
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    expect(
      screen.queryByRole("button", { name: "Ödev ver" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Bu programda henüz ödev verilmedi."),
    ).toBeInTheDocument();
  });

  it("offers no Düzenle or Sil on an archived program's Ödevler", () => {
    detail = coordinatorProgramDetail();
    detail.program.lifecycle = ProgramLifecycle.Completed;
    renderWithQueryClient(<ProgramAssignmentsView programId="program-1" />);

    expect(screen.getByText("Pazar araştırması")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ödevini düzenle/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ödevini sil/ }),
    ).not.toBeInTheDocument();
  });
});
