/** The bot API's answer; it may leave out the id, and the assistant then makes one up. */
export type AddBotResult = {
  id?: string;
  platform: string;
  nativeMeetingId: string;
  status: string;
  title: string;
};

export type TranscriptSegment = {
  id: string;
  speaker: string;
  text: string;
  at: string;
};

export enum BotStatus {
  Sending = "sending",
  Ok = "ok",
  Err = "err",
}

export enum MeetingStatus {
  Scheduled = "scheduled",
  Joining = "joining",
  Active = "active",
  Completed = "completed",
  Failed = "failed",
}

export type MeetingStatusColor =
  | "var(--ma-blue)"
  | "var(--ma-accent)"
  | "var(--ma-green)"
  | "var(--ma-danger)";

export type MeetingStatusBg =
  | "var(--ma-bluebg)"
  | "var(--ma-accentbg)"
  | "var(--ma-greenbg)"
  | "var(--ma-dangerbg)";

export type MeetingStatusMeta = {
  color: MeetingStatusColor;
  bg: MeetingStatusBg;
};

/** What the assistant tells the user about the meeting's recording bot; each value is a message key. */
export enum MeetingBotNotice {
  Joining = "joining",
  WaitingForAdmission = "waitingForAdmission",
  WaitingTooLong = "waitingTooLong",
  Recording = "recording",
  CouldNotJoin = "couldNotJoin",
  NotAdmittedInTime = "notAdmittedInTime",
  Rejected = "rejected",
  Left = "left",
}

export enum MeetingBotNoticeTone {
  Info = "info",
  Success = "success",
  Danger = "danger",
}

export enum MeetingPlatform {
  GoogleMeet = "Google Meet",
  Zoom = "Zoom",
  Teams = "Teams",
  Jitsi = "Jitsi",
}

export type Meeting = {
  id: string;
  title: string;
  platform: MeetingPlatform;
  platformKey: string;
  nativeMeetingId: string;
  status: MeetingStatus;
  when: string;
  participants: string[];
};

export type TranscriptLine = {
  id: string;
  speaker: string;
  text: string;
  at: string;
};

export type MeetingReportActionItem = {
  owner: string | null;
  task: string;
  due: string | null;
};

export type MeetingReport = {
  title: string;
  meetingDate: string | null;
  topic: string | null;
  summary: string;
  topicsDiscussed: string[];
  decisions: string[];
  actionItems: MeetingReportActionItem[];
  risksOrBlockers: string[];
  nextSteps: string[];
  model: string;
};

type MeetingReportList =
  | "topicsDiscussed"
  | "decisions"
  | "actionItems"
  | "risksOrBlockers"
  | "nextSteps";

/**
 * A report as a view receives it: the AI backend's JSON reaches the page unvalidated, so any of
 * its lists may be missing. Views read reports through this type and fall back to an empty list.
 */
export type ReceivedMeetingReport = Omit<MeetingReport, MeetingReportList> &
  Partial<{
    [List in MeetingReportList]: MeetingReport[List] | null;
  }>;
