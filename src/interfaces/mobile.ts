export enum MobileTab {
  Home = "home",
  Calendar = "calendar",
  Tasks = "tasks",
  Startups = "startups",
  Messages = "messages",
}

export type MobileTabLink = {
  tab: MobileTab;
  label: string;
  href: string;
  icon: string;
};

export enum MobileButtonVariant {
  Neutral = "neutral",
  Primary = "primary",
  Secondary = "secondary",
  Ghost = "ghost",
}
