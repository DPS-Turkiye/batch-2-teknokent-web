import { Avatar } from "@/components/common/avatar";
import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { AppShell } from "@/components/hoc/app-shell";
import { loadMentors } from "@/lib/mentors";

export const dynamic = "force-dynamic";

type Mentor = Awaited<ReturnType<typeof loadMentors>>["mentors"][number];

const comparisonRows = [
  ["Uzmanlık", (mentor: Mentor) => mentor.specialties.join(", ")],
  ["Deneyim", (mentor: Mentor) => mentor.experienceLevel],
  ["Sektör", (mentor: Mentor) => mentor.sectorExperience],
  ["Girişim aşamaları", (mentor: Mentor) => mentor.startupStages],
  ["Görüşme biçimi", (mentor: Mentor) => mentor.meetingMode],
  ["Müsaitlik", (mentor: Mentor) => mentor.availabilityLabel],
  ["Mentorluk yaklaşımı", (mentor: Mentor) => mentor.mentoringStyle],
] as const;

export default async function MentorComparisonPage() {
  const { mentors, error } = await loadMentors();
  const visibleMentors = mentors.slice(0, 3);

  return (
    <AppShell title="Mentor Karşılaştırması" backHref="/mentor-request?step=4">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            Mentorlar şu anda yüklenemedi: {error}
          </p>
        ) : null}
        {visibleMentors.length === 0 ? (
          <p className="rounded-lg border border-[#e5e7eb] bg-white p-8 text-sm text-[#777]">
            Karşılaştırılabilecek mentor bulunamadı.
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
                        {index === 0 ? "En uygun · " : ""}
                        {mentor.professionalTitle} · {mentor.company}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([label, value], index) => (
                  <tr
                    key={label}
                    className={index % 2 ? "bg-[#fafafa]" : "bg-white"}
                  >
                    <td className="p-4 text-[#777]">{label}</td>
                    {visibleMentors.map((mentor) => (
                      <td key={mentor.id} className="p-4 text-[#444]">
                        {value(mentor) || "Belirtilmedi"}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td />
                  {visibleMentors.map((mentor) => (
                    <td key={mentor.id} className="p-4">
                      <SecondaryButton className="mb-2 w-full border-0">
                        Profili Görüntüle
                      </SecondaryButton>
                      <PrimaryButton
                        href={`/mentor-request?step=4&mentor=${encodeURIComponent(mentor.id)}`}
                        className="w-full"
                      >
                        Bu Mentoru Seç
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
