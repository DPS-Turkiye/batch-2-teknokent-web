"use client";

import { useTranslations } from "next-intl";

import { AcademicProfileView } from "@/components/office-hours/academic-profile-view";
import { OfficeHoursFrame } from "@/components/office-hours/office-hours-frame";
import { useOfficeHoursProfilePage } from "@/hooks/use-office-hours-pages";

export function OfficeHoursProfileScreen() {
  const t = useTranslations("officeHours");
  const person = useOfficeHoursProfilePage();
  if (!person) return null;

  return (
    <OfficeHoursFrame
      productName={t("title")}
      userName={person.fullName}
      profile={{ href: "/office-hours/profile", label: t("profile.title") }}
    >
      <AcademicProfileView fullName={person.fullName} />
    </OfficeHoursFrame>
  );
}
