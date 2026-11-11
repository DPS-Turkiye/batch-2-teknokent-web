"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { getMeetingFeedback } from "@/lib/client/meetings";
import { meetingFeedbackHref } from "@/lib/mentorship-workspace";

type MeetingFeedbackHistoryLinkProps = {
  meetingId: string;
};

export function MeetingFeedbackHistoryLink({
  meetingId,
}: MeetingFeedbackHistoryLinkProps) {
  const t = useTranslations("feedbackLink");
  const feedbackQuery = useQuery({
    queryKey: ["meeting-feedback", meetingId],
    queryFn: () => getMeetingFeedback(meetingId),
  });

  const hasFeedback = Boolean(feedbackQuery.data);
  const label = feedbackQuery.isPending
    ? t("checking")
    : hasFeedback
      ? t("view")
      : t("rate");

  return (
    <Link
      href={meetingFeedbackHref(meetingId)}
      aria-busy={feedbackQuery.isPending}
      className={
        hasFeedback
          ? "inline-flex min-h-[38px] items-center justify-center rounded-lg border border-[#e4e7ea] px-4 text-[13px] font-medium text-[#22262b] hover:border-[#f2b78f]"
          : "inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[#e86f22] px-4 text-[13px] font-medium text-white hover:bg-[#ce5e19]"
      }
    >
      {label}
    </Link>
  );
}
