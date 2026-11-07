import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramApprovalsView } from "@/components/coordinator/program-approvals-view";
import { ProgramTypeTabView } from "@/components/coordinator/program-type-tab-view";
import { ProgramType } from "@/interfaces/program";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { getCoordinatorProgram } from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("next/navigation", () => ({
  usePathname: () => "/coordinator/programs/program-1/participants",
}));

vi.mock("@/lib/client/coordinator-programs", () => ({
  getCoordinatorProgram: vi.fn(),
  launchCoordinatorProgram: vi.fn(),
}));

function mockType(type: ProgramType) {
  const detail = coordinatorProgramDetail();
  vi.mocked(getCoordinatorProgram).mockResolvedValue({
    ...detail,
    program: { ...detail.program, type },
  });
}

describe("program tabs by type", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows Office Hours Randevular, no Onaylar and empty Katılımcılar", async () => {
    mockType(ProgramType.OfficeHours);
    renderWithQueryClient(
      <ProgramTypeTabView
        programId="program-1"
        tab={ProgramTab.Participants}
      />,
    );

    const tabs = await screen.findByRole("tablist");
    expect(
      within(tabs).getByRole("tab", { name: "Randevular" }),
    ).toHaveAttribute("href", "/coordinator/programs/program-1/appointments");
    expect(
      within(tabs).queryByRole("tab", { name: "Onaylar" }),
    ).not.toBeInTheDocument();
    expect(
      within(tabs).getByRole("tab", { name: "Katılımcılar" }),
    ).toHaveAttribute("aria-selected", "true");
    const sub = screen.getByRole("navigation", { name: "Katılımcılar" });
    expect(within(sub).getByText("Akademisyenler")).toBeInTheDocument();
    expect(within(sub).queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Office Hours programları için henüz hazır değil/),
    ).toBeInTheDocument();
  });

  it("links Girişim's Katılımcılar sub-tabs to the existing Takımlar and Mentor Havuzu screens", async () => {
    mockType(ProgramType.StartupMentoring);
    renderWithQueryClient(
      <ProgramTypeTabView programId="program-1" tab={ProgramTab.Teams} />,
    );

    const sub = await screen.findByRole("navigation", { name: "Katılımcılar" });
    expect(within(sub).getByRole("link", { name: /Takımlar/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      within(sub).getByRole("link", { name: /Mentor Havuzu/ }),
    ).toHaveAttribute("href", "/coordinator/programs/program-1/mentors");
  });

  it("keeps the Girişim screens off an Akran program's Onaylar tab", async () => {
    mockType(ProgramType.PeerMentoring);
    renderWithQueryClient(<ProgramApprovalsView programId="program-1" />);

    expect(
      await screen.findByText(/Akran Mentörlüğü programları için/),
    ).toBeInTheDocument();
  });
});
