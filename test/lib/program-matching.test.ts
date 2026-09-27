import { describe, expect, it } from "vitest";

import {
  type MatchCandidate,
  MatchNeedSource,
  type WaitingTeam,
} from "@/interfaces/program-matching";
import {
  filterPool,
  isFull,
  loadAfterMatch,
  needLabel,
  teamMeta,
  waitingLabel,
} from "@/lib/program-matching";

const candidate: MatchCandidate = {
  mentorId: "nihan",
  fullName: "Nihan Öztürk",
  title: "UX/UI & Ürün stratejisi",
  specialties: ["Pazarlama"],
  availability: null,
  activeTeams: 3,
  capacity: 4,
  reasons: [],
};
const team: WaitingTeam = {
  organizationId: "terra",
  name: "Terra",
  sector: "E-ticaret",
  stage: null,
  leadName: "Mert Aydın",
  waitingDays: 0,
  needSource: MatchNeedSource.None,
  needTopic: null,
  needText: null,
};

describe("program matching helpers", () => {
  it("describes load, capacity and the team", () => {
    expect(loadAfterMatch(candidate)).toBe("Yük 3/4 → 4/4 olacak");
    expect(isFull(candidate)).toBe(false);
    expect(isFull({ ...candidate, activeTeams: 4 })).toBe(true);
    expect(teamMeta(team)).toBe("E-ticaret · Yetkili: Mert Aydın");
    expect(needLabel(team)).toBe("İhtiyaç belirtilmedi");
    expect(waitingLabel(0)).toBe("bugün");
  });

  it("searches the pool by name, title or specialty", () => {
    expect(filterPool([candidate], "pazar")).toEqual([candidate]);
    expect(filterPool([candidate], "hukuk")).toEqual([]);
    expect(filterPool([candidate], "  ")).toEqual([]);
  });
});
