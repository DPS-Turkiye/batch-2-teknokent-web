import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProgramsPage from "@/app/programs/page";
import {
  useAddProgramStartup,
  useCreateProgram,
  useDecideProgramMentorRequest,
  useInviteProgramMentor,
  useProgramDirectory,
  usePrograms,
  useProgramStatusSwitch,
  useRemoveProgramStartup,
} from "@/hooks/use-programs";
import { ProgramStatus } from "@/interfaces/program";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-programs", () => ({
  usePrograms: vi.fn(),
  useProgramDirectory: vi.fn(),
  useCreateProgram: vi.fn(),
  useAddProgramStartup: vi.fn(),
  useRemoveProgramStartup: vi.fn(),
  useInviteProgramMentor: vi.fn(),
  useDecideProgramMentorRequest: vi.fn(),
  useProgramStatusSwitch: vi.fn(),
}));

describe("ProgramsPage", () => {
  const createMutate = vi.fn();
  const addStartupMutate = vi.fn();
  const toggleStatus = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateProgram).mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    } as ReturnType<typeof useCreateProgram>);
    vi.mocked(useAddProgramStartup).mockReturnValue({
      mutateAsync: addStartupMutate,
      isPending: false,
    } as ReturnType<typeof useAddProgramStartup>);
    vi.mocked(useRemoveProgramStartup).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useRemoveProgramStartup>);
    vi.mocked(useInviteProgramMentor).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useInviteProgramMentor>);
    vi.mocked(useDecideProgramMentorRequest).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as ReturnType<typeof useDecideProgramMentorRequest>);
    vi.mocked(useProgramStatusSwitch).mockReturnValue({
      active: true,
      label: "Aktif",
      isSaving: false,
      toggle: toggleStatus,
    });
    vi.mocked(usePrograms).mockReturnValue({
      data: [
        {
          id: "program-1",
          name: "Seed 2026",
          status: ProgramStatus.Active,
          mentors: [],
          startups: [],
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePrograms>);
    vi.mocked(useProgramDirectory).mockReturnValue({
      data: {
        startups: [{ id: "org-1", name: "NovaMed AI" }],
        mentors: [
          { id: "mentor-1", fullName: "Ece Demir", email: "ece@x.com" },
        ],
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useProgramDirectory>);
  });

  it("lists startups under the search field and adds one to the program", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramsPage />);

    expect(screen.getByPlaceholderText("Startup ara")).toBeInTheDocument();
    expect(screen.getByText("NovaMed AI")).toBeInTheDocument();
    expect(screen.getByText("Seed 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Programa ekle" }));
    expect(addStartupMutate).toHaveBeenCalledWith({
      programId: "program-1",
      organizationId: "org-1",
    });
  });

  it("shows each program's status and lets the coordinator switch it", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramsPage />);

    const toggle = screen.getByRole("switch", { name: "Seed 2026 aktif" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Aktif")).toBeInTheDocument();
    await user.click(toggle);

    expect(toggleStatus).toHaveBeenCalled();
    expect(useProgramStatusSwitch).toHaveBeenCalledWith(
      expect.objectContaining({ id: "program-1" }),
    );
  });

  it("disables the switch while the status is saving", () => {
    vi.mocked(useProgramStatusSwitch).mockReturnValue({
      active: false,
      label: "Tamamlandı",
      isSaving: true,
      toggle: toggleStatus,
    });
    renderWithQueryClient(<ProgramsPage />);

    const toggle = screen.getByRole("switch", { name: "Seed 2026 aktif" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(toggle).toBeDisabled();
    expect(screen.getByText("Tamamlandı")).toBeInTheDocument();
  });

  it("filters the startup list by name", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramsPage />);

    await user.type(screen.getByPlaceholderText("Startup ara"), "xyz");
    expect(screen.queryByText("NovaMed AI")).not.toBeInTheDocument();
    expect(screen.getByText("Startup bulunamadı.")).toBeInTheDocument();
  });
});
