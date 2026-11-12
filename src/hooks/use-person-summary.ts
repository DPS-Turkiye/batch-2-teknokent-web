"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import { useOptionLabel } from "@/hooks/use-option-label";
import { ClientApiError } from "@/lib/client/api";
import { getPersonSummary } from "@/lib/client/person-summary";
import { exceptionLabel } from "@/lib/mentor-availability";
import { slotDayLabel, slotTimeLabel } from "@/lib/mentor-availability-days";
import { personSummaryModel } from "@/lib/person-summary";
import { formatShortDate, isAdminArea } from "@/lib/utils";
import {
  SummaryFactKind,
  type KeyedText,
  type SummaryFact,
} from "@/types/person-summary";

export const personSummaryQueryKey = (userId: string) =>
  ["person-summary", userId] as const;

export type SummaryFactText = { key: string; label: string; value: string };

function isNotFound(error: unknown) {
  return error instanceof ClientApiError && error.status === 404;
}

/** The profile page: what to show, already in the reader's language, plus where "back" and program links lead. */
export function usePersonSummary(userId: string) {
  const admin = isAdminArea(usePathname());
  const router = useRouter();
  const t = useTranslations("personSummary");
  const tLanguage = useTranslations("options.language");
  const tWeekday = useTranslations("options.weekday");
  const optionLabel = useOptionLabel();
  const locale = useLocale();
  const query = useQuery({
    queryKey: personSummaryQueryKey(userId),
    queryFn: () => getPersonSummary(userId),
    retry: (failures, error) => !isNotFound(error) && failures < 1,
  });
  const programsHref = admin ? "/admin/programs" : "/coordinator/programs";
  const listHref = admin ? "/admin/users" : programsHref;

  const view = useMemo(() => {
    if (!query.data) return null;
    const model = personSummaryModel(query.data);
    const factText = (fact: SummaryFact): SummaryFactText => {
      const label = t(fact.label);
      switch (fact.kind) {
        case SummaryFactKind.Text:
          return { key: fact.label, label, value: fact.text };
        case SummaryFactKind.Option:
          return {
            key: fact.label,
            label,
            value: optionLabel(fact.group, fact.value),
          };
        case SummaryFactKind.Languages:
          return {
            key: fact.label,
            label,
            value: fact.languages
              .map((language) => tLanguage(language))
              .join(", "),
          };
        case SummaryFactKind.Date:
          return {
            key: fact.label,
            label,
            value: formatShortDate(fact.date, locale),
          };
      }
    };
    const topics = (items: KeyedText[]) =>
      items.map(({ key, value }) => ({
        key,
        value: optionLabel("mentorTopic", value),
      }));
    return {
      userId: query.data.id,
      fullName: model.fullName,
      initials: model.initials,
      email: model.email,
      roleLabel: model.roleLabel ? t(model.roleLabel) : null,
      status: { tone: model.status.tone, label: t(model.status.label) },
      headline: model.headline,
      linkedinUrl: model.linkedinUrl,
      about: model.about,
      tags: topics(model.tags),
      mentor: model.mentor
        ? {
            facts: model.mentor.facts.map(factText),
            offerings: model.mentor.offerings,
            experiences: model.mentor.experiences,
            educations: model.mentor.educations,
            availability: {
              isEmpty: model.mentor.availability.isEmpty,
              days: model.mentor.availability.days.map((day) => ({
                key: day.day,
                label: tWeekday(day.day),
                value: day.ranges.map((range) => range.value).join(", "),
              })),
              daysOff: model.mentor.availability.daysOff.map((dayOff) => ({
                key: dayOff.key,
                value: exceptionLabel({ ...dayOff, reason: null }, locale),
              })),
              extraSlots: model.mentor.availability.extraSlots.map((slot) => ({
                key: slot.key,
                value: t("availabilityExtraSlot", {
                  day: slotDayLabel(slot.startsAt, locale),
                  time: slotTimeLabel(slot.startsAt, locale),
                  minutes: slot.durationMinutes,
                }),
              })),
            },
          }
        : null,
      showStartup: model.showStartup,
      startup: model.startup
        ? { ...model.startup, facts: model.startup.facts.map(factText) }
        : null,
      programs: model.programs.map((program) => ({
        key: program.key,
        name: program.name,
        href: `${programsHref}/${encodeURIComponent(program.id)}`,
        note: t(program.note),
      })),
      activity: model.activity.map(factText),
      showTeamHistory: model.showTeamHistory,
    };
  }, [query.data, t, tLanguage, tWeekday, optionLabel, locale, programsHref]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(listHref);
  }

  return {
    query,
    view,
    notFound: isNotFound(query.error),
    listHref,
    goBack,
  };
}
