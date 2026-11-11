import type { OptionGroup } from "@/hooks/use-option-label";
import type { MentorExperience } from "@/interfaces/mentor";
import {
  PersonProgramRelation,
  type PersonSummary,
  type PersonSummaryMentor,
  type PersonSummaryProgram,
  type PersonSummaryStartup,
} from "@/interfaces/person-summary";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserAccountStatus, UserRole } from "@/interfaces/session";
import {
  educationLine,
  experienceDetail,
  experienceHeading,
} from "@/lib/mentor-detail";
import { distinctBy, httpUrlOrNull, initials } from "@/lib/utils";
import {
  SummaryFactKind,
  type KeyedText,
  type PersonSummaryModel,
  type SummaryFact,
  type SummaryFactLabel,
  type SummaryProgramNote,
  type SummaryRoleLabel,
  type SummaryStatusLabel,
  type SummaryStatusTone,
} from "@/types/person-summary";

function roleLabel(role: UserRole): SummaryRoleLabel | null {
  switch (role) {
    case UserRole.Mentor:
      return "roles.MENTOR";
    case UserRole.Mentee:
      return "roles.MENTEE";
    case UserRole.Admin:
    case UserRole.Coordinator:
    case UserRole.Academician:
      return null;
  }
}

function accountStatus(status: UserAccountStatus): {
  tone: SummaryStatusTone;
  label: SummaryStatusLabel;
} {
  switch (status) {
    case UserAccountStatus.Approved:
      return { tone: "green", label: "statuses.APPROVED" };
    case UserAccountStatus.Pending:
      return { tone: "amber", label: "statuses.PENDING" };
    case UserAccountStatus.Rejected:
      return { tone: "red", label: "statuses.REJECTED" };
  }
}

function programNote(program: PersonSummaryProgram): SummaryProgramNote {
  switch (program.relation) {
    case PersonProgramRelation.Mentee:
      return "relations.MENTEE";
    case PersonProgramRelation.Mentor:
      return program.mentorStatus === ProgramMentorStatus.Pending
        ? "mentorPending"
        : "relations.MENTOR";
  }
}

function textFact(
  label: SummaryFactLabel,
  value: string | null,
): SummaryFact[] {
  return value ? [{ kind: SummaryFactKind.Text, label, text: value }] : [];
}

function optionFact(
  label: SummaryFactLabel,
  group: OptionGroup,
  value: string | null,
): SummaryFact[] {
  return value ? [{ kind: SummaryFactKind.Option, label, group, value }] : [];
}

function keyedValues(values: readonly string[]): KeyedText[] {
  return distinctBy(values, (value) => value).map(({ key }) => ({
    key,
    value: key,
  }));
}

function experienceKey(experience: MentorExperience) {
  return `${experienceHeading(experience)}\n${experienceDetail(experience)}`;
}

function mentorModel(mentor: PersonSummaryMentor) {
  const facts: SummaryFact[] = [
    ...textFact("facts.experienceLevel", mentor.experienceLevel),
    ...textFact("facts.sectorExperience", mentor.sectorExperience),
    ...textFact("facts.startupStages", mentor.startupStages),
    ...optionFact("facts.meetingMode", "meetingFormat", mentor.meetingMode),
  ];
  if (mentor.languages.length > 0) {
    facts.push({
      kind: SummaryFactKind.Languages,
      label: "facts.languages",
      languages: mentor.languages,
    });
  }
  return {
    facts,
    offerings: keyedValues(mentor.offerings),
    experiences: distinctBy(mentor.experiences, experienceKey).map(
      ({ key, item }) => ({
        key,
        heading: experienceHeading(item),
        detail: experienceDetail(item),
      }),
    ),
    educations: distinctBy(mentor.educations, educationLine).map(({ key }) => ({
      key,
      value: key,
    })),
  };
}

function startupModel(startup: PersonSummaryStartup) {
  return {
    name: startup.name,
    description: startup.description,
    websiteUrl: httpUrlOrNull(startup.website),
    facts: [
      ...textFact("startupFields.sector", startup.sector),
      ...optionFact("startupFields.maturity", "stage", startup.maturity),
      ...optionFact(
        "startupFields.fundingStage",
        "fundingStage",
        startup.fundingStage,
      ),
      ...textFact(
        "startupFields.foundedYear",
        startup.foundedYear === null ? null : String(startup.foundedYear),
      ),
      ...textFact("startupFields.problem", startup.problem),
      ...textFact("startupFields.solution", startup.solution),
    ],
  };
}

function menteeLoad(mentor: PersonSummaryMentor) {
  const active = String(mentor.activeMenteeCount);
  return mentor.menteeCapacity
    ? `${active} / ${String(mentor.menteeCapacity)}`
    : active;
}

function activity(summary: PersonSummary): SummaryFact[] {
  const mentor = summary.mentor;
  const facts: SummaryFact[] = mentor
    ? [
        ...textFact("activeMentees", menteeLoad(mentor)),
        ...textFact(
          "completedMentorships",
          String(mentor.completedMentorshipCount),
        ),
      ]
    : [];
  if (summary.createdAt) {
    facts.push({
      kind: SummaryFactKind.Date,
      label: "registered",
      date: summary.createdAt,
    });
  }
  return facts;
}

/**
 * Decides what the profile page shows. A mentor's own title and about text win over the account's job title and
 * bio, only plain web links become links, and empty facts are left out.
 */
export function personSummaryModel(summary: PersonSummary): PersonSummaryModel {
  const mentor = summary.mentor;
  const headline = mentor
    ? [mentor.professionalTitle, mentor.company].filter(Boolean).join(" · ")
    : summary.jobTitle;
  const mentee = summary.role === UserRole.Mentee;
  return {
    fullName: summary.fullName,
    initials: initials(summary.fullName),
    email: summary.email,
    roleLabel: roleLabel(summary.role),
    status: accountStatus(summary.status),
    headline: headline || null,
    linkedinUrl: httpUrlOrNull(summary.linkedinUrl),
    about: mentor?.about || summary.bio || null,
    tags: keyedValues(
      mentor && mentor.specialties.length > 0
        ? mentor.specialties
        : summary.expertise,
    ),
    mentor: mentor ? mentorModel(mentor) : null,
    showStartup: mentee || summary.startup !== null,
    startup: summary.startup ? startupModel(summary.startup) : null,
    programs: summary.programs.map((program) => ({
      key: `${program.id}-${program.relation}`,
      id: program.id,
      name: program.name,
      note: programNote(program),
    })),
    activity: activity(summary),
    showTeamHistory: mentee,
  };
}
