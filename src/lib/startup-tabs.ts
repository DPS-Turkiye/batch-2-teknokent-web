export enum StartupTab {
  Profile = "profile",
  Process = "process",
  Meetings = "meetings",
  Files = "files",
  Team = "team",
}

export type StartupTabLink = {
  id: StartupTab;
  label: string;
  href: string;
};

/**
 * The Startup'ım tabs, in order. Toplantılar is left out of the bar but its
 * /startup/meetings page still works.
 */
export const STARTUP_TABS: StartupTabLink[] = [
  { id: StartupTab.Profile, label: "Profil", href: "/startup" },
  { id: StartupTab.Process, label: "Süreç", href: "/startup/process" },
  { id: StartupTab.Files, label: "Dosyalar", href: "/startup/files" },
  { id: StartupTab.Team, label: "Ekip", href: "/startup/team" },
];
