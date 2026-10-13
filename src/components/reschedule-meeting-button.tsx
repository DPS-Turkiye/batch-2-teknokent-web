"use client";

import { useTranslations } from "next-intl";

import { ProposeMeetingDialog } from "@/components/propose-meeting-dialog";
import { useRescheduleMeeting } from "@/hooks/use-meeting-proposals";
import type { MeetingItem } from "@/interfaces/meeting";
import { canReschedule } from "@/lib/meeting-proposals";

/** "Yeni saat öner" for the mentor's or the team's own planned, upcoming meeting. */
export function RescheduleMeetingButton({
  meeting,
  pairLabel,
  className,
}: {
  meeting: MeetingItem;
  pairLabel: string;
  className: string;
}) {
  const t = useTranslations("meetingProposals");
  const reschedule = useRescheduleMeeting(meeting);
  if (!canReschedule(meeting)) return null;
  return (
    <>
      <button
        type="button"
        onClick={reschedule.openComposer}
        className={className}
      >
        {t("reschedule")}
      </button>
      <ProposeMeetingDialog
        proposals={reschedule}
        pairLabel={pairLabel}
        note={t("rescheduleNote")}
      />
    </>
  );
}
