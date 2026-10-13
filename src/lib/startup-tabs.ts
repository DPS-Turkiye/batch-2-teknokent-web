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
