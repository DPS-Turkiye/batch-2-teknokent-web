import {
  EmailAudience,
  EmailCampaignStatus,
  EmailRecipientKind,
  EmailRecipientStatus,
  type EmailCampaign,
  type EmailCampaignDetail,
  type EmailRecipient,
} from "@/interfaces/email-center";
import { UserAccountStatus } from "@/interfaces/session";

export function emailCampaign(
  overrides: Partial<EmailCampaign> = {},
): EmailCampaign {
  return {
    id: "30000000-0000-4000-8000-000000000001",
    programId: "10000000-0000-4000-8000-000000000001",
    programName: "Build '26",
    senderName: "Elif Koordinatör",
    audience: EmailAudience.Participants,
    subject: "Duyuru konusu",
    status: EmailCampaignStatus.Draft,
    testSentAt: null,
    confirmedAt: null,
    finishedAt: null,
    createdAt: "2026-11-23T08:00:00Z",
    counts: {},
    ...overrides,
  };
}

export function emailRecipient(
  overrides: Partial<EmailRecipient> = {},
): EmailRecipient {
  return {
    id: "40000000-0000-4000-8000-000000000001",
    fullName: "Ayşe Kurucu",
    address: "ayse@example.test",
    teamName: "GreenLoop",
    kind: EmailRecipientKind.Participant,
    accountStatus: UserAccountStatus.Approved,
    status: EmailRecipientStatus.Reviewed,
    exclusion: null,
    errorCode: null,
    sentAt: null,
    ...overrides,
  };
}

export function emailDetail(
  overrides: Partial<EmailCampaignDetail> = {},
): EmailCampaignDetail {
  return {
    campaign: emailCampaign(),
    bodyHtml: "<p>Merhaba</p>",
    replyTo: "elif@example.test",
    reviewDigest: null,
    recipients: [],
    ...overrides,
  };
}
