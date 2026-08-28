import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TeamPage from "@/app/team/page";
import {
  useOrganizationInvite,
  useRotateInviteCode,
} from "@/hooks/use-organization-invite";
import { useOrganizationMembers } from "@/hooks/use-organization-members";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: vi.fn(),
}));

vi.mock("@/hooks/use-organization-invite", () => ({
  useOrganizationInvite: vi.fn(),
  useRotateInviteCode: vi.fn(),
}));

describe("TeamPage", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRotateInviteCode).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useRotateInviteCode>);
    vi.mocked(useOrganizationInvite).mockReturnValue({
      data: { organizationId: "org-1", inviteCode: "ABCD2345" },
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationInvite>);
  });

  it("shows an empty state when there are no members", () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);

    renderWithQueryClient(<TeamPage />);

    expect(
      screen.getByText("Henüz eklenmiş bir ekip üyesi yok."),
    ).toBeInTheDocument();
  });

  it("lists existing members", () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [
        {
          id: "member-1",
          fullName: "Ekip Üyesi",
          email: "ekip@greenloop.demo",
          role: "MENTEE",
          jobTitle: "Ürün Müdürü",
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);

    renderWithQueryClient(<TeamPage />);

    expect(screen.getByText("Ekip Üyesi")).toBeInTheDocument();
    expect(
      screen.getByText("ekip@greenloop.demo · Ürün Müdürü"),
    ).toBeInTheDocument();
  });

  it("shows the invite code instead of an add-member form", () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);

    renderWithQueryClient(<TeamPage />);

    expect(screen.getByText("ABCD2345")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ekip Üyesi Ekle" }),
    ).not.toBeInTheDocument();
  });

  it("copies the invite code to the clipboard", async () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    const clipboardWrite = vi.spyOn(navigator.clipboard, "writeText");

    renderWithQueryClient(<TeamPage />);
    await user.click(screen.getByRole("button", { name: "Kopyala" }));

    expect(clipboardWrite).toHaveBeenCalledWith("ABCD2345");
    expect(
      screen.getByRole("button", { name: "Kopyalandı" }),
    ).toBeInTheDocument();
  });

  it("asks the server to rotate the invite code", async () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);
    mutateAsync.mockResolvedValue({
      organizationId: "org-1",
      inviteCode: "NEWCODE8",
    });
    const user = userEvent.setup();

    renderWithQueryClient(<TeamPage />);
    await user.click(screen.getByRole("button", { name: "Yeni kod üret" }));

    expect(mutateAsync).toHaveBeenCalled();
  });
});
