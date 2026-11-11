"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

import { StartupInviteCode } from "@/components/startup/startup-invite-code";
import {
  StartupPageFrame,
  startupPrimaryActionClass,
} from "@/components/startup/startup-page-frame";
import {
  LeaveTeamDialog,
  MemberFormDialog,
  RemoveMemberDialog,
} from "@/components/startup/startup-team-dialogs";
import { usePendingMembers } from "@/hooks/use-pending-members";
import { useStartupTeam } from "@/hooks/use-startup-team";
import { useTeamChanges } from "@/hooks/use-team-changes";
import { TeamChangeKind } from "@/interfaces/team-change";
import { programPersonHref } from "@/lib/program-links";
import { formatShortDate, initials } from "@/lib/utils";

const chipClass =
  "rounded-full px-2.5 py-1 text-[11.5px] font-medium leading-[17px]";
const rowLinkClass = "text-xs font-medium leading-[18px] hover:underline";

export function StartupTeamView() {
  const t = useTranslations("startupTeam");
  const locale = useLocale();
  const team = useStartupTeam();
  const pendingMembers = usePendingMembers();
  const changes = useTeamChanges(team.members);

  const addAction = (
    <button
      type="button"
      onClick={team.openAdd}
      className={startupPrimaryActionClass}
    >
      {t("add")}
    </button>
  );

  if (team.isLoading) {
    return (
      <StartupPageFrame action={addAction}>
        <p className="py-10 text-sm text-[#858c96]">{t("loading")}</p>
      </StartupPageFrame>
    );
  }
  if (team.error) {
    return (
      <StartupPageFrame>
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {team.error.message}
        </p>
      </StartupPageFrame>
    );
  }

  return (
    <StartupPageFrame action={addAction}>
      {team.viewerIsFounder ? <StartupInviteCode /> : null}
      <section
        aria-labelledby="startup-team-title"
        className="space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2
              id="startup-team-title"
              className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
            >
              {t("title")}
            </h2>
            <p className="text-[12.5px] leading-[19px] text-[#676e78]">
              {t("hint")}
            </p>
          </div>
          {changes.canLeave ? (
            <button
              type="button"
              onClick={changes.openLeave}
              className={`${rowLinkClass} text-[#c24135]`}
            >
              {t("changes.leaveAction")}
            </button>
          ) : null}
        </div>

        {team.members.length === 0 ? (
          <p className="text-sm text-[#858c96]">{t("empty")}</p>
        ) : (
          <ul className="space-y-3.5">
            {team.members.map((member) => {
              const change = changes.changeFor(member.id);
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#e4e7ea] px-4 py-3.5"
                >
                  <Link
                    href={programPersonHref({ userId: member.id })}
                    className="group flex min-w-0 items-center gap-3"
                  >
                    <span
                      aria-hidden
                      className="grid size-[38px] shrink-0 place-items-center rounded-full bg-[#fbe2d0] text-xs font-semibold text-[#9e4400]"
                    >
                      {initials(member.fullName) || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium leading-5 text-[#22262b] group-hover:underline">
                        {member.fullName}
                      </p>
                      <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                        {[member.jobTitle, member.founder ? t("founder") : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="w-[160px] truncate text-xs leading-[18px] text-[#858c96]">
                      {member.email}
                    </span>
                    <span className="w-[150px] text-xs leading-[18px] text-[#858c96]">
                      {member.joinedAt
                        ? t("joined", {
                            date: formatShortDate(member.joinedAt, locale),
                          })
                        : null}
                    </span>
                    {member.founder ? (
                      <span
                        className={`${chipClass} bg-[#fff4ec] text-[#9e4400]`}
                      >
                        {t("admin")}
                      </span>
                    ) : (
                      <span
                        className={`${chipClass} bg-[#f3f4f6] text-[#676e78]`}
                      >
                        {t("member")}
                      </span>
                    )}
                    {team.canEdit(member) ? (
                      <button
                        type="button"
                        onClick={() => team.openEdit(member)}
                        aria-label={t("editLabel", { name: member.fullName })}
                        className={`${rowLinkClass} text-[#676e78]`}
                      >
                        {t("edit")}
                      </button>
                    ) : null}
                    {change ? (
                      <span
                        className={`${chipClass} bg-[#fff8e6] text-[#8a5a00]`}
                      >
                        {change.kind === TeamChangeKind.Leave
                          ? t("changes.leavePending")
                          : t("changes.removalPending")}
                      </span>
                    ) : null}
                    {change && changes.requestedByMe(change) ? (
                      <button
                        type="button"
                        onClick={() => changes.cancel(change.id)}
                        disabled={changes.cancellingId === change.id}
                        className={`${rowLinkClass} text-[#676e78] disabled:opacity-60`}
                      >
                        {t("changes.withdraw")}
                      </button>
                    ) : null}
                    {!change && team.canRemove(member) ? (
                      <button
                        type="button"
                        onClick={() => team.askRemove(member.id)}
                        aria-label={t("removeLabel", { name: member.fullName })}
                        className={`${rowLinkClass} text-[#c24135]`}
                      >
                        {t("remove")}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pendingMembers.pending.length ? (
        <section
          aria-labelledby="startup-pending-title"
          className="space-y-3.5 rounded-xl border border-[#e4e7ea] bg-white px-[22px] py-5"
        >
          <div className="space-y-1">
            <h2
              id="startup-pending-title"
              className="text-[15px] font-semibold leading-[23px] text-[#22262b]"
            >
              {t("pendingTitle")}
            </h2>
            <p className="text-[12.5px] leading-[19px] text-[#676e78]">
              {t("pendingHint")}
            </p>
          </div>
          <ul className="space-y-3.5">
            {pendingMembers.pending.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-[#e4e7ea] px-4 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-[38px] shrink-0 place-items-center rounded-full bg-[#f3f4f6] text-xs font-semibold text-[#676e78]"
                  >
                    {initials(member.fullName) || "?"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium leading-5 text-[#22262b]">
                      {member.fullName}
                    </p>
                    {member.jobTitle ? (
                      <p className="truncate text-[11.5px] leading-[17px] text-[#676e78]">
                        {member.jobTitle}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {member.email ? (
                    <span className="w-[160px] truncate text-xs leading-[18px] text-[#858c96]">
                      {member.email}
                    </span>
                  ) : null}
                  <span className={`${chipClass} bg-[#fff8e6] text-[#8a5a00]`}>
                    {t("pending")}
                  </span>
                  {team.viewerIsFounder ? (
                    <button
                      type="button"
                      onClick={() => pendingMembers.remove(member.id)}
                      disabled={pendingMembers.removingId === member.id}
                      aria-label={t("removePendingLabel", {
                        name: member.fullName,
                      })}
                      className={`${rowLinkClass} text-[#c24135] disabled:opacity-60`}
                    >
                      {t("remove")}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <MemberFormDialog team={team} />
      <LeaveTeamDialog changes={changes} />
      <RemoveMemberDialog
        asRequest={team.removalNeedsApproval}
        isRemoving={team.isRemoving}
        member={team.removingMember}
        onCancel={team.cancelRemove}
        onConfirm={team.confirmRemove}
      />
    </StartupPageFrame>
  );
}
