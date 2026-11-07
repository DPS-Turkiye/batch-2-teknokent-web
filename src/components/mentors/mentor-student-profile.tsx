"use client";

import { useTranslations } from "next-intl";

import type { StudentProfile } from "@/interfaces/mentor";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
/** A student mentor's studies on the mentor page mentees see. */
export function MentorStudentProfile({
  profile,
  cardClass,
  headingClass,
}: {
  profile: StudentProfile;
  cardClass: string;
  headingClass: string;
}) {
  const t = useTranslations("mentorStudentProfile");
  const rows = [
    { label: t("department"), value: profile.department },
    { label: t("year"), value: profile.studyYear },
    { label: t("courses"), value: profile.strongCourses.join(", ") },
    { label: t("erasmus"), value: profile.erasmus },
  ].filter((row) => row.value);

  return (
    <section className={cardClass}>
      <h2 className={headingClass}>{t("title")}</h2>
      <dl className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="text-[13px] leading-5">
            <dt className="inline font-medium text-[#22262b]">{row.label}: </dt>
            <dd className="inline text-[#676e78]">{row.value}</dd>
          </div>
        ))}
      </dl>
      {profile.projects.length > 0 ? (
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-[#22262b]">
            {t("projects")}
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-[#676e78]">
            {profile.projects.map((project) => (
              <li key={project}>{project}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
