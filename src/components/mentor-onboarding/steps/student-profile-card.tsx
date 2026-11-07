"use client";

import { useTranslations } from "next-intl";

import {
  OnboardingCard,
  OnboardingChips,
  onboardingInputClass,
} from "@/components/onboarding/onboarding-ui";
import {
  ONBOARDING_TONES,
  OnboardingTone,
} from "@/components/onboarding/onboarding-tone";
import type { StudentOnboardingDraft } from "@/interfaces/mentor-onboarding";
import { STUDENT_LEVELS } from "@/lib/student-topics";

const TONE = OnboardingTone.Mentor;
const inputClass = `${onboardingInputClass} ${ONBOARDING_TONES[TONE].focus}`;
const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-[#4a5059]";

// TEST UI: placeholder until the design team's screen; replace when it arrives.
/** "Öğrenim bilgilerin": what mentees see about a student mentor (İŞKUR); internships go in Deneyim. */
export function StudentProfileCard({
  student,
  onChange,
}: {
  student: StudentOnboardingDraft;
  onChange: (key: keyof StudentOnboardingDraft, value: string) => void;
}) {
  const copy = useTranslations("mentorSteps");

  return (
    <OnboardingCard
      rounded="rounded-xl"
      title={copy("studentProfileTitle")}
      subtitle={copy("studentProfileSubtitle")}
    >
      <label className={labelClass}>
        {copy("studentDepartment")}
        <input
          className={inputClass}
          value={student.department}
          maxLength={255}
          placeholder={copy("studentDepartmentPlaceholder")}
          onChange={(event) => onChange("department", event.target.value)}
        />
      </label>
      <OnboardingChips
        tone={TONE}
        label={copy("studentYear")}
        options={STUDENT_LEVELS}
        selected={student.studyYear ? [student.studyYear] : []}
        onToggle={(year) =>
          onChange("studyYear", year === student.studyYear ? "" : year)
        }
      />
      <label className={labelClass}>
        {copy("studentCourses")}
        <input
          className={inputClass}
          value={student.courses}
          placeholder={copy("studentCoursesPlaceholder")}
          onChange={(event) => onChange("courses", event.target.value)}
        />
      </label>
      <label className={labelClass}>
        {copy("studentProjects")}
        <textarea
          className={`${inputClass} min-h-20 py-2`}
          value={student.projects}
          placeholder={copy("studentProjectsPlaceholder")}
          onChange={(event) => onChange("projects", event.target.value)}
        />
      </label>
      <label className={labelClass}>
        {copy("studentErasmus")}
        <input
          className={inputClass}
          value={student.erasmus}
          maxLength={500}
          placeholder={copy("studentErasmusPlaceholder")}
          onChange={(event) => onChange("erasmus", event.target.value)}
        />
      </label>
      <p className="text-xs text-[#858c96]">{copy("studentInternshipsNote")}</p>
    </OnboardingCard>
  );
}
