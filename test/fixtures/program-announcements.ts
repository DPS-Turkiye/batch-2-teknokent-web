import { vi } from "vitest";

import type { MyAnnouncements } from "@/hooks/use-program-announcements";
import type { ProgramAnnouncement } from "@/interfaces/program-announcement";

export function programAnnouncement(
  overrides: Partial<ProgramAnnouncement> = {},
): ProgramAnnouncement {
  return {
    id: "announcement-1",
    programId: "program-1",
    programName: "METU Stars 2026",
    authorName: "Elif Demir",
    body: "Ürün-Pazar Uyumu Atölyesi bugün 16:00'da",
    createdAt: "2026-09-27T09:00:00Z",
    teamCount: 42,
    mentorCount: 28,
    ...overrides,
  };
}

export function myAnnouncementsStub(
  overrides: Partial<MyAnnouncements> = {},
): MyAnnouncements {
  return {
    threads: [],
    openProgramId: null,
    active: null,
    open: vi.fn(),
    close: vi.fn(),
    ...overrides,
  };
}
