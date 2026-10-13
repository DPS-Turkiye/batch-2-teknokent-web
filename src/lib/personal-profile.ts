import type { useTranslations } from "next-intl";

import { DocumentKind } from "@/interfaces/startup-document";
import type { StoredDocument } from "@/lib/client/documents";
import type { ActiveMentorshipRow } from "@/lib/startup-overview";
import { formatDayMonth } from "@/lib/utils";

export enum ProfileChipTone {
  Program = "program",
  Active = "active",
  Neutral = "neutral",
}

export type ProfileChip = { label: string; tone: ProfileChipTone };

/** The personal profile's translator and language, for the labels built here. */
export type PersonalProfileTexts = {
  t: ReturnType<typeof useTranslations<"personalProfile">>;
  locale: string;
};

export const PROFILE_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** "Product Designer · Kurucu" */
export function personalRoleLabel(
  jobTitle: string | null | undefined,
  isFounder: boolean,
  { t }: PersonalProfileTexts,
) {
  const title = jobTitle?.trim() ?? "";
  // A founder whose job title already says so is not labelled twice.
  const saysFounder = /^(kurucu|founder)$/i.test(title);
  return [title, isFounder && !saysFounder ? t("founder") : null]
    .filter(Boolean)
    .join(" · ");
}

/** "Product Designer · Kurucu · Döngü" */
export function personalSubtitle(
  role: string,
  organizationName: string | null | undefined,
) {
  return [role, organizationName?.trim()].filter(Boolean).join(" · ");
}

/** "Pre-seed · 4 kişilik ekip · MVP yayında" */
export function startupSummary(
  {
    fundingStage,
    teamSize,
    maturity,
  }: {
    fundingStage: string | null;
    teamSize: number | null;
    maturity: string | null;
  },
  { t }: PersonalProfileTexts,
) {
  return [
    fundingStage,
    teamSize ? t("teamSize", { count: teamSize }) : null,
    maturity,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "Ürün konumlandırma · 3/6 seans", or only the held count without a plan. */
export function mentorshipSessionLabel(
  row: ActiveMentorshipRow,
  { t }: PersonalProfileTexts,
) {
  const sessions = row.plannedSessions
    ? t("sessionsPlanned", {
        held: row.heldSessions,
        planned: row.plannedSessions,
      })
    : t("sessions", { held: row.heldSessions });
  return [row.supportArea, sessions].filter(Boolean).join(" · ");
}

/**
 * Open action items first, then the next booked meeting, otherwise nothing:
 * the same order as the home page's `activeMentorshipFooter`, so one mentorship
 * reads the same on both pages. Only the wording follows this page's design.
 */
export function mentorshipRowStatus(
  row: ActiveMentorshipRow,
  openActionCount: number,
  { t, locale }: PersonalProfileTexts,
) {
  if (openActionCount > 0) return t("openActions", { count: openActionCount });
  return row.nextMeetingAt
    ? t("nextMeeting", {
        date: formatDayMonth(new Date(row.nextMeetingAt), locale),
      })
    : null;
}

/** The backend lists a user's documents newest first, so the first avatar is the current photo. */
export function currentAvatar(documents: StoredDocument[]) {
  return (
    documents.find((document) => document.kind === DocumentKind.Avatar) ?? null
  );
}

/** Why a chosen file can't be a profile photo (a `personalProfile` key), or null; mirrors the backend's limits. */
export function profilePhotoError(file: File) {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) return "photoType" as const;
  if (file.size > PROFILE_PHOTO_MAX_BYTES) return "photoSize" as const;
  return null;
}
