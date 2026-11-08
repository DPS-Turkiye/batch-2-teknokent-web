import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProgramApprovalsView } from "@/components/coordinator/program-approvals-view";
import { ProgramTypeTabView } from "@/components/coordinator/program-type-tab-view";
import { ProgramType } from "@/interfaces/program";
import { ProgramTab } from "@/lib/coordinator-program-detail";
import { getCoordinatorProgram } from "@/lib/client/coordinator-programs";
import { coordinatorProgramDetail } from "@test/fixtures/coordinator-programs";
import { renderWithQueryClient } from "@test/test-utils";

const navigation = vi.hoisted(() => ({
  pathname: "/coordinator/programs/program-1/participants",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ replace: navigation.replace }),
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
  beforeEach(() => {
    vi.clearAllMocks();
    navigation.pathname = "/coordinator/programs/program-1/participants";
  });

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

  it("sends a Girişim program's Katılımcılar URL to Takımlar instead of an empty state", async () => {
    mockType(ProgramType.StartupMentoring);
    renderWithQueryClient(
      <ProgramTypeTabView
        programId="program-1"
        tab={ProgramTab.Participants}
      />,
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/coordinator/programs/program-1/teams",
      ),
    );
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText(/henüz hazır değil/)).not.toBeInTheDocument();
  });

  it("keeps the admin inside the admin shell when it redirects", async () => {
    navigation.pathname = "/admin/programs/program-1/appointments";
    mockType(ProgramType.StartupMentoring);
    renderWithQueryClient(
      <ProgramTypeTabView
        programId="program-1"
        tab={ProgramTab.Appointments}
      />,
    );

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/admin/programs/program-1/matching",
      ),
    );
  });

  it("sends an Office Hours program's Onaylar URL to its overview", async () => {
    mockType(ProgramType.OfficeHours);
    renderWithQueryClient(<ProgramApprovalsView programId="program-1" />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        "/coordinator/programs/program-1",
      ),
    );
  });

  it("tells the admin that the coordinators set the program up", async () => {
    navigation.pathname = "/admin/programs/program-1/participants";
    mockType(ProgramType.PeerMentoring);
    renderWithQueryClient(
      <ProgramTypeTabView
        programId="program-1"
        tab={ProgramTab.Participants}
      />,
    );

    expect(
      await screen.findByText(
        /koordinatörleri Program Ayarları’nda yapılandırır/,
      ),
    ).toBeInTheDocument();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
