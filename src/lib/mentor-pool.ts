import type { useTranslations } from "next-intl";

import { type MentorPoolRow, MentorPoolStatus } from "@/interfaces/mentor-pool";
import { SignupRole } from "@/interfaces/signup";
import { daysWaiting } from "@/lib/program-launch";

export enum PoolFilter {
  All = "ALL",
  Active = "ACTIVE",
  Invited = "INVITED",
  AwaitingApproval = "AWAITING_APPROVAL",
}

export enum CapacityFilter {
  All = "ALL",
  Available = "AVAILABLE",
  Full = "FULL",
}

export type PoolT = ReturnType<typeof useTranslations<"programMentors">>;

const INVITE_STATUSES = new Set([
  MentorPoolStatus.Invited,
  MentorPoolStatus.InviteExpiring,
  MentorPoolStatus.InviteExpired,
]);
const ACTIVE_STATUSES = new Set([
  MentorPoolStatus.Active,
  MentorPoolStatus.Full,
]);

export const POOL_STATUS_TONES: Record<
  MentorPoolStatus,
  "green" | "amber" | "blue" | "red"
> = {
  [MentorPoolStatus.Active]: "green",
  [MentorPoolStatus.Full]: "amber",
  [MentorPoolStatus.AwaitingApproval]: "amber",
  [MentorPoolStatus.Invited]: "blue",
  [MentorPoolStatus.InviteExpiring]: "amber",
  [MentorPoolStatus.InviteExpired]: "red",
};

function matchesFilter(row: MentorPoolRow, filter: PoolFilter) {
  switch (filter) {
    case PoolFilter.Active:
      return ACTIVE_STATUSES.has(row.status);
    case PoolFilter.Invited:
      return INVITE_STATUSES.has(row.status);
    case PoolFilter.AwaitingApproval:
      return row.status === MentorPoolStatus.AwaitingApproval;
    default:
      return true;
  }
}

export function poolFilterOptions(rows: MentorPoolRow[], t: PoolT) {
  return Object.values(PoolFilter).map((id) => ({
    id,
    label: t(`filters.${id}`, {
      count: rows.filter((row) => matchesFilter(row, id)).length,
    }),
  }));
}

/** Every expertise tag in the pool, for the "Uzmanlık" select. */
export function expertiseOptions(rows: MentorPoolRow[]) {
  return [...new Set(rows.flatMap((row) => row.expertise))].sort((a, b) =>
    a.localeCompare(b, "tr"),
  );
}

export function filterPool(
  rows: MentorPoolRow[],
  {
    filter,
    search,
    expertise,
    capacity,
  }: {
    filter: PoolFilter;
    search: string;
    expertise: string;
    capacity: CapacityFilter;
  },
) {
  const query = search.trim().toLocaleLowerCase("tr");
  return rows.filter((row) => {
    if (!matchesFilter(row, filter)) return false;
    if (expertise && !row.expertise.includes(expertise)) return false;
    if (
      capacity === CapacityFilter.Full &&
      row.status !== MentorPoolStatus.Full
    )
      return false;
    if (
      capacity === CapacityFilter.Available &&
      row.status !== MentorPoolStatus.Active
    )
      return false;
    if (!query) return true;
    return [row.fullName ?? "", row.email, ...row.expertise].some((value) =>
      value.toLocaleLowerCase("tr").includes(query),
    );
  });
}

const DAY = 24 * 60 * 60 * 1000;

/** The "Mentorluk yükü" cell for rows that have no load bar yet. */
export function poolRowNote(row: MentorPoolRow, t: PoolT, now = new Date()) {
  const since = daysWaiting(row.since, now);
  const ago = since === 0 ? t("today") : t("daysAgo", { days: since });
  switch (row.status) {
    case MentorPoolStatus.AwaitingApproval:
      return t("verification", {
        when: since === 0 ? t("today") : t("days", { days: since }),
      });
    case MentorPoolStatus.Invited:
      return ago;
    case MentorPoolStatus.InviteExpiring: {
      const left = row.expiresAt
        ? Math.max(
            0,
            Math.ceil(
              (new Date(row.expiresAt).getTime() - now.getTime()) / DAY,
            ),
          )
        : 0;
      return t("expiring", { ago, left });
    }
    case MentorPoolStatus.InviteExpired:
      return t("expired");
    default:
      return null;
  }
}

/**
 * The mentor id to open "Profili gör" with, or null. The backend only shows a mentor in the pool or one who asked to
 * join; a coordinator's open invite does not count, so invited rows get no link.
 */
export function profileMentorId(row: MentorPoolRow) {
  const reachable =
    row.status === MentorPoolStatus.Active ||
    row.status === MentorPoolStatus.Full ||
    row.status === MentorPoolStatus.AwaitingApproval;
  return reachable ? row.mentorId : null;
}

export function loadShare(row: MentorPoolRow) {
  return row.capacity > 0
    ? Math.min(100, (row.activeTeams / row.capacity) * 100)
    : 0;
}

/** The signup link a coordinator copies for someone without an account. */
export function mentorInviteLink(code: string, origin: string) {
  return `${origin}/signup?${new URLSearchParams({ role: SignupRole.Mentor, programInvite: code })}`;
}

export function rowKey(row: MentorPoolRow) {
  return row.mentorId ?? row.inviteId ?? row.email;
}
