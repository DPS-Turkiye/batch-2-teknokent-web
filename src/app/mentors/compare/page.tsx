import { getTranslations } from "next-intl/server";

import { Avatar } from "@/components/common/avatar";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { mentorProfileHref } from "@/lib/mentor-profile-request";
import { loadMentors } from "@/lib/mentors";

export const dynamic = "force-dynamic";

type Mentor = Awaited<ReturnType<typeof loadMentors>>["mentors"][number];
type OptionLabel = (
  group: "mentorTopic" | "meetingFormat",
  value: string,
) => string;

const comparisonRows = [
  [
    "specialties",
    (mentor: Mentor, label: OptionLabel) =>
      mentor.specialties.map((topic) => label("mentorTopic", topic)).join(", "),
  ],
  ["experience", (mentor: Mentor) => mentor.experienceLevel],
  ["sector", (mentor: Mentor) => mentor.sectorExperience],
  ["stages", (mentor: Mentor) => mentor.startupStages],
  [
    "meetingMode",
    (mentor: Mentor, label: OptionLabel) =>
      mentor.meetingMode && label("meetingFormat", mentor.meetingMode),
  ],
  ["availability", (mentor: Mentor) => mentor.availabilityLabel],
  ["style", (mentor: Mentor) => mentor.mentoringStyle],
] as const;

export default async function MentorComparisonPage() {
  const [t, tOption, { mentors, error }] = await Promise.all([
    getTranslations("mentorCompare"),
    getTranslations("optionValues"),
    loadMentors(),
  ]);
  // Same fallback as useOptionLabel: values the list doesn't know show as stored.
  const optionLabel: OptionLabel = (group, value) => {
    const key = `${group}.${value}` as Parameters<typeof tOption>[0];
    return tOption.has(key) ? tOption(key) : value;
  };
  const visibleMentors = mentors.slice(0, 3);

  return (
    <AppShell title={t("title")} backHref="/mentor-request?step=4">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            {t("loadFailed")}
          </p>
        ) : null}
        {visibleMentors.length === 0 ? (
          <p className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-sm text-[#777]">
            {t("empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#fafafa]">
                  <th className="w-1/4 p-4 text-left" />
                  {visibleMentors.map((mentor, index) => (
                    <th
                      key={mentor.id}
                      className="w-1/4 p-4 text-left font-medium"
                    >
                      <span className="flex items-center gap-3">
                        <Avatar initials={mentor.initials} size="sm" />
                        {mentor.fullName}
                      </span>
                      <span className="mt-3 block text-xs text-[#777]">
                        {index === 0 ? t("bestMatch") : ""}
                        {mentor.professionalTitle} · {mentor.company}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([row, value], index) => (
                  <tr
                    key={row}
                    className={index % 2 ? "bg-[#fafafa]" : "bg-white"}
                  >
                    <td className="p-4 text-[#777]">{t(`rows.${row}`)}</td>
                    {visibleMentors.map((mentor) => (
                      <td key={mentor.id} className="p-4 text-[#444]">
                        {value(mentor, optionLabel) || t("notSpecified")}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {visibleMentors.map((mentor) => (
                    <td key={mentor.id} className="p-4">
                      <SecondaryButton
                        href={mentorProfileHref(mentor.id)}
                        className="mb-2 w-full border-0"
                      >
                        {t("viewProfile")}
                      </SecondaryButton>
                      <PrimaryButton
                        href={mentorProfileHref(mentor.id)}
                        className="w-full"
                      >
                        {t("sendRequest")}
                      </PrimaryButton>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
