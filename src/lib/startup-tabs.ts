export enum StartupTab {
  Profile = "profile",
}

export type StartupTabLink = {
  id: StartupTab;
  label: string;
  href: string;
};

/** The Startup'ım tabs, in order. Each tab joins the list with its screen. */
export const STARTUP_TABS: StartupTabLink[] = [
  { id: StartupTab.Profile, label: "Startup Profilim", href: "/startup" },
];
