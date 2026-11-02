import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ProgramApprovalsView,
  ProgramWithoutTeam,
} from "@/components/coordinator/program-approvals-view";
import {
  ApprovalKind,
  type ProgramApprovals,
} from "@/interfaces/program-approvals";
import {
  decideProgramApproval,
  getCoordinatorProgram,
  getProgramApprovals,
  getProgramWithoutTeam,
} from "@/lib/client/coordinator-programs";
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
      people: approvals.people.slice(1),
      startups: approvals.startups,
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

  it("reads in English", async () => {
    renderWithQueryClient(
      <InLocale locale="en">
        <ProgramApprovalsView programId="program-1" />
      </InLocale>,
    );

    expect(await screen.findByText("Applications")).toBeInTheDocument();
    expect(screen.getByText("Startups created later")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(3);
  });
});

describe("ProgramWithoutTeam", () => {
  it("lists the approved people who have no startup yet", async () => {
    vi.mocked(getProgramWithoutTeam).mockResolvedValue([approvals.people[0]]);
    renderWithQueryClient(<ProgramWithoutTeam programId="program-1" />);

    expect(await screen.findByText("Takımı olmayanlar")).toBeInTheDocument();
    expect(screen.getByText("Zeynep Kaya")).toBeInTheDocument();
  });

  it("says so when everyone has a team", async () => {
    vi.mocked(getProgramWithoutTeam).mockResolvedValue([]);
    renderWithQueryClient(<ProgramWithoutTeam programId="program-1" />);

    expect(
      await screen.findByText("Takımı olmayan kimse yok."),
    ).toBeInTheDocument();
  });
});
