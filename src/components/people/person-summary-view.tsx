// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useId, type ReactNode } from "react";

import { Avatar, Panel, StatusChip } from "@/components/admin/admin-ui";
import { TeamHistory } from "@/components/common/team-history";
import {
  usePersonSummary,
  type SummaryFactText,
} from "@/hooks/use-person-summary";
import type { KeyedText } from "@/types/person-summary";

type SummaryView = NonNullable<ReturnType<typeof usePersonSummary>["view"]>;

/** "Profili gör": who a mentor or mentee is and what they do, for admins and their coordinators. */
export function PersonSummaryView({ userId }: { userId: string }) {
  const t = useTranslations("personSummary");
  const profile = usePersonSummary(userId);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={profile.goBack}
        className="inline-flex items-center gap-1.5 text-[13px] text-[#676e78] hover:text-[#22262b]"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </button>
      {profile.query.isLoading ? (
        <p role="status" className="text-sm text-[#858c96]">
          {t("loading")}
        </p>
      ) : profile.notFound ? (
        <Panel>
          <div className="space-y-3 px-6 py-8">
            <p role="status" className="text-sm text-[#22262b]">
              {t("notFound")}
            </p>
            <Link
              href={profile.listHref}
              className="text-[13px] font-medium text-[#9e4400] hover:underline"
            >
              {t("toList")}
            </Link>
          </div>
        </Panel>
      ) : profile.query.error ? (
        <p role="alert" className="text-sm text-[#d9464b]">
          {profile.query.error.message}
        </p>
      ) : profile.view ? (
        <ProfileBody view={profile.view} />
      ) : null}
    </div>
  );
}

function ProfileBody({ view }: { view: SummaryView }) {
  const t = useTranslations("personSummary");
  return (
    <>
      <ProfileHeader view={view} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Section title={t("about")}>
            {view.about ? (
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#22262b] [overflow-wrap:anywhere]">
                {view.about}
              </p>
            ) : (
              <p className="text-[13.5px] text-[#858c96]">{t("noAbout")}</p>
            )}
            {view.tags.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-[12px] text-[#858c96]">{t("expertise")}</p>
                <Chips items={view.tags} />
              </div>
            ) : null}
          </Section>
          {view.mentor ? <MentorSections mentor={view.mentor} /> : null}
          {view.showStartup ? <StartupSection startup={view.startup} /> : null}
        </div>
        <aside className="min-w-0 space-y-6">
          <Section title={t("programs")}>
            {view.programs.length === 0 ? (
              <p className="text-[13px] text-[#858c96]">{t("noPrograms")}</p>
            ) : (
              <ul className="space-y-2">
                {view.programs.map((program) => (
                  <li
                    key={program.key}
                    className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                  >
                    <Link
                      href={program.href}
                      className="text-[13.5px] font-medium text-[#22262b] hover:underline"
                    >
                      {program.name}
                    </Link>
                    <p className="text-[12px] text-[#858c96]">{program.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title={t("activity")}>
            <Facts facts={view.activity} />
            {view.showTeamHistory ? (
              <div className="mt-3">
                <TeamHistory userId={view.userId} />
              </div>
            ) : null}
          </Section>
        </aside>
      </div>
    </>
  );
}

function ProfileHeader({ view }: { view: SummaryView }) {
  const t = useTranslations("personSummary");
  return (
    <Panel>
      <div className="flex flex-wrap items-start gap-4 px-6 py-6">
        <Avatar initials={view.initials} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#22262b] [overflow-wrap:anywhere]">
              {view.fullName}
            </h1>
            {view.roleLabel ? (
              <span className="text-[12px] text-[#858c96]">
                {view.roleLabel}
              </span>
            ) : null}
            <StatusChip tone={view.status.tone}>{view.status.label}</StatusChip>
          </div>
          {view.headline ? (
            <p className="text-[14px] text-[#676e78] [overflow-wrap:anywhere]">
              {view.headline}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            <a
              href={`mailto:${view.email}`}
              className="text-[#1583d6] [overflow-wrap:anywhere] hover:underline"
            >
              {view.email}
            </a>
            {view.linkedinUrl ? (
              <a
                href={view.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1583d6] hover:underline"
              >
                {t("linkedin")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function MentorSections({
  mentor,
}: {
  mentor: NonNullable<SummaryView["mentor"]>;
}) {
  const t = useTranslations("personSummary");
  return (
    <>
      <Section title={t("mentoring")}>
        <Facts facts={mentor.facts} />
        {mentor.offerings.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-[12px] text-[#858c96]">{t("offerings")}</p>
            <Chips items={mentor.offerings} />
          </div>
        ) : null}
      </Section>
      {mentor.experiences.length > 0 ? (
        <Section title={t("experience")}>
          <ul className="space-y-3">
            {mentor.experiences.map((experience) => (
              <li key={experience.key}>
                <p className="text-[13.5px] font-medium text-[#22262b]">
                  {experience.heading}
                </p>
                <p className="text-[12.5px] text-[#676e78]">
                  {experience.detail}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      {mentor.educations.length > 0 ? (
        <Section title={t("education")}>
          <ul className="space-y-2 text-[13.5px] text-[#22262b]">
            {mentor.educations.map((education) => (
              <li key={education.key}>{education.value}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

function StartupSection({ startup }: { startup: SummaryView["startup"] }) {
  const t = useTranslations("personSummary");
  return (
    <Section title={t("startup")}>
      {startup ? (
        <>
          <p className="text-[15px] font-medium text-[#22262b]">
            {startup.name}
          </p>
          {startup.description ? (
            <p className="mt-1 whitespace-pre-line text-[13.5px] text-[#676e78] [overflow-wrap:anywhere]">
              {startup.description}
            </p>
          ) : null}
          <div className="mt-4">
            <Facts facts={startup.facts} />
          </div>
          {startup.websiteUrl ? (
            <a
              href={startup.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[13px] text-[#1583d6] hover:underline"
            >
              {t("startupFields.website")}
            </a>
          ) : null}
        </>
      ) : (
        <p className="text-[13.5px] text-[#858c96]">{t("noStartup")}</p>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <Panel>
      <section aria-labelledby={headingId} className="px-6 py-5">
        <h2
          id={headingId}
          className="mb-3 text-[15px] font-semibold text-[#22262b]"
        >
          {title}
        </h2>
        {children}
      </section>
    </Panel>
  );
}

function Facts({ facts }: { facts: SummaryFactText[] }) {
  if (facts.length === 0) return null;
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {facts.map((fact) => (
        <div key={fact.key} className="min-w-0">
          <dt className="text-[12px] text-[#858c96]">{fact.label}</dt>
          <dd className="whitespace-pre-line text-[13.5px] text-[#22262b] [overflow-wrap:anywhere]">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Chips({ items }: { items: KeyedText[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item.key}
          className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#e0522a]"
        >
          {item.value}
        </span>
      ))}
    </div>
  );
}
