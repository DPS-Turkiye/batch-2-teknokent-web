import {
  EmailAudience,
  EmailCampaignStatus,
  EmailRecipientStatus,
  EmailSkipReason,
  type EmailCampaign,
  type EmailDraft,
  type EmailRecipient,
  type EmailTemplate,
} from "@/interfaces/email-center";
import { isEnumValue } from "@/lib/enum";
import {
  EmailStep,
  EmailStepState,
  RecipientFilter,
  type StatusTone,
} from "@/types/email-center";

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

/** Seconds until a confirmed mail starts to leave; 0 once it may, or when it is not being sent. */
export function holdSecondsLeft(campaign: EmailCampaign, now: Date) {
  if (
    campaign.status !== EmailCampaignStatus.Sending ||
    campaign.startsAt === null
  )
    return 0;
  const left = Date.parse(campaign.startsAt) - now.getTime();
  return Math.max(0, Math.ceil(left / 1000));
}

/** 272 → "4:32" */
export function countdownLabel(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function skipReasonOf(recipient: EmailRecipient) {
  return recipient.status === EmailRecipientStatus.Skipped &&
    isEnumValue(EmailSkipReason, recipient.errorCode)
    ? recipient.errorCode
    : null;
}

export function notReached(recipients: readonly EmailRecipient[]) {
  return recipients.filter((row) => PROBLEMS.includes(row.status));
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

export const CAMPAIGN_TONES: Record<EmailCampaignStatus, StatusTone> = {
  [EmailCampaignStatus.Draft]: "neutral",
  [EmailCampaignStatus.Sending]: "blue",
  [EmailCampaignStatus.Sent]: "green",
  [EmailCampaignStatus.Stopped]: "amber",
};

export const RECIPIENT_TONES: Record<EmailRecipientStatus, StatusTone> = {
  [EmailRecipientStatus.Excluded]: "neutral",
  [EmailRecipientStatus.Reviewed]: "green",
  [EmailRecipientStatus.Unticked]: "neutral",
  [EmailRecipientStatus.Pending]: "blue",
  [EmailRecipientStatus.Sending]: "blue",
  [EmailRecipientStatus.Sent]: "green",
  [EmailRecipientStatus.Delivered]: "green",
  [EmailRecipientStatus.Bounced]: "red",
  [EmailRecipientStatus.Complained]: "red",
  [EmailRecipientStatus.Failed]: "red",
  [EmailRecipientStatus.Skipped]: "amber",
};

/** Where the writer stands: the first step that is not done is the current one, and those after it wait. */
export function emailStepStates(done: {
  isSaved: boolean;
  isTested: boolean;
  isReviewed: boolean;
}): Record<EmailStep, EmailStepState> {
  const order = [
    { step: EmailStep.Write, isDone: done.isSaved },
    { step: EmailStep.Test, isDone: done.isTested },
    { step: EmailStep.Review, isDone: done.isReviewed },
    { step: EmailStep.Send, isDone: false },
  ];
  const current = order.findIndex((row) => !row.isDone);
  const stateAt = (index: number) =>
    index < current
      ? EmailStepState.Done
      : index === current
        ? EmailStepState.Current
        : EmailStepState.Waiting;
  return {
    [EmailStep.Write]: stateAt(0),
    [EmailStep.Test]: stateAt(1),
    [EmailStep.Review]: stateAt(2),
    [EmailStep.Send]: stateAt(3),
  };
}

export function recipientFilterOf(status: EmailRecipientStatus) {
  if (PROBLEMS.includes(status)) return RecipientFilter.NotReached;
  if (ARRIVING.includes(status)) return RecipientFilter.Reached;
  return RecipientFilter.Other;
}

/** By name, address or team, the way Turkish letters are cased. */
export function findRecipients(
  recipients: readonly EmailRecipient[],
  search: string,
  filter: RecipientFilter = RecipientFilter.All,
) {
  const needle = search.trim().toLocaleLowerCase("tr");
  return recipients.filter(
    (row) =>
      (filter === RecipientFilter.All ||
        recipientFilterOf(row.status) === filter) &&
      [row.fullName, row.address, row.teamName].some((value) =>
        (value ?? "").toLocaleLowerCase("tr").includes(needle),
      ),
  );
}

/** How many recipients have each status, in the order the statuses are declared. */
export function statusCounts(campaign: EmailCampaign) {
  return Object.values(EmailRecipientStatus).flatMap((status) => {
    const count = campaign.counts[status] ?? 0;
    return count > 0 ? [{ status, count }] : [];
  });
}
