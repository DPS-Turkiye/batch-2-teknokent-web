import type { CSSProperties } from "react";

import { MentorshipRequestStatus } from "@/interfaces/mentorship-request";

export const MENTOR_ACCENT_STYLE = {
  "--ms-accent": "#26a4ff",
  "--ms-accent-hover": "#1598ef",
  "--ms-accent-strong": "#1a8ad9",
  "--ms-accent-soft": "#e6f1f8",
  "--ms-accent-faint": "#f2f8fc",
  "--ms-accent-border": "#95cdff",
} as CSSProperties;

export const MENTORSHIP_PERIOD_FORMAT = new Intl.DateTimeFormat("tr-TR", {
  month: "short",
  year: "numeric",
});

export const PAST_MENTORSHIP_LABELS = {
  empty: "Henüz tamamlanan bir mentorluk yok.",
  period: "Dönem",
  topics: "Konular",
  notes: "Notlar",
  files: "Dosyalar",
  transcript: "Toplantı Transkripti",
  history: (name: string) => `${name} mentorluk geçmişi`,
} as const;

export const MENTORSHIPS_ACTIVE_HREF = "/mentorships?tab=active";
export const MENTORSHIPS_HISTORY_HREF = "/mentorships?tab=history";
export const MENTORSHIPS_REGULAR_HREF = "/mentorships?tab=regular";
export const MENTORSHIPS_BACK_LABEL = "Mentorluklarıma dön";
export const MENTOR_PROFILE_HISTORY_PAGE_SIZE = 5;
export const MENTOR_PROFILE_HISTORY_PAGER_LABEL = "Mentorluk geçmişi sayfaları";

export const MENTEE_REQUESTS_HREF = "/mentorships?tab=requests";

export const MENTEE_REQUEST_STATUS_LABELS: Record<
  MentorshipRequestStatus,
  string
> = {
  [MentorshipRequestStatus.Accepted]: "Kabul edildi",
  [MentorshipRequestStatus.CounterProposed]: "Mentör yeni saat önerdi",
  [MentorshipRequestStatus.Declined]: "Mentör uygun değil",
  [MentorshipRequestStatus.MoreInfoRequested]: "Mentör ek bilgi istedi",
  [MentorshipRequestStatus.Pending]: "Mentörün yanıtı bekleniyor",
  [MentorshipRequestStatus.Withdrawn]: "Geri çekildi",
};

export const MENTEE_REQUEST_DETAIL_LABELS = {
  title: "Talep Bilgileri",
  loading: "Talep yükleniyor…",
  missing: "Görüntülenecek bir talep seçilmedi.",
  backToRequests: "Taleplerime Git",
  requestSection: "Talepte girilenler",
  otherSection: "Diğer bilgiler",
  mentor: "Mentör",
  status: "Durum",
  requester: "Talebi oluşturan",
  startup: "Startup",
  sentAt: "Gönderildi",
  plannedSessions: "Planlanan görüşme sayısı",
  mentorMessage: "Mentörün mesajı",
  proposedSlots: "Mentörün önerdiği saatler",
  rejectionReason: "Uygun olmama gerekçesi",
  mentorProfile: "Mentör profilini gör",
} as const;
