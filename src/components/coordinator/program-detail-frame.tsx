"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import type { ReactNode } from "react";

import { QueryNotice, StatusChip } from "@/components/admin/admin-ui";
import { ProgramGlyph } from "@/components/coordinator/program-glyph";
import { ProgramTabRedirect } from "@/components/coordinator/program-tab-redirect";
import { ProgramTypeChip } from "@/components/coordinator/program-type-chip";
import {
  useCoordinatorProgram,
  useLaunchProgram,
} from "@/hooks/use-coordinator-program";
import { useProgramNavigation } from "@/hooks/use-program-navigation";
import { useProgramWaitingCounts } from "@/hooks/use-program-waiting-counts";
import {
  ProgramLifecycle,
  type CoordinatorProgramDetail,
} from "@/interfaces/coordinator-program";
import { ProgramType } from "@/interfaces/program";
import {
  hasTabContent,
  isActiveTab,
  isParticipantsTab,
  misplacedTabHref,
  participantTabs,
  programHeaderLine,
  programTabs,
  type ProgramTab,
  type ProgramWaitingCounts,
} from "@/lib/coordinator-program-detail";

const LIFECYCLE_TONES: Record<ProgramLifecycle, "green" | "blue" | "neutral"> =
  {
    [ProgramLifecycle.Draft]: "neutral",
    [ProgramLifecycle.Active]: "green",
    [ProgramLifecycle.Upcoming]: "blue",
    [ProgramLifecycle.Completed]: "neutral",
  };

/** The program's header, counts and tabs; each tab page renders inside it. */
export function ProgramDetailFrame({
  programId,
  tab,
  children,
}: {
  programId: string;
  tab: ProgramTab;
  children: (detail: CoordinatorProgramDetail) => ReactNode;
}) {
  const t = useTranslations("coordinatorPrograms");
  const tNav = useTranslations("roleFrame.nav");
  const locale = useLocale();
  const navigation = useProgramNavigation(programId);
  const query = useCoordinatorProgram(programId);
  const detail = query.data;
  const waiting = useProgramWaitingCounts(
    programId,
    detail?.program.type === ProgramType.StartupMentoring
      ? detail.program.teamCount
      : null,
  );
  if (!detail) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const misplaced = misplacedTabHref(detail, programId, tab);
  if (misplaced) {
    return <ProgramTabRedirect href={navigation.resolveHref(misplaced)} />;
  }
  const program = detail.program;

  return (
    <div className="space-y-6">
      <nav
        aria-label={t("breadcrumb")}
        className="flex items-center gap-1.5 text-[13px] text-[#858c96]"
      >
        <Link href={navigation.listHref}>
          {navigation.admin ? tNav("programs") : t("myPrograms")}
        </Link>
        <ChevronRight aria-hidden className="size-3.5" />
        <span className="text-[#22262b]">{program.name}</span>
      </nav>

      <header className="flex items-start gap-4">
        <ProgramGlyph
          muted={program.lifecycle === ProgramLifecycle.Completed}
        />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-3 text-[28px] font-semibold tracking-[-0.03em] text-[#22262b]">
            {program.name}
            <StatusChip tone={LIFECYCLE_TONES[program.lifecycle]}>
              {t(`lifecycle.${program.lifecycle}`)}
            </StatusChip>
            <ProgramTypeChip type={program.type} />
          </h1>
          <p className="mt-1 text-[13.5px] text-[#676e78]">
            {programHeaderLine(detail, t, locale)}
          </p>
        </div>
        <Link
          href={`${navigation.baseHref}/report`}
          className="shrink-0 rounded-full border border-[#e9ecef] bg-white px-4 py-2.5 text-[13.5px] font-medium text-[#22262b]"
        >
          {t("report")}
        </Link>
      </header>

      {program.type === ProgramType.StartupMentoring ? (
        <ul className="flex flex-wrap gap-2 text-[13.5px]">
          <Pill
            dot="#ff6a3d"
            value={program.teamCount}
            waiting={waiting.teams}
            label={t("pills.teams")}
          />
          <Pill
            dot="#26a4ff"
            value={program.mentorCount}
            waiting={waiting.mentors}
            label={t("pills.mentors")}
          />
          <Pill
            value={program.activeMentorshipCount}
            label={t("pills.activeMentorships")}
          />
          <Pill
            dot="#ff6a3d"
            value={program.awaitingMatchCount}
            label={t("pills.awaitingMatch")}
          />
        </ul>
      ) : null}

      {program.lifecycle === ProgramLifecycle.Draft ? (
        <DraftBanner
          programId={programId}
          admin={navigation.admin}
          hasCoordinator={detail.coordinators.length > 0}
        />
      ) : null}

      <div
        role="tablist"
        aria-label={t("sections")}
        className="flex overflow-x-auto border-b border-[#e9ecef]"
      >
        {programTabs(detail, programId).map((item) => {
          const active = isActiveTab(item.id, tab);
          const content = (
            <>
              {t(`tabs.${item.id}`)}
              {item.count != null ? (
                <span className="rounded-full bg-[#f4f5f7] px-2 py-0.5 text-[11.5px] text-[#676e78]">
                  {item.count}
                </span>
              ) : null}
            </>
          );
          const className = `-mb-px flex shrink-0 items-center gap-2 border-b-2 px-5 pb-3 text-[14.5px] ${
            active
              ? "border-[#22262b] font-medium text-[#22262b]"
              : "border-transparent text-[#676e78]"
          }`;
          return item.href ? (
            <Link
              key={item.id}
              href={navigation.resolveHref(item.href)}
              role="tab"
              aria-selected={active}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <span
              key={item.id}
              role="tab"
              aria-selected={false}
              aria-disabled="true"
              title={t("soon")}
              className={`${className} cursor-not-allowed opacity-60`}
            >
              {content}
            </span>
          );
        })}
      </div>

      {isParticipantsTab(tab) ? (
        <ParticipantTabs
          detail={detail}
          programId={programId}
          tab={tab}
          waiting={waiting}
        />
      ) : null}

      {hasTabContent(program.type, tab) ? (
        children(detail)
      ) : (
        <TypeTabEmptyState type={program.type} admin={navigation.admin} />
      )}
    </div>
  );
}

function Pill({
  dot,
  value,
  waiting,
  label,
}: {
  dot?: string;
  value: number;
  waiting?: number | null;
  label: string;
}) {
  const t = useTranslations("coordinatorPrograms");
  return (
    <li className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-3.5 py-2">
      {dot ? (
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ background: dot }}
        />
      ) : null}
      <span className="font-semibold text-[#22262b]">{value}</span>
      <span className="text-[#858c96]">{label}</span>
      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      {waiting ? (
        <span className="text-[#858c96]">
          {t("waitingSuffix", { count: waiting })}
        </span>
      ) : null}
    </li>
  );
}

// TEST UI: placeholder until the design team's screen; replace when it arrives.
function DraftBanner({
  programId,
  admin,
  hasCoordinator,
}: {
  programId: string;
  admin: boolean;
  hasCoordinator: boolean;
}) {
  const t = useTranslations("coordinatorPrograms");
  const launch = useLaunchProgram(programId);
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f4f5f7] px-5 py-3 text-[13px] text-[#676e78]"
    >
      <p>{admin ? t("draftBannerAdmin") : t("draftBannerCoordinator")}</p>
      {admin ? (
        <div className="flex items-center gap-3">
          {hasCoordinator ? null : <span>{t("launchNeedsCoordinator")}</span>}
          <button
            type="button"
            onClick={launch.launch}
            disabled={!hasCoordinator || launch.launching}
            className="rounded-full bg-[#22262b] px-4 py-2 text-[13px] font-medium text-white disabled:bg-[#aeb4bc]"
          >
            {launch.launching ? t("launching") : t("launchProgram")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

// TEST UI: placeholder until the design team's screen; replace when it arrives.
function ParticipantTabs({
  detail,
  programId,
  tab,
  waiting,
}: {
  detail: CoordinatorProgramDetail;
  programId: string;
  tab: ProgramTab;
  waiting: ProgramWaitingCounts;
}) {
  const t = useTranslations("coordinatorPrograms");
  const navigation = useProgramNavigation(programId);
  return (
    <nav aria-label={t("tabs.PARTICIPANTS")} className="flex flex-wrap gap-2">
      {participantTabs(detail, programId, waiting).map((item) => {
        const active = item.id === tab;
        const content = (
          <>
            {t(`participantTabs.${item.id}`)}
            {item.count != null ? (
              <span className="text-[12px] text-[#858c96]">
                {item.count}
                {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
                {item.waiting
                  ? ` ${t("waitingSuffix", { count: item.waiting })}`
                  : null}
              </span>
            ) : null}
          </>
        );
        const className = `inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] ${
          active
            ? "bg-[#22262b] font-medium text-white"
            : "border border-[#e9ecef] text-[#676e78]"
        }`;
        return item.href ? (
          <Link
            key={item.id}
            href={navigation.resolveHref(item.href)}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <span
            key={item.id}
            aria-disabled="true"
            title={t("soon")}
            className={`${className} cursor-not-allowed opacity-60`}
          >
            {content}
          </span>
        );
      })}
    </nav>
  );
}

// TEST UI: placeholder until the design team's screen; replace when it arrives.
export function TypeTabEmptyState({
  type,
  admin,
}: {
  type: ProgramType;
  admin: boolean;
}) {
  const t = useTranslations("coordinatorPrograms");
  const tType = useTranslations("programTypes");
  return (
    <p className="rounded-[28px] border border-dashed border-[#e0e3e7] px-6 py-10 text-center text-[13.5px] text-[#676e78]">
      {t(admin ? "typeTabEmptyAdmin" : "typeTabEmpty", { type: tType(type) })}
    </p>
  );
}
