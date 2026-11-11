import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminStudentsTable } from "@/components/admin/admin-students-table";
import { GateBadgeState } from "@/interfaces/badges";
import { getAdminStudents } from "@/lib/client/badges";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/badges", () => ({ getAdminStudents: vi.fn() }));

describe("AdminStudentsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAdminStudents).mockResolvedValue([
      {
        userId: "u1",
        fullName: "Zeynep Öğrenci",
        email: "zeynep@odtu-dev.invalid",
        programId: "p1",
        programName: "İŞKUR 2026 Bahar",
        state: GateBadgeState.Active,
        awardId: "a1",
        source: null,
        awardedAt: "2026-11-08T10:00:00Z",
        revokedAt: null,
        reason: null,
        training: { videoWatched: false, attempts: 0, bestScore: null },
      },
      {
        userId: "u2",
        fullName: "Mehmet Eğitimde",
        email: "mehmet@odtu-dev.invalid",
        programId: "p1",
        programName: "İŞKUR 2026 Bahar",
        state: GateBadgeState.None,
        awardId: null,
        source: null,
        awardedAt: null,
        revokedAt: null,
        reason: null,
        training: { videoWatched: true, attempts: 1, bestScore: 5 },
      },
    ]);
  });

  it("filters by badge state and links each student to their program's list", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdminStudentsTable />);

    expect(await screen.findByText("Zeynep Öğrenci")).toBeInTheDocument();
    expect(getAdminStudents).toHaveBeenCalledWith(null);
    expect(
      screen.getAllByRole("link", { name: "İŞKUR 2026 Bahar" })[0],
    ).toHaveAttribute("href", "/admin/programs/p1/students");

    await user.click(screen.getByRole("button", { name: "Akran mentoru" }));
    await waitFor(() =>
      expect(getAdminStudents).toHaveBeenCalledWith(GateBadgeState.Active),
    );
    expect(
      screen.getByRole("button", { name: "Akran mentoru" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("narrows Rozet yok to those in training", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<AdminStudentsTable />);
    await screen.findByText("Mehmet Eğitimde");

    await user.click(screen.getByRole("button", { name: "Eğitimde" }));

    await waitFor(() =>
      expect(getAdminStudents).toHaveBeenLastCalledWith(GateBadgeState.None),
    );
    await waitFor(() =>
      expect(screen.queryByText("Zeynep Öğrenci")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Mehmet Eğitimde")).toBeInTheDocument();
  });
});
