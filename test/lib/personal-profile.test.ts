import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import type { StoredDocument } from "@/lib/client/documents";
import {
  currentAvatar,
  mentorshipRowStatus,
  mentorshipSessionLabel,
  personalRoleLabel,
  personalSubtitle,
  type PersonalProfileTexts,
  profilePhotoError,
  startupSummary,
} from "@/lib/personal-profile";
import type { ActiveMentorshipRow } from "@/lib/startup-overview";
import en from "@/messages/en.json";
import tr from "@/messages/tr.json";

function profileTexts(locale: "tr" | "en"): PersonalProfileTexts {
  return {
    t: createTranslator({
      locale,
      messages: locale === "en" ? en : tr,
      namespace: "personalProfile",
    }),
    locale,
  };
}
const texts = profileTexts("tr");

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
    const role = personalRoleLabel("Product Designer", true, texts);

    expect(role).toBe("Product Designer · Kurucu");
    expect(personalSubtitle(role, "Döngü")).toBe(
      "Product Designer · Kurucu · Döngü",
    );
  });

  it("does not repeat Kurucu when the job title already says it", () => {
    expect(personalRoleLabel("Kurucu", true, texts)).toBe("Kurucu");
    expect(personalRoleLabel(" founder ", true, texts)).toBe("founder");
    expect(personalRoleLabel("Kurucu Ortak", true, texts)).toBe(
      "Kurucu Ortak · Kurucu",
    );
  });

  it("leaves out what is missing", () => {
    expect(personalRoleLabel(null, true, texts)).toBe("Kurucu");
    expect(personalRoleLabel("  ", false, texts)).toBe("");
    expect(personalSubtitle("", undefined)).toBe("");
  });
});

describe("startupSummary", () => {
  it("joins funding stage, team size and maturity", () => {
    expect(
      startupSummary(
        {
          fundingStage: "Pre-seed",
          teamSize: 4,
          maturity: "MVP yayında",
        },
        texts,
      ),
    ).toBe("Pre-seed · 4 kişilik ekip · MVP yayında");
    expect(
      startupSummary(
        { fundingStage: null, teamSize: 0, maturity: null },
        texts,
      ),
    ).toBe("");
  });
});

describe("mentorshipSessionLabel", () => {
  it("shows held of planned sessions, or only the held count without a plan", () => {
    expect(mentorshipSessionLabel(row(), texts)).toBe(
      "Ürün konumlandırma · 3/6 seans",
    );
    expect(
      mentorshipSessionLabel(
        row({ plannedSessions: null, heldSessions: 2 }),
        texts,
      ),
    ).toBe("Ürün konumlandırma · 2 seans");
  });
});

describe("mentorshipRowStatus", () => {
  it("prefers open actions, then the next meeting, then nothing", () => {
    const booked = row({ nextMeetingAt: "2026-08-30T10:00:00" });

    expect(mentorshipRowStatus(booked, 2, texts)).toBe("2 açık aksiyon");
    expect(mentorshipRowStatus(booked, 0, texts)).toBe(
      "Sonraki görüşme 30 Ağu",
    );
    expect(mentorshipRowStatus(row(), 0, texts)).toBeNull();
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
    ).toBe("photoType");
    expect(
      profilePhotoError(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], "me.jpg", {
          type: "image/jpeg",
        }),
      ),
    ).toBe("photoSize");
  });
});

describe("personal profile labels in English", () => {
  it("writes the role, team size and status in English", () => {
    const english = profileTexts("en");
    const booked = row({ nextMeetingAt: "2026-08-30T10:00:00" });

    expect(personalRoleLabel("Product Designer", true, english)).toBe(
      "Product Designer · Founder",
    );
    expect(
      startupSummary(
        { fundingStage: null, teamSize: 4, maturity: null },
        english,
      ),
    ).toBe("team of 4");
    expect(mentorshipRowStatus(booked, 1, english)).toBe("1 open action");
    expect(mentorshipRowStatus(booked, 0, english)).toBe("Next meeting Aug 30");
  });
});
