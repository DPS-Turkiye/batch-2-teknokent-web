"use client";

import { useLocale, useTranslations } from "next-intl";

import { PrimaryButton } from "@/components/common/primary-button";
import { SecondaryButton } from "@/components/common/secondary-button";
import { SectionHeader } from "@/components/mentee-home/section-header";
import { useMentorProgramInvitations } from "@/hooks/use-mentor-program-invitations";
import { formatShortDate } from "@/lib/utils";

const cardClass =
  "rounded-[20px] border-[0.685px] border-[#dde1e6] bg-white px-4 py-3.5";

/** On the mentor's home: coordinators' invitations to accept or decline, and joins waiting for a coordinator. */
export function MentorProgramInvitations() {
  const t = useTranslations("mentorProgramInvitations");
  const locale = useLocale();
  const panel = useMentorProgramInvitations();

  if (
    panel.isLoading ||
    (!panel.error &&
      panel.invitations.length === 0 &&
      panel.awaitingReview.length === 0)
  ) {
    return null;
  }

  return (
    <section aria-labelledby="mentor-program-invitations-title">
      <SectionHeader id="mentor-program-invitations-title" title={t("title")} />
      {panel.error ? (
        <p role="alert" className="text-xs text-[#c24135]">
          {t("failed")}
        </p>
      ) : null}
      <ul className="space-y-[10px]">
        {panel.invitations.map((invitation) => (
          <li key={invitation.programId} className={cardClass}>
            <p className="text-sm font-medium leading-[21px] text-[#2b303a]">
              {invitation.programName}
            </p>
            <p className="mt-0.5 text-xs leading-[18px] text-[#7a828d]">
              {t("invitedBy", {
                name: invitation.coordinatorName,
                date: formatShortDate(invitation.createdAt, locale),
              })}
            </p>
            {panel.answeringId === invitation.programId ? (
              <p className="mt-3 text-xs text-[#7a828d]">{t("answering")}</p>
            ) : (
              <div className="mt-3 flex justify-end gap-2">
                <SecondaryButton onClick={() => panel.decline(invitation)}>
                  {t("decline")}
                </SecondaryButton>
                <PrimaryButton onClick={() => panel.accept(invitation)}>
                  {t("accept")}
                </PrimaryButton>
              </div>
            )}
          </li>
        ))}
        {panel.awaitingReview.map((program) => (
          <li key={program.id} className={cardClass}>
            <p className="text-sm font-medium leading-[21px] text-[#2b303a]">
              {program.name}
            </p>
            <p className="mt-0.5 text-xs leading-[18px] text-[#8a5a00]">
              {t("awaitingReview")}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
