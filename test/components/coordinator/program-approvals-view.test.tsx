import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramApprovalsView } from "@/components/coordinator/program-approvals-view";
import {
  ApprovalKind,
  type ProgramApprovals,
} from "@/interfaces/program-approvals";
import {
  decideProgramApproval,
  getCoordinatorProgram,
  getProgramApprovals,
} from "@/lib/client/coordinator-programs";
import { TeamChangeKind, TeamChangeStatus } from "@/interfaces/team-change";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { InLocale, renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  getProgramApprovals: vi.fn(),
  decideProgramApproval: vi.fn(),
  getProgramWithoutTeam: vi.fn(),
  getProgramTeams: vi.fn().mockResolvedValue([]),
}));

const approvals: ProgramApprovals = {
  people: [
    {
      id: "user-1",
      fullName: "Zeynep Kaya",
      email: "zeynep@kargo.ai",
      jobTitle: "Ürün",
      organizationName: null,
      createdAt: "2026-11-01T10:00:00Z",
    },
    {
      id: "user-2",
      fullName: "Ayşe Demir",
      email: "ayse@dongu.co",
      jobTitle: "Kurucu",
      organizationName: "Döngü",
      createdAt: "2026-11-01T11:00:00Z",
    },
  ],
  mentors: [
    {
      id: "mentor-1",
      fullName: "Nihan Öztürk",
      email: "nihan@mentor.co",
      jobTitle: "Ürün Direktörü",
      organizationName: null,
      createdAt: "2026-11-03T10:00:00Z",
    },
  ],
  startups: [
    {
      id: "org-1",
      name: "Kargo AI",
      description: "Rota optimizasyonu",
      founderName: "Mehmet Can",
      founderEmail: "mehmet@kargo.ai",
      createdAt: "2026-11-02T09:00:00Z",
    },
  ],
  teamChanges: [
    {
      id: "tc-1",
      kind: TeamChangeKind.Leave,
      status: TeamChangeStatus.Pending,
      organizationId: "org-2",
      organizationName: "Döngü",
      memberId: "user-3",
      memberName: "Selin Ak",
      memberEmail: "selin@dongu.co",
      requestedById: "user-3",
      requestedByName: "Selin Ak",
      createdAt: "2026-11-04T08:00:00Z",
    },
    {
      id: "tc-2",
      kind: TeamChangeKind.Remove,
      status: TeamChangeStatus.Pending,
      organizationId: "org-2",
      organizationName: "Döngü",
      memberId: "user-4",
      memberName: "Bora Yıldız",
      memberEmail: "bora@dongu.co",
      requestedById: "user-2",
      requestedByName: "Ayşe Demir",
      createdAt: "2026-11-04T09:00:00Z",
    },
  ],
};

describe("ProgramApprovalsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getProgramApprovals).mockResolvedValue(approvals);
  });

  it("lists applicants with or without a startup, and startups created later", async () => {
    renderWithQueryClient(<ProgramApprovalsView programId="program-1" />);

    expect(await screen.findByText("Zeynep Kaya")).toBeInTheDocument();
    expect(screen.getByText(/Startup daha sonra/)).toBeInTheDocument();
    expect(screen.getByText(/Startup: Döngü/)).toBeInTheDocument();
    expect(screen.getByText("Kargo AI")).toBeInTheDocument();
    expect(screen.getByText(/Kuran: Mehmet Can/)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Onaylar" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("approves a person and rejects a startup", async () => {
    vi.mocked(decideProgramApproval).mockResolvedValue({
      ...approvals,
      people: approvals.people.slice(1),
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramApprovalsView programId="program-1" />);

    const zeynep = (await screen.findByText("Zeynep Kaya")).closest(
      "li",
    ) as HTMLElement;
    await user.click(within(zeynep).getByRole("button", { name: "Onayla" }));
    expect(decideProgramApproval).toHaveBeenCalledWith(
      "program-1",
      ApprovalKind.People,
      "user-1",
      true,
    );
    expect(await screen.findByText("Onaylandı.")).toBeInTheDocument();
    expect(screen.queryByText("Zeynep Kaya")).not.toBeInTheDocument();

    const startup = screen.getByText("Kargo AI").closest("li") as HTMLElement;
    await user.click(within(startup).getByRole("button", { name: "Reddet" }));
    expect(decideProgramApproval).toHaveBeenLastCalledWith(
      "program-1",
      ApprovalKind.Startups,
      "org-1",
      false,
    );
  });

  it("lists a mentor asking to join and approves them", async () => {
    vi.mocked(decideProgramApproval).mockResolvedValue({
      ...approvals,
      mentors: [],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramApprovalsView programId="program-1" />);

    expect(await screen.findByText("Mentor başvuruları")).toBeInTheDocument();
    const nihan = screen.getByText("Nihan Öztürk").closest("li") as HTMLElement;
    expect(within(nihan).getByText(/Ürün Direktörü/)).toBeInTheDocument();
    await user.click(within(nihan).getByRole("button", { name: "Onayla" }));

    expect(decideProgramApproval).toHaveBeenCalledWith(
      "program-1",
      ApprovalKind.Mentors,
      "mentor-1",
      true,
    );
    expect(
      await screen.findByText("Onay bekleyen mentor başvurusu yok."),
    ).toBeInTheDocument();
  });

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramApprovalsView programId="program-1" />
      </InLocale>,
    );

    expect(await screen.findByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Startups created later")).toBeInTheDocument();
    expect(screen.getByText("Mentor applications")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(6);
    expect(screen.getByText("Leaving and removal")).toBeInTheDocument();
  });
});

describe("ProgramApprovalsView team changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCoordinatorProgram).mockResolvedValue(
      coordinatorProgramDetail(),
    );
    vi.mocked(getProgramApprovals).mockResolvedValue(approvals);
  });

  it("lists leave and removal requests and decides them", async () => {
    vi.mocked(decideProgramApproval).mockResolvedValue({
      ...approvals,
      teamChanges: approvals.teamChanges.slice(1),
    });
    const user = userEvent.setup();
    renderWithQueryClient(<ProgramApprovalsView programId="program-1" />);

    const selin = (await screen.findByText("Selin Ak")).closest(
      "li",
    ) as HTMLElement;
    expect(
      within(selin).getByText(/Döngü takımından ayrılmak istiyor/),
    ).toBeInTheDocument();
    const bora = screen.getByText("Bora Yıldız").closest("li") as HTMLElement;
    expect(
      within(bora).getByText(
        /Ayşe Demir, Döngü takımından çıkarılmasını istiyor/,
      ),
    ).toBeInTheDocument();

    await user.click(within(selin).getByRole("button", { name: "Onayla" }));
    expect(decideProgramApproval).toHaveBeenCalledWith(
      "program-1",
      ApprovalKind.TeamChanges,
      "tc-1",
      true,
    );
    await waitFor(() =>
      expect(screen.queryByText("Selin Ak")).not.toBeInTheDocument(),
    );
  });
});
