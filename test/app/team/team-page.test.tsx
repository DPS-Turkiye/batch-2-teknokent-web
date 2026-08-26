import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TeamPage from "@/app/team/page";
import {
  useAddOrganizationMember,
  useOrganizationMembers,
} from "@/hooks/use-organization-members";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-organization-members", () => ({
  useOrganizationMembers: vi.fn(),
  useAddOrganizationMember: vi.fn(),
}));

describe("TeamPage", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAddOrganizationMember).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useAddOrganizationMember>);
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

  it("submits the add-member form with the entered fields", async () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);
    mutateAsync.mockResolvedValue({});
    const user = userEvent.setup();

    renderWithQueryClient(<TeamPage />);

    await user.type(screen.getByLabelText("Ad Soyad"), "Yeni Üye");
    await user.type(
      screen.getByLabelText("E-posta"),
      "yeni.uye@greenloop.demo",
    );
    await user.click(screen.getByRole("button", { name: "Ekip Üyesi Ekle" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      fullName: "Yeni Üye",
      email: "yeni.uye@greenloop.demo",
      jobTitle: undefined,
    });
  });

  it("shows a validation error when required fields are missing", async () => {
    vi.mocked(useOrganizationMembers).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useOrganizationMembers>);
    const user = userEvent.setup();

    renderWithQueryClient(<TeamPage />);

    await user.click(screen.getByRole("button", { name: "Ekip Üyesi Ekle" }));

    expect(
      screen.getByText("Ad soyad ve e-posta gereklidir."),
    ).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
