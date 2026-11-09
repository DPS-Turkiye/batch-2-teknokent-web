import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BadgeChips } from "@/components/badges/badge-chips";
import { BadgeCode, BadgeKind, type PublicBadge } from "@/interfaces/badges";
import { InLocale } from "@test/test-utils";

const at = "2026-11-08T10:00:00Z";
const badges: PublicBadge[] = [
  {
    code: BadgeCode.PeerMentor,
    kind: BadgeKind.Gate,
    programId: "p1",
    awardedAt: at,
  },
  {
    code: BadgeCode.Sessions10,
    kind: BadgeKind.Achievement,
    programId: null,
    awardedAt: at,
  },
  {
    code: BadgeCode.WellRated,
    kind: BadgeKind.Achievement,
    programId: null,
    awardedAt: at,
  },
  {
    code: BadgeCode.Hours25,
    kind: BadgeKind.Achievement,
    programId: null,
    awardedAt: at,
  },
];

function show(props: Partial<Parameters<typeof BadgeChips>[0]> = {}) {
  render(
    <InLocale locale="tr">
      <BadgeChips badges={badges} {...props} />
    </InLocale>,
  );
}

describe("BadgeChips", () => {
  // On a mentor card the gate badge is implied by being listed (D5).
  it("shows achievements only, at most max, and counts the rest", () => {
    show({ max: 2 });
    expect(screen.getByText("10 Görüşme")).toBeInTheDocument();
    expect(screen.getByText("Mentee'lerin Tavsiyesi")).toBeInTheDocument();
    expect(screen.queryByText("25 Saat Mentorluk")).not.toBeInTheDocument();
    expect(screen.queryByText("Akran Mentoru")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("can include the gate badge, e.g. on the person's own profile", () => {
    show({ includeGate: true });
    expect(screen.getByText("Akran Mentoru")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
  });

  it("renders nothing without achievements", () => {
    render(
      <InLocale locale="tr">
        <BadgeChips badges={[badges[0]]} />
      </InLocale>,
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
