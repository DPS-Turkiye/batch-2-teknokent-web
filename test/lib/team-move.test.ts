import { describe, expect, it } from "vitest";

import { UserAccountStatus, UserRole } from "@/interfaces/session";
import { TeamExitReason } from "@/interfaces/team-change";
import { TeamMoveBlock } from "@/interfaces/team-move";
import {
  canOfferTeamMove,
  filterTeamMoveTargets,
  TEAM_MOVE_BLOCK_KEYS,
  teamExitKey,
  teamMoveLabel,
} from "@/lib/team-move";
import { menteeSummary } from "@test/fixtures/person-summary";
import { teamMoveTeam } from "@test/fixtures/team-moves";

const tree = teamMoveTeam({
  organizationId: "o1",
  name: "Ağaç",
  programName: "Kuluçka 2026",
});
const market = teamMoveTeam({
  organizationId: "o2",
  name: "Pazar Lab",
  programName: "Hızlandırma 2026",
});
const loose = teamMoveTeam({
  organizationId: "o3",
  name: "İzmir Kod",
  programId: null,
  programName: null,
});

describe("filterTeamMoveTargets", () => {
  it("keeps every team for an empty or blank search", () => {
    expect(filterTeamMoveTargets([tree, market], "  ")).toEqual([tree, market]);
  });

  it("matches the team or its program, ignoring case the Turkish way", () => {
    expect(filterTeamMoveTargets([tree, market, loose], "pazar")).toEqual([
      market,
    ]);
    expect(filterTeamMoveTargets([tree, market, loose], "HIZLANDIRMA")).toEqual(
      [market],
    );
    expect(filterTeamMoveTargets([tree, market, loose], "izmir")).toEqual([
      loose,
    ]);
  });

  it("finds nothing when no team or program contains the text", () => {
    expect(filterTeamMoveTargets([tree, market], "rüzgar")).toEqual([]);
  });
});

describe("TEAM_MOVE_BLOCK_KEYS", () => {
  it("names an explanation for every refusal the backend sends", () => {
    expect(TEAM_MOVE_BLOCK_KEYS[TeamMoveBlock.Founder]).toBe("founder");
    expect(Object.keys(TEAM_MOVE_BLOCK_KEYS).sort()).toEqual(
      Object.values(TeamMoveBlock).sort(),
    );
  });
});

describe("canOfferTeamMove", () => {
  const member = menteeSummary({ status: UserAccountStatus.Approved });

  it("offers the move for an approved startup member", () => {
    expect(canOfferTeamMove(member)).toBe(true);
  });

  it("hides it for someone without a startup, a pending account and staff", () => {
    expect(canOfferTeamMove({ ...member, startup: null })).toBe(false);
    expect(
      canOfferTeamMove({ ...member, status: UserAccountStatus.Pending }),
    ).toBe(false);
    expect(canOfferTeamMove({ ...member, role: UserRole.Mentor })).toBe(false);
  });
});

describe("teamMoveLabel", () => {
  it("names the program next to the team, or the team alone", () => {
    expect(teamMoveLabel(tree)).toBe("Ağaç · Kuluçka 2026");
    expect(teamMoveLabel(loose)).toBe("İzmir Kod");
  });
});

describe("teamExitKey", () => {
  it("reads every exit reason, and an old row without one as a leave", () => {
    expect(teamExitKey(TeamExitReason.Left)).toBe("left");
    expect(teamExitKey(TeamExitReason.Removed)).toBe("removed");
    expect(teamExitKey(TeamExitReason.Moved)).toBe("moved");
    expect(teamExitKey(null)).toBe("left");
  });
});
