import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Video,
} from "lucide-react";

import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/common/badge";
import { AppShell } from "@/components/hoc/app-shell";
import { loadMentors } from "@/lib/mentors";
import { AppArea } from "@/types/app-area";

export const dynamic = "force-dynamic";

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { mentors } = await loadMentors();
  const mentor = mentors.find((item) => item.id === id);

  if (!mentor) notFound();

  return (
    <AppShell active={AppArea.Mentorships}>
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-14 pt-8 sm:px-8">
        <Link
          href="/mentor-request?step=4"
          className="inline-flex items-center gap-2 text-xs font-medium text-[#676e78] hover:text-[#e86f22]"
        >
          <ArrowLeft className="size-4" /> Mentor önerilerine dön
        </Link>

        <section className="mt-6 grid gap-5 rounded-3xl border border-[#e4e7ea] bg-white p-6 shadow-sm md:grid-cols-[96px_minmax(0,1fr)_230px]">
          <Avatar initials={mentor.initials} size="lg" tone="orange" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#e86f22]">
              Önerilen mentor
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {mentor.fullName}
            </h1>
            <p className="mt-1 text-sm text-[#676e78]">
              {mentor.professionalTitle} · {mentor.company}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {mentor.specialties.map((specialty) => (
                <Badge key={specialty}>{specialty}</Badge>
              ))}
            </div>
          </div>
          <aside className="rounded-2xl bg-[#fff9f5] p-4">
            <p className="text-xs text-[#858c96]">Uygunluk</p>
            <p className="mt-1 text-sm font-semibold text-[#c85816]">
              {mentor.availabilityLabel}
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-[#676e78]">
              <Clock3 className="size-4" /> {mentor.responseTimeLabel}
            </p>
            <Link
              href="/mentor-request"
              className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e86f22] px-4 text-xs font-semibold text-white"
            >
              Mentorluk talebi oluştur <ArrowRight className="size-4" />
            </Link>
          </aside>
        </section>

        <section className="mt-5 rounded-2xl border border-[#f2b78f] bg-[#fff9f5] p-5">
          <h2 className="text-sm font-semibold text-[#c85816]">
            Bu mentor neden sana önerildi?
          </h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {mentor.recommendationReasons.map((reason) => (
              <li
                key={reason}
                className="flex items-start gap-2 text-sm leading-6 text-[#676e78]"
              >
                <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#e86f22]" />
                {reason}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <h2 className="text-base font-semibold">Deneyim ve uzmanlık</h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[#858c96]">Deneyim seviyesi</dt>
                  <dd className="mt-1 font-medium">{mentor.experienceLevel}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#858c96]">Sektör deneyimi</dt>
                  <dd className="mt-1 font-medium">
                    {mentor.sectorExperience}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#858c96]">Girişim aşamaları</dt>
                  <dd className="mt-1 font-medium">{mentor.startupStages}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[#858c96]">
                    Mentorluk yaklaşımı
                  </dt>
                  <dd className="mt-1 font-medium">{mentor.mentoringStyle}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <h2 className="text-base font-semibold">Öneri kanıtları</h2>
              {mentor.recommendationEvidence.length ? (
                <div className="mt-4 space-y-3">
                  {mentor.recommendationEvidence.map((evidence) => (
                    <blockquote
                      key={evidence.claim + evidence.quote}
                      className="rounded-xl border-l-2 border-[#e86f22] bg-[#f8f9fa] p-4 text-sm leading-6 text-[#676e78]"
                    >
                      <strong className="block text-xs text-[#22262b]">
                        {evidence.category} · {evidence.claim}
                      </strong>
                      <span className="mt-1 block">{evidence.quote}</span>
                    </blockquote>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#676e78]">
                  Eşleşme, mentor uzmanlıkları ve girişim ihtiyacı üzerinden
                  oluşturuldu.
                </p>
              )}
            </section>
          </div>
          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#e4e7ea] bg-white p-5">
              <h2 className="text-base font-semibold">Mentorluk bilgisi</h2>
              <div className="mt-4 space-y-4 text-sm text-[#676e78]">
                <p className="flex items-center gap-3">
                  <Video className="size-4 text-[#e86f22]" />
                  {mentor.meetingMode}
                </p>
                <p>{mentor.communicationPreference}</p>
                <p>{mentor.fitLabel}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
