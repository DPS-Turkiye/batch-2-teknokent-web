import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdminPage from "@/app/admin/page";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import type { AdminOverview } from "@/interfaces/admin-overview";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/hooks/use-admin-overview", () => ({
  useAdminOverview: vi.fn(),
}));

const emptyOverview: AdminOverview = {
  programs: [],
  users: [],
  mentorships: [],
  requests: [],
  bottlenecks: [],
  meetingsLast8Weeks: 0,
};

describe("AdminPage", () => {
  beforeEach(() => {
    vi.mocked(useAdminOverview).mockReturnValue({
      data: emptyOverview,
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdminOverview>);
  });

  it("shows live queue counts instead of sample programs", () => {
    renderWithQueryClient(<AdminPage />);

    expect(screen.getByText("Eşleşme bekleyen takımlar")).toBeInTheDocument();
    expect(screen.getByText("Henüz program yok.")).toBeInTheDocument();
    expect(screen.queryByText("METU Stars 2026")).not.toBeInTheDocument();
  });
});
