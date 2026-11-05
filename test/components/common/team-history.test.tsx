import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TeamHistory } from "@/components/common/team-history";
import { UserAccountStatus } from "@/interfaces/session";
import { TeamExitReason } from "@/interfaces/team-change";
import { getTeamHistory } from "@/lib/client/team-changes";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/team-changes", () => ({ getTeamHistory: vi.fn() }));

describe("TeamHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads only when opened and lists every startup with how it ended", async () => {
    vi.mocked(getTeamHistory).mockResolvedValue({
      userId: "u1",
      fullName: "Selin Ak",
      stays: [
        {
          organizationId: "o2",
          organizationName: "Kargo AI",
          joinedAt: "2026-10-01T09:00:00Z",
          leftAt: null,
          exitReason: null,
          startupApproval: UserAccountStatus.Approved,
          startupArchived: false,
        },
        {
          organizationId: "o1",
          organizationName: "Döngü",
          joinedAt: "2026-06-12T09:00:00Z",
          leftAt: "2026-09-20T09:00:00Z",
          exitReason: TeamExitReason.Removed,
          startupApproval: UserAccountStatus.Rejected,
          startupArchived: true,
        },
      ],
    });
    const user = userEvent.setup();
    renderWithQueryClient(<TeamHistory userId="u1" />);

    expect(getTeamHistory).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Takım geçmişi" }));

    expect(await screen.findByText("Kargo AI")).toBeInTheDocument();
    expect(getTeamHistory).toHaveBeenCalledWith("u1");
    expect(screen.getByText(/1 Eki 2026 tarihinden beri/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /12 Haz 2026 – 20 Eyl 2026, çıkarıldı · arşivlendi · startup reddedildi/,
      ),
    ).toBeInTheDocument();
  });
});
