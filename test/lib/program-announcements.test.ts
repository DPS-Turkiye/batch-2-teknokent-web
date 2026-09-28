import { describe, expect, it } from "vitest";

import {
  announcementThreadName,
  announcementThreads,
  audienceLabel,
} from "@/lib/program-announcements";
import { programAnnouncement } from "@test/fixtures/program-announcements";

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
    expect(threads[0].latest?.id).toBe("a3");
    expect(threads[0].announcements.map((item) => item.id)).toEqual([
      "a3",
      "a1",
    ]);
  });

  it("names the thread and its audience", () => {
    expect(announcementThreadName("METU Stars 2026")).toBe(
      "METU Stars 2026 — Duyuru",
    );
    expect(audienceLabel(programAnnouncement())).toBe("42 takım · 28 mentor");
    expect(audienceLabel(null)).toBe("Henüz duyuru yok");
  });
});
