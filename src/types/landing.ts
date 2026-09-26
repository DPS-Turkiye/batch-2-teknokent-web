import type { NotificationCategory } from "@/interfaces/notification";

/** Which little product mock sits on an announcement card. */
export enum LandingMock {
  Calendar = "CALENDAR",
  Training = "TRAINING",
  Checklist = "CHECKLIST",
}

export type LandingAnnouncement = {
  tag: string;
  tone: "or" | "bl" | null;
  date: string;
  title: string;
  text: string;
  mock: LandingMock;
};

export type LandingHowStep = {
  title: string;
  text: string;
};

export type LandingFaq = {
  question: string;
  answer: string;
};

export type LandingLink = { label: string; href: string };

export type DashboardNotification = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  category?: NotificationCategory;
  readAt?: string | null;
  createdAt: string;
};
