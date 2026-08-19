import {
  MentorMeetingMode,
  MentorRequestUrgency,
  MentorshipFormat,
} from "@/types/mentor-request";

export const URGENCY_BY_LABEL = {
  "Bu hafta": MentorRequestUrgency.ThisWeek,
  "Önümüzdeki iki hafta": MentorRequestUrgency.NextTwoWeeks,
  "Bu ay": MentorRequestUrgency.ThisMonth,
  "Acil değil": MentorRequestUrgency.NotUrgent,
} as const;

export const FORMAT_BY_LABEL = {
  "Tek görüşme": MentorshipFormat.SingleMeeting,
  "Kısa mentorluk süreci": MentorshipFormat.ShortTerm,
  "Düzenli mentorluk": MentorshipFormat.Regular,
  "Uzman yönlendirmesi": MentorshipFormat.ExpertReferral,
} as const;

export const MEETING_MODE_BY_LABEL = {
  Online: MentorMeetingMode.Online,
  "Yüz yüze": MentorMeetingMode.InPerson,
  "Fark etmez": MentorMeetingMode.NoPreference,
} as const;
