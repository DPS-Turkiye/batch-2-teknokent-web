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

/** Shown by account actions that have no page yet. */
export const COMING_SOON_MESSAGE = "Bu bölüm yakında eklenecek.";

export const PROFILE_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** "Product Designer · Kurucu" */
export function personalRoleLabel(
  jobTitle: string | null | undefined,
  isFounder: boolean,
) {
  return [jobTitle?.trim(), isFounder ? "Kurucu" : null]
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
export function startupSummary({
  fundingStage,
  teamSize,
  maturity,
}: {
  fundingStage: string | null;
  teamSize: number | null;
  maturity: string | null;
}) {
  return [fundingStage, teamSize ? `${teamSize} kişilik ekip` : null, maturity]
    .filter(Boolean)
    .join(" · ");
}

/** "Ürün konumlandırma · 3/6 seans", or only the held count without a plan. */
export function mentorshipSessionLabel(row: ActiveMentorshipRow) {
  const sessions = row.plannedSessions
    ? `${row.heldSessions}/${row.plannedSessions} seans`
    : `${row.heldSessions} seans`;
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
) {
  if (openActionCount > 0) return `${openActionCount} açık aksiyon`;
  return row.nextMeetingAt
    ? `Sonraki görüşme ${formatDayMonth(new Date(row.nextMeetingAt))}`
    : null;
}

/** The backend lists a user's documents newest first, so the first avatar is the current photo. */
export function currentAvatar(documents: StoredDocument[]) {
  return (
    documents.find((document) => document.kind === DocumentKind.Avatar) ?? null
  );
}

/** Why a chosen file can't be a profile photo, or null; mirrors the backend's limits. */
export function profilePhotoError(file: File) {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
    return "PNG, JPG veya WebP bir fotoğraf seç.";
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return "Fotoğraf en fazla 5 MB olabilir.";
  }
  return null;
}
