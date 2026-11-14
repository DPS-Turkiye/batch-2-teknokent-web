import type {
  PeerActivityType,
  PeerMentorSkill,
} from "@/interfaces/peer-reports";
import type { PeerReportBadge, PeerReportView } from "@/types/peer-reports";

/** "Günlük değerlendirme" as typed. */
export type DailyReportForm = {
  didToday: string;
  challenge: string;
  skills: PeerMentorSkill[];
  learned: string;
  tomorrowPlan: string;
};

/** "Görüşme dışı faaliyet ekle" as typed (Figma 3.2.3b). */
export type ActivityForm = {
  type: PeerActivityType;
  title: string;
  activityDate: string;
  durationMinutes: string;
  menteeId: string;
  description: string;
};

/** One card of the week's day strip. `badge` is null for a day nobody started ("Henüz başlamadı"). */
export type ReportDayCard = {
  date: string;
  badge: PeerReportBadge | null;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
};

/** A line of "Gönderime hazır mı?". */
export enum DailyReadinessItem {
  Activities = "activities",
  MeetingReport = "meetingReport",
  Evaluation = "evaluation",
}

/** Where "Faaliyet Raporum" is, as read from the URL (`view`, `week`, `day`). */
export type ReportSearch = {
  view: PeerReportView;
  week: string;
  day: string;
};
