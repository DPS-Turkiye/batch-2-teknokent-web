import type { useTranslations } from "next-intl";

import {
  BottleneckSeverity,
  type AdminBottleneck,
  type AdminOverview,
  type AdminProgram,
  type AdminStartup,
} from "@/interfaces/admin-overview";
import { ProgramStatus } from "@/interfaces/program";
import {
  activeMentorshipFor,
  coordinatorUsersHref,
  daysSince,
  needsAttention,
  pendingMemberships,
  programForOrganization,
  programOfMentorship,
} from "@/lib/admin-model";
import { USER_TAB_HREFS } from "@/lib/admin-users";
import {
  HomeInterventionKind,
  HomeProgramScope,
  InterventionTone,
} from "@/types/admin-home";
import { UserTab } from "@/types/admin-users";

export type HomeT = ReturnType<typeof useTranslations<"adminHome">>;

/** One row of the home page's intervention list, with what its expanded panel shows. */
export type Intervention = {
  id: string;
  kind: HomeInterventionKind;
  title: string;
  subtitle?: string;
  owner: string;
  tone: InterventionTone;
  label: string;
  action: string;
  href: string;
  detail?: {
    leftTitle: string;
    chips: string[];
    pool: string;
    demand?: string | undefined;
    poolNote?: string | undefined;
    action: string;
  };
};

export const HOME_PROGRAM_SCOPES = Object.values(HomeProgramScope);

const INTERVENTIONS_HREF = "/admin/mentorships/interventions";
const MENTORS_HREF = USER_TAB_HREFS[UserTab.Mentors];

/** How many programs the waiting teams are spread over. */
export function waitingProgramCount(waiting: AdminStartup[]) {
  return new Set(waiting.map((item) => item.programName)).size;
}

/** The row opened when the page loads: the first bottleneck, if any. */
export function initialOpenIntervention(rows: Intervention[]) {
  return (
    rows.find((row) => row.kind === HomeInterventionKind.Bottleneck)?.id ?? null
  );
}

export function programsInScope(
  programs: AdminProgram[],
  scope: HomeProgramScope,
) {
  return programs.filter((program) => {
    if (scope === HomeProgramScope.Active) {
      return program.status === ProgramStatus.Active;
    }
    if (scope === HomeProgramScope.Completed) {
      return program.status === ProgramStatus.Completed;
    }
    return true;
  });
}

function pairRows(data: AdminOverview, t: HomeT, now: Date): Intervention[] {
  return data.mentorships
    .filter((item) => needsAttention(item, now))
    .map((item) => {
      const program = programOfMentorship(data, item);
      const days = item.daysSinceMeeting ?? daysSince(item.startDate, now);
      return {
        id: item.id,
        kind: HomeInterventionKind.Pair,
        title: t("pair.title", {
          days,
          mentor: item.mentorName,
          team: item.organizationName,
        }),
        subtitle: t("pair.subtitle", {
          program: program?.name ?? t("pair.noProgram"),
        }),
        owner: program?.coordinatorName ?? item.mentorName,
        tone: InterventionTone.Red,
        label: t("critical"),
        action: t("pair.action"),
        href: coordinatorUsersHref(program),
        detail: {
          leftTitle: t("pair.leftTitle"),
          chips: [item.organizationName],
          pool: t("pair.progress", { percent: item.progressPercent }),
          poolNote:
            item.daysSinceMeeting == null
              ? t("pair.noMeeting")
              : t("pair.lastMeeting", { days: item.daysSinceMeeting }),
          action: t("pair.suggestion"),
        },
      };
    });
}

type BottleneckGroup = [AdminBottleneck, ...AdminBottleneck[]];

/** Bottlenecks with the same title (in Turkish case rules), in the order their titles first appear. */
export function groupBottlenecks(bottlenecks: AdminBottleneck[]) {
  const groups = new Map<string, BottleneckGroup>();
  for (const item of bottlenecks) {
    const key = item.title.trim().toLocaleLowerCase("tr");
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return [...groups.values()];
}

function bottleneckRow(
  data: AdminOverview,
  items: BottleneckGroup,
  t: HomeT,
): Intervention {
  const [first] = items;
  const programs = [
    ...new Set(
      items
        .map((item) => programForOrganization(data, item.organizationId))
        .filter((program) => program != null),
    ),
  ];
  const accepted = programs.reduce(
    (sum, program) => sum + program.acceptedMentorCount,
    0,
  );
  const orgIds = new Set(items.map((item) => item.organizationId));
  const demand = data.requests.filter((request) =>
    orgIds.has(request.organizationId),
  ).length;
  const critical = items.some(
    (item) => item.severity === BottleneckSeverity.Critical,
  );
  const pendingInvites = programs.reduce(
    (sum, program) => sum + program.pendingMentorCount,
    0,
  );
  return {
    id: first.id,
    kind: HomeInterventionKind.Bottleneck,
    title:
      items.length > 1
        ? t("bottleneck.recurring", {
            count: items.length,
            title: first.title.toLocaleLowerCase("tr"),
          })
        : first.title,
    owner: programs[0]?.coordinatorName ?? first.organizationName,
    tone: critical ? InterventionTone.Red : InterventionTone.Amber,
    label: critical ? t("critical") : t("attention"),
    action: t("review"),
    href: INTERVENTIONS_HREF,
    detail: {
      leftTitle: t("bottleneck.leftTitle"),
      chips: items.map((item) => item.organizationName),
      pool: t("bottleneck.accepted", { count: accepted }),
      demand: demand ? t("bottleneck.demand", { count: demand }) : undefined,
      poolNote:
        pendingInvites > 0
          ? t("bottleneck.pendingInvites", { count: pendingInvites })
          : undefined,
      action: t("bottleneck.suggestion"),
    },
  };
}

function accessRows(data: AdminOverview, t: HomeT): Intervention[] {
  const groups = new Map<string, ReturnType<typeof pendingMemberships>>();
  for (const item of pendingMemberships(data)) {
    groups.set(item.programName, [
      ...(groups.get(item.programName) ?? []),
      item,
    ]);
  }
  return [...groups.entries()].map(([programName, items]) => {
    const program = data.programs.find((item) => item.name === programName);
    return {
      id: `access:${programName}`,
      kind: HomeInterventionKind.Access,
      title: t("access.title", { count: items.length }),
      subtitle: t("access.subtitle", { program: programName }),
      owner: program?.coordinatorName ?? t("access.ownerFallback"),
      tone: InterventionTone.Neutral,
      label: t("waiting"),
      action: t("access.action"),
      href: MENTORS_HREF,
      detail: {
        leftTitle: t("access.leftTitle"),
        chips: items.map((item) => item.fullName),
        pool: t("access.pending", { count: items.length }),
        action: t("access.suggestion"),
      },
    };
  });
}

/** The intervention list: pairs overdue a meeting, then recurring bottlenecks, then programs with mentors waiting. */
export function interventionRows(
  data: AdminOverview,
  t: HomeT,
  now = new Date(),
): Intervention[] {
  const bottlenecks = groupBottlenecks(data.bottlenecks).map((items) =>
    bottleneckRow(data, items, t),
  );
  return [...pairRows(data, t, now), ...bottlenecks, ...accessRows(data, t)];
}

/** Per team of the program: red when its mentorship is overdue a meeting, amber when blocked or unmatched, else green. */
export function programHealth(
  program: AdminProgram,
  data: AdminOverview,
  now = new Date(),
) {
  let green = 0;
  let amber = 0;
  let red = 0;
  for (const startup of program.startups) {
    const mentorship = activeMentorshipFor(data, startup);
    const blocked = data.bottlenecks.some(
      (item) => item.organizationId === startup.id,
    );
    if (mentorship && needsAttention(mentorship, now)) red += 1;
    else if (blocked || !mentorship) amber += 1;
    else green += 1;
  }
  return { green, amber, red };
}

/** Completed; in setup since its creation; or the week of mentoring, counted from the earliest mentorship. */
export function phaseLabel(
  program: AdminProgram,
  data: AdminOverview,
  t: HomeT,
  locale: string,
  now = new Date(),
) {
  if (program.status === ProgramStatus.Completed) return t("phaseCompleted");
  const starts = program.startups
    .map((startup) => activeMentorshipFor(data, startup)?.startDate)
    .filter((value): value is string => Boolean(value));
  if (starts.length === 0) {
    const created = new Date(program.createdAt);
    const date = created.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
    });
    return t("phaseSetup", { date });
  }
  const earliest = starts.reduce((min, value) => (value < min ? value : min));
  const weeks = Math.max(1, Math.ceil(daysSince(earliest, now) / 7));
  return t("phaseMentoring", { weeks });
}
