import type { CSSProperties } from "react";

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
