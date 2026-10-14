import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import {
  type MatchCandidate,
  MatchNeedSource,
  type WaitingTeam,
} from "@/interfaces/program-matching";
import { MentorshipStatus } from "@/interfaces/coordinator-mentorship";
import {
  filterPool,
  findMatch,
  isFull,
  loadAfterMatch,
  teamMeta,
  waitingLabel,
} from "@/lib/program-matching";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

const t = createTranslator({
  locale: "tr",
  messages: tr,
  namespace: "programMatching",
});
const tEn = createTranslator({
  locale: "en",
  messages: en,
  namespace: "programMatching",
});

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
    expect(loadAfterMatch(candidate, t)).toBe("Yük 3/4 → 4/4 olacak");
    expect(loadAfterMatch(candidate, tEn)).toBe("Load 3/4 → will be 4/4");
    expect(isFull(candidate)).toBe(false);
    expect(isFull({ ...candidate, activeTeams: 4 })).toBe(true);
    expect(teamMeta(team, null, t)).toBe("E-ticaret · Yetkili: Mert Aydın");
    expect(teamMeta(team, null, tEn)).toBe("E-ticaret · Lead: Mert Aydın");
    expect(waitingLabel(0, t)).toBe("bugün");
    expect(waitingLabel(3, tEn)).toBe("3 days");
  });

  it("searches the pool by name, title or specialty", () => {
    expect(filterPool([candidate], "pazar")).toEqual([candidate]);
    expect(filterPool([candidate], "hukuk")).toEqual([]);
    expect(filterPool([candidate], "  ")).toEqual([]);
  });

  it("finds the mentorship a match just created", () => {
    const match = {
      mentorshipId: "m-new",
      organizationId: "terra",
      teamName: "Terra",
      mentorId: "nihan",
      mentorName: "Nihan Öztürk",
      status: MentorshipStatus.Active,
      startDate: "2026-09-27",
      endDate: null,
    };
    const overview = { waiting: [], active: [match], past: [] };

    expect(findMatch(overview, "terra", "nihan")?.mentorshipId).toBe("m-new");
    expect(findMatch(overview, "terra", "kerem")).toBeNull();
  });
});
