import type { PeerMentorSkill } from "@/interfaces/peer-reports";

/** The three "Haftalık değerlendirme" questions, named after the report's fields. */
export enum WeeklyQuestion {
  NeedsObserved = "needsObserved",
  Growth = "growth",
  NextWeekPlan = "nextWeekPlan",
}

/** The evaluation as typed: one text per question. */
export type WeeklyAnswers = Record<WeeklyQuestion, string>;

/** The rows of the "Haftalık özet" side card's checklist. */
export enum WeeklyCheck {
  DailyReports = "dailyReports",
  MeetingReports = "meetingReports",
  Evaluation = "evaluation",
}

/** One checklist row; `blocking` rows must be complete before the week can be sent. */
export type WeeklyCheckItem = {
  check: WeeklyCheck;
  done: number;
  total: number;
  complete: boolean;
  blocking: boolean;
};

/** Why "Haftalık Özeti Koordinatöre Gönder" is not available yet. */
export enum WeeklySubmitBlock {
  /** Sent (İncelemede) or approved: the week takes no changes. */
  Locked = "locked",
  /** Before Friday 18:00 of the report week. */
  NotOpen = "notOpen",
  MeetingReports = "meetingReports",
  Evaluation = "evaluation",
}

/** One "Bu hafta kullandığın beceriler" row. */
export type WeeklySkillBar = {
  skill: PeerMentorSkill;
  meetings: number;
  percent: number;
};

/** The note under the "Haftalık özet" side card's checklist. */
export enum WeeklyStatusNote {
  /** Sent: locked until the coordinator acts, approved automatically after 7 days. */
  InReview = "inReview",
  /** Approved, and with it every report of the week. */
  Approved = "approved",
  Revision = "revision",
  /** Still unsent after Monday 23:59. */
  Late = "late",
}
