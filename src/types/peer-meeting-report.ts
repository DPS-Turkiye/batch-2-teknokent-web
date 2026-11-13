import type {
  PeerActionOwner,
  PeerMeetingFormat,
  PeerMeetingTopic,
  PeerMeetingType,
  PeerMentorSkill,
} from "@/interfaces/peer-reports";
import type { Keyed } from "@/lib/keyed-list";

/** The six numbered sections of the meeting report form (Figma 220:2), named as the backend names missing ones. */
export enum MeetingReportSection {
  Meeting = "MEETING",
  Topic = "TOPIC",
  Details = "DETAILS",
  Skills = "SKILLS",
  Outcomes = "OUTCOMES",
  Evaluation = "EVALUATION",
}

export const MEETING_REPORT_SECTIONS = Object.values(MeetingReportSection);

/** One "Eylem adımı" row while it is edited; `id` is null until the backend has saved it. */
export type MeetingReportActionRow = Keyed<{
  id: string | null;
  text: string;
  owner: PeerActionOwner;
  dueDate: string;
  done: boolean;
}>;

/** The form as typed: free text stays as typed, the duration as the field's text, the follow-up as datetime-local. */
export type MeetingReportForm = {
  meetingType: PeerMeetingType | null;
  meetingFormat: PeerMeetingFormat | null;
  actualDurationMinutes: string;
  topics: PeerMeetingTopic[];
  menteeNeed: string;
  discussion: string;
  approach: string;
  skills: PeerMentorSkill[];
  skillExample: string;
  outcome: string;
  actions: MeetingReportActionRow[];
  followUpNeeded: boolean;
  followUpAt: string;
  productivity: number | null;
  nextTime: string;
  coordinatorSupportNeeded: boolean | null;
};

/** The "Koordinatör desteği" answer as the yes/no control shows it. */
export enum SupportChoice {
  No = "no",
  Yes = "yes",
}
