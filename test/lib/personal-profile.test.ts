import { describe, expect, it } from "vitest";

import type { StoredDocument } from "@/lib/client/documents";
import {
  currentAvatar,
  mentorshipRowStatus,
  mentorshipSessionLabel,
  personalRoleLabel,
  personalSubtitle,
  profilePhotoError,
  startupSummary,
} from "@/lib/personal-profile";
import type { ActiveMentorshipRow } from "@/lib/startup-overview";

function row(
  overrides: Partial<ActiveMentorshipRow> = {},
): ActiveMentorshipRow {
  return {
    id: "r1",
    mentorName: "Nihan Öztürk",
    supportArea: "Ürün konumlandırma",
    heldSessions: 3,
    plannedSessions: 6,
    nextMeetingAt: null,
    ...overrides,
  };
}

function document(id: string, kind: string): StoredDocument {
  return { id, kind, originalFilename: `${id}.png`, sizeBytes: 10 };
}

describe("personalRoleLabel and personalSubtitle", () => {
  it("adds Kurucu for the founder and the startup at the end", () => {
    const role = personalRoleLabel("Product Designer", true);

    expect(role).toBe("Product Designer · Kurucu");
    expect(personalSubtitle(role, "Döngü")).toBe(
      "Product Designer · Kurucu · Döngü",
    );
  });

  it("leaves out what is missing", () => {
    expect(personalRoleLabel(null, true)).toBe("Kurucu");
    expect(personalRoleLabel("  ", false)).toBe("");
    expect(personalSubtitle("", undefined)).toBe("");
  });
});

describe("startupSummary", () => {
  it("joins funding stage, team size and maturity", () => {
    expect(
      startupSummary({
        fundingStage: "Pre-seed",
        teamSize: 4,
        maturity: "MVP yayında",
      }),
    ).toBe("Pre-seed · 4 kişilik ekip · MVP yayında");
    expect(
      startupSummary({ fundingStage: null, teamSize: 0, maturity: null }),
    ).toBe("");
  });
});

describe("mentorshipSessionLabel", () => {
  it("shows held of planned sessions, or only the held count without a plan", () => {
    expect(mentorshipSessionLabel(row())).toBe(
      "Ürün konumlandırma · 3/6 seans",
    );
    expect(
      mentorshipSessionLabel(row({ plannedSessions: null, heldSessions: 2 })),
    ).toBe("Ürün konumlandırma · 2 seans");
  });
});

describe("mentorshipRowStatus", () => {
  it("prefers the next meeting, then open actions, then nothing", () => {
    expect(
      mentorshipRowStatus(row({ nextMeetingAt: "2026-08-30T10:00:00" }), 2),
    ).toBe("Sonraki görüşme 30 Ağu");
    expect(mentorshipRowStatus(row(), 1)).toBe("1 açık aksiyon");
    expect(mentorshipRowStatus(row(), 0)).toBeNull();
  });
});

describe("currentAvatar", () => {
  it("takes the first avatar of a newest-first list", () => {
    expect(
      currentAvatar([
        document("logo", "logo"),
        document("new", "avatar"),
        document("old", "avatar"),
      ])?.id,
    ).toBe("new");
    expect(currentAvatar([document("logo", "logo")])).toBeNull();
  });
});

describe("profilePhotoError", () => {
  it("accepts PNG, JPG and WebP up to 5 MB only", () => {
    expect(
      profilePhotoError(new File(["x"], "me.png", { type: "image/png" })),
    ).toBeNull();
    expect(
      profilePhotoError(new File(["x"], "me.gif", { type: "image/gif" })),
    ).toBe("PNG, JPG veya WebP bir fotoğraf seç.");
    expect(
      profilePhotoError(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "me.jpg", {
          type: "image/jpeg",
        }),
      ),
    ).toBe("Fotoğraf en fazla 5 MB olabilir.");
  });
});
