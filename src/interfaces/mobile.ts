import type { DueTone } from "@/types/mentee-home";

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

export type MobileMeetingSummary = {
  id: string;
  title: string;
  whenChip: string;
  mentorName: string;
  mentorInitials: string;
  mentorDetail: string;
  timeLine: string;
  href: string;
};

export type MobileTaskPreview = {
  id: string;
  title: string;
  subtitle: string;
  dueLabel: string;
  dueTone: DueTone;
  href: string;
};

export type MobileMessagePreview = {
  id: string;
  name: string;
  initials: string;
  preview: string;
  time: string;
  href: string;
};
