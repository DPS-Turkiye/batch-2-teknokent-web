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

export const CAPACITY_FILTER_LABELS: Record<CapacityFilter, string> = {
  [CapacityFilter.All]: "Tümü",
  [CapacityFilter.Available]: "Yeri var",
  [CapacityFilter.Full]: "Dolu",
};

const INVITE_STATUSES = new Set([
  MentorPoolStatus.Invited,
  MentorPoolStatus.InviteExpiring,
  MentorPoolStatus.InviteExpired,
]);
const ACTIVE_STATUSES = new Set([
  MentorPoolStatus.Active,
  MentorPoolStatus.Full,
]);

export const POOL_STATUS_CHIPS: Record<
  MentorPoolStatus,
  { label: string; tone: "green" | "amber" | "blue" | "red" }
> = {
  [MentorPoolStatus.Active]: { label: "Aktif", tone: "green" },
  [MentorPoolStatus.Full]: { label: "Kapasite dolu", tone: "amber" },
  [MentorPoolStatus.AwaitingApproval]: {
    label: "Onay bekliyor",
    tone: "amber",
  },
  [MentorPoolStatus.Invited]: { label: "Davet gönderildi", tone: "blue" },
  [MentorPoolStatus.InviteExpiring]: {
    label: "Davet süresi doluyor",
    tone: "amber",
  },
  [MentorPoolStatus.InviteExpired]: {
    label: "Davet süresi doldu",
    tone: "red",
  },
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

export function poolFilterOptions(rows: MentorPoolRow[]) {
  const count = (filter: PoolFilter) =>
    rows.filter((row) => matchesFilter(row, filter)).length;
  return [
    { id: PoolFilter.All, label: `Tümü ${rows.length}` },
    { id: PoolFilter.Active, label: `Aktif ${count(PoolFilter.Active)}` },
    {
      id: PoolFilter.Invited,
      label: `Davet bekliyor ${count(PoolFilter.Invited)}`,
    },
    {
      id: PoolFilter.AwaitingApproval,
      label: `Onay bekliyor ${count(PoolFilter.AwaitingApproval)}`,
    },
  ];
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
export function poolRowNote(row: MentorPoolRow, now = new Date()) {
  const since = daysWaiting(row.since, now);
  const ago = since === 0 ? "bugün" : `${since} gün önce`;
  switch (row.status) {
    case MentorPoolStatus.AwaitingApproval:
      return `Uzmanlık doğrulaması · ${since === 0 ? "bugün" : `${since} gün`}`;
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
      return `${ago} · ${left} gün kaldı`;
    }
    case MentorPoolStatus.InviteExpired:
      return "Süresi doldu";
    default:
      return null;
  }
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
