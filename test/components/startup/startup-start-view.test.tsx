import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  StartupApprovalBanner,
  StartupStartView,
} from "@/components/startup/startup-start-view";
import { useViewerIsFounder } from "@/hooks/use-organization-members";
import { useStartupAccess } from "@/hooks/use-startup-access";
import { UserRole } from "@/interfaces/session";
import { joinStartup } from "@/lib/client/organization";
import { StartupAccess } from "@/lib/startup-access";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-startup-access", () => ({ useStartupAccess: vi.fn() }));
vi.mock("@/hooks/use-organization-members", () => ({
  useViewerIsFounder: vi.fn(),
}));

vi.mock("@/lib/client/organization", () => ({
  joinStartup: vi.fn(),
  resubmitStartup: vi.fn(),
  getStartupProfile: vi.fn(),
}));

describe("StartupStartView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("offers a code to join and a way to create a startup", () => {
    renderWithQueryClient(<StartupStartView />);

    expect(screen.getByRole("heading", { name: "Kodum var" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Startup'ımı oluştur" }),
    ).toHaveAttribute("href", "/startup/create");
    expect(screen.getByRole("button", { name: "Katıl" })).toBeDisabled();
  });

  it("joins with the typed code", async () => {
    vi.mocked(joinStartup).mockResolvedValue({
      userId: "mentee-1",
      email: "zeynep@kargo.ai",
      fullName: "Zeynep Kaya",
      jobTitle: "Ürün",
      role: UserRole.Mentee,
      organizationId: "org-1",
      organizationName: "Kargo AI",
    });
    const user = userEvent.setup();
    renderWithQueryClient(<StartupStartView />);

    await user.type(screen.getByLabelText("Startup kodu"), " kargo1 ");
    await user.click(screen.getByRole("button", { name: "Katıl" }));

    expect(joinStartup).toHaveBeenCalledWith("kargo1");
  });

  it("explains a code from another program", async () => {
    vi.mocked(joinStartup).mockRejectedValue(
      new Error("Bu kod başka bir programdaki startup'a ait."),
    );
    const user = userEvent.setup();
    renderWithQueryClient(<StartupStartView />);

    await user.type(screen.getByLabelText("Startup kodu"), "OTHER1");
    await user.click(screen.getByRole("button", { name: "Katıl" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Bu kod başka bir programdaki startup'a ait.",
    );
  });
});

describe("StartupApprovalBanner", () => {
  it("lets the founder of a rejected startup send it again", () => {
    vi.mocked(useStartupAccess).mockReturnValue({
      access: StartupAccess.Rejected,
      isLoading: false,
    });
    vi.mocked(useViewerIsFounder).mockReturnValue(true);
    renderWithQueryClient(<StartupApprovalBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Profili güncelleyip tekrar onaya gönderebilirsiniz.",
    );
    expect(
      screen.getByRole("button", { name: "Tekrar onaya gönder" }),
    ).toBeInTheDocument();
  });

  it("tells a member that only the founder can fix and resend it", () => {
    vi.mocked(useStartupAccess).mockReturnValue({
      access: StartupAccess.Rejected,
      isLoading: false,
    });
    vi.mocked(useViewerIsFounder).mockReturnValue(false);
    renderWithQueryClient(<StartupApprovalBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Kurucu profili güncelleyip tekrar onaya gönderebilir.",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("tells a member waiting for approval that the pages open afterwards", () => {
    vi.mocked(useStartupAccess).mockReturnValue({
      access: StartupAccess.Pending,
      isLoading: false,
    });
    vi.mocked(useViewerIsFounder).mockReturnValue(false);
    renderWithQueryClient(<StartupApprovalBanner />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Onaylandığında tüm sayfalar açılır.",
    );
  });
});
