import type { MentorProfile } from "@/interfaces/mentor";
import type { StartupContext } from "@/interfaces/startup";
import {
  DEFAULT_NEED_GOAL_IDS,
  DEFAULT_NEED_SITUATION_ID,
  messageForNeedGoals,
  readNeedDraft,
  summaryForNeed,
  supportAreaForNeedTopic,
} from "@/lib/mentor-request-need";
import { MEETING_MODE_BY_LABEL } from "@/lib/mentor-request-options";
import type { MentorshipRequestSubmission } from "@/lib/mentorship-requests";
import {
  MentorMeetingMode,
  MentorRequestUrgency,
  MentorshipFormat,
} from "@/types/mentor-request";

export function mentorProfileHref(mentorId: string) {
  return `/mentors/${encodeURIComponent(mentorId)}`;
}

export function mentorFirstName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const name = parts.find((part) => !/^(dr|prof|doç)\.?$/i.test(part));
  return name || parts[0] || fullName;
}

export function meetingModeForMentor(meetingMode: string) {
  const key = meetingMode as keyof typeof MEETING_MODE_BY_LABEL;
  if (key in MEETING_MODE_BY_LABEL) return MEETING_MODE_BY_LABEL[key];
  const lower = meetingMode.toLocaleLowerCase("tr-TR");
  if (lower.includes("yüz yüze")) return MentorMeetingMode.InPerson;
  return MentorMeetingMode.Online;
}

export function profileMentorshipSubmission({
  mentor,
  startup,
  requestedForName,
  problem,
  outcome,
  preferredTimes,
}: {
  mentor: MentorProfile;
  startup: StartupContext;
  requestedForName: string;
  problem?: string;
  outcome?: string;
  preferredTimes?: readonly string[];
}): MentorshipRequestSubmission {
  const draft = readNeedDraft();
  const supportArea = draft
    ? supportAreaForNeedTopic(draft.topicId)
    : mentor.specialties[0] || "Diğer";
  const draftSummary = draft
    ? summaryForNeed({
        topicId: draft.topicId,
        otherSummary: draft.otherSummary,
        situationId: draft.situationId ?? DEFAULT_NEED_SITUATION_ID,
        noneSummary: draft.noneSummary ?? "",
      })
    : mentor.recommendationReasons[0] || mentor.professionalTitle;
  const draftOutcome = draft
    ? messageForNeedGoals(
        draft.goalIds ?? DEFAULT_NEED_GOAL_IDS,
        draft.goalNote ?? "",
      )
    : "";
  const timesLine = preferredTimes?.filter(Boolean).length
    ? `Tercih edilen saatler: ${preferredTimes.filter(Boolean).join(", ")}`
    : "";

  return {
    mentorId: mentor.id,
    requestedForName,
    supportArea,
    summary: problem?.trim() || draftSummary,
    urgency: MentorRequestUrgency.ThisWeek,
    mentorshipFormat: MentorshipFormat.SingleMeeting,
    meetingMode: meetingModeForMentor(mentor.meetingMode),
    requesterMessage: [outcome?.trim() || draftOutcome, timesLine]
      .filter(Boolean)
      .join("\n"),
    recommendationSnapshot: {
      matchingMethod: "PROFILE",
      generatedAt: new Date().toISOString(),
      startupName: startup.name,
      startupSector: startup.sector,
      startupStage: startup.stage,
      startupSummary: startup.summary,
      startupTechnologies: startup.technologies,
      recommendations: [
        {
          mentorId: mentor.id,
          rank: 1,
          selected: true,
          mentorName: mentor.fullName,
          professionalTitle: mentor.professionalTitle,
          company: mentor.company,
          reasons: mentor.recommendationReasons,
          evidence: mentor.recommendationEvidence,
        },
      ],
    },
  };
}
