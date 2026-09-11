export enum StartupTab {
  Profile = "profile",
  Process = "process",
  Meetings = "meetings",
  Files = "files",
}

export type StartupTabLink = {
  id: StartupTab;
  label: string;
  href: string;
};

/** The Startup'ım tabs, in order. Each tab joins the list with its screen. */
export const STARTUP_TABS: StartupTabLink[] = [
  { id: StartupTab.Profile, label: "Startup Profilim", href: "/startup" },
  { id: StartupTab.Process, label: "Süreç", href: "/startup/process" },
  { id: StartupTab.Meetings, label: "Toplantılar", href: "/startup/meetings" },
  { id: StartupTab.Files, label: "Dosyalar", href: "/startup/files" },
];
