import {
  EmailAudience,
  EmailRecipientStatus,
  type EmailCampaign,
  type EmailDraft,
  type EmailRecipient,
  type EmailTemplate,
} from "@/interfaces/email-center";

/** Off until a deployment turns it on; the backend has its own switch. */
export const EMAIL_CENTER_ENABLED =
  process.env.NEXT_PUBLIC_EMAIL_CENTER_ENABLED === "true";

export const EmailCenterPath = {
  Coordinator: "/coordinator/emails",
  Admin: "/admin/emails",
} as const;

export type EmailCenterPath =
  (typeof EmailCenterPath)[keyof typeof EmailCenterPath];

/** Codes the backend answers a refused send with. */
export const EmailSendRefusal = {
  ListChanged: "EMAIL_LIST_CHANGED",
  TestNeeded: "EMAIL_TEST_NEEDED",
  SendingOff: "EMAIL_SENDING_OFF",
} as const;

export const EMAIL_SUBJECT_MAX = 200;

const PROBLEMS: readonly EmailRecipientStatus[] = [
  EmailRecipientStatus.Bounced,
  EmailRecipientStatus.Complained,
  EmailRecipientStatus.Failed,
];

const ARRIVING: readonly EmailRecipientStatus[] = [
  EmailRecipientStatus.Sent,
  EmailRecipientStatus.Delivered,
];

function sumOf(
  campaign: EmailCampaign,
  statuses: readonly EmailRecipientStatus[],
) {
  return statuses.reduce(
    (total, status) => total + (campaign.counts[status] ?? 0),
    0,
  );
}

export function problemCount(campaign: EmailCampaign) {
  return sumOf(campaign, PROBLEMS);
}

export function sentCount(campaign: EmailCampaign) {
  return sumOf(campaign, ARRIVING);
}

/** The people a mail would go to, and the ones on the audience it would not. */
export function splitRecipients(recipients: readonly EmailRecipient[]) {
  return {
    offered: recipients.filter(
      (row) => row.status === EmailRecipientStatus.Reviewed,
    ),
    excluded: recipients.filter(
      (row) => row.status === EmailRecipientStatus.Excluded,
    ),
  };
}

/** What stands in the editor when nothing is written: only tags and blanks. */
export function isBlankHtml(html: string) {
  return html.replace(/<[^>]*>|&nbsp;|\s/g, "") === "";
}

export function isDraftComplete(draft: EmailDraft) {
  return (
    draft.programId !== "" &&
    draft.subject.trim() !== "" &&
    draft.subject.trim().length <= EMAIL_SUBJECT_MAX &&
    !isBlankHtml(draft.bodyHtml)
  );
}

export const EMPTY_EMAIL_DRAFT: EmailDraft = {
  programId: "",
  audience: EmailAudience.Participants,
  subject: "",
  bodyHtml: "",
};

export function draftFromTemplate(
  programId: string,
  { audience, subject, bodyHtml }: EmailTemplate,
): EmailDraft {
  return { programId, audience, subject, bodyHtml };
}

/** Where "Bu şablonu kullan" leads: a new mail of that program, starting with that text. */
export function templateHref(
  basePath: EmailCenterPath,
  programId: string,
  templateKey: string,
) {
  const query = new URLSearchParams({
    program: programId,
    template: templateKey,
  });
  return `${basePath}/new?${query}`;
}

export type EmailStartQuery = Record<string, string | string[] | undefined>;

/** Reads {@link templateHref}'s query; anything else starts an empty mail. */
export function startFromQuery({ program, template }: EmailStartQuery) {
  return {
    programId: typeof program === "string" ? program : "",
    templateKey: typeof template === "string" ? template : "",
  };
}

export function isSameDraft(left: EmailDraft, right: EmailDraft) {
  return (
    left.programId === right.programId &&
    left.audience === right.audience &&
    left.subject === right.subject &&
    left.bodyHtml === right.bodyHtml
  );
}
