// TEST UI: placeholder until the design team's screen; replace when it arrives.
"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, type ReactNode } from "react";

import { Avatar, Panel, StatusChip } from "@/components/admin/admin-ui";
import { TeamHistory } from "@/components/common/team-history";
import { usePersonSummary } from "@/hooks/use-person-summary";
import { useOptionLabel } from "@/hooks/use-option-label";
import {
  PersonProgramRelation,
  type PersonSummary,
  type PersonSummaryMentor,
  type PersonSummaryProgram,
  type PersonSummaryStartup,
} from "@/interfaces/person-summary";
import type { MentorExperience } from "@/interfaces/mentor";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  educationLine,
  experienceDetail,
  experienceHeading,
} from "@/lib/mentor-detail";
import {
  distinctBy,
  formatShortDate,
  httpUrlOrNull,
  initials,
} from "@/lib/utils";

const STATUS_TONE = {
  [UserAccountStatus.Approved]: "green",
  [UserAccountStatus.Pending]: "amber",
  [UserAccountStatus.Rejected]: "red",
} as const;

type Fact = [label: string, value: string | null];

function experienceKey(experience: MentorExperience) {
  return `${experienceHeading(experience)}\n${experienceDetail(experience)}`;
}

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
      ) : profile.summary ? (
        <ProfileBody
          summary={profile.summary}
          programHref={profile.programHref}
        />
      ) : null}
    </div>
  );
}

function ProfileBody({
  summary,
  programHref,
}: {
  summary: PersonSummary;
  programHref: (programId: string) => string;
}) {
  const t = useTranslations("personSummary");
  const optionLabel = useOptionLabel();
  const mentor = summary.mentor;
  const about = mentor?.about || summary.bio;
  const tags = mentor?.specialties.length
    ? mentor.specialties
    : summary.expertise;

  return (
    <>
      <ProfileHeader summary={summary} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Section title={t("about")}>
            {about ? (
              <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[#22262b] [overflow-wrap:anywhere]">
                {about}
              </p>
            ) : (
              <p className="text-[13.5px] text-[#858c96]">{t("noAbout")}</p>
            )}
            {tags.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-[12px] text-[#858c96]">{t("expertise")}</p>
                <Chips
                  items={tags.map((tag) => optionLabel("mentorTopic", tag))}
                />
              </div>
            ) : null}
          </Section>
          {mentor ? <MentorSections mentor={mentor} /> : null}
          {summary.role === UserRole.Mentee || summary.startup ? (
            <StartupSection startup={summary.startup} />
          ) : null}
        </div>
        <aside className="min-w-0 space-y-6">
          <ProgramsSection
            programs={summary.programs}
            programHref={programHref}
          />
          <ActivitySection summary={summary} />
        </aside>
      </div>
    </>
  );
}

function ProfileHeader({ summary }: { summary: PersonSummary }) {
  const t = useTranslations("personSummary");
  const linkedin = httpUrlOrNull(summary.linkedinUrl);
  const roleLabel =
    summary.role === UserRole.Mentor
      ? t("roles.MENTOR")
      : summary.role === UserRole.Mentee
        ? t("roles.MENTEE")
        : null;
  const headline = summary.mentor
    ? [summary.mentor.professionalTitle, summary.mentor.company]
        .filter(Boolean)
        .join(" · ")
    : summary.jobTitle;

  return (
    <Panel>
      <div className="flex flex-wrap items-start gap-4 px-6 py-6">
        <Avatar initials={initials(summary.fullName)} size="lg" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#22262b] [overflow-wrap:anywhere]">
              {summary.fullName}
            </h1>
            {roleLabel ? (
              <span className="text-[12px] text-[#858c96]">{roleLabel}</span>
            ) : null}
            <StatusChip tone={STATUS_TONE[summary.status]}>
              {t(`statuses.${summary.status}`)}
            </StatusChip>
          </div>
          {headline ? (
            <p className="text-[14px] text-[#676e78] [overflow-wrap:anywhere]">
              {headline}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
            <a
              href={`mailto:${summary.email}`}
              className="text-[#1583d6] [overflow-wrap:anywhere] hover:underline"
            >
              {summary.email}
            </a>
            {linkedin ? (
              <a
                href={linkedin}
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

function MentorSections({ mentor }: { mentor: PersonSummaryMentor }) {
  const t = useTranslations("personSummary");
  const tLanguage = useTranslations("options.language");
  const optionLabel = useOptionLabel();
  const facts: Fact[] = [
    [t("facts.experienceLevel"), mentor.experienceLevel],
    [t("facts.sectorExperience"), mentor.sectorExperience],
    [t("facts.startupStages"), mentor.startupStages],
    [
      t("facts.meetingMode"),
      mentor.meetingMode
        ? optionLabel("meetingFormat", mentor.meetingMode)
        : null,
    ],
    [
      t("facts.languages"),
      mentor.languages.map((language) => tLanguage(language)).join(", ") ||
        null,
    ],
  ];

  return (
    <>
      <Section title={t("mentoring")}>
        <Facts facts={facts} />
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
            {distinctBy(mentor.experiences, experienceKey).map(
              ({ key, item: experience }) => (
                <li key={key}>
                  <p className="text-[13.5px] font-medium text-[#22262b]">
                    {experienceHeading(experience)}
                  </p>
                  <p className="text-[12.5px] text-[#676e78]">
                    {experienceDetail(experience)}
                  </p>
                </li>
              ),
            )}
          </ul>
        </Section>
      ) : null}
      {mentor.educations.length > 0 ? (
        <Section title={t("education")}>
          <ul className="space-y-2 text-[13.5px] text-[#22262b]">
            {distinctBy(mentor.educations, educationLine).map(({ key }) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
        </Section>
      ) : null}
    </>
  );
}

function StartupSection({ startup }: { startup: PersonSummaryStartup | null }) {
  const t = useTranslations("personSummary");
  const optionLabel = useOptionLabel();
  if (!startup) {
    return (
      <Section title={t("startup")}>
        <p className="text-[13.5px] text-[#858c96]">{t("noStartup")}</p>
      </Section>
    );
  }
  const website = httpUrlOrNull(startup.website);
  const facts: Fact[] = [
    [t("startupFields.sector"), startup.sector],
    [
      t("startupFields.maturity"),
      startup.maturity ? optionLabel("stage", startup.maturity) : null,
    ],
    [
      t("startupFields.fundingStage"),
      startup.fundingStage
        ? optionLabel("fundingStage", startup.fundingStage)
        : null,
    ],
    [
      t("startupFields.foundedYear"),
      startup.foundedYear == null ? null : String(startup.foundedYear),
    ],
    [t("startupFields.problem"), startup.problem],
    [t("startupFields.solution"), startup.solution],
  ];

  return (
    <Section title={t("startup")}>
      <p className="text-[15px] font-medium text-[#22262b]">{startup.name}</p>
      {startup.description ? (
        <p className="mt-1 whitespace-pre-line text-[13.5px] text-[#676e78] [overflow-wrap:anywhere]">
          {startup.description}
        </p>
      ) : null}
      <div className="mt-4">
        <Facts facts={facts} />
      </div>
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-[13px] text-[#1583d6] hover:underline"
        >
          {t("startupFields.website")}
        </a>
      ) : null}
    </Section>
  );
}

function ProgramsSection({
  programs,
  programHref,
}: {
  programs: PersonSummaryProgram[];
  programHref: (programId: string) => string;
}) {
  const t = useTranslations("personSummary");
  return (
    <Section title={t("programs")}>
      {programs.length === 0 ? (
        <p className="text-[13px] text-[#858c96]">{t("noPrograms")}</p>
      ) : (
        <ul className="space-y-2">
          {programs.map((program) => (
            <li
              key={`${program.id}-${program.relation}`}
              className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
            >
              <Link
                href={programHref(program.id)}
                className="text-[13.5px] font-medium text-[#22262b] hover:underline"
              >
                {program.name}
              </Link>
              <p className="text-[12px] text-[#858c96]">
                {program.relation === PersonProgramRelation.Mentee
                  ? t("relations.MENTEE")
                  : program.mentorStatus === ProgramMentorStatus.Pending
                    ? t("mentorPending")
                    : t("relations.MENTOR")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ActivitySection({ summary }: { summary: PersonSummary }) {
  const t = useTranslations("personSummary");
  const locale = useLocale();
  const mentor = summary.mentor;
  const facts: Fact[] = [
    [
      t("activeMentees"),
      mentor
        ? mentor.menteeCapacity
          ? `${mentor.activeMenteeCount} / ${mentor.menteeCapacity}`
          : String(mentor.activeMenteeCount)
        : null,
    ],
    [
      t("completedMentorships"),
      mentor ? String(mentor.completedMentorshipCount) : null,
    ],
    [
      t("registered"),
      summary.createdAt ? formatShortDate(summary.createdAt, locale) : null,
    ],
  ];
  return (
    <Section title={t("activity")}>
      <Facts facts={facts} />
      {summary.role === UserRole.Mentee ? (
        <div className="mt-3">
          <TeamHistory userId={summary.id} />
        </div>
      ) : null}
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

function Facts({ facts }: { facts: Fact[] }) {
  const shown = facts.filter(([, value]) => value);
  if (shown.length === 0) return null;
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {shown.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[12px] text-[#858c96]">{label}</dt>
          <dd className="whitespace-pre-line text-[13.5px] text-[#22262b] [overflow-wrap:anywhere]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {distinctBy(items, (item) => item).map(({ key: item }) => (
        <span
          key={item}
          className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#e0522a]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
