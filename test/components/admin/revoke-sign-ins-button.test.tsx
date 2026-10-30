import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RevokeSignInsButton } from "@/components/admin/revoke-sign-ins-button";
import { UserRole } from "@/interfaces/session";
import { ClientApiError } from "@/lib/client/api";
import { revokeUserSignIns } from "@/lib/client/admin-users";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/admin-users", () => ({
  revokeUserSignIns: vi.fn(),
}));

const user = { id: "user-1", fullName: "Okan Yurt" };

describe("RevokeSignInsButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks before ending the sign-ins, and does nothing when cancelled", async () => {
    renderWithQueryClient(<RevokeSignInsButton user={user} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
    );
    expect(
      screen.getByText(/Okan Yurt tüm cihazlarda çıkış yapacak/),
    ).toBeInTheDocument();
    // Focus lands on the safe choice, which also reads the question out.
    const cancel = screen.getByRole("button", { name: "Vazgeç" });
    expect(cancel).toHaveFocus();
    expect(cancel).toHaveAccessibleDescription(
      /Okan Yurt tüm cihazlarda çıkış yapacak/,
    );
    await userEvent.click(cancel);

    expect(revokeUserSignIns).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
    ).toHaveFocus();
  });

  it("does not take focus before it is used", () => {
    renderWithQueryClient(<RevokeSignInsButton user={user} />);

    expect(
      screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
    ).not.toHaveFocus();
  });

  it("ends the sign-ins once confirmed and says so", async () => {
    vi.mocked(revokeUserSignIns).mockResolvedValue({
      id: "user-1",
      email: "okan@bigg.gov.tr",
      fullName: "Okan Yurt",
      role: UserRole.Coordinator,
      signInsRevokedAt: "2026-10-23T15:00:00Z",
    });
    renderWithQueryClient(<RevokeSignInsButton user={user} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Oturumları kapat" }),
    );

    expect(revokeUserSignIns).toHaveBeenCalledWith("user-1");
    expect(
      await screen.findByText(/Okan Yurt için tüm oturumlar kapatıldı/),
    ).toBeInTheDocument();
  });

  it("shows the backend's reason when it fails", async () => {
    vi.mocked(revokeUserSignIns).mockRejectedValue(
      new ClientApiError(
        "Kullanıcının oturumları Firebase'de kapatılamadı (PERMISSION_DENIED).",
        502,
      ),
    );
    renderWithQueryClient(<RevokeSignInsButton user={user} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Tüm oturumlarını kapat" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Oturumları kapat" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText(/Firebase'de kapatılamadı \(PERMISSION_DENIED\)/),
      ).toBeInTheDocument(),
    );
  });
});
