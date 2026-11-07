export enum StartupTab {
  Profile = "profile",
  Process = "process",
  Meetings = "meetings",
  Files = "files",
  Team = "team",
}

export type StartupTabLink = {
  id: StartupTab;
  href: string;
};

/**
 * The Startup'ım tabs, in order. Toplantılar is left out of the bar but its
 * /startup/meetings page still works.
 */
export const STARTUP_TABS: StartupTabLink[] = [
  { id: StartupTab.Profile, href: "/startup" },
  { id: StartupTab.Process, href: "/startup/process" },
  { id: StartupTab.Files, href: "/startup/files" },
  { id: StartupTab.Team, href: "/startup/team" },
];

/** Where "Projem" opens for a student of an individual program. */
export const STUDENT_PROJECT_HREF = "/startup/process";

/** Projem's tab that stays open while a student's application waits, so the gate sends them there. */
export const STUDENT_FILES_HREF = "/startup/files";

/** A student of an individual program has no startup profile or team, so Projem keeps only these two tabs. */
const STUDENT_PROJECT_TABS = new Set([StartupTab.Process, StartupTab.Files]);

export function startupTabsFor(individual: boolean) {
  return individual
    ? STARTUP_TABS.filter((tab) => STUDENT_PROJECT_TABS.has(tab.id))
    : STARTUP_TABS;
}
