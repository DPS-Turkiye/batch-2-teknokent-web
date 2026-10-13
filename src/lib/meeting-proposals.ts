import { type MeetingItem, MeetingStatus } from "@/interfaces/meeting";
import {
  type MeetingProposal,
  MeetingProposalStatus,
} from "@/interfaces/meeting-proposal";

export const PROPOSAL_DURATIONS = [30, 45, 60, 90] as const;
export const DEFAULT_PROPOSAL_DURATION = 45;
export const MAX_PROPOSAL_AGENDA = 500;

/** "18 Eylül Perşembe 10:30" */
export function proposalWhen(proposal: MeetingProposal, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(proposal.scheduledAt));
}

/** "18 Eylül Perşembe 10:30 · 45 dk" */
export function proposalWhenLabel(proposal: MeetingProposal) {
  return `${proposalWhen(proposal, "tr")} · ${proposal.durationMinutes} dk`;
}

export function openProposal(proposals: MeetingProposal[]) {
  return (
    proposals.find(
      (proposal) => proposal.status === MeetingProposalStatus.Pending,
    ) ?? null
  );
}

/** The latest settled proposal worth showing next to a new one: a decline, with its reason. */
export function lastDeclined(proposals: MeetingProposal[]) {
  const latest = proposals[0];
  return latest?.status === MeetingProposalStatus.Declined ? latest : null;
}

export function sideLabel(acceptedAt: string | null) {
  return acceptedAt ? "Onayladı" : "Yanıt bekleniyor";
}

/** Tomorrow at 10:00, as a datetime-local value. */
export function defaultProposalStart(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  return start;
}

export enum StepState {
  Done = "DONE",
  Waiting = "WAITING",
  Todo = "TODO",
}

/** The "Tanışma görüşmesi" step of İlk adımlar, from the mentorship's newest proposal. */
export function introStep(latest: MeetingProposal | null) {
  if (!latest) return { state: StepState.Todo, detail: "Henüz önerilmedi" };
  const when = proposalWhenLabel(latest);
  switch (latest.status) {
    case MeetingProposalStatus.Confirmed:
      return { state: StepState.Done, detail: `${when} · iki taraf onayladı` };
    case MeetingProposalStatus.Pending:
      return {
        state: StepState.Waiting,
        detail: `${when} önerildi · yanıt bekleniyor`,
      };
    case MeetingProposalStatus.Declined:
      return {
        state: StepState.Todo,
        detail: `${when} önerisi reddedildi${latest.declineReason ? `: ${latest.declineReason}` : ""}`,
      };
    default:
      return { state: StepState.Todo, detail: "Öneri geri çekildi" };
  }
}

/** Only a planned meeting that hasn't started yet can be moved. */
export function canReschedule(meeting: MeetingItem, now = new Date()) {
  return (
    meeting.status === MeetingStatus.Scheduled &&
    new Date(meeting.scheduledAt).getTime() > now.getTime()
  );
}
