import type { MeetingItem } from "@/interfaces/meeting";
import type { MentorshipRequest } from "@/interfaces/mentorship-request";
import type { MeetingFeedbackPayload } from "@/lib/client/meetings";
import {
  MENTOR_EVALUATION_QUESTION_COUNT,
  OUTCOME_CLARITY_RATINGS,
} from "@/lib/const/mentor-evaluation";
import type { OutcomeClarity } from "@/types/mentor-evaluation";

export type MentorEvaluationAnswers = {
  preparedness: number | null;
  qualities: string[];
  clarity: OutcomeClarity | null;
  note: string;
};

export function mentorMeetingEvaluationHref(meetingId: string) {
  return `/mentor-dashboard/meetings/${encodeURIComponent(meetingId)}/evaluation`;
}

export function answeredQuestionCount(answers: MentorEvaluationAnswers) {
  return [
    answers.preparedness != null,
    answers.qualities.length > 0,
    answers.clarity != null,
  ].filter(Boolean).length;
}

export function isEvaluationComplete(answers: MentorEvaluationAnswers) {
  return answeredQuestionCount(answers) === MENTOR_EVALUATION_QUESTION_COUNT;
}

/**
 * The mentor's answers in the shared meeting feedback shape: preparedness and
 * clarity as the two ratings, the chosen qualities and then the note as the
 * benefits, the way the mentee form already stores its note.
 */
export function evaluationPayload(
  answers: MentorEvaluationAnswers,
): MeetingFeedbackPayload {
  const note = answers.note.trim();
  return {
    ratings: [
      answers.preparedness ?? 0,
      answers.clarity ? OUTCOME_CLARITY_RATINGS[answers.clarity] : 0,
    ],
    benefits: note ? [...answers.qualities, note] : [...answers.qualities],
  };
}

/** "Döngü · Gülse · UX Flow Review · 5 Eylül · 14:00 · 45 dk" */
export function evaluationMeetingMeta(
  meeting: MeetingItem,
  request: MentorshipRequest | undefined,
  { minutes, locale }: { minutes: (count: number) => string; locale: string },
) {
  const start = new Date(meeting.scheduledAt);
  const day = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(start);
  const time = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);
  return [
    meeting.organizationName ?? request?.organizationName,
    request?.requesterName?.trim().split(/\s+/)[0],
    meeting.agenda?.trim() || request?.supportArea,
    day,
    time,
    minutes(meeting.durationMinutes),
  ]
    .filter(Boolean)
    .join(" · ");
}
