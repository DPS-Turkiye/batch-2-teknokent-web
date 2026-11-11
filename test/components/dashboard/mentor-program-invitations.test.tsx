import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MentorProgramInvitations } from "@/components/dashboard/mentor-program-invitations";
import {
  ProgramMentorInvitedBy,
  ProgramMentorStatus,
  ProgramStatus,
  type Program,
  type ProgramInvitation,
} from "@/interfaces/program";
import {
  decideProgramInvitation,
  getProgramInvitations,
  getPrograms,
} from "@/lib/client/programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/providers/session-provider", () => ({
  useAppSession: () => ({ userId: "mentor-1" }),
}));

vi.mock("@/lib/client/programs", () => ({
  getPrograms: vi.fn(),
  getProgramInvitations: vi.fn(),
  decideProgramInvitation: vi.fn(),
}));

const invitation: ProgramInvitation = {
  programId: "program-1",
  programName: "METU BİGG 2026",
  coordinatorId: "coordinator-1",
  coordinatorName: "Elif Demir",
  createdAt: "2026-11-02T09:00:00Z",
};

function program(
  id: string,
  name: string,
  status: ProgramMentorStatus,
  invitedBy: ProgramMentorInvitedBy,
): Program {
  return {
    id,
    name,
    coordinatorId: "coordinator-1",
    coordinatorName: "Elif Demir",
    createdAt: "2026-10-01T09:00:00Z",
    status: ProgramStatus.Active,
    startups: [],
    mentors: [
      {
        mentorId: "mentor-1",
        fullName: "Kemal Arslan",
        email: "kemal@example.com",
        status,
        invitedBy,
        createdAt: "2026-10-01T09:00:00Z",
      },
    ],
  };
}

describe("MentorProgramInvitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPrograms).mockResolvedValue([]);
    vi.mocked(getProgramInvitations).mockResolvedValue([]);
  });

  it("shows nothing when there is no invitation and nothing waiting", async () => {
    renderWithQueryClient(<MentorProgramInvitations />);

    await waitFor(() => expect(getProgramInvitations).toHaveBeenCalled());
    await waitFor(() => expect(getPrograms).toHaveBeenCalled());
    expect(screen.queryByText("Program davetleri")).toBeNull();
  });

  it("accepts a coordinator's invitation from the dashboard", async () => {
    vi.mocked(getProgramInvitations).mockResolvedValue([invitation]);
    vi.mocked(decideProgramInvitation).mockResolvedValue({
      ...invitation,
    });
    const user = userEvent.setup();
    renderWithQueryClient(<MentorProgramInvitations />);

    expect(await screen.findByText("METU BİGG 2026")).toBeInTheDocument();
    expect(
      screen.getByText(/Elif Demir seni mentor olarak davet etti/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Kabul et" }));

    expect(decideProgramInvitation).toHaveBeenCalledWith("program-1", true);
    expect(
      await screen.findByText("METU BİGG 2026 programına katıldın."),
    ).toBeInTheDocument();
  });

  it("declines an invitation", async () => {
    vi.mocked(getProgramInvitations).mockResolvedValue([invitation]);
    vi.mocked(decideProgramInvitation).mockResolvedValue(invitation);
    const user = userEvent.setup();
    renderWithQueryClient(<MentorProgramInvitations />);

    await user.click(await screen.findByRole("button", { name: "Reddet" }));

    expect(decideProgramInvitation).toHaveBeenCalledWith("program-1", false);
  });

  it("lists the mentor's own joins still waiting for the coordinator, not other programs", async () => {
    vi.mocked(getPrograms).mockResolvedValue([
      program(
        "program-2",
        "QA METU Stars",
        ProgramMentorStatus.Pending,
        ProgramMentorInvitedBy.Mentor,
      ),
      program(
        "program-3",
        "Kabul edilmiş program",
        ProgramMentorStatus.Accepted,
        ProgramMentorInvitedBy.Mentor,
      ),
    ]);
    renderWithQueryClient(<MentorProgramInvitations />);

    expect(await screen.findByText("QA METU Stars")).toBeInTheDocument();
    expect(
      screen.getByText("Koordinatör onayı bekleniyor"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Kabul edilmiş program")).toBeNull();
    expect(screen.queryByRole("button", { name: "Kabul et" })).toBeNull();
  });
});
