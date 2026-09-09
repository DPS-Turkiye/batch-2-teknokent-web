import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/admin/page";
import {
  useDecidePendingAccount,
  usePendingAccounts,
} from "@/hooks/use-pending-accounts";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/components/hoc/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/hooks/use-pending-accounts", () => ({
  usePendingAccounts: vi.fn(),
  useDecidePendingAccount: vi.fn(),
}));

describe("AdminPage", () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDecidePendingAccount).mockReturnValue({
      mutateAsync,
      isPending: false,
    } as ReturnType<typeof useDecidePendingAccount>);
  });

  it("shows an empty state when nothing is waiting", () => {
    vi.mocked(usePendingAccounts).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePendingAccounts>);

    renderWithQueryClient(<AdminPage />);

    expect(screen.getByText("Bekleyen başvuru yok.")).toBeInTheDocument();
  });

  it("lists a pending founder and posts APPROVED without an actorId", async () => {
    vi.mocked(usePendingAccounts).mockReturnValue({
      data: [
        {
          id: "founder-1",
          fullName: "Deniz Arslan",
          email: "deniz@greenloop.demo",
          role: UserRole.Mentee,
          jobTitle: "Kurucu",
          organizationName: "GreenLoop",
        },
      ],
      isLoading: false,
      error: null,
    } as ReturnType<typeof usePendingAccounts>);
    mutateAsync.mockResolvedValue({
      user: { fullName: "Deniz Arslan" },
      inviteCode: "ABCD2345",
    });
    const user = userEvent.setup();

    renderWithQueryClient(<AdminPage />);
    await user.click(screen.getByRole("button", { name: "Onayla" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      userId: "founder-1",
      status: UserAccountStatus.Approved,
    });
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Deniz Arslan onaylandı. Davet kodu: ABCD2345",
    );
  });
});
