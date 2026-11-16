import { describe, expect, it } from "vitest";

import { AnnouncementAudience } from "@/interfaces/program-announcement";
import {
  announcementThreads,
  audienceName,
  audienceOptions,
  audienceSummary,
} from "@/lib/program-announcements";
import { expectLength } from "@test/fixtures/list-assertions";
import { programAnnouncement } from "@test/fixtures/program-announcements";
import { translatorIn } from "@test/translators";

describe("program announcement helpers", () => {
  it("groups a viewer's announcements into one thread per program", () => {
    const threads = announcementThreads([
      programAnnouncement({ id: "a3", createdAt: "2026-09-27T10:00:00Z" }),
      programAnnouncement({
        id: "b1",
        programId: "program-2",
        programName: "Bilkent Cyberpark",
      }),
      programAnnouncement({ id: "a1", createdAt: "2026-09-20T10:00:00Z" }),
    ]);

    expect(threads.map((thread) => thread.programName)).toEqual([
      "METU Stars 2026",
      "Bilkent Cyberpark",
    ]);
    expectLength(threads, 2);
    expect(threads[0].latest?.id).toBe("a3");
    expect(threads[0].announcements.map((item) => item.id)).toEqual([
      "a3",
      "a1",
    ]);
  });

  it("keeps whether the program's teams are single participants", () => {
    const [thread] = announcementThreads([
      programAnnouncement({ individualProgram: true }),
    ]);
    expect(thread?.individualProgram).toBe(true);
  });

  describe("audience labels", () => {
    const t = translatorIn("tr", "announcements");
    const tEn = translatorIn("en", "announcements");

    it("counts in English with plurals", () => {
      expect(
        audienceSummary(
          programAnnouncement({
            audience: AnnouncementAudience.Mentors,
            mentorCount: 1,
          }),
          tEn,
        ),
      ).toBe("Mentors only · 1 mentor");
    });

    it("names each audience, with participants for an individual program", () => {
      expect(audienceOptions(false, t).map((option) => option.label)).toEqual([
        "Herkes",
        "Yalnızca mentorlar",
        "Yalnızca takımlar",
      ]);
      expect(audienceName(AnnouncementAudience.Participants, true, t)).toBe(
        "Yalnızca katılımcılar",
      );
    });

    it.each([
      [AnnouncementAudience.Everyone, false, "Herkes · 42 takım · 28 mentor"],
      [
        AnnouncementAudience.Everyone,
        true,
        "Herkes · 42 katılımcı · 28 mentor",
      ],
      [AnnouncementAudience.Mentors, false, "Yalnızca mentorlar · 28 mentor"],
      [
        AnnouncementAudience.Participants,
        false,
        "Yalnızca takımlar · 42 takım",
      ],
      [
        AnnouncementAudience.Participants,
        true,
        "Yalnızca katılımcılar · 42 katılımcı",
      ],
    ])(
      "summarises %s (individual: %s) as %s",
      (audience, individual, label) => {
        expect(
          audienceSummary(
            programAnnouncement({ audience, individualProgram: individual }),
            t,
          ),
        ).toBe(label);
      },
    );
  });
});
