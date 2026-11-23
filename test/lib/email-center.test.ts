import { describe, expect, it } from "vitest";

import {
  EmailAudience,
  EmailExclusion,
  EmailRecipientStatus,
} from "@/interfaces/email-center";
import {
  isBlankHtml,
  isDraftComplete,
  isSameDraft,
  problemCount,
  sentCount,
  splitRecipients,
} from "@/lib/email-center";
import { emailCampaign, emailRecipient } from "@test/fixtures/email-center";

const draft = {
  programId: "p",
  audience: EmailAudience.Mentors,
  subject: "Konu",
  bodyHtml: "<p>Metin</p>",
};

describe("email center rules", () => {
  it("counts what arrived and what did not", () => {
    const campaign = emailCampaign({
      counts: {
        [EmailRecipientStatus.Sent]: 2,
        [EmailRecipientStatus.Delivered]: 3,
        [EmailRecipientStatus.Bounced]: 1,
        [EmailRecipientStatus.Complained]: 1,
        [EmailRecipientStatus.Failed]: 1,
        [EmailRecipientStatus.Unticked]: 9,
      },
    });
    expect(sentCount(campaign)).toBe(5);
    expect(problemCount(campaign)).toBe(3);
  });

  it("separates the people to write to from the ones left out", () => {
    const offered = emailRecipient();
    const excluded = emailRecipient({
      id: "x",
      status: EmailRecipientStatus.Excluded,
      exclusion: EmailExclusion.Unsubscribed,
    });
    expect(splitRecipients([offered, excluded])).toEqual({
      offered: [offered],
      excluded: [excluded],
    });
  });

  it("treats markup without text as blank", () => {
    expect(isBlankHtml("<p>&nbsp; </p><br>")).toBe(true);
    expect(isBlankHtml("<p>a</p>")).toBe(false);
  });

  it("wants a program, a subject and a text", () => {
    expect(isDraftComplete(draft)).toBe(true);
    expect(isDraftComplete({ ...draft, programId: "" })).toBe(false);
    expect(isDraftComplete({ ...draft, subject: "  " })).toBe(false);
    expect(isDraftComplete({ ...draft, subject: "a".repeat(201) })).toBe(false);
    expect(isDraftComplete({ ...draft, bodyHtml: "<p></p>" })).toBe(false);
  });

  it("notices any changed field", () => {
    expect(isSameDraft(draft, { ...draft })).toBe(true);
    expect(isSameDraft(draft, { ...draft, programId: "q" })).toBe(false);
    expect(
      isSameDraft(draft, { ...draft, audience: EmailAudience.Everyone }),
    ).toBe(false);
    expect(isSameDraft(draft, { ...draft, subject: "b" })).toBe(false);
    expect(isSameDraft(draft, { ...draft, bodyHtml: "b" })).toBe(false);
  });
});
