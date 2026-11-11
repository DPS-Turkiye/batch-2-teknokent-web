"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { AddCoordinatorDialog } from "@/components/admin/add-coordinator-dialog";
import { AdminAcademicsTable } from "@/components/admin/admin-academics-table";
import {
  activeMentorshipFor,
  assignableProgramsForMentor,
  assignableProgramsForStartup,
  coordinatorsOf,
  mentorsOf,
  needsAttention,
  programsForCoordinator,
  programsForMentor,
  startupsOf,
} from "@/components/admin/admin-model";
import { AdminStudentsTable } from "@/components/admin/admin-students-table";
import { AdminIcon, EmptyNote, QueryNotice } from "@/components/admin/admin-ui";
import { AssignToProgram } from "@/components/admin/assign-to-program";
import { CoordinatorAccessControl } from "@/components/admin/coordinator-access-control";
import {
  ApproveCoordinatorDialog,
  CoordinatorApplicationDialog,
} from "@/components/admin/coordinator-approval";
import { RevokeSignInsButton } from "@/components/admin/revoke-sign-ins-button";
import { TeamHistory } from "@/components/common/team-history";
import { useCoordinatorAccess } from "@/hooks/use-admin-coordinators";
import { useAdminOverview } from "@/hooks/use-admin-overview";
import { useOptionLabel } from "@/hooks/use-option-label";
import { useDecidePendingAccount } from "@/hooks/use-pending-accounts";
import {
  ProgramMemberKind,
  type AdminOverview,
  type AdminProgram,
  type AdminStartup,
  type AdminUser,
} from "@/interfaces/admin-overview";
import { ProgramMentorStatus } from "@/interfaces/program";
import { UserAccountStatus } from "@/interfaces/session";
import { ToastTone } from "@/interfaces/toast";
import { errorMessage, initials } from "@/lib/utils";
import type messages from "@/messages/tr.json";
import { useToast } from "@/stores/toast-store";

export type UserTab =
  "coordinators" | "mentors" | "teams" | "students" | "academics";

const PAGE_SIZE = 7;

type AccountDecision = UserAccountStatus.Approved | UserAccountStatus.Rejected;

type UsersT = ReturnType<typeof useTranslations<"adminUsers">>;
type Filter = keyof (typeof messages)["adminUsers"]["filters"];
type Section = keyof (typeof messages)["adminUsers"]["sections"];

export function UsersView({ tab }: { tab: UserTab }) {
  const t = useTranslations("adminUsers");
  const query = useAdminOverview();
  const focusUserId = useSearchParams().get("user");
  const [inviteOpen, setInviteOpen] = useState(false);
  if (!query.data) {
    return <QueryNotice isLoading={query.isLoading} error={query.error} />;
  }
  const data = query.data;
  const tabs = [
    {
      id: "coordinators" as const,
      href: "/admin/users",
      label: t("tabs.coordinators"),
      count: coordinatorsOf(data).length,
    },
    {
      id: "mentors" as const,
      href: "/admin/users/mentors",
      label: t("tabs.mentors"),
      count: mentorsOf(data).length,
      dot: "#26a4ff",
    },
    {
      id: "teams" as const,
      href: "/admin/users/teams",
      label: t("tabs.teams"),
      count: startupsOf(data).length,
      dot: "#ff6a3d",
    },
    {
      id: "students" as const,
      href: "/admin/users/students",
      label: t("tabs.students"),
      count: null,
    },
    {
      id: "academics" as const,
      href: "/admin/users/academics",
      label: t("tabs.academics"),
      count: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="rounded-full bg-[#22262b] px-5 py-[11px] text-[13.5px] leading-[1.3] font-medium text-white"
        >
          {t("addCoordinator")}
        </button>
      </div>
      <div className="flex border-b border-[#e9ecef]">
        {tabs.map((item) => {
          const active = item.id === tab;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-3 px-6"
            >
              <span className="flex items-center gap-1.5">
                {item.dot ? (
                  <span
                    aria-hidden
                    className="size-[7px] rounded-full"
                    style={{ background: item.dot }}
                  />
                ) : null}
                <span
                  className={`text-[14.5px] leading-[1.3] ${
                    active ? "font-semibold text-[#22262b]" : "text-[#676e78]"
                  }`}
                >
                  {item.label}
                </span>
                {item.count != null ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${
                      active
                        ? "bg-[#22262b] text-white"
                        : "bg-[#f5f6f8] text-[#676e78]"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </span>
              <span
                className={`h-[2.5px] w-full rounded-sm ${active ? "bg-[#22262b]" : ""}`}
              />
            </Link>
          );
        })}
      </div>
      {tab === "coordinators" ? (
        <CoordinatorsTable data={data} focusUserId={focusUserId} />
      ) : null}
      {tab === "mentors" ? (
        <MentorsTable data={data} focusUserId={focusUserId} />
      ) : null}
      {tab === "teams" ? <TeamsTable data={data} /> : null}
      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      {tab === "students" ? <AdminStudentsTable /> : null}
      {/* TEST UI: placeholder until the design team's screen; replace when it arrives. */}
      {tab === "academics" ? <AdminAcademicsTable /> : null}
      {inviteOpen ? (
        <AddCoordinatorDialog onClose={() => setInviteOpen(false)} />
      ) : null}
    </div>
  );
}

function CoordinatorsTable({
  data,
  focusUserId,
}: {
  data: AdminOverview;
  focusUserId: string | null;
}) {
  const t = useTranslations("adminUsers");
  const users = coordinatorsOf(data);
  const decide = useDecidePendingAccount();
  const access = useCoordinatorAccess();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [program, setProgram] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [seenFocus, setSeenFocus] = useState(focusUserId);
  if (focusUserId !== seenFocus) {
    setSeenFocus(focusUserId);
    const focused = users.find((item) => item.id === focusUserId);
    if (focused?.status === UserAccountStatus.Pending) setReviewId(focused.id);
    else if (focused) setSelectedId(focused.id);
  }
  const counts: Partial<Record<Filter, number>> = {
    ALL: users.length,
    ACTIVE: users.filter((user) => user.status === UserAccountStatus.Approved)
      .length,
    PENDING: users.filter((user) => user.status === UserAccountStatus.Pending)
      .length,
    NO_ACCESS: 0,
    INACTIVE: users.filter((user) => user.status === UserAccountStatus.Rejected)
      .length,
  };
  const rows = useMemo(() => {
    return users.filter((user) => {
      if (filter === "ACTIVE" && user.status !== UserAccountStatus.Approved)
        return false;
      if (filter === "PENDING" && user.status !== UserAccountStatus.Pending)
        return false;
      if (filter === "INACTIVE" && user.status !== UserAccountStatus.Rejected)
        return false;
      if (filter === "NO_ACCESS") return false;
      if (
        program &&
        !programsForCoordinator(data, user.id).some(
          (item) => item.name === program,
        )
      ) {
        return false;
      }
      return `${user.fullName} ${user.email}`
        .toLocaleLowerCase("tr")
        .includes(search.toLocaleLowerCase("tr"));
    });
  }, [data, filter, program, search, users]);
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selected = users.find((user) => user.id === selectedId) ?? null;
  const review = users.find((user) => user.id === reviewId) ?? null;
  const approving = users.find((user) => user.id === approveId) ?? null;

  function reject(user: AdminUser) {
    void decide
      .mutateAsync({
        userId: user.id,
        status: UserAccountStatus.Rejected,
      })
      .then(() => {
        setReviewId(null);
        setApproveId(null);
        showToast({
          message: t("rejected", { name: user.fullName }),
          tone: ToastTone.Success,
        });
      })
      .catch((error: unknown) =>
        showToast({
          message: errorMessage(error, t("decideFailed")),
          tone: ToastTone.Error,
        }),
      );
  }

  return (
    <div className="space-y-4">
      <Toolbar
        filters={["ALL", "ACTIVE", "PENDING", "NO_ACCESS", "INACTIVE"]}
        counts={counts}
        filter={filter}
        onFilter={(value) => {
          setFilter(value);
          setPage(0);
        }}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder={t("searchCoordinators")}
        program={program}
        programs={data.programs.map((item) => item.name)}
        onProgram={(value) => {
          setProgram(value);
          setPage(0);
        }}
      />
      <TableCard>
        <div
          className={`${coordCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
        >
          <span>{t("coordinatorColumns.coordinator")}</span>
          <span>{t("coordinatorColumns.access")}</span>
          <span>{t("coordinatorColumns.programs")}</span>
          <span>{t("coordinatorColumns.programCount")}</span>
          <span>{t("coordinatorColumns.activity")}</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <EmptyNote>{t("noCoordinators")}</EmptyNote>
        ) : (
          visible.map((user) => {
            const programs = programsForCoordinator(data, user.id);
            const activity = relativeTime(user.createdAt, t);
            return (
              <div
                key={user.id}
                className={`${coordCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0 ${
                  selectedId === user.id ? "rounded-[18px] bg-[#fafafb]" : ""
                }`}
              >
                <PersonCell user={user} tone="coordinator" />
                <AccessChip
                  status={user.status}
                  passwordSet={user.passwordSet}
                />
                <ProgramChips programs={programs} empty={t("unassigned")} />
                <span className="text-[13.5px] font-medium text-[#22262b]">
                  {programs.length}
                </span>
                <span
                  className={`text-[12.5px] ${
                    activity?.stale ? "text-[#b7791f]" : "text-[#22262b]"
                  }`}
                >
                  {activity?.label ?? "—"}
                </span>
                <span className="flex items-center justify-end gap-1">
                  {user.status === UserAccountStatus.Pending ? (
                    <>
                      <button
                        type="button"
                        disabled={decide.isPending}
                        onClick={() => reject(user)}
                        className="rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#22262b] disabled:opacity-50"
                      >
                        {t("reject")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReviewId(user.id)}
                        className="rounded-full bg-[#22262b] px-3.5 py-2 text-[12.5px] font-medium text-white"
                      >
                        {t("approve")}
                      </button>
                    </>
                  ) : (
                    <DetailButton onClick={() => setSelectedId(user.id)} />
                  )}
                  <RowMenu
                    items={[
                      {
                        label: t("detail"),
                        onClick: () =>
                          user.status === UserAccountStatus.Pending
                            ? setReviewId(user.id)
                            : setSelectedId(user.id),
                      },
                      ...(user.status === UserAccountStatus.Approved
                        ? [
                            {
                              label: t("deactivate"),
                              onClick: () => access.setAccess(user.id, false),
                            },
                          ]
                        : []),
                      ...(user.status === UserAccountStatus.Rejected
                        ? [
                            {
                              label: t("reactivate"),
                              onClick: () => access.setAccess(user.id, true),
                            },
                          ]
                        : []),
                    ]}
                  />
                </span>
              </div>
            );
          })
        )}
      </TableCard>
      <Pager
        total={rows.length}
        page={page}
        onPage={setPage}
        noun="coordinators"
      />
      {selected ? (
        <CoordinatorDrawer
          user={selected}
          programs={programsForCoordinator(data, selected.id)}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
      {review ? (
        <CoordinatorApplicationDialog
          user={review}
          programs={programsForCoordinator(data, review.id)}
          appliedLabel={relativeTime(review.createdAt, t)?.label ?? null}
          busy={decide.isPending}
          onClose={() => setReviewId(null)}
          onReject={() => reject(review)}
          onApprove={() => {
            setReviewId(null);
            setApproveId(review.id);
          }}
        />
      ) : null}
      {approving ? (
        <ApproveCoordinatorDialog
          user={approving}
          programs={data.programs}
          onClose={() => setApproveId(null)}
          onApproved={(programName, already) => {
            const name = approving.fullName;
            const id = approving.id;
            setApproveId(null);
            showToast({
              title: t("approvedTitle", { name }),
              message: already
                ? t("alreadyCoordinator", { program: programName })
                : t("assignedTo", { program: programName }),
              tone: ToastTone.Success,
              action: {
                label: t("detail"),
                onClick: () => setSelectedId(id),
              },
            });
          }}
          onFailed={(message) => {
            setApproveId(null);
            showToast({ message, tone: ToastTone.Error });
          }}
        />
      ) : null}
    </div>
  );
}

function MentorsTable({
  data,
  focusUserId,
}: {
  data: AdminOverview;
  focusUserId: string | null;
}) {
  const t = useTranslations("adminUsers");
  const optionLabel = useOptionLabel();
  const users = mentorsOf(data);
  const decide = useDecidePendingAccount();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [program, setProgram] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seenFocus, setSeenFocus] = useState(focusUserId);
  if (focusUserId !== seenFocus) {
    setSeenFocus(focusUserId);
    if (users.some((user) => user.id === focusUserId))
      setSelectedId(focusUserId);
  }
  const invited = (user: AdminUser) =>
    data.programs.some((item) =>
      item.mentors.some(
        (mentor) =>
          mentor.mentorId === user.id &&
          mentor.status === ProgramMentorStatus.Pending,
      ),
    );
  const counts: Partial<Record<Filter, number>> = {
    ALL: users.length,
    ACTIVE: users.filter((user) => user.status === UserAccountStatus.Approved)
      .length,
    PENDING: users.filter((user) => user.status === UserAccountStatus.Pending)
      .length,
    INVITED: users.filter(
      (user) => user.status === UserAccountStatus.Approved && invited(user),
    ).length,
    INACTIVE: users.filter((user) => user.status === UserAccountStatus.Rejected)
      .length,
  };
  const rows = users.filter((user) => {
    if (filter === "ACTIVE" && user.status !== UserAccountStatus.Approved)
      return false;
    if (filter === "PENDING" && user.status !== UserAccountStatus.Pending)
      return false;
    if (filter === "INACTIVE" && user.status !== UserAccountStatus.Rejected)
      return false;
    if (
      filter === "INVITED" &&
      !(user.status === UserAccountStatus.Approved && invited(user))
    )
      return false;
    if (
      program &&
      !programsForMentor(data, user.id).some((item) => item.name === program)
    ) {
      return false;
    }
    return `${user.fullName} ${user.email} ${(user.expertise ?? []).join(" ")}`
      .toLocaleLowerCase("tr")
      .includes(search.toLocaleLowerCase("tr"));
  });
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selected = users.find((user) => user.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <Toolbar
        filters={["ALL", "ACTIVE", "PENDING", "INVITED", "INACTIVE"]}
        counts={counts}
        filter={filter}
        onFilter={(value) => {
          setFilter(value);
          setPage(0);
        }}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder={t("searchMentors")}
        program={program}
        programs={data.programs.map((item) => item.name)}
        onProgram={(value) => {
          setProgram(value);
          setPage(0);
        }}
      />
      <TableCard>
        <div
          className={`${mentorCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
        >
          <span>{t("mentorColumns.mentor")}</span>
          <span>{t("mentorColumns.status")}</span>
          <span>{t("mentorColumns.warning")}</span>
          <span>{t("mentorColumns.expertise")}</span>
          <span>{t("mentorColumns.programs")}</span>
          <span>{t("mentorColumns.load")}</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <EmptyNote>{t("noMentors")}</EmptyNote>
        ) : (
          visible.map((user) => {
            const programs = programsForMentor(data, user.id);
            const load = data.mentorships.filter(
              (item) =>
                item.mentorId === user.id &&
                (item.status === "ACTIVE" || item.status === "PLANNED"),
            );
            const stale = load.some(
              (item) => item.status === "ACTIVE" && needsAttention(item),
            );
            const pendingInvite =
              user.status === UserAccountStatus.Approved &&
              programs.some((item) =>
                item.mentors.some(
                  (mentor) =>
                    mentor.mentorId === user.id &&
                    mentor.status === ProgramMentorStatus.Pending,
                ),
              );
            return (
              <div
                key={user.id}
                className={`${mentorCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
              >
                <PersonCell user={user} tone="mentor" />
                {user.status === UserAccountStatus.Pending ? (
                  <StatusPill tone="amber">{t("pending")}</StatusPill>
                ) : user.status === UserAccountStatus.Rejected ? (
                  <StatusPill tone="neutral">{t("inactive")}</StatusPill>
                ) : pendingInvite ? (
                  <StatusPill tone="blue">{t("inviteSent")}</StatusPill>
                ) : (
                  <StatusPill tone="green">{t("active")}</StatusPill>
                )}
                <span>
                  {stale ? (
                    <span className="rounded-full bg-[#fff6e5] px-2.5 py-1 text-[11.5px] font-medium text-[#b7791f]">
                      {t("noMeeting")}
                    </span>
                  ) : (
                    <span className="text-[13px] text-[#aeb4bc]">—</span>
                  )}
                </span>
                <span className="flex min-w-0 flex-wrap gap-1.5">
                  {(user.expertise ?? []).length === 0 ? (
                    <span className="text-[13px] text-[#aeb4bc]">—</span>
                  ) : (
                    user.expertise?.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#e0522a]"
                      >
                        {optionLabel("mentorTopic", item)}
                      </span>
                    ))
                  )}
                </span>
                <ProgramChips programs={programs} empty={t("unassigned")} />
                <LoadBar count={load.length} warning={stale} />
                <span className="flex items-center justify-end gap-1">
                  {user.status === UserAccountStatus.Pending ? (
                    <DecideButtons
                      busy={decide.isPending}
                      onDecide={(status) =>
                        void decide
                          .mutateAsync({ userId: user.id, status })
                          .then(() =>
                            showToast({
                              message:
                                status === UserAccountStatus.Approved
                                  ? t("approved", { name: user.fullName })
                                  : t("rejected", { name: user.fullName }),
                              tone: ToastTone.Success,
                            }),
                          )
                          .catch((error: unknown) =>
                            showToast({
                              message:
                                error instanceof Error
                                  ? error.message
                                  : t("decideFailed"),
                              tone: ToastTone.Error,
                            }),
                          )
                      }
                    />
                  ) : (
                    <DetailButton onClick={() => setSelectedId(user.id)} />
                  )}
                  <RowMenu
                    items={[
                      {
                        label: t("detail"),
                        onClick: () => setSelectedId(user.id),
                      },
                    ]}
                  />
                </span>
              </div>
            );
          })
        )}
      </TableCard>
      <Pager total={rows.length} page={page} onPage={setPage} noun="mentors" />
      {selected ? (
        <MentorDrawer
          user={selected}
          programs={programsForMentor(data, selected.id)}
          assignable={assignableProgramsForMentor(data, selected.id)}
          mentorships={data.mentorships.filter(
            (item) =>
              item.mentorId === selected.id &&
              (item.status === "ACTIVE" || item.status === "PLANNED"),
          )}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}

function TeamsTable({ data }: { data: AdminOverview }) {
  const t = useTranslations("adminUsers");
  const teams = startupsOf(data);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [program, setProgram] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const risky = (startup: AdminStartup) => {
    const mentorship = activeMentorshipFor(data, startup);
    return Boolean(mentorship && needsAttention(mentorship));
  };
  const waiting = (startup: AdminStartup) =>
    !activeMentorshipFor(data, startup);
  const counts: Partial<Record<Filter, number>> = {
    ALL: teams.length,
    MENTORED: teams.filter((startup) => !waiting(startup)).length,
    WAITING: teams.filter(waiting).length,
    RISKY: teams.filter(risky).length,
  };
  const rows = teams.filter((startup) => {
    if (filter === "MENTORED" && waiting(startup)) return false;
    if (filter === "WAITING" && !waiting(startup)) return false;
    if (filter === "RISKY" && !risky(startup)) return false;
    if (program && startup.programName !== program) return false;
    return `${startup.name} ${startup.founderName ?? ""} ${startup.programName}`
      .toLocaleLowerCase("tr")
      .includes(search.toLocaleLowerCase("tr"));
  });
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selected =
    teams.find(
      (startup) => `${startup.programId}:${startup.id}` === selectedKey,
    ) ?? null;

  return (
    <div className="space-y-4">
      <Toolbar
        filters={["ALL", "MENTORED", "WAITING", "RISKY"]}
        counts={counts}
        filter={filter}
        onFilter={(value) => {
          setFilter(value);
          setPage(0);
        }}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(0);
        }}
        searchPlaceholder={t("searchTeams")}
        program={program}
        programs={data.programs.map((item) => item.name)}
        onProgram={(value) => {
          setProgram(value);
          setPage(0);
        }}
      />
      <TableCard>
        <div
          className={`${teamCols} border-b border-[#f0f2f4] px-5 py-3 text-[12px] font-medium text-[#858c96]`}
        >
          <span>{t("teamColumns.team")}</span>
          <span>{t("teamColumns.mentorship")}</span>
          <span>{t("teamColumns.health")}</span>
          <span>{t("teamColumns.program")}</span>
          <span>{t("teamColumns.lead")}</span>
          <span>{t("teamColumns.team2")}</span>
          <span>{t("teamColumns.mentor")}</span>
          <span />
        </div>
        {visible.length === 0 ? (
          <EmptyNote>{t("noTeams")}</EmptyNote>
        ) : (
          visible.map((startup) => {
            const mentorship = activeMentorshipFor(data, startup);
            const blocked = data.bottlenecks.some(
              (item) => item.organizationId === startup.id,
            );
            const members = data.users.filter(
              (user) => user.organizationId === startup.id,
            );
            const attention = Boolean(mentorship && needsAttention(mentorship));
            return (
              <div
                key={`${startup.programId}:${startup.id}`}
                className={`${teamCols} border-b border-[#f0f2f4] px-5 py-3.5 last:border-0`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[12px] bg-[#fff1ec] text-[12px] font-semibold text-[#e0522a]">
                    {initials(startup.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-medium text-[#22262b]">
                      {startup.name}
                    </span>
                    <span className="block truncate text-[12px] text-[#858c96]">
                      {startup.sector ?? t("noSector")}
                    </span>
                  </span>
                </span>
                {mentorship ? (
                  <StatusPill tone={attention ? "amber" : "green"}>
                    {mentorship.status === "ACTIVE"
                      ? t("active")
                      : t("planned")}
                  </StatusPill>
                ) : (
                  <StatusPill tone="amber">{t("waiting")}</StatusPill>
                )}
                <span>
                  {!mentorship ? (
                    <span className="text-[13px] text-[#aeb4bc]">—</span>
                  ) : attention ? (
                    <StatusPill tone="red">{t("health.RISKY")}</StatusPill>
                  ) : blocked ? (
                    <span className="rounded-full bg-[#fff6e5] px-2.5 py-1 text-[11.5px] font-medium text-[#b7791f]">
                      {t("health.FOLLOW_UP")}
                    </span>
                  ) : (
                    <StatusPill tone="green">{t("health.HEALTHY")}</StatusPill>
                  )}
                </span>
                <span>
                  <span className="rounded-full border border-[#e9ecef] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#676e78]">
                    {startup.programName}
                  </span>
                </span>
                <span className="min-w-0">
                  {startup.founderName ? (
                    <>
                      <span className="block truncate text-[13px] text-[#22262b]">
                        {startup.founderName}
                      </span>
                      <span className="block truncate text-[12px] text-[#858c96]">
                        {startup.founderJobTitle ?? t("leadFallback")}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#aeb4bc]">
                      {t("notAssigned")}
                    </span>
                  )}
                </span>
                <span className="text-[13.5px] font-medium text-[#22262b]">
                  {members.length === 0 ? "—" : members.length}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  {mentorship ? (
                    <>
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eaf6ff] text-[10px] font-semibold text-[#1583d6]">
                        {initials(mentorship.mentorName)}
                      </span>
                      <span className="truncate text-[13px] text-[#22262b]">
                        {mentorship.mentorName}
                      </span>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#aeb4bc]">
                      {t("notAssigned")}
                    </span>
                  )}
                </span>
                <span className="flex justify-end">
                  <DetailButton
                    onClick={() =>
                      setSelectedKey(`${startup.programId}:${startup.id}`)
                    }
                  />
                </span>
              </div>
            );
          })
        )}
      </TableCard>
      <Pager total={rows.length} page={page} onPage={setPage} noun="teams" />
      {selected ? (
        <TeamDrawer
          startup={selected}
          data={data}
          onClose={() => setSelectedKey(null)}
        />
      ) : null}
    </div>
  );
}

function CoordinatorDrawer({
  user,
  programs,
  onClose,
}: {
  user: AdminUser;
  programs: AdminProgram[];
  onClose: () => void;
}) {
  const t = useTranslations("adminUsers");
  const [section, setSection] = useState<Section>("OVERVIEW");
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const activity = relativeTime(user.createdAt, t);

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    window.setTimeout(onClose, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${
        leaving ? "admin-backdrop-out" : "admin-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <aside
        className={`flex h-full w-full max-w-[460px] flex-col rounded-l-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.14)] ${
          leaving ? "admin-drawer-out" : "admin-drawer-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-[14px] font-semibold text-[#ffab3d]">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[18px] font-semibold text-[#22262b]">
                  {user.fullName}
                </p>
                <span className="text-[12px] text-[#858c96]">
                  {t("roleCoordinator")}
                </span>
                <AccessChip
                  status={user.status}
                  passwordSet={user.passwordSet}
                />
              </div>
              <p className="truncate text-[12.5px] text-[#858c96]">
                {user.email}
              </p>
              <p className="text-[12px] text-[#858c96]">
                {t("programCount", { count: programs.length })}
                {activity ? t("registered", { when: activity.label }) : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={requestClose}
            className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f5f6f8]"
          >
            ×
          </button>
        </div>
        <div className="mt-5 flex gap-5 border-b border-[#e9ecef] px-6">
          {(["OVERVIEW", "ASSIGNED", "ACCESS", "ACTIVITY"] as const).map(
            (item) => (
              <SectionTab
                key={item}
                label={t(`sections.${item}`)}
                active={section === item}
                onClick={() => setSection(item)}
              />
            ),
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-[13.5px] text-[#22262b]">
          {section === "OVERVIEW" ? (
            <div className="space-y-3">
              <p>
                <span className="text-[#858c96]">{t("email")}</span>
                {user.email}
              </p>
              <p>
                <span className="text-[#858c96]">{t("jobTitle")}</span>
                {user.jobTitle ?? "—"}
              </p>
              <ProgramChips programs={programs} empty={t("unassigned")} />
            </div>
          ) : null}
          {section === "ASSIGNED" ? (
            programs.length === 0 ? (
              <p className="text-[#858c96]">{t("noPrograms")}</p>
            ) : (
              <ul className="space-y-2">
                {programs.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[12.5px] text-[#858c96]">
                      {t("teamsMentors", {
                        teams: item.startupCount,
                        mentors: item.acceptedMentorCount,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {section === "ACCESS" ? (
            <div className="space-y-3">
              <AccessChip status={user.status} passwordSet={user.passwordSet} />
              <p className="text-[13px] leading-[1.5] text-[#676e78]">
                {t("accessNote")}
              </p>
              <CoordinatorAccessControl id={user.id} status={user.status} />
            </div>
          ) : null}
          {section === "ACTIVITY" ? (
            <p className="text-[#676e78]">
              {activity
                ? t("createdAt", { when: activity.label })
                : t("noCreatedAt")}
            </p>
          ) : null}
        </div>
        <div className="border-t border-[#e9ecef] px-6 py-4">
          <RevokeSignInsButton user={user} />
        </div>
      </aside>
    </div>
  );
}

function MentorDrawer({
  user,
  programs,
  assignable,
  mentorships,
  onClose,
}: {
  user: AdminUser;
  programs: AdminProgram[];
  assignable: AdminProgram[];
  mentorships: AdminOverview["mentorships"];
  onClose: () => void;
}) {
  const t = useTranslations("adminUsers");
  const optionLabel = useOptionLabel();
  const [section, setSection] = useState<Section>("OVERVIEW");
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const activity = relativeTime(user.createdAt, t);
  const stale = mentorships.some(
    (item) => item.status === "ACTIVE" && needsAttention(item),
  );

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    window.setTimeout(onClose, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${
        leaving ? "admin-backdrop-out" : "admin-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <aside
        className={`flex h-full w-full max-w-[460px] flex-col rounded-l-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.14)] ${
          leaving ? "admin-drawer-out" : "admin-drawer-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#eaf6ff] text-[14px] font-semibold text-[#1583d6]">
              {initials(user.fullName)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[18px] font-semibold text-[#22262b]">
                  {user.fullName}
                </p>
                <span className="text-[12px] text-[#858c96]">
                  {t("roleMentor")}
                </span>
                <AccessChip
                  status={user.status}
                  passwordSet={user.passwordSet}
                />
              </div>
              <p className="truncate text-[12.5px] text-[#858c96]">
                {user.email}
              </p>
              <p className="text-[12px] text-[#858c96]">
                {t("mentorshipCount", { count: mentorships.length })}
                {activity ? t("registered", { when: activity.label }) : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={requestClose}
            className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f5f6f8]"
          >
            ×
          </button>
        </div>
        <div className="mt-5 flex gap-5 border-b border-[#e9ecef] px-6">
          {(["OVERVIEW", "PROGRAMS", "MENTORSHIPS", "ACTIVITY"] as const).map(
            (item) => (
              <SectionTab
                key={item}
                label={t(`sections.${item}`)}
                active={section === item}
                onClick={() => setSection(item)}
              />
            ),
          )}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-[13.5px] text-[#22262b]">
          {section === "OVERVIEW" ? (
            <div className="space-y-3">
              <p>
                <span className="text-[#858c96]">{t("email")}</span>
                {user.email}
              </p>
              <p>
                <span className="text-[#858c96]">{t("jobTitle")}</span>
                {user.jobTitle ?? "—"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(user.expertise ?? []).length === 0 ? (
                  <span className="text-[#aeb4bc]">{t("noExpertise")}</span>
                ) : (
                  user.expertise?.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[#fff1ec] px-2.5 py-1 text-[11.5px] font-medium text-[#e0522a]"
                    >
                      {optionLabel("mentorTopic", item)}
                    </span>
                  ))
                )}
              </div>
              {stale ? (
                <span className="inline-flex rounded-full bg-[#fff6e5] px-2.5 py-1 text-[11.5px] font-medium text-[#b7791f]">
                  {t("noMeeting")}
                </span>
              ) : null}
            </div>
          ) : null}
          {section === "PROGRAMS" ? (
            <AssignToProgram
              kind={ProgramMemberKind.Mentors}
              targetId={user.id}
              programs={assignable}
            />
          ) : null}
          {section === "PROGRAMS" ? (
            programs.length === 0 ? (
              <p className="mt-3 text-[#858c96]">{t("noPrograms")}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {programs.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[12.5px] text-[#858c96]">
                      {item.mentors.find(
                        (mentor) => mentor.mentorId === user.id,
                      )?.status === ProgramMentorStatus.Pending
                        ? t("invitePending")
                        : t("accepted")}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {section === "MENTORSHIPS" ? (
            mentorships.length === 0 ? (
              <p className="text-[#858c96]">{t("noActiveMentorship")}</p>
            ) : (
              <ul className="space-y-2">
                {mentorships.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                  >
                    <p className="font-medium">{item.organizationName}</p>
                    <p className="text-[12.5px] text-[#858c96]">
                      {item.status === "ACTIVE" ? t("active") : t("planned")}
                      {item.daysSinceMeeting == null
                        ? ""
                        : t("lastMeeting", { days: item.daysSinceMeeting })}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {section === "ACTIVITY" ? (
            <p className="text-[#676e78]">
              {activity
                ? t("createdAt", { when: activity.label })
                : t("noCreatedAt")}
            </p>
          ) : null}
        </div>
        <div className="border-t border-[#e9ecef] px-6 py-4">
          <RevokeSignInsButton user={user} />
        </div>
      </aside>
    </div>
  );
}

function TeamDrawer({
  startup,
  data,
  onClose,
}: {
  startup: AdminStartup;
  data: AdminOverview;
  onClose: () => void;
}) {
  const t = useTranslations("adminUsers");
  const optionLabel = useOptionLabel();
  const [section, setSection] = useState<Section>("OVERVIEW");
  const [leaving, setLeaving] = useState(false);
  const closing = useRef(false);
  const mentorship = activeMentorshipFor(data, startup);
  const members = data.users.filter(
    (user) => user.organizationId === startup.id,
  );
  const bottlenecks = data.bottlenecks.filter(
    (item) => item.organizationId === startup.id,
  );
  const requests = data.requests.filter(
    (item) => item.organizationId === startup.id,
  );
  const attention = Boolean(mentorship && needsAttention(mentorship));
  const health = !mentorship
    ? null
    : attention
      ? ("RISKY" as const)
      : bottlenecks.length > 0
        ? ("FOLLOW_UP" as const)
        : ("HEALTHY" as const);

  function requestClose() {
    if (closing.current) return;
    closing.current = true;
    setLeaving(true);
    window.setTimeout(onClose, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end ${
        leaving ? "admin-backdrop-out" : "admin-backdrop-in"
      }`}
      onClick={requestClose}
    >
      <aside
        className={`flex h-full w-full max-w-[460px] flex-col rounded-l-[28px] bg-white shadow-[0_16px_48px_rgba(33,38,43,0.14)] ${
          leaving ? "admin-drawer-out" : "admin-drawer-in"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-[#fff1ec] text-[14px] font-semibold text-[#e0522a]">
              {initials(startup.name)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[18px] font-semibold text-[#22262b]">
                  {startup.name}
                </p>
                <span className="text-[12px] text-[#858c96]">
                  {t("roleTeam")}
                </span>
                {health ? (
                  <StatusPill
                    tone={
                      health === "RISKY"
                        ? "red"
                        : health === "FOLLOW_UP"
                          ? "amber"
                          : "green"
                    }
                  >
                    {t(`health.${health}`)}
                  </StatusPill>
                ) : (
                  <StatusPill tone="amber">{t("waiting")}</StatusPill>
                )}
              </div>
              <p className="truncate text-[12.5px] text-[#858c96]">
                {startup.sector ?? t("noSector")}
              </p>
              <p className="text-[12px] text-[#858c96]">
                {startup.programName}
                {members.length > 0
                  ? t("people", { count: members.length })
                  : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={requestClose}
            className="grid size-8 place-items-center rounded-full text-[#676e78] hover:bg-[#f5f6f8]"
          >
            ×
          </button>
        </div>
        <div className="mt-5 flex gap-5 border-b border-[#e9ecef] px-6">
          {(["OVERVIEW", "TEAM", "MENTORSHIP"] as const).map((item) => (
            <SectionTab
              key={item}
              label={t(`sections.${item}`)}
              active={section === item}
              onClick={() => setSection(item)}
            />
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 text-[13.5px] text-[#22262b]">
          {section === "OVERVIEW" ? (
            <div className="space-y-3">
              <p>
                <span className="text-[#858c96]">{t("programField")}</span>
                {startup.programName}
              </p>
              <AssignToProgram
                kind={ProgramMemberKind.Startups}
                targetId={startup.id}
                programs={assignableProgramsForStartup(data, startup.id)}
              />
              <p>
                <span className="text-[#858c96]">{t("sectorField")}</span>
                {startup.sector ?? "—"}
              </p>
              <p>
                <span className="text-[#858c96]">{t("leadField")}</span>
                {startup.founderName
                  ? `${startup.founderName}${startup.founderJobTitle ? ` · ${startup.founderJobTitle}` : ""}`
                  : t("notAssigned")}
              </p>
              <p>
                <span className="text-[#858c96]">{t("mentorField")}</span>
                {mentorship?.mentorName ?? t("notAssigned")}
              </p>
            </div>
          ) : null}
          {section === "TEAM" ? (
            members.length === 0 ? (
              <p className="text-[#858c96]">{t("noMembers")}</p>
            ) : (
              <ul className="space-y-2">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                  >
                    <p className="font-medium">{member.fullName}</p>
                    <p className="text-[12.5px] text-[#858c96]">
                      {member.email}
                      {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                    </p>
                    <TeamHistory userId={member.id} />
                  </li>
                ))}
              </ul>
            )
          ) : null}
          {section === "MENTORSHIP" ? (
            <div className="space-y-4">
              {mentorship ? (
                <div className="rounded-[20px] border border-[#e9ecef] px-4 py-3">
                  <p className="font-medium">{mentorship.mentorName}</p>
                  <p className="text-[12.5px] text-[#858c96]">
                    {mentorship.status === "ACTIVE"
                      ? t("active")
                      : t("planned")}
                    {mentorship.daysSinceMeeting == null
                      ? ""
                      : t("lastMeeting", { days: mentorship.daysSinceMeeting })}
                  </p>
                </div>
              ) : (
                <p className="text-[#858c96]">{t("waitingMatch")}</p>
              )}
              {bottlenecks.length > 0 ? (
                <ul className="space-y-2">
                  {bottlenecks.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                    >
                      <p className="font-medium">{item.title}</p>
                      <p className="text-[12.5px] text-[#858c96]">
                        {item.severity} · {item.status}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
              {requests.length > 0 ? (
                <ul className="space-y-2">
                  {requests.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-[20px] border border-[#e9ecef] px-4 py-3"
                    >
                      <p className="font-medium">
                        {item.supportArea
                          ? optionLabel("supportArea", item.supportArea)
                          : t("supportRequest")}
                      </p>
                      <p className="text-[12.5px] text-[#858c96]">
                        {item.status}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Toolbar({
  filters,
  counts,
  filter,
  onFilter,
  search,
  onSearch,
  searchPlaceholder,
  program,
  programs,
  onProgram,
}: {
  filters: Filter[];
  counts: Partial<Record<Filter, number>>;
  filter: Filter;
  onFilter: (value: Filter) => void;
  search: string;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  program: string;
  programs: string[];
  onProgram: (value: string) => void;
}) {
  const t = useTranslations("adminUsers");
  return (
    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
      <div className="flex w-max max-w-full gap-1 overflow-x-auto rounded-full bg-[#f5f6f8] p-1">
        {filters.map((id) => {
          const selected = id === filter;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onFilter(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[13px] leading-[1.3] ${
                selected
                  ? "bg-white font-medium text-[#22262b] shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                  : "text-[#676e78]"
              }`}
            >
              {t(`filters.${id}`)}
              <span className="text-[12px] font-medium text-[#858c96]">
                {counts[id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
        <label className="flex h-[42px] w-[240px] items-center gap-2 rounded-full border border-[#e9ecef] bg-white px-4">
          <AdminIcon src="/admin/search.svg" width={18} height={18} />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-[13.5px] text-[#22262b] outline-none placeholder:text-[#aeb4bc]"
          />
        </label>
        <label className="flex items-center gap-2 rounded-full border border-[#e9ecef] bg-white py-2.5 pr-3.5 pl-4">
          <span className="text-[13px] text-[#858c96]">{t("program")}</span>
          <select
            aria-label={t("programLabel")}
            value={program}
            onChange={(event) => onProgram(event.target.value)}
            className="appearance-none bg-transparent text-[13.5px] font-medium text-[#22262b] outline-none"
          >
            <option value="">{t("all")}</option>
            {programs.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <AdminIcon src="/admin/chevron-down-sm.svg" width={16} height={16} />
        </label>
      </div>
    </div>
  );
}

function PersonCell({
  user,
  tone,
}: {
  user: AdminUser;
  tone: "coordinator" | "mentor";
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
          tone === "mentor"
            ? "bg-[#eaf6ff] text-[#1583d6]"
            : "bg-[#fbe2d0] text-[#ffab3d]"
        }`}
      >
        {initials(user.fullName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] leading-[1.3] font-medium text-[#22262b]">
          {user.fullName}
        </span>
        <span className="block truncate text-[12px] leading-[1.3] text-[#858c96]">
          {user.email}
        </span>
      </span>
    </span>
  );
}

function ProgramChips({
  programs,
  empty,
}: {
  programs: { id: string; name: string }[];
  empty: string;
}) {
  if (programs.length === 0) {
    return <span className="text-[13px] text-[#aeb4bc]">{empty}</span>;
  }
  return (
    <span className="flex min-w-0 flex-wrap gap-1.5">
      {programs.map((program) => (
        <span
          key={program.id}
          className="rounded-full border border-[#e9ecef] bg-white px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium text-[#676e78]"
        >
          {program.name}
        </span>
      ))}
    </span>
  );
}

function AccessChip({
  status,
  passwordSet,
}: {
  status: AdminUser["status"];
  passwordSet?: AdminUser["passwordSet"];
}) {
  const t = useTranslations("adminUsers");
  // An added coordinator is approved at once but cannot sign in before the e-mailed link sets a password.
  if (status === UserAccountStatus.Approved && passwordSet === false)
    return <StatusPill tone="amber">{t("passwordNotSet")}</StatusPill>;
  if (status === UserAccountStatus.Approved) {
    return <StatusPill tone="green">{t("active")}</StatusPill>;
  }
  if (status === UserAccountStatus.Pending) {
    return <StatusPill tone="amber">{t("pending")}</StatusPill>;
  }
  return <StatusPill tone="neutral">{t("inactive")}</StatusPill>;
}

function StatusPill({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "neutral" | "blue";
  children: ReactNode;
}) {
  const styles = {
    green: {
      box: "bg-[#eaf7f0] text-[#2f9e6b]",
      dot: "/admin/dot-success.svg",
    },
    amber: { box: "bg-[#fff6e5] text-[#b7791f]", dot: "/admin/dot-warn.svg" },
    red: { box: "bg-[#fdeeee] text-[#d9464b]", dot: "/admin/dot-critical.svg" },
    neutral: {
      box: "bg-[#f5f6f8] text-[#676e78]",
      dot: "/admin/dot-muted.svg",
    },
    blue: { box: "bg-[#eaf6ff] text-[#1583d6]", dot: "/admin/dot-info.svg" },
  }[tone];
  return (
    <span
      className={`inline-flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] leading-[1.3] font-medium ${styles.box}`}
    >
      <AdminIcon src={styles.dot} width={6} height={6} />
      {children}
    </span>
  );
}

function LoadBar({ count, warning }: { count: number; warning: boolean }) {
  if (count === 0) {
    return <span className="text-[13px] text-[#aeb4bc]">—</span>;
  }
  return (
    <span className="flex items-center gap-2">
      <span
        className="h-2 w-16 rounded-full"
        style={{ background: warning ? "#ffab3d" : "#26a4ff" }}
      />
      <span className="text-[12.5px] font-medium text-[#22262b]">{count}</span>
    </span>
  );
}

function RowMenu({
  items,
}: {
  items: { label: string; onClick: () => void }[];
}) {
  const t = useTranslations("adminUsers");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t("moreActions")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid size-8 place-items-center"
      >
        <AdminIcon src="/admin/overflow.svg" width={38} height={32} />
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-2xl border border-[#e9ecef] bg-white p-1 shadow-[0_8px_24px_rgba(33,38,43,0.12)]">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="block w-full rounded-xl px-3 py-2 text-left text-[13px] text-[#22262b] hover:bg-[#f5f6f8]"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DetailButton({ onClick }: { onClick?: () => void }) {
  const t = useTranslations("adminUsers");
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] leading-[1.3] font-medium text-[#22262b]"
    >
      {t("detail")}
    </button>
  );
}

function SectionTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-3 text-[13px] ${
        active
          ? "border-b-2 border-[#22262b] font-medium text-[#22262b]"
          : "text-[#858c96]"
      }`}
    >
      {label}
    </button>
  );
}

function DecideButtons({
  busy,
  onDecide,
}: {
  busy: boolean;
  onDecide: (status: AccountDecision) => void;
}) {
  const t = useTranslations("adminUsers");
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => onDecide(UserAccountStatus.Rejected)}
        className="rounded-full border border-[#e9ecef] bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#22262b] disabled:opacity-50"
      >
        {t("reject")}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onDecide(UserAccountStatus.Approved)}
        className="rounded-full bg-[#22262b] px-3.5 py-2 text-[12.5px] font-medium text-white disabled:opacity-50"
      >
        {t("approve")}
      </button>
    </>
  );
}

function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#e9ecef] bg-white p-2">
      <div className="overflow-x-auto">
        <div className="min-w-[980px]">{children}</div>
      </div>
    </div>
  );
}

function Pager({
  total,
  page,
  onPage,
  noun,
}: {
  total: number;
  page: number;
  onPage: (page: number) => void;
  noun: keyof (typeof messages)["adminUsers"]["nouns"];
}) {
  const t = useTranslations("adminUsers");
  const label = t(`nouns.${noun}`, { count: total });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const start = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const end = Math.min(total, (page + 1) * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between text-[12.5px] text-[#858c96]">
      <span>
        {total === 0
          ? t("rangeEmpty", { noun: label })
          : t("range", { start, end, total, noun: label })}
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="disabled:opacity-40"
        >
          {t("previous")}
        </button>
        <span>{t("page", { page: page + 1, pages })}</span>
        <button
          type="button"
          disabled={page + 1 >= pages}
          onClick={() => onPage(page + 1)}
          className="disabled:opacity-40"
        >
          {t("next")}
        </button>
      </span>
    </div>
  );
}

function relativeTime(value: string | null | undefined, t: UsersT) {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  const minutes = Math.floor((Date.now() - then) / 60000);
  let label = t("justNow");
  if (minutes >= 60 * 24 * 2) {
    label = t("daysAgo", { count: Math.floor(minutes / (60 * 24)) });
  } else if (minutes >= 60 * 24) label = t("yesterday");
  else if (minutes >= 60) {
    label = t("hoursAgo", { count: Math.floor(minutes / 60) });
  } else if (minutes >= 1) label = t("minutesAgo", { count: minutes });
  return { label, stale: minutes >= 60 * 24 * 7 };
}

const coordCols =
  "grid w-full grid-cols-[minmax(0,280fr)_180fr_minmax(0,300fr)_70fr_180fr_220fr] items-center gap-2";
const mentorCols =
  "grid w-full grid-cols-[minmax(0,240fr)_160fr_140fr_minmax(0,180fr)_minmax(0,180fr)_140fr_180fr] items-center gap-2";
const teamCols =
  "grid w-full grid-cols-[minmax(0,200fr)_160fr_130fr_150fr_minmax(0,160fr)_70fr_minmax(0,160fr)_90fr] items-center gap-2";
