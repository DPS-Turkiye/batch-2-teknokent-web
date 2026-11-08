import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MyBadgesSection } from "@/components/badges/my-badges-section";
import {
  BadgeCode,
  BadgeKind,
  BadgeSource,
  BadgeStatus,
  type BadgeAward,
} from "@/interfaces/badges";
import { getMyBadges } from "@/lib/client/badges";
import { renderWithQueryClient } from "@test/test-utils";

vi.mock("@/lib/client/badges", () => ({ getMyBadges: vi.fn() }));

function award(overrides: Partial<BadgeAward>): BadgeAward {
  return {
    id: "a1",
    code: BadgeCode.PeerMentor,
    kind: BadgeKind.Gate,
    programId: "p1",
    programName: "İŞKUR 2026 Bahar",
    status: BadgeStatus.Active,
    source: BadgeSource.Coordinator,
    awardedAt: "2026-11-08T10:00:00Z",
    expiresAt: null,
    revokedAt: null,
    reason: null,
    ...overrides,
  };
}

describe("MyBadgesSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists active badges first and shows why one was taken back", async () => {
    vi.mocked(getMyBadges).mockResolvedValue([
      award({
        id: "old",
        status: BadgeStatus.Revoked,
        revokedAt: "2026-11-09T10:00:00Z",
        reason: "Görüşmelere gelmedi",
      }),
      award({
        id: "new",
        code: BadgeCode.FirstSession,
        kind: BadgeKind.Achievement,
        programName: null,
      }),
    ]);
    renderWithQueryClient(<MyBadgesSection />);

    const items = await screen.findAllByRole("listitem");
    expect(items[0]).toHaveTextContent("İlk Görüşme");
    expect(items[1]).toHaveTextContent("Akran Mentoru");
    expect(items[1]).toHaveTextContent("Geri alındı");
    expect(items[1]).toHaveTextContent(
      "Geri alınma nedeni: Görüşmelere gelmedi",
    );
    expect(items[1]).toHaveTextContent("İŞKUR 2026 Bahar");
  });

  it("says when there are no badges yet", async () => {
    vi.mocked(getMyBadges).mockResolvedValue([]);
    renderWithQueryClient(<MyBadgesSection />);
    expect(await screen.findByText("Henüz rozetin yok.")).toBeInTheDocument();
  });
});
