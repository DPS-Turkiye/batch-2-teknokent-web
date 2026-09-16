"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { AppShell } from "@/components/hoc/app-shell";
import { useAppSession } from "@/components/providers/session-provider";
import { useProgramDetail } from "@/hooks/use-programs";
import { UserRole } from "@/interfaces/session";
import {
  PROGRAM_CARD_CLASS,
  PROGRAM_DETAIL_LABELS,
} from "@/lib/const/programs";
import { StartupNameLink } from "@/components/common/startup-name-link";
import { programPersonHref } from "@/lib/program-links";
import { initials } from "@/lib/utils";
import { AppArea } from "@/types/app-area";

export function ProgramDetailView() {
  const params = useParams<{ id: string }>();
  const session = useAppSession();
  const isMentor = session?.role === UserRole.Mentor;
  const homeHref =
    session?.role === UserRole.Mentor ? "/mentor-dashboard" : "/dashboard";
  const query = useProgramDetail(params.id);

  return (
    <AppShell
      active={AppArea.Home}
      menteeHome={session?.role === UserRole.Mentee}
      mentorHome={session?.role === UserRole.Mentor}
    >
      <div className="mx-auto w-full max-w-[960px] px-4 pb-16 pt-3 sm:px-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-[#676e78]">
          <Link href={homeHref} className="hover:text-[#22262b]">
            {PROGRAM_DETAIL_LABELS.home}
          </Link>
          <span>›</span>
          <span className="font-medium text-[#4a5059]">
            {PROGRAM_DETAIL_LABELS.programs}
          </span>
          {query.data ? (
            <>
              <span>›</span>
              <span className="font-medium text-[#4a5059]">
                {query.data.name}
              </span>
            </>
          ) : null}
        </nav>

        {query.isLoading ? (
          <p className="mt-10 text-sm text-[#858c96]">
            {PROGRAM_DETAIL_LABELS.loading}
          </p>
        ) : query.error || !query.data ? (
          <p
            role="alert"
            className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {query.error?.message ?? PROGRAM_DETAIL_LABELS.notFound}
          </p>
        ) : (
          <>
            <header className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide text-[#858c96]">
                {PROGRAM_DETAIL_LABELS.programEyebrow}
              </p>
              <h1 className="mt-1 text-[28px] font-semibold leading-tight text-[#22262b]">
                {query.data.name}
              </h1>
            </header>

            <section className={`mt-6 ${PROGRAM_CARD_CLASS}`}>
              <h2 className="text-[15px] font-semibold text-[#22262b]">
                {PROGRAM_DETAIL_LABELS.coordinator}
              </h2>
              <Link
                href={programPersonHref({
                  userId: query.data.coordinatorId,
                })}
                className="mt-3 flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-[#f7f8f9]"
              >
                <span className="grid size-9 place-items-center rounded-full bg-[#fdebdd] text-[11px] font-medium text-[#a8480e]">
                  {initials(query.data.coordinatorName)}
                </span>
                <span className="text-sm font-medium text-[#22262b]">
                  {query.data.coordinatorName}
                </span>
              </Link>
            </section>

            <section className={`mt-4 ${PROGRAM_CARD_CLASS}`}>
              <h2 className="text-[15px] font-semibold text-[#22262b]">
                {PROGRAM_DETAIL_LABELS.mentors}
              </h2>
              {query.data.mentors.length === 0 ? (
                <p className="mt-3 text-sm text-[#676e78]">
                  {PROGRAM_DETAIL_LABELS.noMentors}
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {query.data.mentors.map((mentor) => (
                    <li key={mentor.mentorId}>
                      <Link
                        href={programPersonHref({
                          userId: mentor.mentorId,
                          isMentor: true,
                        })}
                        className="flex items-center gap-3 rounded-xl px-1 py-1.5 hover:bg-[#f7f8f9]"
                      >
                        <span className="grid size-9 place-items-center rounded-full bg-[#fdebdd] text-[11px] font-medium text-[#a8480e]">
                          {initials(mentor.fullName)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#22262b]">
                            {mentor.fullName}
                          </span>
                          <span className="block truncate text-xs text-[#858c96]">
                            {PROGRAM_DETAIL_LABELS.mentorRole}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={`mt-4 ${PROGRAM_CARD_CLASS}`}>
              <h2 className="text-[15px] font-semibold text-[#22262b]">
                {PROGRAM_DETAIL_LABELS.startups}
              </h2>
              {query.data.startups.length === 0 ? (
                <p className="mt-3 text-sm text-[#676e78]">
                  {PROGRAM_DETAIL_LABELS.noStartups}
                </p>
              ) : (
                <div className="mt-3 space-y-4">
                  {query.data.startups.map((startup) => {
                    return (
                      <article
                        key={startup.id}
                        className="rounded-[16px] border border-[#eef0f3] px-4 py-3.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {isMentor ? (
                            <StartupNameLink
                              organizationId={startup.id}
                              className="text-sm font-semibold"
                            >
                              {startup.name}
                            </StartupNameLink>
                          ) : (
                            <span className="text-sm font-semibold text-[#22262b]">
                              {startup.name}
                            </span>
                          )}
                          <span className="text-xs text-[#858c96]">
                            {PROGRAM_DETAIL_LABELS.memberCount(
                              startup.members.length,
                            )}
                          </span>
                        </div>
                        {startup.members.length === 0 ? (
                          <p className="mt-2 text-xs text-[#858c96]">
                            {PROGRAM_DETAIL_LABELS.noMembers}
                          </p>
                        ) : (
                          <ul className="mt-3 space-y-1.5">
                            {startup.members.map((member) => (
                              <li key={member.id}>
                                <Link
                                  href={programPersonHref({
                                    userId: member.id,
                                  })}
                                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-[#f7f8f9]"
                                >
                                  <span className="grid size-8 place-items-center rounded-full bg-[#f2f4f6] text-[10px] font-medium text-[#676e78]">
                                    {initials(member.fullName)}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-[13px] font-medium text-[#22262b]">
                                      {member.fullName}
                                    </span>
                                    <span className="block truncate text-[11.5px] text-[#858c96]">
                                      {[
                                        member.jobTitle,
                                        member.founder
                                          ? PROGRAM_DETAIL_LABELS.founder
                                          : null,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") ||
                                        PROGRAM_DETAIL_LABELS.memberFallback}
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
