import type { useTranslations } from "next-intl";

import {
  MobileConversationKind,
  MobileTab,
  type MobileTabLink,
} from "@/interfaces/mobile";
import { UserRole } from "@/interfaces/session";

/** The phone screens' translator and language, for the labels built in lib/mobile-*. */
export type MobileTexts = {
  t: ReturnType<typeof useTranslations<"mobile">>;
  locale: string;
  /** A saved request topic in the page's language (useTopicLabel). */
  topicLabel: (value: string) => string;
};

/** "14:00" */
export function mobileClock(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** "24 Eylül" / "September 24" */
export function mobileDayMonth(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(date);
}

/** "Perşembe 24 Eylül" / "Thursday, September 24" */
export function mobileLongDay(date: Date, { t, locale }: MobileTexts) {
  return t("dates.longDay", {
    weekday: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date),
    date: mobileDayMonth(date, locale),
  });
}

export const MOBILE_HOME = "/m";
export const MOBILE_LOGIN = "/m/login";
export const MOBILE_CALENDAR = "/m/calendar";
export const MOBILE_TASKS = "/m/tasks";
export const MOBILE_MESSAGES = "/m/messages";
export const MOBILE_NOTIFICATIONS = "/m/notifications";
export const MOBILE_STARTUPS = "/m/startups";
export const MOBILE_ACCOUNT = "/m/account";

export function isMobileConversationKind(
  value: string,
): value is MobileConversationKind {
  return Object.values(MobileConversationKind).includes(
    value as MobileConversationKind,
  );
}

export function mobileChatHref(kind: MobileConversationKind, id: string) {
  return `${MOBILE_MESSAGES}/${kind}/${encodeURIComponent(id)}`;
}

/** Opening any page with ?web=1 keeps a phone on the web pages until it opens /m again. */
export const PREFER_WEB_PARAM = "web";
export const PREFER_WEB_COOKIE = "menton_prefer_web";

/** Where a phone lands instead of the desktop entry pages. Deeper pages stay reachable for "Web'de Aç". */
export const PHONE_ENTRY_PATHS = new Set([
  "/",
  "/login",
  "/workspace",
  "/dashboard",
  "/mentor-dashboard",
]);

export const MOBILE_NEUTRAL_ACCENT = "#22262b";

const MOBILE_ACCENTS: Partial<Record<UserRole, string>> = {
  [UserRole.Mentee]: "#e66600",
  [UserRole.Mentor]: "#26a4ff",
};

// Tablets get the desktop pages; only phones are sent to /m.
const PHONE_USER_AGENT = /iPhone|iPod|Android.+Mobile|Windows Phone/i;

export function isPhoneUserAgent(userAgent: string | null) {
  return Boolean(userAgent && PHONE_USER_AGENT.test(userAgent));
}

export function isMobilePath(pathname: string) {
  return pathname === MOBILE_HOME || pathname.startsWith(`${MOBILE_HOME}/`);
}

/** Coordinators and admins have no phone screens. */
export function hasMobileApp(role?: UserRole | null) {
  return role === UserRole.Mentee || role === UserRole.Mentor;
}

export function mobileAccentFor(role?: UserRole | null) {
  return (role && MOBILE_ACCENTS[role]) ?? MOBILE_NEUTRAL_ACCENT;
}

/**
 * A web page opened from the phone app, without being sent back to /m. Render
 * it as a plain <a>, not next/link: the proxy only remembers the choice on a
 * full page load, and leaving the phone shell needs one anyway.
 */
export function webHref(path: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${PREFER_WEB_PARAM}=1`;
}

export const SIGNUP_ON_WEB_HREF = webHref("/signup");

const HOME_TAB: MobileTabLink = {
  tab: MobileTab.Home,
  href: MOBILE_HOME,
  icon: "/mobile/icon-home.svg",
};

const CALENDAR_TAB: MobileTabLink = {
  tab: MobileTab.Calendar,
  href: MOBILE_CALENDAR,
  icon: "/mobile/icon-calendar.svg",
};

const MESSAGES_TAB: MobileTabLink = {
  tab: MobileTab.Messages,
  href: MOBILE_MESSAGES,
  icon: "/mobile/icon-messages.svg",
};

const TASKS_TAB: MobileTabLink = {
  tab: MobileTab.Tasks,
  href: MOBILE_TASKS,
  icon: "/mobile/icon-tasks.svg",
};

const STARTUPS_TAB: MobileTabLink = {
  tab: MobileTab.Startups,
  href: MOBILE_STARTUPS,
  icon: "/mobile/icon-startups.svg",
};

export function mobileTabsFor(role?: UserRole | null): MobileTabLink[] {
  const thirdTab = role === UserRole.Mentor ? STARTUPS_TAB : TASKS_TAB;
  return [HOME_TAB, CALENDAR_TAB, thirdTab, MESSAGES_TAB];
}

/** The tab a path belongs to, so a nested screen keeps its tab highlighted. */
export function mobileTabForPath(
  pathname: string,
  tabs: MobileTabLink[],
): MobileTabLink | undefined {
  if (pathname === MOBILE_HOME) return HOME_TAB;
  return tabs.find(
    (link) =>
      link.href !== MOBILE_HOME &&
      (pathname === link.href || pathname.startsWith(`${link.href}/`)),
  );
}
