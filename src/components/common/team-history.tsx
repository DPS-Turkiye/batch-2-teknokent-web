"use client";

import { useLocale, useTranslations } from "next-intl";

import { useTeamHistory } from "@/hooks/use-team-history";
import { UserAccountStatus } from "@/interfaces/session";
import { TeamExitReason, type TeamHistoryStay } from "@/interfaces/team-change";
import { formatShortDate } from "@/lib/utils";

/** "Takım geçmişi" for admins and coordinators: every startup the person was in. */
export function TeamHistory({ userId }: { userId: string }) {
  const t = useTranslations("teamHistory");
  const history = useTeamHistory(userId);
  const stays = history.query.data?.stays ?? [];
  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={history.toggle}
        aria-expanded={history.open}
        className="text-[12px] font-medium text-[#9e4400] hover:underline"
      >
        {history.open ? t("hide") : t("show")}
      </button>
      {!history.open ? null : history.query.isLoading ? (
        <p className="mt-1 text-[12px] text-[#858c96]">{t("loading")}</p>
      ) : history.query.error ? (
        <p role="alert" className="mt-1 text-[12px] text-[#c24135]">
          {history.query.error.message}
        </p>
      ) : stays.length === 0 ? (
        <p className="mt-1 text-[12px] text-[#858c96]">{t("empty")}</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {stays.map((stay) => (
            <StayRow
              key={`${stay.organizationId}-${stay.joinedAt}`}
              stay={stay}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function StayRow({ stay }: { stay: TeamHistoryStay }) {
  const t = useTranslations("teamHistory");
  const locale = useLocale();
  const joined = formatShortDate(stay.joinedAt, locale);
  const notes = [
    stay.leftAt
      ? t(stay.exitReason === TeamExitReason.Removed ? "removed" : "left", {
          from: joined,
          to: formatShortDate(stay.leftAt, locale),
        })
      : t("current", { from: joined }),
    stay.startupArchived ? t("archived") : null,
    stay.startupApproval === UserAccountStatus.Pending
      ? t("startupPending")
      : stay.startupApproval === UserAccountStatus.Rejected
        ? t("startupRejected")
        : null,
  ];
  return (
    <li className="text-[12px] text-[#676e78]">
      <span className="font-medium text-[#22262b]">
        {stay.organizationName}
      </span>
      {" · "}
      {notes.filter(Boolean).join(" · ")}
    </li>
  );
}
