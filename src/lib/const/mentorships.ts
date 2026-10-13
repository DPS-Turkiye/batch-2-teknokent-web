import type { CSSProperties } from "react";

export const MENTOR_ACCENT_STYLE = {
  "--ms-accent": "#26a4ff",
  "--ms-accent-hover": "#1598ef",
  "--ms-accent-strong": "#1a8ad9",
  "--ms-accent-soft": "#e6f1f8",
  "--ms-accent-faint": "#f2f8fc",
  "--ms-accent-border": "#95cdff",
} as CSSProperties;

// Saved as the message the mentee reads, so these stay Turkish like other saved texts.
export const MENTOR_ACCEPT_MESSAGE = "Talebiniz kabul edildi.";
export const MENTOR_DECLINE_MESSAGE = "Şu an uygun değilim.";

export const MENTORSHIPS_ACTIVE_HREF = "/mentorships?tab=active";
export const MENTORSHIPS_HISTORY_HREF = "/mentorships?tab=history";
export const MENTORSHIPS_REGULAR_HREF = "/mentorships?tab=regular";
export const MENTOR_PROFILE_HISTORY_PAGE_SIZE = 5;
export const MENTOR_PROFILE_HISTORY_PAGER_LABEL = "Mentorluk geçmişi sayfaları";

export const MENTEE_REQUESTS_HREF = "/mentorships?tab=requests";
