"use client";

import { useTranslations } from "next-intl";

import {
  LANDING_ANNOUNCEMENTS,
  LANDING_FOOTER_COLUMNS,
  LANDING_MATCHES,
  LANDING_NAV_LINKS,
  LANDING_TASKS,
  LANDING_TOPIC_CHIPS,
} from "@/lib/const/landing";
import type tr from "@/messages/tr.json";
import type {
  LandingAnnouncement,
  LandingFaq,
  LandingHowStep,
  LandingLink,
} from "@/types/landing";

type LandingMessages = (typeof tr)["landing"];
type FooterColumn = { title: string; links: Record<string, string> };

/** The landing page's text in the visitor's language, joined with its links, photos and tones. */
export function useLandingContent() {
  const t = useTranslations("landing");
  return {
    navLinks: LANDING_NAV_LINKS.map(({ key, href }): LandingLink => ({
      href,
      label: t(`nav.${key}`),
    })),
    hero: t.raw("hero") as LandingMessages["hero"],
    announcements: LANDING_ANNOUNCEMENTS.map(
      ({ key, tone, mock }): LandingAnnouncement => ({
        tone,
        mock,
        tag: t(`announcements.${key}.tag`),
        date: t(`announcements.${key}.date`),
        title: t(`announcements.${key}.title`),
        text: t(`announcements.${key}.text`),
      }),
    ),
    howSteps: t.raw("howSteps") as LandingHowStep[],
    stageRoles: {
      mentor: { key: "mentor", label: t("stageRoles.mentor") },
      mentee: { key: "mentee", label: t("stageRoles.mentee") },
    } as const,
    typedProblem: t("typedProblem"),
    topicChips: LANDING_TOPIC_CHIPS.map(({ key, selected }) => ({
      label: t(`topics.${key}`),
      selected,
    })),
    matches: LANDING_MATCHES.map(({ key, name, photo, selected }) => ({
      name,
      photo,
      selected,
      field: t(`matches.${key}.field`),
      pill: t(`matches.${key}.pill`),
    })),
    matchReason: t("matchReason"),
    agenda: t.raw("agenda") as string[],
    tasks: LANDING_TASKS.map(({ key, tone }) => ({
      tone,
      title: t(`tasks.${key}.title`),
      source: t(`tasks.${key}.source`),
      status: t(`tasks.${key}.status`),
    })),
    compare: t.raw("compare") as LandingMessages["compare"],
    faqs: t.raw("faqs") as LandingFaq[],
    cta: t.raw("cta") as LandingMessages["cta"],
    footer: {
      tagline: t("footer.tagline"),
      text: t("footer.text"),
      copyright: t("footer.copyright"),
      columns: LANDING_FOOTER_COLUMNS.map(({ key, links }) => {
        const column = t.raw(`footer.columns.${key}`) as FooterColumn;
        return {
          title: column.title,
          links: links.map((link) => ({
            href: link.href,
            label: column.links[link.key],
          })),
        };
      }),
    },
    ui: t.raw("ui") as LandingMessages["ui"],
  };
}
