import { describe, expect, it } from "vitest";

import {
  EmailAudience,
  EmailCampaignStatus,
  EmailExclusion,
  EmailRecipientStatus,
  EmailSkipReason,
} from "@/interfaces/email-center";
import {
  countdownLabel,
  EmailCenterPath,
  emailStepStates,
  findRecipients,
  holdSecondsLeft,
  isBlankHtml,
  isDraftComplete,
  isSameDraft,
  notReached,
  problemCount,
  recipientFilterOf,
  sentCount,
  skipReasonOf,
  splitRecipients,
  startFromQuery,
  statusCounts,
  templateHref,
} from "@/lib/email-center";
import { EmailStepState, RecipientFilter } from "@/types/email-center";
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

  it("leads from a template to a new mail of the program and back", () => {
    const href = templateHref(EmailCenterPath.Admin, "p 1", "inviteReminder");
    expect(href).toBe("/admin/emails/new?program=p+1&template=inviteReminder");
    const query = new URL(href, "http://x").searchParams;
    expect(startFromQuery(Object.fromEntries(query))).toEqual({
      programId: "p 1",
      templateKey: "inviteReminder",
    });
  });

  it("starts empty from a query it does not understand", () => {
    expect(startFromQuery({ program: ["a", "b"] })).toEqual({
      programId: "",
      templateKey: "",
    });
  });

  it("makes the first unfinished step the current one", () => {
    const { Done, Current, Waiting } = EmailStepState;
    const states = (isSaved: boolean, isTested: boolean, isReviewed: boolean) =>
      Object.values(emailStepStates({ isSaved, isTested, isReviewed }));
    expect(states(false, false, false)).toEqual([
      Current,
      Waiting,
      Waiting,
      Waiting,
    ]);
    expect(states(true, false, true)).toEqual([
      Done,
      Current,
      Waiting,
      Waiting,
    ]);
    expect(states(true, true, true)).toEqual([Done, Done, Done, Current]);
  });

  it("finds people by name, address or team in Turkish, and by outcome", () => {
    const irem = emailRecipient({ id: "1", fullName: "İrem Işık" });
    const bounced = emailRecipient({
      id: "2",
      fullName: "Can",
      address: null,
      teamName: null,
      status: EmailRecipientStatus.Bounced,
    });
    const people = [irem, bounced];
    expect(findRecipients(people, " irem ışık ")).toEqual([irem]);
    expect(findRecipients(people, "GREENLOOP")).toEqual([irem]);
    expect(findRecipients(people, "", RecipientFilter.NotReached)).toEqual([
      bounced,
    ]);
    expect(notReached(people)).toEqual([bounced]);
    expect(recipientFilterOf(EmailRecipientStatus.Delivered)).toBe(
      RecipientFilter.Reached,
    );
    expect(recipientFilterOf(EmailRecipientStatus.Skipped)).toBe(
      RecipientFilter.Other,
    );
  });

  it("counts down to the end of the hold and not below zero", () => {
    const now = new Date("2026-11-23T10:00:00Z");
    const at = (
      startsAt: string | null,
      status = EmailCampaignStatus.Sending,
    ) => holdSecondsLeft(emailCampaign({ status, startsAt }), now);
    expect(at("2026-11-23T10:04:31.200Z")).toBe(272);
    expect(at("2026-11-23T09:59:00Z")).toBe(0);
    expect(at(null)).toBe(0);
    expect(at("2026-11-23T10:04:00Z", EmailCampaignStatus.Stopped)).toBe(0);
    expect(countdownLabel(272)).toBe("4:32");
    expect(countdownLabel(5)).toBe("0:05");
  });

  it("names why somebody was skipped, and nothing for other rows or codes", () => {
    const row = (status: EmailRecipientStatus, errorCode: string | null) =>
      skipReasonOf(emailRecipient({ status, errorCode }));
    expect(row(EmailRecipientStatus.Skipped, "EXPIRED")).toBe(
      EmailSkipReason.Expired,
    );
    expect(row(EmailRecipientStatus.Skipped, "SOMETHING_NEW")).toBeNull();
    expect(row(EmailRecipientStatus.Failed, "STOPPED")).toBeNull();
  });

  it("lists only the statuses somebody has", () => {
    expect(
      statusCounts(
        emailCampaign({
          counts: {
            [EmailRecipientStatus.Failed]: 1,
            [EmailRecipientStatus.Sent]: 4,
            [EmailRecipientStatus.Bounced]: 0,
          },
        }),
      ),
    ).toEqual([
      { status: EmailRecipientStatus.Sent, count: 4 },
      { status: EmailRecipientStatus.Failed, count: 1 },
    ]);
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
