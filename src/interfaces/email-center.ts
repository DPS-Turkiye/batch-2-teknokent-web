import type { UserAccountStatus } from "@/interfaces/session";

export enum EmailAudience {
  Participants = "PARTICIPANTS",
  Mentors = "MENTORS",
  Everyone = "EVERYONE",
  Unjoined = "UNJOINED",
}

export enum EmailRecipientKind {
  Participant = "PARTICIPANT",
  Mentor = "MENTOR",
  Unjoined = "UNJOINED",
}

export enum EmailCampaignStatus {
  Draft = "DRAFT",
  Sending = "SENDING",
  Sent = "SENT",
}

export enum EmailRecipientStatus {
  Excluded = "EXCLUDED",
  Reviewed = "REVIEWED",
  Unticked = "UNTICKED",
  Pending = "PENDING",
  Sending = "SENDING",
  Sent = "SENT",
  Delivered = "DELIVERED",
  Bounced = "BOUNCED",
  Complained = "COMPLAINED",
  Failed = "FAILED",
  Skipped = "SKIPPED",
}

export enum EmailExclusion {
  AccountNotApproved = "ACCOUNT_NOT_APPROVED",
  NoAddress = "NO_ADDRESS",
  NotEligible = "NOT_ELIGIBLE",
  Unsubscribed = "UNSUBSCRIBED",
  Undeliverable = "UNDELIVERABLE",
  NotOnAllowlist = "NOT_ON_ALLOWLIST",
}

export type EmailCampaign = {
  id: string;
  programId: string;
  programName: string;
  senderName: string;
  audience: EmailAudience;
  subject: string;
  status: EmailCampaignStatus;
  testSentAt: string | null;
  confirmedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  counts: Partial<Record<EmailRecipientStatus, number>>;
};

export type EmailRecipient = {
  id: string;
  fullName: string;
  address: string | null;
  teamName: string | null;
  kind: EmailRecipientKind;
  accountStatus: UserAccountStatus | null;
  status: EmailRecipientStatus;
  exclusion: EmailExclusion | null;
  errorCode: string | null;
  sentAt: string | null;
};

export type EmailCampaignDetail = {
  campaign: EmailCampaign;
  bodyHtml: string;
  replyTo: string | null;
  reviewDigest: string | null;
  recipients: EmailRecipient[];
};

export type EmailCenterOptions = {
  sendingOn: boolean;
  programs: { id: string; name: string }[];
};

export type EmailTemplate = {
  key: string;
  name: string;
  audience: EmailAudience;
  subject: string;
  bodyHtml: string;
};

export type EmailDraft = {
  programId: string;
  audience: EmailAudience;
  subject: string;
  bodyHtml: string;
};

export type EmailConfirmation = {
  reviewDigest: string;
  untickedIds: string[];
  expectedCount: number;
};
