"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { useInstitutionAdvisees } from "@/hooks/use-institution-record";
import { appointmentsHref } from "@/lib/academician-calendar";
import {
  ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
  ACADEMICIAN_REQUESTS_QUERY_KEY,
  slotWhenLabel,
  TURKEY_TIME_ZONE,
} from "@/lib/academician-office-hours";
import {
  ACADEMICIAN_ROUTES,
  studentProfileHref,
} from "@/lib/academician-routes";
import { studentProfile } from "@/lib/academician-students";
import {
  getAcademicianAppointments,
  getAcademicianRequests,
} from "@/lib/client/academician-office-hours";
import { RequestStep } from "@/types/academician-calendar";
import { StudentProfileOrigin } from "@/types/academician-office-hours";

const BACK: Record<StudentProfileOrigin, string> = {
  [StudentProfileOrigin.Appointments]: ACADEMICIAN_ROUTES.appointments,
  [StudentProfileOrigin.Advisees]: ACADEMICIAN_ROUTES.advisees,
};

/** A student as the academician may see them: the record, the waiting request and their meetings together. */
export function useAcademicianStudent(
  userId: string,
  from: StudentProfileOrigin,
) {
  const t = useTranslations("iaAcademician.student");
  const tLevel = useTranslations("studyLevel");
  const locale = useLocale();
  const advisees = useInstitutionAdvisees();
  const requests = useQuery({
    queryKey: ACADEMICIAN_REQUESTS_QUERY_KEY,
    queryFn: getAcademicianRequests,
  });
  const appointments = useQuery({
    queryKey: ACADEMICIAN_APPOINTMENTS_QUERY_KEY,
    queryFn: getAcademicianAppointments,
  });

  const queries = [requests, appointments];
  const shared = {
    isLoading: queries.some((query) => query.isLoading) || advisees.isLoading,
    error: queries.find((query) => query.error)?.error ?? null,
    retry: () => {
      for (const query of queries) void query.refetch();
    },
    isRetrying: queries.some((query) => query.isRefetching),
    back: { href: BACK[from], label: t(`back.${from}`) },
  };
  // Advisees only decide the "Danışanın" chip and the record; a failed list still shows the meetings.
  if (!requests.data || !appointments.data || advisees.isLoading) {
    return { ...shared, student: null, notFound: false };
  }

  const now = new Date(
    Math.max(requests.dataUpdatedAt, appointments.dataUpdatedAt),
  );
  const profile = studentProfile(
    userId,
    {
      advisees: advisees.data ?? [],
      requests: requests.data,
      appointments: appointments.data,
    },
    now,
  );
  if (profile === null) return { ...shared, student: null, notFound: true };

  const historyDay = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TURKEY_TIME_ZONE,
  });
  const pending = profile.pendingRequest;
  const [pendingTime] = pending?.requestedTimes ?? [];

  return {
    ...shared,
    notFound: false,
    student: {
      userId: profile.userId,
      name: profile.fullName,
      subtitle: [
        profile.department,
        profile.classYear === null
          ? null
          : t("classYear", { year: profile.classYear }),
        profile.programLevel === null ? null : tLevel(profile.programLevel),
      ]
        .filter((part) => part !== null)
        .join(" · "),
      isAdvisee: profile.isAdvisee,
      facts: [
        {
          key: "department",
          label: t("department"),
          value: profile.department,
        },
        {
          key: "classYear",
          label: t("classYearLabel"),
          value:
            profile.classYear === null
              ? null
              : t("classYear", { year: profile.classYear }),
        },
        {
          key: "advisor",
          label: t("advisor"),
          value: profile.isAdvisee ? t("advisorYou") : null,
        },
      ].filter(
        (fact): fact is { key: string; label: string; value: string } =>
          fact.value !== null,
      ),
      pendingRequest:
        pending === null
          ? null
          : {
              topic: pending.topic,
              note: pending.note,
              when: pendingTime ? slotWhenLabel(pendingTime, locale) : null,
              href: appointmentsHref(ACADEMICIAN_ROUTES.appointments, {
                request: pending.id,
              }),
              proposeHref: appointmentsHref(ACADEMICIAN_ROUTES.appointments, {
                request: pending.id,
                step: RequestStep.Propose,
              }),
            },
      history: profile.history.map((item) => ({
        key: item.key,
        title: item.title,
        when: t("historyWhen", {
          when: historyDay.format(new Date(item.startsAt)),
        }),
        badge: item.badge,
      })),
      fullProfileHref: studentProfileHref(
        profile.userId,
        StudentProfileOrigin.Appointments,
      ),
    },
  };
}

export type AcademicianStudent = NonNullable<
  ReturnType<typeof useAcademicianStudent>["student"]
>;
